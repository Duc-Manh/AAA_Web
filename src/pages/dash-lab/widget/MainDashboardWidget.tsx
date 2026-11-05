import React, { useState, useMemo } from 'react';
import { Building2, User, Cpu, HelpCircle } from 'lucide-react';

export interface LabTelemetryRow {
  id?: number;
  device_id: number;
  device_code: string;
  device_name: string;
  device_type?: string;
  floor?: string;
  location_id?: number;
  project_name?: string;
  project_address?: string;
  customer_name?: string;
  gateway_sn?: string;
  gateway_ip?: string;
  gateway_status?: 'online' | 'offline';
  show?: any;
  raw_data?: any;
  meter?: string | null;
  control?: string | null;
  recorded_at: string;
  history_rows?: LabTelemetryRow[];
}

export interface MainDashboardWidgetProps {
  projectName: string;
  customerName: string;
  devices: LabTelemetryRow[];
  isGwOnline?: boolean;
}

export const parseJsonMap = (raw: any): Record<string, any> => {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...raw };
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    try {
      const decoded = JSON.parse(raw.trim());
      if (decoded && typeof decoded === 'object' && !Array.isArray(decoded)) {
        return { ...decoded };
      }
    } catch {
      // ignore
    }
  }
  return {};
};

export const parseMeterMapping = (raw: any): Record<string, string> => {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const out: Record<string, string> = {};
    Object.entries(raw).forEach(([k, v]) => {
      const lk = String(k || '').trim().toLowerCase();
      if (/^m\d+$/i.test(lk)) {
        out[lk] = v !== null && v !== undefined ? String(v).trim() : '';
      }
    });
    return out;
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const trimmed = raw.trim();
    try {
      const decoded = JSON.parse(trimmed);
      if (Array.isArray(decoded)) {
        const out: Record<string, string> = {};
        decoded.forEach((item) => {
          const lk = String(item || '').trim().toLowerCase();
          if (/^m\d+$/i.test(lk)) {
            out[lk] = '';
          }
        });
        return out;
      }
      if (decoded && typeof decoded === 'object') {
        const out: Record<string, string> = {};
        Object.entries(decoded).forEach(([k, v]) => {
          const lk = String(k || '').trim().toLowerCase();
          if (/^m\d+$/i.test(lk)) {
            out[lk] = v !== null && v !== undefined ? String(v).trim() : '';
          }
        });
        return out;
      }
    } catch {
      const out: Record<string, string> = {};
      trimmed.split(/[\r\n,;]+/).forEach((part) => {
        const line = part.trim();
        if (!line) return;
        const kv = line.match(/^\s*(m\d+)\s*[:=-]\s*(.*)\s*$/i);
        if (kv) {
          out[kv[1].toLowerCase()] = kv[2].trim();
        } else {
          line.split(/\s+/).forEach((token) => {
            const lk = token.trim().toLowerCase();
            if (/^m\d+$/i.test(lk) && !(lk in out)) {
              out[lk] = '';
            }
          });
        }
      });
      return out;
    }
  }
  return {};
};

export const extractMValuesFromRow = (row: any): Record<string, any> => {
  if (!row || typeof row !== 'object') return {};
  const showMap = parseJsonMap(row.show);
  const rawMap = parseJsonMap(row.raw_data);
  const combined: Record<string, any> = {
    ...rawMap,
    ...(rawMap.values && typeof rawMap.values === 'object' ? rawMap.values : {}),
    ...(rawMap.measurements && typeof rawMap.measurements === 'object' ? rawMap.measurements : {}),
    ...(rawMap.data && typeof rawMap.data === 'object' ? rawMap.data : {}),
    ...showMap
  };

  const result: Record<string, any> = {};
  Object.entries(combined).forEach(([key, value]) => {
    const k = String(key || '').trim().toLowerCase();
    if (/^m\d+$/i.test(k) && value !== null && value !== undefined && String(value).trim() !== '') {
      result[k] = value;
    }
  });

  if (Object.keys(result).length === 0) {
    const ignored = new Set([
      'device_code',
      'device_id',
      'deviceid',
      'devicecode',
      'device_name',
      'device_type',
      'floor',
      'timestamp',
      'time',
      'status',
      'gateway',
      'values',
      'measurements',
      'data'
    ]);
    let autoIdx = 1;
    Object.entries(combined).forEach(([key, value]) => {
      const k = String(key || '').trim().toLowerCase();
      if (
        !ignored.has(k) &&
        value !== null &&
        value !== undefined &&
        String(value).trim() !== '' &&
        typeof value !== 'object'
      ) {
        result[/^m\d+$/i.test(k) ? k : `m${autoIdx}`] = value;
        autoIdx++;
      }
    });
  }

  return result;
};

const isExcludedControlNote = (label: string): boolean => {
  const normalized = label.trim().toLowerCase().replace(/\s+/g, ' ');
  return (
    normalized === 'bật / tắt' ||
    normalized === 'bật/tắt' ||
    normalized.includes('bật / tắt') ||
    normalized.includes('bật/tắt') ||
    normalized === 'cài đặt nhiệt độ' ||
    normalized.includes('cài đặt nhiệt độ')
  );
};

const hasValidTelemetryValue = (dev: LabTelemetryRow): boolean => {
  const showMap = parseJsonMap(dev.show);
  const rawMap = parseJsonMap(dev.raw_data);
  const valuesPayload = Object.keys(showMap).length > 0 ? showMap : rawMap;

  for (const [k, v] of Object.entries(valuesPayload)) {
    const lk = k.toLowerCase();
    if (lk === 'status' || lk === 'time' || lk === 'timestamp' || lk === 'device_code') continue;
    if (v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== 'null') {
      return true;
    }
  }
  return false;
};

export const MainDashboardWidget: React.FC<MainDashboardWidgetProps> = ({
  projectName,
  customerName,
  devices
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const validDevices = useMemo(() => {
    return devices.filter(hasValidTelemetryValue);
  }, [devices]);

  const collectMColumnsAndNotes = (targetDevices: LabTelemetryRow[]): Record<string, string> => {
    const mColSet = new Set<string>();
    const resolvedMeters: Record<string, string> = {};

    const collectFromRow = (row: any) => {
      if (!row || typeof row !== 'object') return;
      const meterMap = parseMeterMapping(row.meter);
      Object.entries(meterMap).forEach(([lk, label]) => {
        if (/^m\d+$/i.test(lk)) {
          mColSet.add(lk);
          if (label && (!resolvedMeters[lk] || resolvedMeters[lk] === '')) {
            resolvedMeters[lk] = label;
          }
        }
      });

      const mVals = extractMValuesFromRow(row);
      Object.keys(mVals).forEach((k) => mColSet.add(k));
    };

    targetDevices.forEach((dev) => {
      collectFromRow(dev);
      if (Array.isArray(dev.history_rows)) {
        dev.history_rows.forEach((hRow) => collectFromRow(hRow));
      }
    });

    const sortedKeys = Array.from(mColSet).sort((a, b) => {
      const na = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
      const nb = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
      return na - nb;
    });

    const orderedResult: Record<string, string> = {};
    sortedKeys.forEach((mKey) => {
      orderedResult[mKey] = (resolvedMeters[mKey] || '').trim();
    });
    return orderedResult;
  };

  const categories = useMemo(() => {
    const mColumnsWithNotes = collectMColumnsAndNotes(validDevices);
    const list: Array<{ key: string; label: string }> = [{ key: 'all', label: 'Tất cả' }];

    Object.entries(mColumnsWithNotes).forEach(([mKey, mappedLabel]) => {
      if (mappedLabel && isExcludedControlNote(mappedLabel)) {
        return;
      }
      list.push({
        key: mKey,
        label: mappedLabel || mKey
      });
    });

    return list;
  }, [validDevices]);

  const filteredDevices = useMemo(() => {
    return validDevices.filter((d) => {
      if (selectedCategory === 'all') return true;
      const devMCols = collectMColumnsAndNotes([d]);
      if (selectedCategory in devMCols) return true;
      return d.device_type === selectedCategory;
    });
  }, [validDevices, selectedCategory]);

  const renderDeviceTelemetryTable = (dev: LabTelemetryRow) => {
    const historyRows: LabTelemetryRow[] =
      Array.isArray(dev.history_rows) && dev.history_rows.length > 0 ? dev.history_rows : [dev];

    const mColSet = new Set<string>();
    const resolvedNotes: Record<string, string> = {};

    const collectMeter = (rawMeter: any) => {
      const map = parseMeterMapping(rawMeter);
      Object.entries(map).forEach(([lk, label]) => {
        if (/^m\d+$/i.test(lk)) {
          mColSet.add(lk);
          if (label && (!resolvedNotes[lk] || resolvedNotes[lk] === '')) {
            resolvedNotes[lk] = label;
          }
        }
      });
    };

    collectMeter(dev.meter);
    historyRows.forEach((row) => {
      collectMeter(row.meter);
      const mVals = extractMValuesFromRow(row);
      Object.keys(mVals).forEach((k) => mColSet.add(k));
    });

    const mCols = Array.from(mColSet).sort((a, b) => {
      const na = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
      const nb = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
      return na - nb;
    });

    if (mCols.length === 0) {
      mCols.push('m1');
    }

    const timeColWidth = 148;
    const colHeaders: Record<string, string> = {};
    const colWidths: Record<string, number> = {};

    mCols.forEach((mKey) => {
      const mappedLabel = (resolvedNotes[mKey] || '').trim();
      const headerText = mappedLabel || mKey;
      colHeaders[mKey] = headerText;
      colWidths[mKey] =
        headerText.length > 7 ? Math.min(Math.max(headerText.length * 7.5 + 20, 84), 180) : 76;
    });

    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: '6px',
          overflowX: 'auto'
        }}
      >
        <div style={{ display: 'inline-block', minWidth: '100%' }}>
          {/* Hàng Header: Cập nhật lúc | Tên chuyển đổi trong cột meter hoặc m1, m2, ... */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #CBD5E1'
            }}
          >
            <div
              style={{
                width: `${timeColWidth}px`,
                minWidth: `${timeColWidth}px`,
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 10px',
                borderRight: '1px solid #E2E8F0',
                fontSize: '12px',
                fontWeight: 700,
                color: '#475569',
                boxSizing: 'border-box'
              }}
            >
              Cập nhật lúc
            </div>
            {mCols.map((mKey, mIdx) => {
              const isLastCol = mIdx === mCols.length - 1;
              const headerText = colHeaders[mKey] || mKey;
              const colWidth = colWidths[mKey] || 76;
              return (
                <div
                  key={mKey}
                  title={headerText}
                  style={{
                    width: `${colWidth}px`,
                    minWidth: `${colWidth}px`,
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 6px',
                    borderRight: isLastCol ? 'none' : '1px solid #E2E8F0',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#1D58BB',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    boxSizing: 'border-box'
                  }}
                >
                  {headerText}
                </div>
              );
            })}
          </div>

          {/* Các hàng dữ liệu lịch sử */}
          <div style={{ maxHeight: '210px', overflowY: 'auto' }}>
            {historyRows.map((row, rIdx) => {
              const isLastRow = rIdx === historyRows.length - 1;
              const recordedAt = String(row.recorded_at || '--').trim();
              const mVals = extractMValuesFromRow(row);

              return (
                <div
                  key={`${row.id || rIdx}-${recordedAt}`}
                  style={{
                    display: 'flex',
                    backgroundColor: rIdx === 0 ? '#F0FDF4' : '#FFFFFF',
                    borderBottom: isLastRow ? 'none' : '1px solid #F1F5F9'
                  }}
                >
                  <div
                    style={{
                      width: `${timeColWidth}px`,
                      minWidth: `${timeColWidth}px`,
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 8px',
                      borderRight: '1px solid #F1F5F9',
                      fontSize: '11.5px',
                      fontFamily: 'monospace',
                      color: '#64748B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      boxSizing: 'border-box'
                    }}
                  >
                    {recordedAt || '--'}
                  </div>
                  {mCols.map((mKey, mIdx) => {
                    const isLastCol = mIdx === mCols.length - 1;
                    const colWidth = colWidths[mKey] || 76;
                    const val = mVals[mKey];
                    const hasVal = val !== null && val !== undefined && String(val).trim() !== '';

                    return (
                      <div
                        key={mKey}
                        style={{
                          width: `${colWidth}px`,
                          minWidth: `${colWidth}px`,
                          height: '34px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 6px',
                          borderRight: isLastCol ? 'none' : '1px solid #F1F5F9',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          fontWeight: hasVal ? 700 : 400,
                          color: hasVal ? '#0F172A' : '#CBD5E1',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          boxSizing: 'border-box'
                        }}
                      >
                        {hasVal ? String(val) : '--'}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Thông tin Dự án & Tên khách hàng (Tương tự ProjectHeaderWidget) */}
      <div
        style={{
          width: '100%',
          padding: '14px 16px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #2563EB, #1D58BB)',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Building2 size={24} color="#FFFFFF" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            title={projectName}
            style={{
              fontSize: '15.5px',
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '-0.2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {projectName}
          </div>
          <div
            style={{
              marginTop: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#64748B'
            }}
          >
            <User size={14} color="#64748B" />
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Khách hàng: {customerName}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Khối Quản lý thiết bị (Tương tự DeviceManagementWidget) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Header Khối */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              backgroundColor: 'rgba(29, 88, 187, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Cpu size={18} color="#1D58BB" />
          </div>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0F172A'
            }}
          >
            Quản lý thiết bị ({validDevices.length})
          </span>
        </div>

        {/* Filter Tabs phân loại theo cột meter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${isSelected ? '#1D58BB' : '#E2E8F0'}`,
                  backgroundColor: isSelected ? '#1D58BB' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Danh sách thiết bị */}
        {filteredDevices.length === 0 ? (
          <div
            style={{
              width: '100%',
              padding: '28px',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxSizing: 'border-box'
            }}
          >
            <HelpCircle size={36} color="#94A3B8" />
            <span style={{ fontSize: '13px', color: '#64748B', textAlign: 'center' }}>
              Không tìm thấy thiết bị nào thuộc danh mục này
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredDevices.map((dev) => {
              const name = dev.device_name || dev.device_code || 'Thiết bị';
              const floor = dev.floor || dev.project_name || 'Khu vực chính';

              return (
                <div
                  key={`${dev.device_id}-${dev.device_code}`}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {name}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#64748B',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Vị trí: {floor}
                    </span>
                  </div>

                  {renderDeviceTelemetryTable(dev)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainDashboardWidget;

