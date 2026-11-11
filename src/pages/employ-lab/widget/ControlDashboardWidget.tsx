import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Sliders
} from 'lucide-react';
import type { LabTelemetryRow } from './MainDashboardWidget';
import {
  parseMeterMapping,
  extractMValuesFromRow
} from './MainDashboardWidget';

export interface ControlDashboardWidgetProps {
  projectName: string;
  address: string;
  isGwOnline: boolean;
  devices: LabTelemetryRow[];
  onCommandSent?: (msg: string) => void;
  onRefreshData?: () => void;
}

interface ControlCardItem {
  code: string;
  targetDeviceCode: string;
  channel: string;
  name: string;
  room: string;
  category: 'fan' | 'temp';
  inControl: boolean;
  initialBool: boolean;
  initialTemp: number;
}

export const ControlDashboardWidget: React.FC<ControlDashboardWidgetProps> = ({
  projectName,
  address,
  isGwOnline,
  devices,
  onCommandSent,
  onRefreshData
}) => {
  const [deviceStates, setDeviceStates] = useState<Record<string, boolean>>({});
  const [deviceTemps, setDeviceTemps] = useState<Record<string, number>>({});
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});
  const userCommandLockRef = useRef<
    Record<string, { boolVal?: boolean; tempVal?: number; until: number }>
  >({});

  // Dựng danh sách thẻ điều khiển từ cột control bảng telemetry_data
  const controlCards = useMemo<ControlCardItem[]>(() => {
    const cards: ControlCardItem[] = [];

    devices.forEach((dev, idx) => {
      const devCode = String(dev.device_code || `DEV_${idx + 1}`).trim().toUpperCase();
      const areaName = String(dev.floor || dev.project_name || 'Khu vực chính').trim();

      const historyRows: LabTelemetryRow[] =
        Array.isArray(dev.history_rows) && dev.history_rows.length > 0 ? dev.history_rows : [dev];

      const controlMap: Record<string, string> = {};
      const collectCtrl = (rawControl: any) => {
        const parsed = parseMeterMapping(rawControl);
        Object.entries(parsed).forEach(([k, v]) => {
          if (!(k in controlMap) || (controlMap[k] === '' && v !== '')) {
            controlMap[k] = v;
          }
        });
      };

      collectCtrl(dev.control);
      historyRows.forEach((r) => collectCtrl(r.control));

      const setupMap: Record<string, string> = {};
      const collectSetup = (rawSetup: any) => {
        const parsed = parseMeterMapping(rawSetup);
        Object.entries(parsed).forEach(([k, v]) => {
          if (!(k in setupMap) || (setupMap[k] === '' && v !== '')) {
            setupMap[k] = v;
          }
        });
        if (Object.keys(parsed).length === 0 && typeof rawSetup === 'string') {
          const trimmed = rawSetup.trim();
          if (
            trimmed !== '' &&
            trimmed !== '{}' &&
            trimmed !== '[]' &&
            trimmed.toLowerCase() !== 'null' &&
            trimmed.toLowerCase() !== 'undefined'
          ) {
            if (!('m1' in setupMap)) {
              setupMap['m1'] = trimmed;
            }
          }
        }
      };

      collectSetup(dev.setup);
      historyRows.forEach((r) => collectSetup(r.setup));

      // Gộp giá trị kênh từ hàng mới nhất về cũ để giữ nguyên trạng thái ON/OFF đã chốt
      const allRowsToScan: LabTelemetryRow[] = [
        dev,
        ...historyRows.filter((r) => r !== dev)
      ];
      const mergedChannelNums: Record<string, number> = {};
      allRowsToScan.forEach((row) => {
        const rowVals = extractMValuesFromRow(row);
        Object.entries(rowVals).forEach(([k, rv]) => {
          const lk = k.trim().toLowerCase();
          if (lk in mergedChannelNums) return;
          const n =
            typeof rv === 'number'
              ? rv
              : rv !== null && rv !== undefined && String(rv).trim() !== ''
              ? Number(String(rv).trim())
              : NaN;
          if (!Number.isNaN(n)) {
            mergedChannelNums[lk] = n;
          }
        });
      });

      const sortedChannels = Object.keys(controlMap).sort((a, b) => {
        const na = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
        const nb = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
        return na - nb;
      });

      sortedChannels.forEach((channel) => {
        const validNum = channel in mergedChannelNums ? mergedChannelNums[channel] : null;

        const label = (controlMap[channel] || '').trim();
        const lowerLabel = label.toLowerCase();

        const isExplicitFan =
          lowerLabel.includes('điều khiển quạt') ||
          lowerLabel.includes('on/off') ||
          lowerLabel.includes('quạt') ||
          lowerLabel.includes('công tắc') ||
          lowerLabel.includes('bật') ||
          lowerLabel.includes('tắt') ||
          lowerLabel.includes('đèn') ||
          lowerLabel.includes('van') ||
          lowerLabel.includes('bơm') ||
          lowerLabel.includes('rèm') ||
          lowerLabel.includes('cửa') ||
          lowerLabel.includes('khóa');

        const isExplicitTemp =
          lowerLabel.includes('cài đặt nhiệt độ') ||
          lowerLabel.includes('nhiệt độ') ||
          lowerLabel.includes('temp') ||
          lowerLabel.includes('°c') ||
          lowerLabel.includes('độ c');

        const isTempCtrl =
          isExplicitTemp || (!isExplicitFan && validNum !== null && validNum !== 0 && validNum !== 1);

        const cardCode = `${devCode}_${channel}`;
        const displayLabel = label !== '' ? label : channel;

        cards.push({
          code: cardCode,
          targetDeviceCode: devCode,
          channel,
          name: displayLabel,
          room: areaName,
          category: isTempCtrl ? 'temp' : 'fan',
          inControl: true,
          initialBool: (validNum ?? 0) > 0,
          initialTemp: Math.min(Math.max(Math.round(validNum ?? 24), 0), 50)
        });
      });

      // Tạo thêm nút Cài đặt nhiệt độ / Điều khiển dải nhiệt độ nếu cột setup bảng telemetry_data có giá trị
      const sortedSetupChannels = Object.keys(setupMap).sort((a, b) => {
        const na = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
        const nb = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
        return na - nb;
      });

      sortedSetupChannels.forEach((channel) => {
        const validNum = channel in mergedChannelNums ? mergedChannelNums[channel] : null;
        const label = (setupMap[channel] || '').trim();
        const displayLabel = label !== '' ? label : channel;
        const cardCode =
          channel in controlMap ? `${devCode}_setup_${channel}` : `${devCode}_${channel}`;

        cards.push({
          code: cardCode,
          targetDeviceCode: devCode,
          channel,
          name: displayLabel,
          room: areaName,
          category: 'temp',
          inControl: true,
          initialBool: true,
          initialTemp: Math.min(Math.max(Math.round(validNum ?? 24), 0), 50)
        });
      });
    });

    return cards.filter((c) => c.inControl);
  }, [devices]);

  // Lắng nghe sự kiện lệnh điều khiển thực sự (is_control_command === true) qua WebSocket để đồng bộ 2 chiều giữa EmployLab / DashLab / AAA_Mobile (không bị gói đo lường đảo trạng thái)
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = isLocal
        ? `ws://${window.location.hostname}:5000/ws`
        : `${wsProtocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (
            msg.type === 'TELEMETRY_DATA_SAVED' &&
            msg.is_control_command === true &&
            msg.device_code
          ) {
            const devCode = String(msg.device_code).trim().toUpperCase();
            if (msg.control_channel !== undefined && msg.control_value !== undefined) {
              const lk = String(msg.control_channel).trim().toLowerCase();
              const num = Number(msg.control_value);
              if (/^m\d+$/i.test(lk) && !Number.isNaN(num)) {
                const key = `${devCode}_${lk}`;
                const setupKey = `${devCode}_setup_${lk}`;
                const clampedTemp = Math.min(Math.max(Math.round(num), 0), 50);
                setDeviceStates((prev) => ({ ...prev, [key]: num > 0 }));
                setDeviceTemps((prev) => ({
                  ...prev,
                  [key]: clampedTemp,
                  [setupKey]: clampedTemp
                }));
              }
              return;
            }
            const showMap = typeof msg.show === 'object' && msg.show ? msg.show : {};
            setDeviceStates((prev) => {
              const next = { ...prev };
              Object.entries(showMap).forEach(([ch, val]) => {
                const lk = ch.trim().toLowerCase();
                if (/^m\d+$/i.test(lk)) {
                  const num = Number(val);
                  if (!Number.isNaN(num)) {
                    next[`${devCode}_${lk}`] = num > 0;
                  }
                }
              });
              return next;
            });
            setDeviceTemps((prev) => {
              const next = { ...prev };
              Object.entries(showMap).forEach(([ch, val]) => {
                const lk = ch.trim().toLowerCase();
                if (/^m\d+$/i.test(lk)) {
                  const num = Number(val);
                  if (!Number.isNaN(num)) {
                    const clampedTemp = Math.min(Math.max(Math.round(num), 0), 50);
                    next[`${devCode}_${lk}`] = clampedTemp;
                    next[`${devCode}_setup_${lk}`] = clampedTemp;
                  }
                }
              });
              return next;
            });
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Đồng bộ giá trị từ dữ liệu telemetry_data nhưng tôn trọng khoá thao tác của người dùng (ON chỉ OFF khi có người OFF, OFF chỉ ON khi có người ON)
  useEffect(() => {
    const now = Date.now();
    setDeviceStates((prev) => {
      const next = { ...prev };
      controlCards.forEach((c) => {
        const lock = userCommandLockRef.current[c.code];
        if (lock && lock.until > now && typeof lock.boolVal === 'boolean') {
          next[c.code] = lock.boolVal;
          return;
        }
        if (c.category === 'fan') {
          next[c.code] = c.initialBool;
        } else {
          next[c.code] = true;
        }
      });
      return next;
    });
    setDeviceTemps((prev) => {
      const next = { ...prev };
      controlCards.forEach((c) => {
        const lock = userCommandLockRef.current[c.code];
        if (lock && lock.until > now && typeof lock.tempVal === 'number') {
          next[c.code] = lock.tempVal;
          return;
        }
        if (c.category === 'temp') {
          next[c.code] = c.initialTemp;
        }
      });
      return next;
    });
    // Tự động mở rộng khu vực đầu tiên nếu chưa mở khu vực nào
    if (controlCards.length > 0) {
      setExpandedAreas((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        return { [controlCards[0].room]: true };
      });
    }
  }, [controlCards]);

  // Gửi lệnh điều khiển kiểu number (0/1 hoặc 0..50) qua API /api/device-control (Publish MQTT + Cập nhật telemetry_data)
  const sendControlCommand = async (
    targetDeviceCode: string,
    channel: string,
    value: number,
    toastLabel: string
  ) => {
    try {
      const res = await fetch('/api/device-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_code: targetDeviceCode.trim().toUpperCase(),
          channel: channel.trim().toLowerCase(),
          value
        })
      });
      if (res.ok) {
        if (onCommandSent) onCommandSent(toastLabel);
        if (onRefreshData) onRefreshData();
      }
    } catch {
      if (onCommandSent) onCommandSent(toastLabel);
    }
  };

  const handleToggleDevice = (card: ControlCardItem) => {
    const currentVal = deviceStates[card.code] ?? card.initialBool;
    const nextVal = !currentVal;
    const numericPayload = nextVal ? 1 : 0;

    userCommandLockRef.current[card.code] = {
      boolVal: nextVal,
      until: Date.now() + 6000
    };
    setDeviceStates((prev) => ({ ...prev, [card.code]: nextVal }));
    sendControlCommand(
      card.targetDeviceCode,
      card.channel,
      numericPayload,
      `Đã gửi [${card.targetDeviceCode}/${card.channel}] = ${numericPayload} (${nextVal ? 'ON' : 'OFF'} - ${card.name})`
    );
  };

  const handleSetTemperature = (card: ControlCardItem, newTemp: number, commit: boolean) => {
    const clamped = Math.min(Math.max(Math.round(newTemp), 0), 50);
    userCommandLockRef.current[card.code] = {
      tempVal: clamped,
      until: Date.now() + 6000
    };
    setDeviceTemps((prev) => ({ ...prev, [card.code]: clamped }));
    if (commit) {
      sendControlCommand(
        card.targetDeviceCode,
        card.channel,
        clamped,
        `Đã gửi [${card.targetDeviceCode}/${card.channel}] = ${clamped} (${card.name}: ${clamped}°C)`
      );
    }
  };

  // Nhóm các thẻ điều khiển theo khu vực (room / floor)
  const groupedByArea = useMemo(() => {
    const map = new Map<string, ControlCardItem[]>();
    controlCards.forEach((c) => {
      const area = c.room || 'Khu vực chính';
      if (!map.has(area)) {
        map.set(area, []);
      }
      map.get(area)!.push(c);
    });
    return Array.from(map.entries());
  }, [controlCards]);

  const activeCount = controlCards.filter((c) =>
    c.category === 'temp' ? true : (deviceStates[c.code] ?? c.initialBool)
  ).length;
  const offCount = Math.max(0, controlCards.length - activeCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Banner thông tin dự án & trạng thái Gateway (Tương tự _buildProjectBanner) */}
      <div
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 55%, #1D58BB 100%)',
          boxShadow: '0 6px 14px rgba(29, 88, 187, 0.25)',
          boxSizing: 'border-box',
          color: '#FFFFFF'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <span
            title={projectName}
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {projectName}
          </span>
          <div
            style={{
              padding: '4px 9px',
              borderRadius: '20px',
              backgroundColor: isGwOnline
                ? 'rgba(22, 163, 74, 0.2)'
                : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${
                isGwOnline ? 'rgba(22, 163, 74, 0.4)' : 'rgba(239, 68, 68, 0.4)'
              }`,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isGwOnline ? '#22C55E' : '#EF4444'
              }}
            />
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: isGwOnline ? '#86EFAC' : '#FCA5A5'
              }}
            >
              {isGwOnline ? 'Gateway Online' : 'Gateway Offline'}
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: '#CBD5E1'
          }}
        >
          <MapPin size={13} color="#93C5FD" />
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {address}
          </span>
        </div>

        <div
          style={{
            margin: '14px 0 12px',
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)'
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}
        >
          <span style={{ color: '#E2E8F0' }}>Tổng: {controlCards.length} thiết bị</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#4ADE80'
                }}
              />
              {activeCount} Đang bật
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#94A3B8'
                }}
              />
              {offCount} Đang tắt
            </span>
          </div>
        </div>
      </div>

      {/* 2. Danh sách các khu vực & thẻ điều khiển từ cột control bảng telemetry_data */}
      {groupedByArea.length === 0 ? (
        <div
          style={{
            width: '100%',
            padding: '28px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxSizing: 'border-box'
          }}
        >
          <Sliders size={40} color="#94A3B8" />
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#64748B',
              textAlign: 'center'
            }}
          >
            Không có thiết bị điều khiển
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {groupedByArea.map(([areaName, areaDevices]) => {
            const isExpanded = expandedAreas[areaName] ?? false;
            const blueColor = '#1D58BB';

            return (
              <div
                key={areaName}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: `${isExpanded ? '1.5px' : '1px'} solid ${
                    isExpanded ? 'rgba(29, 88, 187, 0.6)' : '#E2E8F0'
                  }`,
                  boxShadow: isExpanded
                    ? '0 3px 10px rgba(29, 88, 187, 0.1)'
                    : '0 3px 6px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.22s ease',
                  boxSizing: 'border-box'
                }}
              >
                {/* Hàng tiêu đề Khu vực */}
                <div
                  onClick={() =>
                    setExpandedAreas((prev) => ({
                      ...prev,
                      [areaName]: !isExpanded
                    }))
                  }
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: blueColor,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {areaName}
                  </span>
                  <div
                    style={{
                      padding: '4px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(29, 88, 187, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isExpanded ? (
                      <ChevronUp size={20} color={blueColor} />
                    ) : (
                      <ChevronDown size={20} color={blueColor} />
                    )}
                  </div>
                </div>

                {/* Danh sách thẻ điều khiển (chỉ hiển thị các giá trị trong cột control bảng telemetry_data) */}
                {isExpanded && (
                  <>
                    <div style={{ height: '1px', backgroundColor: '#E2E8F0' }} />
                    <div
                      style={{
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      {areaDevices.map((card) => {
                        const activeColor = '#1D58BB';

                        // Thẻ 1: Công tắc ON/OFF (Switch)
                        if (card.category === 'fan') {
                          const isOn = deviceStates[card.code] ?? card.initialBool;
                          return (
                            <div
                              key={card.code}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '16px',
                                border: `${isOn ? '1.5px' : '1px'} solid ${
                                  isOn ? 'rgba(29, 88, 187, 0.55)' : '#E2E8F0'
                                }`,
                                boxShadow: isOn
                                  ? '0 3px 10px rgba(29, 88, 187, 0.12)'
                                  : '0 3px 6px rgba(0, 0, 0, 0.03)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                transition: 'all 0.22s ease',
                                boxSizing: 'border-box'
                              }}
                            >
                              <span
                                title={card.name}
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 700,
                                  color: '#0F172A',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {card.name}
                              </span>

                              {/* Nút Switch tương tự Flutter Switch */}
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isOn}
                                onClick={() => handleToggleDevice(card)}
                                style={{
                                  width: '48px',
                                  height: '28px',
                                  borderRadius: '14px',
                                  border: 'none',
                                  padding: '3px',
                                  backgroundColor: isOn ? 'rgba(29, 88, 187, 0.35)' : '#CBD5E1',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  transition: 'background-color 0.2s ease',
                                  flexShrink: 0
                                }}
                              >
                                <span
                                  style={{
                                    display: 'block',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    backgroundColor: isOn ? activeColor : '#FFFFFF',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                    transform: isOn ? 'translateX(20px)' : 'translateX(0)',
                                    transition: 'transform 0.2s ease, background-color 0.2s ease'
                                  }}
                                />
                              </button>
                            </div>
                          );
                        }

                        // Thẻ 2: Thanh trượt Cài đặt nhiệt độ (0°C - 50°C, tương tự control_dashboard_screen.dart)
                        const currentTemp = Math.min(
                          Math.max(deviceTemps[card.code] ?? card.initialTemp, 0),
                          50
                        );
                        return (
                          <div
                            key={card.code}
                            style={{
                              width: '100%',
                              padding: '14px 16px 12px',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '16px',
                              border: '1.5px solid rgba(29, 88, 187, 0.55)',
                              boxShadow: '0 3px 10px rgba(29, 88, 187, 0.12)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px'
                              }}
                            >
                              <span
                                title={card.name}
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 700,
                                  color: '#0F172A',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {card.name}
                              </span>
                              <div
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '10px',
                                  backgroundColor: '#EFF6FF',
                                  border: '1px solid #BFDBFE',
                                  color: activeColor,
                                  fontSize: '14px',
                                  fontWeight: 700
                                }}
                              >
                                {currentTemp}°C
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <button
                                type="button"
                                disabled={currentTemp <= 0}
                                onClick={() => handleSetTemperature(card, currentTemp - 1, true)}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '8px',
                                  border: '1px solid #E2E8F0',
                                  backgroundColor: '#F8FAFC',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: currentTemp > 0 ? 'pointer' : 'not-allowed',
                                  color: currentTemp > 0 ? activeColor : '#CBD5E1',
                                  flexShrink: 0
                                }}
                              >
                                <Minus size={15} />
                              </button>

                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#64748B',
                                  flexShrink: 0
                                }}
                              >
                                0°C
                              </span>

                              <input
                                type="range"
                                min={0}
                                max={50}
                                step={1}
                                value={currentTemp}
                                onChange={(e) =>
                                  handleSetTemperature(card, Number(e.target.value), false)
                                }
                                onMouseUp={(e) =>
                                  handleSetTemperature(
                                    card,
                                    Number((e.target as HTMLInputElement).value),
                                    true
                                  )
                                }
                                onTouchEnd={(e) =>
                                  handleSetTemperature(
                                    card,
                                    Number((e.target as HTMLInputElement).value),
                                    true
                                  )
                                }
                                style={{
                                  flex: 1,
                                  accentColor: activeColor,
                                  cursor: 'pointer'
                                }}
                              />

                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#64748B',
                                  flexShrink: 0
                                }}
                              >
                                50°C
                              </span>

                              <button
                                type="button"
                                disabled={currentTemp >= 50}
                                onClick={() => handleSetTemperature(card, currentTemp + 1, true)}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '8px',
                                  border: '1px solid #E2E8F0',
                                  backgroundColor: '#F8FAFC',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: currentTemp < 50 ? 'pointer' : 'not-allowed',
                                  color: currentTemp < 50 ? activeColor : '#CBD5E1',
                                  flexShrink: 0
                                }}
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ControlDashboardWidget;

