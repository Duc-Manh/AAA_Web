import React, { useState, useEffect, useRef } from 'react';
import '../dash/Dash.css';
import { EmpAside } from '../../components/common/EmpAside';
import { EmpHeader } from '../../components/common/EmpHeader';
import {
  Activity,
  RefreshCw,
  Thermometer,
  Droplets,
  Zap,
  Cpu,
  Radio,
  Search,
  Building2,
  CheckCircle2,
  Clock,
  Server,
  Play,
  Pause,
  Network
} from 'lucide-react';

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

export const EmployOperate: React.FC = () => {
  const [activeTab] = useState('operate');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);

  // Danh sách thiết bị viễn trắc (mỗi thiết bị là 1 hàng duy nhất)
  const [telemetryList, setTelemetryList] = useState<TelemetryDeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

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

  const currentFullName = currentUser?.full_name || currentUser?.username || 'Nhân Viên 3A';

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

  return (
    <div className="dash-layout">
      {/* 1. SIDEBAR ĐIỀU HƯỚNG */}
      <EmpAside
        activeTab={activeTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        triggerToast={() => {}}
      />

      {/* 2. KHU VỰC NỘI DUNG CHÍNH */}
      <div className="dash-main">
        {/* TOP NAVBAR */}
        <EmpHeader
          title="Quản Lý Vận Hành & Giám Sát IoT"
          subtitle="Giám sát trực tiếp dữ liệu viễn trắc (Telemetry) từ Gateway 3ONEDATA & Cảm biến đa dự án"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
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
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1D58BB'
                }}
              >
                <Cpu size={26} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Thiết bị giám sát
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  {telemetryList.length} thiết bị
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> 1 hàng / 1 thiết bị (Tối ưu RAM)
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
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  backgroundColor: '#faf5ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7c3aed'
                }}
              >
                <Building2 size={26} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Dự án triển khai
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', lineHeight: 1.2 }}>
                  {uniqueProjects.length} Dự án
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Quản lý phân cấp tập trung
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
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  backgroundColor: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a'
                }}
              >
                <Network size={26} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  IoT Gateway
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.2 }}>
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
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  backgroundColor: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981'
                }}
              >
                <Radio size={26} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  MQTT Broker & WS
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
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

          {/* MAIN CARD: BẢNG DỮ LIỆU TELEMETRY */}
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
                  <Activity size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                    Bảng Giám Sát Thiết Bị IoT (1 hàng / thiết bị)
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
                    <span>Chu kỳ cập nhật tức thời (Lần cuối: {lastFetched || 'Đang tải...'})</span>
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
                    placeholder="Tìm mã thiết bị, tên, dự án, Gateway..."
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

            {/* TABLE */}
            <div
              style={{
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                backgroundColor: '#ffffff'
              }}
            >
              <div style={{ overflowX: 'auto', maxHeight: '560px' }}>
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
                        letterSpacing: '0.5px',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                      }}
                    >
                      <th style={{ padding: '14px 16px', width: '80px' }}>Device ID</th>
                      <th style={{ padding: '14px 16px', width: '150px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Cpu size={13} /> Mã thiết bị
                        </div>
                      </th>
                      <th style={{ padding: '14px 16px', width: '160px' }}>Tên thiết bị</th>
                      <th style={{ padding: '14px 16px', width: '150px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={13} /> Dự án
                        </div>
                      </th>
                      <th style={{ padding: '14px 16px', width: '160px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Network size={13} /> IoT Gateway
                        </div>
                      </th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', width: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Thermometer size={13} color="#ef4444" /> Nhiệt độ
                        </div>
                      </th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', width: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Droplets size={13} color="#0284c7" /> Độ ẩm
                        </div>
                      </th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', width: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Zap size={13} color="#f59e0b" /> Công suất
                        </div>
                      </th>
                      <th style={{ padding: '14px 16px', textAlign: 'center', width: '140px' }}>Điện áp / Dòng</th>
                      <th style={{ padding: '14px 16px', width: '160px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} /> Cập nhật lúc
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                          {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                              <RefreshCw size={24} className="dash-spin" color="#1D58BB" />
                              <span>Đang tải dữ liệu viễn trắc từ cơ sở dữ liệu...</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                              <Server size={32} color="#cbd5e1" />
                              <span style={{ fontWeight: 600, color: '#64748b' }}>Chưa có thiết bị nào trong bảng telemetry_data</span>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                Dữ liệu sẽ tự động xuất hiện khi Gateway hoặc MQTTX phát gói tin!
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((row, idx) => {
                        return (
                          <tr
                            key={row.device_id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                              transition: 'background-color 0.15s ease'
                            }}
                          >
                            {/* 1. Device ID */}
                            <td style={{ padding: '12px 16px', fontWeight: 700, color: '#64748b' }}>
                              #{row.device_id}
                            </td>

                            {/* 2. Mã thiết bị */}
                            <td style={{ padding: '12px 16px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  backgroundColor: '#eff6ff',
                                  color: '#1D58BB',
                                  borderRadius: '6px',
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  border: '1px solid #bfdbfe'
                                }}
                              >
                                {row.device_code}
                              </span>
                            </td>

                            {/* 3. Tên thiết bị */}
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                              {row.device_name}
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                Modbus #{row.slave_address} {row.floor ? `(Tầng ${row.floor})` : ''}
                              </div>
                            </td>

                            {/* 4. Dự án */}
                            <td style={{ padding: '12px 16px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 600,
                                  color: '#334155',
                                  fontSize: '0.82rem'
                                }}
                              >
                                <Building2 size={13} color="#7c3aed" />
                                {row.project_name || 'Dự án nội bộ'}
                              </span>
                            </td>

                            {/* 5. Gateway SN */}
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem', color: '#0f172a' }}>
                                  {row.gateway_sn || 'N/A'}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: row.gateway_status === 'online' ? '#16a34a' : '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <span
                                    style={{
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      backgroundColor: row.gateway_status === 'online' ? '#16a34a' : '#94a3b8'
                                    }}
                                  />
                                  {row.gateway_ip || '192.168.1.250'}
                                </span>
                              </div>
                            </td>

                            {/* 6. Nhiệt độ */}
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              {row.temperature !== null && row.temperature !== undefined ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 10px',
                                    borderRadius: '16px',
                                    backgroundColor: '#fef2f2',
                                    color: '#ef4444',
                                    fontWeight: 700,
                                    fontSize: '0.86rem',
                                    border: '1px solid #fee2e2'
                                  }}
                                >
                                  {row.temperature} °C
                                </span>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>--</span>
                              )}
                            </td>

                            {/* 7. Độ ẩm */}
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              {row.humidity !== null && row.humidity !== undefined ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 10px',
                                    borderRadius: '16px',
                                    backgroundColor: '#f0f9ff',
                                    color: '#0284c7',
                                    fontWeight: 700,
                                    fontSize: '0.86rem',
                                    border: '1px solid #e0f2fe'
                                  }}
                                >
                                  {row.humidity} %
                                </span>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>--</span>
                              )}
                            </td>

                            {/* 8. Công suất */}
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              {row.power !== null && row.power !== undefined ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 10px',
                                    borderRadius: '16px',
                                    backgroundColor: '#fffbeb',
                                    color: '#b45309',
                                    fontWeight: 700,
                                    fontSize: '0.86rem',
                                    border: '1px solid #fef3c7'
                                  }}
                                >
                                  {row.power} W
                                </span>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>--</span>
                              )}
                            </td>

                            {/* 9. Điện áp / Dòng */}
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', color: '#475569' }}>
                              {row.voltage ? `${row.voltage}V` : '--'} / {row.current ? `${row.current}A` : '--'}
                            </td>

                            {/* 10. Thời gian cập nhật */}
                            <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {row.recorded_at}
                            </td>
                          </tr>
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
                  Tổng cộng: <strong>{filteredList.length}</strong> thiết bị giám sát trực tiếp
                </div>
                <div>
                  Cơ chế lưu: <strong>1 Hàng / 1 Thiết Bị (UPSERT thời gian thực)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployOperate;
