import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../dash/Dash.css';
import { EmpAside } from '../../components/common/EmpAside';
import { EmpHeader } from '../../components/common/EmpHeader';
import {
  RefreshCw,
  Thermometer,
  Droplets,
  Zap,
  Activity,
  Search,
  Building2,
  Calendar,
  Clock,
  ArrowUpDown,
  Download,
  AlertCircle,
  Eye,
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ProjectTelemetryChartModal } from '../../components/common/ProjectTelemetryChartModal';
import type { ProjectGroup } from '../employ-operate/EmployOperate';

interface CurrentUserData {
  id?: number;
  full_name?: string;
  gmail?: string;
  username?: string;
}

export interface TelemetryHistoryRecord {
  id: number;
  device_id: number;
  device_code: string;
  device_name: string;
  device_type: string;
  floor?: string;
  project_name: string;
  project_address?: string;
  location_id?: number;
  gateway_sn?: string;
  gateway_ip?: string;
  temperature?: number | null;
  humidity?: number | null;
  power?: number | null;
  voltage?: number | null;
  current?: number | null;
  raw_data?: any;
  recorded_at: string;
  time_label?: string;
}

export const EmployHistory: React.FC = () => {
  const [activeTab] = useState('history');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);

  // Dữ liệu bảng lịch sử telemetry_history
  const [historyList, setHistoryList] = useState<TelemetryHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterDeviceType, setFilterDeviceType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [limitCount, setLimitCount] = useState<number>(200);

  // Phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 25;

  // Modal xem Raw JSON
  const [selectedRawData, setSelectedRawData] = useState<{
    id: number;
    device_code: string;
    device_name: string;
    recorded_at: string;
    data: any;
  } | null>(null);

  // Modal xem Biểu đồ viễn trắc
  const [selectedChartProject, setSelectedChartProject] = useState<ProjectGroup | null>(null);

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

  // Tải danh sách telemetry_history từ Backend
  const fetchHistoryData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const backendUrl = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : '');

      const params = new URLSearchParams();
      params.append('limit', String(limitCount));
      params.append('order', sortOrder);
      if (filterProject !== 'all') params.append('project_name', filterProject);

      const res = await fetch(`${backendUrl}/api/telemetry-history?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setHistoryList(json.data);
          const now = new Date();
          setLastFetched(now.toLocaleTimeString('vi-VN'));
        }
      }
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu telemetry_history:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData(true);
  }, [filterProject, sortOrder, limitCount]);

  // Kết nối WebSocket Realtime để nhận thông báo có bản ghi mới
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

        ws.onopen = () => {
          setWsStatus('connected');
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'TELEMETRY_DATA_SAVED') {
              // Khi có gói tin viễn trắc mới được lưu, làm mới dữ liệu lịch sử
              fetchHistoryData(false);
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
          reconnectTimeout = setTimeout(connectWs, 5000);
        };

        wsRef.current = ws;
      } catch {
        setWsStatus('disconnected');
      }
    };

    connectWs();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [filterProject, sortOrder, limitCount]);

  // Định kỳ polling tự động mỗi 15s nếu bật AutoRefresh
  useEffect(() => {
    if (!autoRefresh) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }
    pollTimerRef.current = setInterval(() => {
      fetchHistoryData(false);
    }, 15000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [autoRefresh, filterProject, sortOrder, limitCount]);

  // Danh sách các dự án duy nhất
  const uniqueProjects = useMemo(() => {
    const set = new Set<string>();
    historyList.forEach((r) => {
      if (r.project_name) set.add(r.project_name);
    });
    return Array.from(set);
  }, [historyList]);

  // Danh sách thiết bị duy nhất
  const uniqueDevices = useMemo(() => {
    const map = new Map<string, string>();
    historyList.forEach((r) => {
      if (r.device_code) {
        map.set(r.device_code, r.device_name || r.device_code);
      }
    });
    return Array.from(map.entries());
  }, [historyList]);

  // Lọc dữ liệu client theo từ khóa và loại thiết bị
  const filteredList = useMemo(() => {
    return historyList.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = (r.device_code || '').toLowerCase().includes(q);
        const matchName = (r.device_name || '').toLowerCase().includes(q);
        const matchProj = (r.project_name || '').toLowerCase().includes(q);
        const matchFloor = (r.floor || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchProj && !matchFloor) return false;
      }
      if (filterDeviceType !== 'all') {
        if ((r.device_type || 'sensor').toLowerCase() !== filterDeviceType.toLowerCase()) return false;
      }
      return true;
    });
  }, [historyList, searchQuery, filterDeviceType]);

  // Phân trang
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  const handleLogout = () => {
    localStorage.removeItem('aaa_admin_auth');
    localStorage.removeItem('aaa_token');
    window.location.hash = '#login';
  };

  const currentFullName = currentUser?.full_name || 'Nhân viên 3A';

  // Xuất CSV
  const handleExportCSV = () => {
    if (filteredList.length === 0) return;
    const headers = [
      'ID',
      'Thời gian',
      'Dự án',
      'Mã thiết bị',
      'Tên thiết bị',
      'Loại thiết bị',
      'Khu vực/Tầng',
      'Nhiệt độ (°C)',
      'Độ ẩm (%)',
      'Công suất (W)',
      'Điện áp (V)',
      'Dòng điện (A)'
    ];

    const rows = filteredList.map((r) => [
      r.id,
      r.recorded_at,
      `"${r.project_name || ''}"`,
      r.device_code,
      `"${r.device_name || ''}"`,
      r.device_type || 'sensor',
      `"${r.floor || ''}"`,
      r.temperature ?? '',
      r.humidity ?? '',
      r.power ?? '',
      r.voltage ?? '',
      r.current ?? ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lich_su_vien_trac_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dash-layout">
      {/* SIDEBAR NHÂN VIÊN */}
      <EmpAside
        activeTab={activeTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <div className="dash-main">
        {/* HEADER */}
        <EmpHeader
          title="Lịch Sử Vận Hành và Dữ Liệu IoT"
          subtitle="Tra cứu, đối soát toàn bộ chu kỳ đo đạc"
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
            {/* Card 1: Tổng bản ghi lịch sử */}
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
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7'
                }}
              >
                <Clock size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Tổng bản ghi lịch sử
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d58bb', lineHeight: 1.2 }}>
                  {historyList.length.toLocaleString()} bản ghi
                </div>
              </div>
            </div>

            {/* Card 2: Thiết bị có số liệu */}
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
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a'
                }}
              >
                <Activity size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Thiết bị ghi nhận
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d58bb', lineHeight: 1.2 }}>
                  {uniqueDevices.length} thiết bị
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Đang ghi chu kỳ viễn trắc
                </div>
              </div>
            </div>

            {/* Card 3: Số dự án */}
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
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706'
                }}
              >
                <Building2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Dự án triển khai
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d58bb', lineHeight: 1.2 }}>
                  {uniqueProjects.length} Dự án
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Lưu trữ tập trung trên VPS
                </div>
              </div>
            </div>

            {/* Card 4: WebSocket Realtime */}
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
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: wsStatus === 'connected' ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${wsStatus === 'connected' ? '#bbf7d0' : '#fed7aa'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: wsStatus === 'connected' ? '#16a34a' : '#d97706'
                }}
              >
                <Zap size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Cập nhật thời gian thực
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1d58bb', lineHeight: 1.2 }}>
                  {wsStatus === 'connected' ? 'WebSocket Live' : 'Đang kết nối...'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Lần tải cuối: {lastFetched || 'Đang cập nhật'}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN TOOLBAR & CONTROLS */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '18px 24px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              marginBottom: '20px'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              {/* Cụm Tìm kiếm & Lọc */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
                {/* Search box */}
                <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px' }}>
                  <Search
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                  />
                  <input
                    type="text"
                    placeholder="Tìm mã thiết bị, tên, dự án..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      backgroundColor: '#f8fafc'
                    }}
                  />
                </div>

                {/* Filter Dự án */}
                <select
                  value={filterProject}
                  onChange={(e) => {
                    setFilterProject(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Tất cả dự án ({uniqueProjects.length})</option>
                  {uniqueProjects.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                {/* Filter Loại thiết bị */}
                <select
                  value={filterDeviceType}
                  onChange={(e) => {
                    setFilterDeviceType(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Tất cả chủng loại</option>
                  <option value="sensor">Cảm biến (sensor)</option>
                  <option value="meter">Đồng hồ đo (meter)</option>
                  <option value="controller">Bộ điều khiển (controller)</option>
                </select>

                {/* Sắp xếp thứ tự thời gian */}
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.88rem',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  title="Đổi thứ tự hiển thị thời gian"
                >
                  <ArrowUpDown size={15} color="#1d58bb" />
                  {sortOrder === 'DESC' ? 'Mới nhất trước' : 'Cũ nhất trước'}
                </button>

                {/* Giới hạn số lượng */}
                <select
                  value={limitCount}
                  onChange={(e) => setLimitCount(Number(e.target.value))}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                  title="Giới hạn số bản ghi tải về"
                >
                  <option value={100}>100 bản ghi</option>
                  <option value={200}>200 bản ghi</option>
                  <option value={500}>500 bản ghi</option>
                  <option value={1000}>1,000 bản ghi</option>
                </select>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Tự động refresh */}
                <button
                  type="button"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${autoRefresh ? '#86efac' : '#cbd5e1'}`,
                    backgroundColor: autoRefresh ? '#f0fdf4' : '#ffffff',
                    color: autoRefresh ? '#16a34a' : '#64748b',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Tự động cập nhật mỗi 15s"
                >
                  {autoRefresh ? <Pause size={15} /> : <Play size={15} />}
                  <span>{autoRefresh ? 'Tự động' : 'Tạm dừng'}</span>
                </button>

                {/* Nút Làm mới */}
                <button
                  type="button"
                  onClick={() => fetchHistoryData(true)}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#1d58bb',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
                </button>

                {/* Xuất file Excel / CSV */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={filteredList.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: filteredList.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: filteredList.length === 0 ? 0.6 : 1
                  }}
                  title="Tải toàn bộ kết quả lọc ra file CSV Excel"
                >
                  <Download size={15} />
                  <span>Xuất CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* BẢNG DỮ LIỆU LỊCH SỬ VIỄN TRẮC */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              marginBottom: '24px'
            }}
          >
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#1d58bb" />
                <span style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1e293b' }}>
                  Danh Sách Lịch Sử Viễn Trắc ({filteredList.length} kết quả)
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Hiển thị trang {currentPage} / {totalPages}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, width: '70px' }}>STT/ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, minWidth: '150px' }}>Thời Gian Đo</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, minWidth: '160px' }}>Dự Án</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, minWidth: '180px' }}>Thiết Bị</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, minWidth: '120px' }}>Nhiệt Độ (°C)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, minWidth: '120px' }}>Độ Ẩm (%)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, minWidth: '130px' }}>Công Suất (W)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, minWidth: '140px' }}>Điện Áp / Dòng</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center', width: '100px' }}>Gói Tin</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && historyList.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#1d58bb' }} />
                        <div>Đang tải dữ liệu lịch sử viễn trắc từ Database 3ahome...</div>
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                        <AlertCircle size={28} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>
                          Chưa có bản ghi lịch sử viễn trắc nào phù hợp
                        </div>
                        <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                          Dữ liệu sẽ tự động tích lũy khi Gateway hoặc MQTTBox gửi gói tin viễn trắc!
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row, idx) => {
                      const displayIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                      const hasTemp = row.temperature !== null && row.temperature !== undefined;
                      const hasHumi = row.humidity !== null && row.humidity !== undefined;
                      const hasPower = row.power !== null && row.power !== undefined;
                      const hasVolt = row.voltage !== null && row.voltage !== undefined;
                      const hasCurr = row.current !== null && row.current !== undefined;

                      return (
                        <tr
                          key={row.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.15s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                        >
                          {/* STT & ID */}
                          <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>
                            <div>#{row.id}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>[{displayIndex}]</div>
                          </td>

                          {/* Thời gian */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {row.recorded_at}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={11} /> {row.time_label || 'Vừa xong'}
                            </div>
                          </td>

                          {/* Dự án */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#1d58bb' }}>
                              {row.project_name || 'Dự án nội bộ'}
                            </div>
                            {row.project_address && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {row.project_address}
                              </div>
                            )}
                          </td>

                          {/* Thiết bị */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                {row.device_name || row.device_code}
                              </span>
                              <span
                                style={{
                                  backgroundColor: '#eff6ff',
                                  color: '#1d58bb',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700
                                }}
                              >
                                {row.device_code}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                              {row.floor || 'Khu vực chính'} • {row.device_type || 'sensor'}
                            </div>
                          </td>

                          {/* Nhiệt độ */}
                          <td style={{ padding: '12px 16px' }}>
                            {hasTemp ? (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 700,
                                  color: (row.temperature ?? 0) > 35 ? '#dc2626' : '#ea580c',
                                  backgroundColor: '#fff7ed',
                                  padding: '4px 8px',
                                  borderRadius: '8px'
                                }}
                              >
                                <Thermometer size={14} />
                                <span>{row.temperature}°C</span>
                              </div>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>--</span>
                            )}
                          </td>

                          {/* Độ ẩm */}
                          <td style={{ padding: '12px 16px' }}>
                            {hasHumi ? (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 700,
                                  color: '#0284c7',
                                  backgroundColor: '#f0f9ff',
                                  padding: '4px 8px',
                                  borderRadius: '8px'
                                }}
                              >
                                <Droplets size={14} />
                                <span>{row.humidity}%</span>
                              </div>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>--</span>
                            )}
                          </td>

                          {/* Công suất */}
                          <td style={{ padding: '12px 16px' }}>
                            {hasPower ? (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 700,
                                  color: '#d97706',
                                  backgroundColor: '#fffbeb',
                                  padding: '4px 8px',
                                  borderRadius: '8px'
                                }}
                              >
                                <Zap size={14} />
                                <span>{row.power} W</span>
                              </div>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>--</span>
                            )}
                          </td>

                          {/* Điện áp / Dòng */}
                          <td style={{ padding: '12px 16px' }}>
                            {hasVolt || hasCurr ? (
                              <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                                <div>{hasVolt ? `${row.voltage} V` : ''}</div>
                                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                  {hasCurr ? `${row.current} A` : ''}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>--</span>
                            )}
                          </td>

                          {/* Nút Xem Gói Tin JSON */}
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRawData({
                                  id: row.id,
                                  device_code: row.device_code,
                                  device_name: row.device_name,
                                  recorded_at: row.recorded_at,
                                  data: row.raw_data || {
                                    temperature: row.temperature,
                                    humidity: row.humidity,
                                    power: row.power,
                                    voltage: row.voltage,
                                    current: row.current
                                  }
                                });
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                color: '#1e293b',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                gap: '4px'
                              }}
                              title="Xem gói tin JSON chi tiết"
                            >
                              <Eye size={13} color="#1d58bb" />
                              <span>JSON</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PHÂN TRANG */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: '14px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f1f5f9',
                  backgroundColor: '#ffffff'
                }}
              >
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, filteredList.length)} trong tổng số{' '}
                  {filteredList.length} bản ghi
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: currentPage === 1 ? '#cbd5e1' : '#334155',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    <ChevronLeft size={14} /> Trước
                  </button>

                  <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 8px', color: '#1e293b' }}>
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: currentPage === totalPages ? '#cbd5e1' : '#334155',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    Sau <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT GÓI TIN RAW DATA JSON */}
      {selectedRawData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSelectedRawData(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Gói Tin Viễn Trắc #{selectedRawData.id}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Thiết bị: <strong>{selectedRawData.device_code}</strong> ({selectedRawData.device_name}) •{' '}
                  {selectedRawData.recorded_at}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRawData(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', maxHeight: '450px', overflowY: 'auto' }}>
              <pre
                style={{
                  backgroundColor: '#0f172a',
                  color: '#38bdf8',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  margin: 0
                }}
              >
                {JSON.stringify(
                  typeof selectedRawData.data === 'string'
                    ? JSON.parse(selectedRawData.data)
                    : selectedRawData.data,
                  null,
                  2
                )}
              </pre>
            </div>

            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: '#ffffff'
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedRawData(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#1d58bb',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BIỂU ĐỒ NẾU ĐƯỢC MỞ */}
      {selectedChartProject && (
        <ProjectTelemetryChartModal
          project={selectedChartProject}
          onClose={() => setSelectedChartProject(null)}
        />
      )}
    </div>
  );
};

export default EmployHistory;
