import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../dash/Dash.css';
import { DashAside } from '../../components/common/DashAside';
import { DashHeader } from '../../components/common/DashHeader';
import {
  RefreshCw,
  Zap,
  Activity,
  Search,
  Building2,
  Clock,
  ArrowUpDown,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Layers,
  LineChart,
  Database,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';
import { ProjectTelemetryChartModal } from '../../components/common/ProjectTelemetryChartModal';

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
  show?: any;
  raw_data?: any;
  recorded_at: string;
  time_label?: string;
}

export const extractMValues = (row: any): Record<string, any> => {
  const result: Record<string, any> = {};
  const parseObj = (val: any) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    return null;
  };

  const showObj = parseObj(row?.show);
  const rawObj = parseObj(row?.raw_data);
  const source = showObj || rawObj?.values || rawObj || {};

  Object.keys(source).forEach((k) => {
    if (/^m\d+$/i.test(k) && source[k] !== undefined && source[k] !== null) {
      result[k.toLowerCase()] = source[k];
    }
  });

  if (Object.keys(result).length === 0 && source && typeof source === 'object') {
    const ignored = new Set([
      'device_code',
      'device_id',
      'deviceId',
      'deviceCode',
      'device_name',
      'device_type',
      'floor',
      'timestamp',
      'status',
      'gateway',
      'values'
    ]);
    const otherKeys = Object.keys(source).filter(
      (k) => !ignored.has(k) && source[k] !== null && source[k] !== undefined && typeof source[k] !== 'object'
    );
    otherKeys.forEach((k, idx) => {
      result[`m${idx + 1}`] = source[k];
    });
  }

  return result;
};

export const getMaxMIndex = (rows: any[]): number => {
  let maxIdx = 3;
  rows.forEach((r) => {
    const mVals = extractMValues(r);
    Object.keys(mVals).forEach((k) => {
      const match = k.match(/^m(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIdx) maxIdx = num;
      }
    });
  });
  return maxIdx;
};

export const parseRecordedAtMs = (val?: string): number => {
  if (!val) return 0;
  const trimmed = String(val).trim();
  const vnMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (vnMatch) {
    const [, dd, mm, yyyy, hh, min, ss = '0'] = vnMatch;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss)).getTime();
  }
  const isoStr = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const parsed = Date.parse(isoStr);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const sortRowsNewestFirst = <T extends { recorded_at?: string; id?: number; device_id?: number }>(rows: T[]): T[] => {
  return [...rows].sort((a, b) => {
    const diff = parseRecordedAtMs(b.recorded_at) - parseRecordedAtMs(a.recorded_at);
    if (diff !== 0) return diff;
    return (Number(b.id || b.device_id) || 0) - (Number(a.id || a.device_id) || 0);
  });
};

export const DashHistory: React.FC = () => {
  const [activeTab] = useState('history');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);

  // Dữ liệu bảng lịch sử telemetry_history
  const [historyList, setHistoryList] = useState<TelemetryHistoryRecord[]>([]);
  // Danh sách cột m tuỳ chỉnh và danh sách cột m đã xoá của từng thiết bị
  const [customMColsMap, setCustomMColsMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('aaa_telemetry_m_col_list');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [removedMColsMap, setRemovedMColsMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('aaa_telemetry_removed_m_cols');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  // Trạng thái hiển thị bảng chọn xoá nhiều cột m
  const [deleteColModal, setDeleteColModal] = useState<{
    devKey: string;
    deviceName: string;
    columns: string[];
    selected: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  const getDeviceMColumns = (devKey: string, rows: any[]): string[] => {
    const maxDataM = getMaxMIndex(rows);
    const defaultCols = Array.from({ length: Math.max(3, maxDataM) }, (_, i) => `m${i + 1}`);
    const removed = new Set(removedMColsMap[devKey] || []);
    const custom = customMColsMap[devKey] || [];
    const merged = new Set<string>();
    defaultCols.forEach((c) => {
      if (!removed.has(c)) merged.add(c);
    });
    custom.forEach((c) => {
      if (!removed.has(c)) merged.add(c);
    });
    return Array.from(merged).sort((a, b) => {
      const na = parseInt(a.replace(/^m/i, ''), 10) || 0;
      const nb = parseInt(b.replace(/^m/i, ''), 10) || 0;
      return na - nb;
    });
  };

  const handleAddMColumn = (devKey: string, currentCols: string[]) => {
    let maxNum = 0;
    currentCols.forEach((c) => {
      const n = parseInt(c.replace(/^m/i, ''), 10) || 0;
      if (n > maxNum) maxNum = n;
    });
    const nextCol = `m${maxNum + 1}`;

    setRemovedMColsMap((prev) => {
      const list = (prev[devKey] || []).filter((c) => c !== nextCol);
      const next = { ...prev, [devKey]: list };
      try {
        localStorage.setItem('aaa_telemetry_removed_m_cols', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    setCustomMColsMap((prev) => {
      const existing = prev[devKey] || currentCols;
      const updated = Array.from(new Set([...existing, nextCol]));
      const next = { ...prev, [devKey]: updated };
      try {
        localStorage.setItem('aaa_telemetry_m_col_list', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleConfirmDeleteColumns = () => {
    if (!deleteColModal || deleteColModal.selected.length === 0) return;
    const { devKey, selected, columns } = deleteColModal;
    const toRemoveSet = new Set(selected);

    setRemovedMColsMap((prev) => {
      const existing = prev[devKey] || [];
      const updated = Array.from(new Set([...existing, ...selected]));
      const next = { ...prev, [devKey]: updated };
      try {
        localStorage.setItem('aaa_telemetry_removed_m_cols', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    setCustomMColsMap((prev) => {
      const existing = prev[devKey] || columns;
      const updated = existing.filter((c) => !toRemoveSet.has(c));
      const next = { ...prev, [devKey]: updated };
      try {
        localStorage.setItem('aaa_telemetry_m_col_list', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    setDeleteColModal(null);
  };

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterDeviceType, setFilterDeviceType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [limitCount, setLimitCount] = useState<number>(200);
  const [, setCurrentPage] = useState<number>(1);

  // Modal xem Raw JSON
  const [selectedRawData, setSelectedRawData] = useState<{
    id: number;
    device_code: string;
    device_name: string;
    recorded_at: string;
    data: any;
  } | null>(null);

  // Modal xem Biểu đồ vận hành
  const [selectedChartProject, setSelectedChartProject] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<any>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

      let res = await fetch(`${backendUrl}/api/telemetry-history?${params.toString()}`).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`/api/telemetry-history?${params.toString()}`).catch(() => null);
      }
      if (res && res.ok) {
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

        ws.onopen = () => {
          setWsStatus('connected');
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'TELEMETRY_DATA_SAVED') {
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

  // Polling tự động mỗi 15s nếu bật AutoRefresh
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

  // Quản lý mở rộng / thu gọn từng dự án và giới hạn bản ghi hiển thị
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [projectLimits, setProjectLimits] = useState<Record<string, number>>({});

  // Gom nhóm dữ liệu lịch sử vận hành theo từng dự án
  const projectGroups = useMemo(() => {
    const map = new Map<string, {
      project_name: string;
      project_address?: string;
      location_id?: number;
      gateway_sn?: string;
      gateway_ip?: string;
      gateway_status?: 'online' | 'offline';
      latest_recorded_at?: string;
      deviceMap: Map<string, {
        device_id: number;
        device_code: string;
        device_name: string;
        device_type?: string;
        floor?: string;
      }>;
      records: TelemetryHistoryRecord[];
    }>();

    filteredList.forEach((row) => {
      const pName = row.project_name || 'Dự án nội bộ';
      if (!map.has(pName)) {
        map.set(pName, {
          project_name: pName,
          project_address: row.project_address,
          location_id: row.location_id,
          gateway_sn: row.gateway_sn,
          gateway_ip: row.gateway_ip,
          gateway_status: 'online',
          latest_recorded_at: row.recorded_at,
          deviceMap: new Map(),
          records: []
        });
      }

      const grp = map.get(pName)!;
      grp.records.push(row);

      if (row.device_code && !grp.deviceMap.has(row.device_code)) {
        grp.deviceMap.set(row.device_code, {
          device_id: row.device_id,
          device_code: row.device_code,
          device_name: row.device_name || row.device_code,
          device_type: row.device_type,
          floor: row.floor
        });
      }

      if (
        row.recorded_at &&
        (!grp.latest_recorded_at || parseRecordedAtMs(row.recorded_at) > parseRecordedAtMs(grp.latest_recorded_at))
      ) {
        grp.latest_recorded_at = row.recorded_at;
      }
    });

    return Array.from(map.values())
      .map((g) => ({
        project_name: g.project_name,
        project_address: g.project_address,
        location_id: g.location_id,
        gateway_sn: g.gateway_sn,
        gateway_ip: g.gateway_ip,
        gateway_status: g.gateway_status,
        latest_recorded_at: g.latest_recorded_at,
        deviceCount: g.deviceMap.size,
        devices: Array.from(g.deviceMap.values()),
        records: sortRowsNewestFirst(g.records)
      }))
      .sort((a, b) => parseRecordedAtMs(b.latest_recorded_at) - parseRecordedAtMs(a.latest_recorded_at));
  }, [filteredList]);

  // Tự động mở rộng các dự án khi có dữ liệu
  useEffect(() => {
    if (projectGroups.length > 0) {
      setExpandedProjects((prev) => {
        const next = { ...prev };
        projectGroups.forEach((g) => {
          if (next[g.project_name] === undefined) {
            next[g.project_name] = true;
          }
        });
        return next;
      });
    }
  }, [projectGroups]);

  const toggleProject = (projectName: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectName]: !prev[projectName]
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    projectGroups.forEach((g) => {
      next[g.project_name] = true;
    });
    setExpandedProjects(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    projectGroups.forEach((g) => {
      next[g.project_name] = false;
    });
    setExpandedProjects(next);
  };

  const currentFullName = currentUser?.full_name || 'Quản Trị Viên';

  // Xuất CSV theo từng dự án hoặc toàn bộ
  const handleExportCSV = (recordsToExport?: TelemetryHistoryRecord[], projectName?: string) => {
    const list = recordsToExport || filteredList;
    if (list.length === 0) return;
    const maxM = getMaxMIndex(list);
    const mHeaders = Array.from({ length: maxM }, (_, i) => `m${i + 1}`);
    const headers = [
      'ID',
      'Thời gian',
      'Dự án',
      'Mã thiết bị',
      'Tên thiết bị',
      'Loại thiết bị',
      'Khu vực/Tầng',
      ...mHeaders
    ];

    const rows = list.map((r) => {
      const mVals = extractMValues(r);
      return [
        r.id,
        r.recorded_at,
        `"${r.project_name || ''}"`,
        r.device_code,
        `"${r.device_name || ''}"`,
        r.device_type || 'sensor',
        `"${r.floor || ''}"`,
        ...mHeaders.map((k) => mVals[k] ?? '')
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeProj = projectName ? projectName.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_') : 'toan_bo';
    link.setAttribute('download', `lich_su_van_hanh_${safeProj}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(projectName ? `Đã xuất CSV cho dự án ${projectName}!` : 'Đã xuất file CSV lịch sử vận hành thành công!');
  };

  return (
    <div className="dash-layout">
      {/* TOAST THÔNG BÁO */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
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

      {/* 1. SIDEBAR ĐIỀU HƯỚNG ADMIN */}
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
          title="Lịch Sử Vận Hành và Dữ Liệu IoT"
          subtitle="Kho lưu trữ toàn bộ chu kỳ đo đạc từ bảng telemetry_history trong Database 3ahome"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
          triggerToast={triggerToast}
          refreshTitle="Làm mới lịch sử"
          onRefresh={() => {
            fetchHistoryData(true);
            triggerToast('Đã làm mới danh sách lịch sử vận hành');
          }}
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
                <Database size={24} />
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
                  Đang ghi chu kỳ vận hành
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
                  onClick={() => {
                    fetchHistoryData(true);
                    triggerToast('Đang tải lại dữ liệu lịch sử...');
                  }}
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
              </div>
            </div>
          </div>

          {/* BẢNG DỮ LIỆU LỊCH SỬ VẬN HÀNH GOM THEO DỰ ÁN */}
          <div style={{ marginBottom: '24px' }}>
            {/* Thanh tiêu đề và điều khiển mở rộng / thu gọn */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
                padding: '12px 18px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={20} color="#1d58bb" />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                  Kho Dữ Liệu Lịch Sử Vận Hành Theo Dự Án
                </span>
                <span
                  style={{
                    backgroundColor: '#eff6ff',
                    color: '#1d58bb',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                >
                  {projectGroups.length} dự án • {filteredList.length} bản ghi
                </span>
              </div>

              {projectGroups.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={expandAll}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Mở rộng tất cả
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Thu gọn tất cả
                  </button>
                </div>
              )}
            </div>

            {/* Trạng thái Loading hoặc Trống */}
            {loading && historyList.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '48px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
                }}
              >
                <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#1d58bb' }} />
                <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>
                  Đang tải dữ liệu lịch sử vận hành từ Database 3ahome...
                </div>
              </div>
            ) : projectGroups.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '48px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
                }}
              >
                <AlertCircle size={32} style={{ margin: '0 auto 10px', color: '#94a3b8' }} />
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#334155' }}>
                  Chưa có bản ghi lịch sử vận hành nào phù hợp
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
                  Dữ liệu sẽ tự động tích lũy khi Gateway hoặc MQTTBox gửi gói tin vận hành!
                </div>
              </div>
            ) : (
              /* Danh sách Accordion Dự Án */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {projectGroups.map((group) => {
                  const isExpanded = expandedProjects[group.project_name] !== false;
                  const currentLimit = projectLimits[group.project_name] || 15;
                  const displayRecords = group.records.slice(0, currentLimit);

                  return (
                    <div
                      key={group.project_name}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden',
                        transition: 'box-shadow 0.2s'
                      }}
                    >
                      {/* Tiêu đề Dự Án (Click để đóng/mở) */}
                      <div
                        onClick={() => toggleProject(group.project_name)}
                        style={{
                          padding: '16px 20px',
                          backgroundColor: isExpanded ? '#f8fafc' : '#ffffff',
                          borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          userSelect: 'none',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              backgroundColor: '#eff6ff',
                              color: '#1d58bb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '1rem'
                            }}
                          >
                            <Building2 size={18} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                                {group.project_name}
                              </span>
                              {group.project_address && (
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                  ({group.project_address})
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', fontSize: '0.78rem', color: '#64748b' }}>
                              <span>
                                <strong>{group.records.length}</strong> bản ghi
                              </span>
                              <span>•</span>
                              <span>
                                <strong>{group.deviceCount}</strong> thiết bị
                              </span>
                              {group.latest_recorded_at && (
                                <>
                                  <span>•</span>
                                  <span>Gần nhất: {group.latest_recorded_at}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChartProject(group);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              backgroundColor: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d58bb',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            title="Xem biểu đồ vận hành của dự án này"
                          >
                            <LineChart size={15} />
                            <span>Biểu đồ</span>
                          </button>

                          {/* Nút Xuất CSV cho riêng dự án này */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportCSV(group.records, group.project_name);
                            }}
                            disabled={group.records.length === 0}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              backgroundColor: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#059669',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              cursor: group.records.length === 0 ? 'not-allowed' : 'pointer',
                              opacity: group.records.length === 0 ? 0.6 : 1
                            }}
                            title={`Tải toàn bộ lịch sử vận hành của dự án ${group.project_name} ra file CSV Excel`}
                          >
                            <Download size={14} />
                            <span>Xuất CSV</span>
                          </button>

                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '8px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569'
                            }}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {/* Bảng Dữ Liệu Lịch Sử Của Dự Án */}
                      {isExpanded && (
                        <div>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                                  <th style={{ padding: '12px 16px', fontWeight: 600, width: '70px' }}>STT/ID</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 600, minWidth: '150px' }}>Thời Gian Đo</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 600, minWidth: '180px' }}>Thiết Bị</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 600, minWidth: '130px' }}>Khu Vực/Tầng</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Giá trị</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center', width: '90px' }}>Gói Tin</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  // Gom các bản ghi trong group.records theo từng thiết bị để bảng lồng hiển thị các hàng giá trị bên dưới (xếp mới nhất lên trên, tối đa 10 hàng hiển thị kèm thanh cuộn dọc)
                                  const devGroupMap = new Map<string, TelemetryHistoryRecord[]>();
                                  group.records.forEach((r) => {
                                    const key = r.device_code || String(r.device_id);
                                    if (!devGroupMap.has(key)) devGroupMap.set(key, []);
                                    devGroupMap.get(key)!.push(r);
                                  });
                                  const deviceEntries = Array.from(devGroupMap.entries())
                                    .map(([devKey, recs]) => [devKey, sortRowsNewestFirst(recs)] as [string, TelemetryHistoryRecord[]])
                                    .sort(
                                      (a, b) =>
                                        parseRecordedAtMs(b[1][0]?.recorded_at) -
                                        parseRecordedAtMs(a[1][0]?.recorded_at)
                                    );

                                  return deviceEntries.map(([devKey, devRecords], idx) => {
                                    const row = devRecords[0];
                                    const mCols = getDeviceMColumns(devKey, devRecords);

                                    return (
                                      <tr
                                        key={devKey}
                                        style={{
                                          borderBottom: '1px solid #f1f5f9',
                                          transition: 'background-color 0.15s',
                                          verticalAlign: 'top'
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                                      >
                                        {/* STT/ID */}
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>
                                          <div>#{row.device_id || row.id}</div>
                                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>[{idx + 1}]</div>
                                        </td>

                                        {/* Thời gian */}
                                        <td style={{ padding: '12px 16px' }}>
                                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                            {row.recorded_at}
                                          </div>
                                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={11} /> {row.time_label || 'Vừa xong'} ({devRecords.length} bản tin)
                                          </div>
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
                                            Loại: {row.device_type || 'sensor'}
                                          </div>
                                        </td>

                                        {/* Khu vực/Tầng */}
                                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                                          {row.floor || 'Khu vực chính'}
                                        </td>

                                        {/* Cột Giá trị: Bảng gồm hàng trên cùng có m1, m2, m3, ..., Cập nhật lúc, và nút Thêm cột */}
                                        <td style={{ padding: '10px 16px' }}>
                                          <div
                                            style={{
                                              border: '1px solid #cbd5e1',
                                              borderRadius: '8px',
                                              maxWidth: '685px',
                                              margin: '0 auto',
                                              overflowX: mCols.length > 5 ? 'auto' : 'hidden',
                                              maxHeight: devRecords.length > 10 ? '365px' : 'none',
                                              overflowY: devRecords.length > 10 ? 'auto' : 'visible',
                                              backgroundColor: '#ffffff'
                                            }}
                                          >
                                            <table
                                              style={{
                                                width: mCols.length > 5 ? `${mCols.length * 72 + 325}px` : '100%',
                                                minWidth: mCols.length > 5 ? `${mCols.length * 72 + 325}px` : undefined,
                                                borderCollapse: 'separate',
                                                borderSpacing: 0,
                                                fontSize: '0.78rem',
                                                textAlign: 'center'
                                              }}
                                            >
                                              <thead>
                                                <tr
                                                  style={{
                                                    backgroundColor: '#f8fafc',
                                                    color: '#1e293b',
                                                    fontWeight: 700
                                                  }}
                                                >
                                                  {mCols.map((mKey) => (
                                                    <th
                                                      key={mKey}
                                                      style={{
                                                        position: 'sticky',
                                                        top: 0,
                                                        zIndex: 2,
                                                        backgroundColor: '#f8fafc',
                                                        padding: '7px 10px',
                                                        borderBottom: '1px solid #cbd5e1',
                                                        borderRight: '1px solid #e2e8f0',
                                                        fontFamily: 'monospace',
                                                        color: '#1D58BB',
                                                        width: '72px',
                                                        minWidth: '72px',
                                                        maxWidth: '72px',
                                                        boxSizing: 'border-box'
                                                      }}
                                                    >
                                                      {mKey}
                                                    </th>
                                                  ))}
                                                  <th
                                                    style={{
                                                      position: 'sticky',
                                                      top: 0,
                                                      right: mCols.length > 5 ? '180px' : undefined,
                                                      zIndex: mCols.length > 5 ? 3 : 2,
                                                      backgroundColor: '#f8fafc',
                                                      padding: '7px 10px',
                                                      borderBottom: '1px solid #cbd5e1',
                                                      borderRight: '1px solid #e2e8f0',
                                                      borderLeft: mCols.length > 5 ? '1px solid #cbd5e1' : undefined,
                                                      width: '145px',
                                                      minWidth: '145px',
                                                      color: '#475569',
                                                      boxSizing: 'border-box'
                                                    }}
                                                  >
                                                    Cập nhật lúc
                                                  </th>
                                                  <th
                                                    style={{
                                                      position: 'sticky',
                                                      top: 0,
                                                      right: mCols.length > 5 ? 0 : undefined,
                                                      zIndex: mCols.length > 5 ? 3 : 2,
                                                      backgroundColor: '#f8fafc',
                                                      borderBottom: '1px solid #cbd5e1',
                                                      padding: '5px 8px',
                                                      width: '180px',
                                                      minWidth: '180px',
                                                      boxSizing: 'border-box'
                                                    }}
                                                  >
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleAddMColumn(devKey, mCols);
                                                        }}
                                                        style={{
                                                          display: 'inline-flex',
                                                          alignItems: 'center',
                                                          gap: '3px',
                                                          padding: '4px 8px',
                                                          borderRadius: '6px',
                                                          border: '1px solid #1D58BB',
                                                          backgroundColor: '#eff6ff',
                                                          color: '#1D58BB',
                                                          fontSize: '0.72rem',
                                                          fontWeight: 700,
                                                          cursor: 'pointer',
                                                          whiteSpace: 'nowrap'
                                                        }}
                                                        title="Thêm cột thông số m tiếp theo"
                                                      >
                                                        <Plus size={12} />
                                                        <span>Thêm cột</span>
                                                      </button>
                                                      <button
                                                        type="button"
                                                        disabled={mCols.length === 0}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setDeleteColModal({
                                                            devKey,
                                                            deviceName: row.device_name || row.device_code,
                                                            columns: mCols,
                                                            selected: []
                                                          });
                                                        }}
                                                        style={{
                                                          display: 'inline-flex',
                                                          alignItems: 'center',
                                                          gap: '3px',
                                                          padding: '4px 8px',
                                                          borderRadius: '6px',
                                                          border: '1px solid #ef4444',
                                                          backgroundColor: mCols.length === 0 ? '#f8fafc' : '#fef2f2',
                                                          color: mCols.length === 0 ? '#cbd5e1' : '#dc2626',
                                                          borderColor: mCols.length === 0 ? '#e2e8f0' : '#fca5a5',
                                                          fontSize: '0.72rem',
                                                          fontWeight: 700,
                                                          cursor: mCols.length === 0 ? 'not-allowed' : 'pointer',
                                                          whiteSpace: 'nowrap'
                                                        }}
                                                        title="Mở bảng chọn các cột m muốn xoá"
                                                      >
                                                        <Minus size={12} />
                                                        <span>Xoá cột</span>
                                                      </button>
                                                    </div>
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {devRecords.map((mRow, rIdx) => {
                                                  const mVals = extractMValues(mRow);
                                                  return (
                                                    <tr
                                                      key={mRow.id ? `hist-${mRow.id}` : `r-${rIdx}-${mRow.recorded_at}`}
                                                      style={{
                                                        backgroundColor: rIdx === 0 ? '#f0fdf4' : '#ffffff'
                                                      }}
                                                    >
                                                      {mCols.map((mKey) => {
                                                        const val = mVals[mKey];
                                                        const hasVal = val !== undefined && val !== null && val !== '';
                                                        return (
                                                          <td
                                                            key={mKey}
                                                            style={{
                                                              padding: '7px 10px',
                                                              borderBottom: rIdx < devRecords.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                              borderRight: '1px solid #f1f5f9',
                                                              fontWeight: hasVal ? 700 : 400,
                                                              color: hasVal ? '#0f172a' : '#cbd5e1',
                                                              fontFamily: 'monospace',
                                                              width: '72px',
                                                              minWidth: '72px',
                                                              maxWidth: '72px',
                                                              boxSizing: 'border-box'
                                                            }}
                                                          >
                                                            {hasVal ? String(val) : '--'}
                                                          </td>
                                                        );
                                                      })}
                                                      <td
                                                        style={{
                                                          position: mCols.length > 5 ? 'sticky' : undefined,
                                                          right: mCols.length > 5 ? '180px' : undefined,
                                                          zIndex: mCols.length > 5 ? 1 : undefined,
                                                          backgroundColor: rIdx === 0 ? '#f0fdf4' : '#ffffff',
                                                          padding: '7px 10px',
                                                          borderBottom: rIdx < devRecords.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                          borderRight: '1px solid #f1f5f9',
                                                          borderLeft: mCols.length > 5 ? '1px solid #e2e8f0' : undefined,
                                                          color: '#64748b',
                                                          fontFamily: 'monospace',
                                                          fontSize: '0.74rem',
                                                          whiteSpace: 'nowrap',
                                                          width: '145px',
                                                          minWidth: '145px',
                                                          boxSizing: 'border-box'
                                                        }}
                                                      >
                                                        {mRow.recorded_at || '--'}
                                                      </td>
                                                      <td
                                                        style={{
                                                          position: mCols.length > 5 ? 'sticky' : undefined,
                                                          right: mCols.length > 5 ? 0 : undefined,
                                                          zIndex: mCols.length > 5 ? 1 : undefined,
                                                          backgroundColor: rIdx === 0 ? '#f0fdf4' : '#ffffff',
                                                          borderBottom: rIdx < devRecords.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                          padding: '5px 8px',
                                                          width: '180px',
                                                          minWidth: '180px',
                                                          boxSizing: 'border-box'
                                                        }}
                                                      >
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            setSelectedRawData({
                                                              id: mRow.id,
                                                              device_code: mRow.device_code,
                                                              device_name: mRow.device_name,
                                                              recorded_at: mRow.recorded_at,
                                                              data: mRow.raw_data || {
                                                                device_code: mRow.device_code,
                                                                ...mVals
                                                              }
                                                            });
                                                          }}
                                                          style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            backgroundColor: '#f8fafc',
                                                            border: '1px solid #e2e8f0',
                                                            color: '#1d58bb',
                                                            cursor: 'pointer',
                                                            fontSize: '0.68rem',
                                                            fontWeight: 600
                                                          }}
                                                          title="Xem JSON gói tin này"
                                                        >
                                                          #{mRow.id}
                                                        </button>
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>

                                        {/* Nút Xem Gói Tin JSON */}
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const mVals = extractMValues(row);
                                              setSelectedRawData({
                                                id: row.id,
                                                device_code: row.device_code,
                                                device_name: row.device_name,
                                                recorded_at: row.recorded_at,
                                                data: row.raw_data || {
                                                  device_code: row.device_code,
                                                  ...mVals
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
                                  });
                                })()}
                              </tbody>
                            </table>
                          </div>

                          {/* Footer của bảng Dự Án: Điều khiển số lượng bản ghi hiển thị */}
                          {group.records.length > 15 && (
                            <div
                              style={{
                                padding: '12px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderTop: '1px solid #f1f5f9',
                                backgroundColor: '#fafafa',
                                flexWrap: 'wrap',
                                gap: '10px'
                              }}
                            >
                              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                Đang hiển thị <strong>{displayRecords.length}</strong> / <strong>{group.records.length}</strong> bản ghi của dự án
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {displayRecords.length < group.records.length && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProjectLimits((prev) => ({
                                          ...prev,
                                          [group.project_name]: (prev[group.project_name] || 15) + 20
                                        }));
                                      }}
                                      style={{
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        backgroundColor: '#ffffff',
                                        color: '#1d58bb',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      + Xem thêm 20 bản ghi
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProjectLimits((prev) => ({
                                          ...prev,
                                          [group.project_name]: group.records.length
                                        }));
                                      }}
                                      style={{
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #bfdbfe',
                                        backgroundColor: '#eff6ff',
                                        color: '#1d58bb',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Xem tất cả ({group.records.length})
                                    </button>
                                  </>
                                )}

                                {currentLimit > 15 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProjectLimits((prev) => ({
                                        ...prev,
                                        [group.project_name]: 15
                                      }));
                                    }}
                                    style={{
                                      padding: '5px 12px',
                                      borderRadius: '8px',
                                      border: '1px solid #e2e8f0',
                                      backgroundColor: '#ffffff',
                                      color: '#64748b',
                                      fontSize: '0.8rem',
                                      fontWeight: 500,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Thu gọn về 15
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BẢNG CHỌN CÁC CỘT M MUỐN XOÁ */}
      {deleteColModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setDeleteColModal(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  Chọn Cột Thông Số (m) Muốn Xoá
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Thiết bị: <strong>{deleteColModal.deviceName}</strong> ({deleteColModal.devKey})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteColModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Bảng danh sách các cột m xếp theo hàng */}
            <div style={{ padding: '16px 20px', maxHeight: '340px', overflowY: 'auto' }}>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700 }}>
                      <th style={{ padding: '10px 14px', width: '50px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={
                            deleteColModal.columns.length > 0 &&
                            deleteColModal.selected.length === deleteColModal.columns.length
                          }
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setDeleteColModal((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    selected: checked ? [...prev.columns] : []
                                  }
                                : null
                            );
                          }}
                          style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                          title="Chọn tất cả các hàng"
                        />
                      </th>
                      <th style={{ padding: '10px 14px', width: '70px', textAlign: 'center' }}>STT</th>
                      <th style={{ padding: '10px 14px' }}>Cột thông số (m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deleteColModal.columns.map((colKey, idx) => {
                      const isSelected = deleteColModal.selected.includes(colKey);
                      return (
                        <tr
                          key={colKey}
                          onClick={() => {
                            setDeleteColModal((prev) => {
                              if (!prev) return null;
                              const exists = prev.selected.includes(colKey);
                              return {
                                ...prev,
                                selected: exists
                                  ? prev.selected.filter((c) => c !== colKey)
                                  : [...prev.selected, colKey]
                              };
                            });
                          }}
                          style={{
                            borderBottom: idx < deleteColModal.columns.length - 1 ? '1px solid #e2e8f0' : 'none',
                            backgroundColor: isSelected ? '#fef2f2' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'background-color 0.12s'
                          }}
                        >
                          <td style={{ padding: '10px 14px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setDeleteColModal((prev) => {
                                  if (!prev) return null;
                                  const exists = prev.selected.includes(colKey);
                                  return {
                                    ...prev,
                                    selected: exists
                                      ? prev.selected.filter((c) => c !== colKey)
                                      : [...prev.selected, colKey]
                                  };
                                });
                              }}
                              style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                            />
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: isSelected ? '#dc2626' : '#1D58BB', fontSize: '0.9rem' }}>
                            Cột {colKey}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer nút Xoá */}
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Đã chọn: <strong style={{ color: '#dc2626' }}>{deleteColModal.selected.length}</strong> cột
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setDeleteColModal(null)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  disabled={deleteColModal.selected.length === 0}
                  onClick={handleConfirmDeleteColumns}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: deleteColModal.selected.length === 0 ? '#cbd5e1' : '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: deleteColModal.selected.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                  <span>Xoá ({deleteColModal.selected.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  Gói Tin Vận Hành #{selectedRawData.id}
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

export default DashHistory;
