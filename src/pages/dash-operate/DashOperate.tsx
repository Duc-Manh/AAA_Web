import React, { useState, useEffect, useRef } from 'react';
import '../dash/Dash.css';
import { DashAside } from '../../components/common/DashAside';
import { DashHeader } from '../../components/common/DashHeader';
import { DashPopup } from '../../components/common/DashPopup';
import {
  RefreshCw,
  Thermometer,
  Droplets,
  Zap,
  Cpu,
  Search,
  Building2,
  CheckCircle2,
  Server,
  Play,
  Pause,
  Network,
  ChevronDown,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { ProjectTelemetryChartModal } from '../../components/common/ProjectTelemetryChartModal';

interface CurrentUserData {
  id?: number;
  full_name?: string;
  gmail?: string;
  username?: string;
}

export interface TelemetryDeviceRow {
  device_id: number;
  device_code: string;
  device_name: string;
  device_type: string;
  slave_address: number;
  floor?: string;
  gateway_id?: number;
  gateway_sn?: string;
  gateway_ip?: string;
  gateway_status?: 'online' | 'offline';
  location_id?: number;
  project_name?: string;
  project_address?: string;
  temperature?: number | null;
  humidity?: number | null;
  power?: number | null;
  voltage?: number | null;
  current?: number | null;
  raw_data?: any;
  recorded_at: string;
}

export interface ProjectGroup {
  location_id?: number;
  project_name: string;
  project_address?: string;
  gateway_sn?: string;
  gateway_ip?: string;
  gateway_status?: 'online' | 'offline';
  latest_recorded_at?: string;
  devices: TelemetryDeviceRow[];
}

export const DashOperate: React.FC = () => {
  const [activeTab] = useState('operate');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);

  // Danh sách dữ liệu viễn trắc (mỗi thiết bị là 1 hàng trong DB)
  const [telemetryList, setTelemetryList] = useState<TelemetryDeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  // Trạng thái đóng/mở dropdown của từng Dự án (mặc định mở dự án đầu tiên)
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Dự án được chọn để xem Biểu đồ viễn trắc (telemetry_history)
  const [selectedChartProject, setSelectedChartProject] = useState<ProjectGroup | null>(null);

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterGateway, setFilterGateway] = useState<string>('all');

  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const authData = localStorage.getItem('aaa_admin_auth');
    if (authData) {
      try {
        setCurrentUser(JSON.parse(authData));
      } catch {
        // ignore
      }
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Tải danh sách telemetry từ backend
  const fetchTelemetryData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/telemetry-data`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTelemetryList(json.data);
          const now = new Date();
          setLastFetched(now.toLocaleTimeString('vi-VN'));
        }
      }
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu telemetry_data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetryData(true);
  }, []);

  // Tự động mở rộng dự án đầu tiên khi mới tải trang
  useEffect(() => {
    if (telemetryList.length > 0 && Object.keys(expandedProjects).length === 0) {
      const firstProject = telemetryList[0].project_name || 'Dự án nội bộ';
      setExpandedProjects({ [firstProject]: true });
    }
  }, [telemetryList]);

  // Kết nối WebSocket Realtime
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connectWs = () => {
      try {
        const hostname = window.location.hostname || 'localhost';
        const wsUrl = `ws://${hostname}:5000/ws`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsStatus('connected');
        };

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

        ws.onerror = () => {
          setWsStatus('disconnected');
        };

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

  // Auto Refresh polling chu kỳ 3s
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

  // Danh sách các dự án và Gateway duy nhất để lọc
  const uniqueProjects = Array.from(new Set(telemetryList.map((d) => d.project_name))).filter(Boolean);
  const uniqueGateways = Array.from(new Set(telemetryList.map((d) => d.gateway_sn))).filter(Boolean);

  // Lọc dữ liệu theo tìm kiếm & dropdown
  const filteredList = telemetryList.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      String(item.device_id).includes(searchQuery) ||
      (item.device_code && item.device_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.device_name && item.device_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.project_name && item.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.gateway_sn && item.gateway_sn.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesProject = filterProject === 'all' || item.project_name === filterProject;
    const matchesGateway = filterGateway === 'all' || item.gateway_sn === filterGateway;

    return matchesSearch && matchesProject && matchesGateway;
  });

  // GOM NHÓM THEO TỪNG DỰ ÁN
  const groupMap = new Map<string, ProjectGroup>();
  filteredList.forEach((row) => {
    const pName = row.project_name || 'Dự án nội bộ';
    if (!groupMap.has(pName)) {
      groupMap.set(pName, {
        project_name: pName,
        project_address: row.project_address,
        location_id: row.location_id,
        gateway_sn: row.gateway_sn,
        gateway_ip: row.gateway_ip,
        gateway_status: row.gateway_status,
        latest_recorded_at: row.recorded_at,
        devices: []
      });
    }
    const grp = groupMap.get(pName)!;
    grp.devices.push(row);
    if (row.recorded_at && (!grp.latest_recorded_at || row.recorded_at > grp.latest_recorded_at)) {
      grp.latest_recorded_at = row.recorded_at;
    }
  });

  const projectGroups = Array.from(groupMap.values());

  // Toggle mở / đóng dropdown của 1 dự án
  const toggleProject = (projectName: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectName]: !prev[projectName]
    }));
  };

  // Mở tất cả / Thu gọn tất cả
  const expandAll = () => {
    const next: Record<string, boolean> = {};
    projectGroups.forEach((g) => {
      next[g.project_name] = true;
    });
    setExpandedProjects(next);
  };

  const collapseAll = () => {
    setExpandedProjects({});
  };

  return (
    <div className="dash-layout">
      {/* Toast thông báo nhanh */}
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

      {/* 1. SIDEBAR ĐIỀU HƯỚNG */}
      <DashAside
        activeTab={activeTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        triggerToast={triggerToast}
      />

      {/* 2. KHU VỰC NỘI DUNG CHÍNH */}
      <div className="dash-main">
        {/* TOP NAVBAR */}
        <DashHeader
          title="Quản Lý Vận Hành Và Giám Sát IoT"
          subtitle="Giám sát trực tiếp dữ liệu viễn trắc (Telemetry) từ Gateway 3ONEDATA & Cảm biến đa dự án"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
          refreshTitle="Làm mới danh sách vận hành"
          onRefresh={() => {
            fetchTelemetryData(true);
            triggerToast('Đã làm mới dữ liệu vận hành!');
          }}
          triggerToast={triggerToast}
          handleLogout={handleLogout}
        />

        <div className="dash-content" style={{ padding: '24px', overflowY: 'auto' }}>
          {/* STATS HEADER CARDS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}
          >
            {/* Card 1: Số lượng thiết bị */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Thiết bị giám sát
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d58bb', lineHeight: 1.2 }}>
                  {telemetryList.length} thiết bị
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> 1 hàng / 1 thiết bị
                </div>
              </div>
            </div>

            {/* Card 2: Số dự án kết nối */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Dự án triển khai
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d58bb', lineHeight: 1.2 }}>
                  {uniqueProjects.length} Dự án
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Phân cấp theo từng dự án
                </div>
              </div>
            </div>

            {/* Card 3: Số Gateway kết nối */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  IoT Gateway
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d58bb', lineHeight: 1.2 }}>
                  {uniqueGateways.length} Gateway
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>
                  Đang thu thập dữ liệu
                </div>
              </div>
            </div>

            {/* Card 4: Broker Status */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  MQTT Broker & WS
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1d58bb', lineHeight: 1.2 }}>
                  Port 1883 / 5000
                </div>
                <div style={{ fontSize: '0.75rem', color: wsStatus === 'connected' ? '#16a34a' : '#d97706', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: wsStatus === 'connected' ? '#16a34a' : '#d97706',
                      display: 'inline-block'
                    }}
                  />
                  {wsStatus === 'connected' ? 'WebSocket Live Online' : 'Đang kết nối lại WS...'}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CARD: BẢNG DỰ ÁN & IOT GATEWAY */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* TOOLBAR */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                marginBottom: '20px'
              }}
            >
              {/* Title & Live indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#1D58BB',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                    Bảng Giám Sát Thiết Bị IoT Trong Từng Dự Án
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#16a34a',
                        display: 'inline-block',
                        boxShadow: '0 0 6px #16a34a'
                      }}
                    />
                    <span>Click vào hàng Dự án để mở Dropdown danh sách chi tiết (Cập nhật: {lastFetched || 'Đang tải...'})</span>
                  </div>
                </div>
              </div>

              {/* Filters & Actions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                {/* Search */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Tìm tên dự án, Gateway, mã thiết bị..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '8px 14px 8px 36px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      width: '260px',
                      backgroundColor: '#f8fafc'
                    }}
                  />
                </div>

                {/* Filter Project */}
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Tất cả Dự án ({uniqueProjects.length})</option>
                  {uniqueProjects.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                {/* Filter Gateway */}
                <select
                  value={filterGateway}
                  onChange={(e) => setFilterGateway(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Tất cả Gateway ({uniqueGateways.length})</option>
                  {uniqueGateways.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                {/* Nút Mở tất cả / Thu gọn */}
                <button
                  type="button"
                  onClick={() => {
                    const allOpen = projectGroups.every((g) => expandedProjects[g.project_name]);
                    if (allOpen) {
                      collapseAll();
                    } else {
                      expandAll();
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {projectGroups.every((g) => expandedProjects[g.project_name]) ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
                </button>

                {/* Auto Refresh Toggle */}
                <button
                  type="button"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: autoRefresh ? '1px solid #86efac' : '1px solid #cbd5e1',
                    backgroundColor: autoRefresh ? '#f0fdf4' : '#f8fafc',
                    color: autoRefresh ? '#15803d' : '#64748b',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
                  <span>{autoRefresh ? 'Tự động' : 'Tạm dừng'}</span>
                </button>

                {/* Manual Refresh */}
                <button
                  type="button"
                  onClick={() => fetchTelemetryData(true)}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#1D58BB',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(29, 88, 187, 0.25)'
                  }}
                >
                  <RefreshCw size={14} className={loading ? 'dash-spin' : ''} />
                  <span>{loading ? 'Đang nạp...' : 'Làm mới'}</span>
                </button>
              </div>
            </div>

            {/* BẢNG CHÍNH: DỰ ÁN VÀ IOT GATEWAY */}
            <div
              style={{
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                backgroundColor: '#ffffff'
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.86rem'
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#f8fafc',
                        borderBottom: '2px solid #e2e8f0',
                        color: '#475569',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '0.74rem',
                        letterSpacing: '0.5px'
                      }}
                    >
                      <th style={{ padding: '14px 16px', width: '48px', textAlign: 'center' }}></th>
                      <th style={{ padding: '14px 20px', width: '38%' }}>
                        DỰ ÁN KHÁCH HÀNG
                      </th>
                      <th style={{ padding: '14px 20px', width: '38%' }}>
                        IOT GATEWAY KẾT NỐI
                      </th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>
                        CHI TIẾT và THAO TÁC
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectGroups.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                          {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                              <RefreshCw size={24} className="dash-spin" color="#1D58BB" />
                              <span>Đang tải danh sách dự án & thiết bị...</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                              <Server size={32} color="#cbd5e1" />
                              <span style={{ fontWeight: 600, color: '#64748b' }}>Không tìm thấy dự án hoặc thiết bị nào phù hợp</span>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                Dữ liệu sẽ xuất hiện khi thiết bị gửi gói tin từ Gateway hoặc MQTTX!
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      projectGroups.map((group) => {
                        const isExpanded = !!expandedProjects[group.project_name];
                        return (
                          <React.Fragment key={group.project_name}>
                            {/* 1. HÀNG CHÍNH DỰ ÁN */}
                            <tr
                              onClick={() => toggleProject(group.project_name)}
                              style={{
                                borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                                backgroundColor: isExpanded ? '#f0f7ff' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              className="dash-table-row-hover"
                            >
                              {/* Cột Icon Mở rộng / Thu gọn */}
                              <td style={{ padding: '16px', textAlign: 'center', color: '#1D58BB' }}>
                                <div
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    backgroundColor: isExpanded ? '#dbeafe' : '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'transform 0.2s ease',
                                    margin: '0 auto'
                                  }}
                                >
                                  {isExpanded ? <ChevronDown size={18} color="#1D58BB" /> : <ChevronRight size={18} color="#64748b" />}
                                </div>
                              </td>

                              {/* Cột 1: DỰ ÁN */}
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div
                                    style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '8px',
                                      backgroundColor: '#eff6ff',
                                      color: '#1d58bb',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}
                                  >
                                    <Building2 size={18} />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a' }}>
                                      {group.project_name}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                                      {group.project_address || 'Địa chỉ dự án 3AHOME'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Cột 2: IOT GATEWAY */}
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div
                                    style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '8px',
                                      backgroundColor: '#eff6ff',
                                      color: '#1d58bb',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}
                                  >
                                    <Network size={18} />
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                                        {group.gateway_sn || 'GATEWAY_3ONEDATA'}
                                      </span>
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          padding: '2px 8px',
                                          borderRadius: '12px',
                                          backgroundColor: group.gateway_status === 'online' ? '#dcfce7' : '#f1f5f9',
                                          color: group.gateway_status === 'online' ? '#15803d' : '#64748b',
                                          fontSize: '0.72rem',
                                          fontWeight: 600
                                        }}
                                      >
                                        <span
                                          style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            backgroundColor: group.gateway_status === 'online' ? '#16a34a' : '#94a3b8'
                                          }}
                                        />
                                        {group.gateway_status === 'online' ? 'Online' : 'Offline'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                                      IP: {group.gateway_ip || '192.168.1.250'} • Port: 1883
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Cột 3: CHI TIẾT & NÚT DROPDOWN */}
                              <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                                  {/* HÀNG NGANG CHỨA NÚT BIỂU ĐỒ & NÚT THIẾT BỊ CON */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {/* NÚT BIỂU ĐỒ VIỄN TRẮC (telemetry_history) */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedChartProject(group);
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #1D58BB',
                                        backgroundColor: '#eff6ff',
                                        color: '#1D58BB',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 3px rgba(29, 88, 187, 0.12)',
                                        transition: 'all 0.15s ease',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0
                                      }}
                                      title={`Xem biểu đồ đường & cột của các giá trị viễn trắc trong bảng telemetry_history (${group.project_name})`}
                                    >
                                      <BarChart3 size={14} />
                                      <span>Biểu đồ</span>
                                    </button>

                                    {/* NÚT THIẾT BỊ CON */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleProject(group.project_name);
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        border: isExpanded ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                                        backgroundColor: isExpanded ? '#1D58BB' : '#ffffff',
                                        color: isExpanded ? '#ffffff' : '#1D58BB',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        boxShadow: isExpanded ? '0 2px 6px rgba(29, 88, 187, 0.25)' : 'none',
                                        transition: 'all 0.15s ease',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0
                                      }}
                                    >
                                      <span>{group.devices.length} Thiết bị con</span>
                                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                  </div>

                                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                    Cập nhật: {group.latest_recorded_at || 'Vừa xong'}
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {/* 2. DROPDOWN LIST CHI TIẾT CỦA DỰ ÁN */}
                            {isExpanded && (
                              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <td colSpan={4} style={{ padding: '0 20px 20px 20px' }}>
                                  <div
                                    style={{
                                      backgroundColor: '#ffffff',
                                      borderRadius: '12px',
                                      border: '1px solid #bfdbfe',
                                      padding: '16px',
                                      boxShadow: '0 4px 12px rgba(29, 88, 187, 0.06)'
                                    }}
                                  >
                                    {/* Sub-header info */}
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '12px',
                                        paddingBottom: '8px',
                                        borderBottom: '1px solid #f1f5f9'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 700, color: '#1D58BB' }}>
                                        <Cpu size={16} />
                                        <span>Danh Sách Thiết Bị Cảm Biến ({group.devices.length} thiết bị thuộc {group.project_name})</span>
                                      </div>
                                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                        Mỗi thiết bị lưu trên 1 hàng duy nhất (Cập nhật thời gian thực)
                                      </div>
                                    </div>

                                    {/* BẢNG CON CHI TIẾT ĐẦY ĐỦ CÁC CỘT */}
                                    <div style={{ overflowX: 'auto' }}>
                                      <table
                                        style={{
                                          width: '100%',
                                          borderCollapse: 'collapse',
                                          fontSize: '0.82rem',
                                          textAlign: 'left'
                                        }}
                                      >
                                        <thead>
                                          <tr
                                            style={{
                                              backgroundColor: '#eff6ff',
                                              borderBottom: '1px solid #dbeafe',
                                              color: '#1e40af',
                                              fontWeight: 700,
                                              fontSize: '0.73rem',
                                              textTransform: 'uppercase',
                                              letterSpacing: '0.4px'
                                            }}
                                          >
                                            <th style={{ padding: '10px 12px', width: '80px' }}>ID</th>
                                            <th style={{ padding: '10px 12px', width: '150px' }}>Mã thiết bị</th>
                                            <th style={{ padding: '10px 12px', width: '180px' }}>Tên thiết bị</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'center', width: '120px' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <Thermometer size={13} color="#ef4444" /> Nhiệt độ
                                              </div>
                                            </th>
                                            <th style={{ padding: '10px 12px', textAlign: 'center', width: '120px' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <Droplets size={13} color="#0284c7" /> Độ ẩm
                                              </div>
                                            </th>
                                            <th style={{ padding: '10px 12px', textAlign: 'center', width: '120px' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <Zap size={13} color="#f59e0b" /> Công suất
                                              </div>
                                            </th>
                                            <th style={{ padding: '10px 12px', textAlign: 'center', width: '130px' }}>Điện áp / Dòng</th>
                                            <th style={{ padding: '10px 12px', width: '150px' }}>Cập nhật lúc</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'center', width: '100px' }}>Trạng thái</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {group.devices.length === 0 ? (
                                            <tr>
                                              <td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                                Dự án này chưa có thiết bị nào truyền dữ liệu
                                              </td>
                                            </tr>
                                          ) : (
                                            group.devices.map((dev, devIdx) => (
                                              <tr
                                                key={dev.device_id}
                                                style={{
                                                  borderBottom: '1px solid #f1f5f9',
                                                  backgroundColor: devIdx % 2 === 0 ? '#ffffff' : '#fafafa'
                                                }}
                                              >
                                                {/* ID */}
                                                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#64748b' }}>
                                                  #{dev.device_id}
                                                </td>

                                                {/* Mã thiết bị */}
                                                <td style={{ padding: '10px 12px' }}>
                                                  <span
                                                    style={{
                                                      display: 'inline-block',
                                                      padding: '3px 8px',
                                                      backgroundColor: '#eff6ff',
                                                      color: '#1D58BB',
                                                      borderRadius: '6px',
                                                      fontFamily: 'monospace',
                                                      fontWeight: 700,
                                                      fontSize: '0.8rem',
                                                      border: '1px solid #bfdbfe'
                                                    }}
                                                  >
                                                    {dev.device_code}
                                                  </span>
                                                </td>

                                                {/* Tên thiết bị */}
                                                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                                                  {dev.device_name}
                                                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                    Modbus #{dev.slave_address} {dev.floor ? `(${dev.floor})` : ''}
                                                  </div>
                                                </td>

                                                {/* Nhiệt độ */}
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                  {dev.temperature !== null && dev.temperature !== undefined ? (
                                                    <span
                                                      style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        padding: '3px 8px',
                                                        borderRadius: '12px',
                                                        backgroundColor: '#fef2f2',
                                                        color: '#ef4444',
                                                        fontWeight: 700,
                                                        fontSize: '0.82rem',
                                                        border: '1px solid #fee2e2'
                                                      }}
                                                    >
                                                      {dev.temperature} °C
                                                    </span>
                                                  ) : (
                                                    <span style={{ color: '#cbd5e1' }}>--</span>
                                                  )}
                                                </td>

                                                {/* Độ ẩm */}
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                  {dev.humidity !== null && dev.humidity !== undefined ? (
                                                    <span
                                                      style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        padding: '3px 8px',
                                                        borderRadius: '12px',
                                                        backgroundColor: '#f0f9ff',
                                                        color: '#0284c7',
                                                        fontWeight: 700,
                                                        fontSize: '0.82rem',
                                                        border: '1px solid #e0f2fe'
                                                      }}
                                                    >
                                                      {dev.humidity} %
                                                    </span>
                                                  ) : (
                                                    <span style={{ color: '#cbd5e1' }}>--</span>
                                                  )}
                                                </td>

                                                {/* Công suất */}
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                  {dev.power !== null && dev.power !== undefined ? (
                                                    <span
                                                      style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        padding: '3px 8px',
                                                        borderRadius: '12px',
                                                        backgroundColor: '#fffbeb',
                                                        color: '#b45309',
                                                        fontWeight: 700,
                                                        fontSize: '0.82rem',
                                                        border: '1px solid #fef3c7'
                                                      }}
                                                    >
                                                      {dev.power} W
                                                    </span>
                                                  ) : (
                                                    <span style={{ color: '#cbd5e1' }}>--</span>
                                                  )}
                                                </td>

                                                {/* Điện áp / Dòng */}
                                                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.78rem', color: '#475569' }}>
                                                  {dev.voltage ? `${dev.voltage}V` : '--'} / {dev.current ? `${dev.current}A` : '--'}
                                                </td>

                                                {/* Cập nhật lúc */}
                                                <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                                                  {dev.recorded_at}
                                                </td>

                                                {/* Trạng thái */}
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                  <span
                                                    style={{
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      gap: '3px',
                                                      padding: '2px 7px',
                                                      borderRadius: '6px',
                                                      backgroundColor: '#ecfdf5',
                                                      color: '#16a34a',
                                                      fontSize: '0.7rem',
                                                      fontWeight: 600
                                                    }}
                                                  >
                                                    <CheckCircle2 size={11} /> Online
                                                  </span>
                                                </td>
                                              </tr>
                                            ))
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table footer info */}
              <div
                style={{
                  padding: '12px 18px',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: '#64748b'
                }}
              >
                <div>
                  Tổng cộng: <strong>{projectGroups.length}</strong> Dự án (Gồm <strong>{filteredList.length}</strong> thiết bị giám sát)
                </div>
                <div>
                  Giao diện: <strong>Mỗi hàng 1 Dự án & Gateway • Click để mở rộng chi tiết thiết bị</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Biểu đồ lịch sử viễn trắc (telemetry_history) */}
      {selectedChartProject && (
        <ProjectTelemetryChartModal
          project={selectedChartProject}
          onClose={() => setSelectedChartProject(null)}
        />
      )}

      {/* Thông báo yêu cầu trình duyệt từ nhân viên */}
      <DashPopup />
    </div>
  );
};

export default DashOperate;
