import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../dash/Dash.css';
import { DashAside } from '../../components/common/DashAside';
import { DashHeader } from '../../components/common/DashHeader';
import {
  Building2,
  RefreshCw,
  CheckCircle2,
  LayoutDashboard,
  Sliders,
  BarChart3,
  Play,
  Pause
} from 'lucide-react';
import {
  MainDashboardWidget,
  type LabTelemetryRow
} from './widget/MainDashboardWidget';
import { ControlDashboardWidget } from './widget/ControlDashboardWidget';
import { DiagramDashboardWidget } from './widget/DiagramDashboardWidget';

interface CurrentUserData {
  id?: number;
  full_name?: string;
  gmail?: string;
  username?: string;
}

const parseRecordedAtMs = (val?: string): number => {
  if (!val) return 0;
  const s = String(val).trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dmy) {
    return new Date(
      Number(dmy[3]),
      Number(dmy[2]) - 1,
      Number(dmy[1]),
      Number(dmy[4] || 0),
      Number(dmy[5] || 0),
      Number(dmy[6] || 0)
    ).getTime();
  }
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export const DashLab: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [telemetryDevices, setTelemetryDevices] = useState<LabTelemetryRow[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [lastFetched, setLastFetched] = useState<string>('--:--:--');

  const pollTimerRef = useRef<any>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  useEffect(() => {
    try {
      const savedUser =
        localStorage.getItem('aaa_admin_auth') || sessionStorage.getItem('aaa_admin_auth');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchTelemetryData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch('/api/telemetry-data?limit=500');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const rawList: LabTelemetryRow[] = json.data;
        const groupedByDev = new Map<number, LabTelemetryRow[]>();

        rawList.forEach((row) => {
          const dId = Number(row.device_id || 0);
          if (!groupedByDev.has(dId)) {
            groupedByDev.set(dId, []);
          }
          groupedByDev.get(dId)!.push(row);
        });

        let localMcCache: Record<string, { meter?: string; control?: string }> = {};
        try {
          const savedMc = localStorage.getItem('aaa_telemetry_meter_control_cache');
          if (savedMc) localMcCache = JSON.parse(savedMc);
        } catch {
          // ignore
        }

        const uniqueDevices: LabTelemetryRow[] = [];
        groupedByDev.forEach((rows) => {
          const sorted = [...rows].sort((a, b) => {
            const diff = parseRecordedAtMs(b.recorded_at) - parseRecordedAtMs(a.recorded_at);
            if (diff !== 0) return diff;
            return Number(b.id || 0) - Number(a.id || 0);
          });
          const dKey = sorted[0]?.device_code || String(sorted[0]?.device_id || '');
          const cachedMc = localMcCache[dKey];
          const dbMeter = sorted.find((r) => r.meter && String(r.meter).trim() !== '')?.meter;
          const dbControl = sorted.find((r) => r.control && String(r.control).trim() !== '')?.control;
          const latest = {
            ...sorted[0],
            meter: dbMeter || cachedMc?.meter || sorted[0]?.meter || null,
            control: dbControl || cachedMc?.control || sorted[0]?.control || null,
            history_rows: sorted
          };
          uniqueDevices.push(latest);
        });

        setTelemetryDevices(uniqueDevices);
        setLastFetched(new Date().toLocaleTimeString('vi-VN'));
      }
    } catch (err) {
      console.warn('Lỗi tải telemetry_data trong DashLab:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetryData(true);
  }, []);

  // Kết nối WebSocket Realtime
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connectWs = () => {
      try {
        const isLocal =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = isLocal
          ? `ws://${window.location.hostname}:5000/ws`
          : `${wsProtocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => setWsStatus('connected');
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TELEMETRY_DATA_SAVED' || data.type === 'TELEMETRY_UPDATE') {
              fetchTelemetryData(false);
            }
          } catch {
            // ignore
          }
        };
        ws.onerror = () => setWsStatus('disconnected');
        ws.onclose = () => {
          setWsStatus('disconnected');
          reconnectTimeout = setTimeout(connectWs, 4000);
        };
      } catch {
        setWsStatus('disconnected');
      }
    };

    connectWs();
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  // Auto Refresh định kỳ 3s
  useEffect(() => {
    if (!autoRefresh) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }
    pollTimerRef.current = setInterval(() => {
      fetchTelemetryData(false);
    }, 3000);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [autoRefresh]);

  const projectNames = useMemo(() => {
    const names = Array.from(
      new Set(telemetryDevices.map((d) => d.project_name || 'Dự án nội bộ'))
    );
    return names;
  }, [telemetryDevices]);

  useEffect(() => {
    if (projectNames.length > 0 && (!selectedProject || !projectNames.includes(selectedProject))) {
      setSelectedProject(projectNames[0]);
    }
  }, [projectNames, selectedProject]);

  const activeDevices = useMemo(() => {
    if (!selectedProject) return telemetryDevices;
    return telemetryDevices.filter(
      (d) => (d.project_name || 'Dự án nội bộ') === selectedProject
    );
  }, [telemetryDevices, selectedProject]);

  const firstDev = activeDevices[0];
  const activeProjectName = selectedProject || firstDev?.project_name || 'Dự Án 3AHOME';
  const activeCustomerName = firstDev?.customer_name || activeProjectName;
  const activeAddress = firstDev?.project_address || 'Việt Nam';
  const isGwOnline = firstDev ? firstDev.gateway_status === 'online' : true;

  const handleLogout = () => {
    localStorage.removeItem('aaa_admin_auth');
    sessionStorage.removeItem('aaa_admin_auth');
    window.location.hash = '#home';
    window.history.pushState(null, '', '/#home');
    window.dispatchEvent(new Event('popstate'));
    window.dispatchEvent(new Event('hashchange'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentFullName = currentUser?.full_name || currentUser?.username || 'Quản Trị Viên 3A';

  return (
    <div className="dash-layout">
      {/* Toast thông báo */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}
        >
          <CheckCircle2 size={18} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. SIDEBAR */}
      <DashAside
        activeTab="lab"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        triggerToast={triggerToast}
      />

      {/* 2. NỘI DUNG CHÍNH */}
      <div className="dash-main">
        <DashHeader
          title="Thử Nghiệm Giao Diện & Điều Khiển Thiết Bị"
          subtitle="Mô phỏng trực tiếp 3 màn hình Tổng quan, Điều khiển và Biểu đồ của AAA_Mobile đặt cạnh nhau"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
          refreshTitle="Làm mới dữ liệu thử nghiệm"
          onRefresh={() => {
            fetchTelemetryData(true);
            triggerToast('Đã làm mới dữ liệu thử nghiệm!');
          }}
          triggerToast={triggerToast}
          handleLogout={handleLogout}
        />

        <div className="dash-content" style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {/* THANH CÔNG CỤ CHỌN DỰ ÁN & TRẠNG THÁI ĐỒNG BỘ */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '14px 18px',
              marginBottom: '20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#0F172A'
                }}
              >
                <Building2 size={18} color="#1D58BB" />
                <span>Chọn dự án thử nghiệm:</span>
              </div>

              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#1D58BB',
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '240px'
                }}
              >
                {projectNames.map((pName) => (
                  <option key={pName} value={pName}>
                    {pName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  backgroundColor: wsStatus === 'connected' ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${wsStatus === 'connected' ? '#BBF7D0' : '#FECACA'}`,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: wsStatus === 'connected' ? '#16A34A' : '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: wsStatus === 'connected' ? '#22C55E' : '#EF4444'
                  }}
                />
                <span>
                  {wsStatus === 'connected' ? 'Realtime WS Online' : 'Realtime Polling'} • {lastFetched}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setAutoRefresh((prev) => !prev)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: autoRefresh ? '#EFF6FF' : '#F8FAFC',
                  color: autoRefresh ? '#1D58BB' : '#64748B',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
                <span>{autoRefresh ? 'Tự động (3s)' : 'Tạm dừng'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchTelemetryData(true);
                  triggerToast('Đã cập nhật dữ liệu mới nhất!');
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#1D58BB',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* 3 WIDGET ĐẶT CẠNH NHAU: TỔNG QUAN | ĐIỀU KHIỂN | BIỂU ĐỒ */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '20px',
              alignItems: 'start'
            }}
          >
            {/* CỘT 1: WIDGET TỔNG QUAN (Tương tự main_dashboard_screen.dart) */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '20px',
                border: '1px solid #CBD5E1',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LayoutDashboard size={18} color="#1D58BB" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    Tổng quan (Main Dashboard)
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#1D58BB',
                    backgroundColor: '#EFF6FF',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                >
                  Cột meter
                </span>
              </div>

              <div style={{ padding: '16px', maxHeight: '78vh', overflowY: 'auto' }}>
                <MainDashboardWidget
                  projectName={activeProjectName}
                  customerName={activeCustomerName}
                  devices={activeDevices}
                  isGwOnline={isGwOnline}
                />
              </div>
            </div>

            {/* CỘT 2: WIDGET ĐIỀU KHIỂN (Tương tự control_dashboard_screen.dart) */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '20px',
                border: '1px solid #CBD5E1',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={18} color="#1D58BB" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    Điều khiển (Control Dashboard)
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#1D58BB',
                    backgroundColor: '#EFF6FF',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                >
                  Cột control • MQTT
                </span>
              </div>

              <div style={{ padding: '16px', maxHeight: '78vh', overflowY: 'auto' }}>
                <ControlDashboardWidget
                  projectName={activeProjectName}
                  address={activeAddress}
                  isGwOnline={isGwOnline}
                  devices={activeDevices}
                  onCommandSent={(msg) => triggerToast(msg)}
                  onRefreshData={() => fetchTelemetryData(false)}
                />
              </div>
            </div>

            {/* CỘT 3: WIDGET BIỂU ĐỒ (Tương tự diagram_dashboard_screen.dart) */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '20px',
                border: '1px solid #CBD5E1',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} color="#1D58BB" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    Biểu đồ (Diagram Dashboard)
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#1D58BB',
                    backgroundColor: '#EFF6FF',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                >
                  Line & Bar Chart
                </span>
              </div>

              <div style={{ padding: '16px', maxHeight: '78vh', overflowY: 'auto' }}>
                <DiagramDashboardWidget
                  projectName={activeProjectName}
                  isGwOnline={isGwOnline}
                  devices={activeDevices}
                  onRefresh={() => {
                    fetchTelemetryData(true);
                    triggerToast('Đã làm mới biểu đồ vận hành!');
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashLab;

