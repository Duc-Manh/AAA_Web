import React, { useState, useEffect, useRef } from 'react';
import '../dash/Dash.css';
import { DashAside } from '../../components/common/DashAside';
import { DashHeader } from '../../components/common/DashHeader';
import { DashPopup } from '../../components/common/DashPopup';
import {
  RefreshCw,
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
  BarChart3,
  Plus,
  Minus,
  Trash2,
  X
} from 'lucide-react';
import { ProjectTelemetryChartModal } from '../../components/common/ProjectTelemetryChartModal';

interface CurrentUserData {
  id?: number;
  full_name?: string;
  gmail?: string;
  username?: string;
}

export interface TelemetryDeviceRow {
  id?: number;
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
  show?: any;
  raw_data?: any;
  note?: string | null;
  recorded_at: string;
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
  // Lịch sử các gói tin MQTT nhận được theo từng thiết bị để hiển thị các hàng trong bảng Giá trị
  const [deviceRowsMap, setDeviceRowsMap] = useState<Record<string, TelemetryDeviceRow[]>>({});
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
  // Trạng thái nhập / sửa ghi chú (note) và xem cửa sổ chi tiết note
  const [editingNoteDevId, setEditingNoteDevId] = useState<number | null>(null);
  const [noteDraftText, setNoteDraftText] = useState<string>('');
  const [savingNoteDevId, setSavingNoteDevId] = useState<number | null>(null);
  const [viewingNoteModal, setViewingNoteModal] = useState<{
    device_id: number;
    device_code: string;
    device_name: string;
    note: string;
  } | null>(null);
  const [deletingDevId, setDeletingDevId] = useState<number | null>(null);
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

  // Lưu nội dung cột note vào bảng telemetry_data
  const handleSaveNote = async (dev: TelemetryDeviceRow) => {
    const devId = dev.device_id;
    const trimmedNote = noteDraftText.trim();
    setSavingNoteDevId(devId);
    try {
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const backendUrl = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : '');

      let ok = false;
      try {
        const res = await fetch(`${backendUrl}/api/telemetry-data/${devId}/note`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: trimmedNote })
        });
        if (res.ok) ok = true;
      } catch {
        // fallback
      }
      if (!ok) {
        await fetch(`/api/telemetry-data/${devId}/note`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: trimmedNote })
        }).catch(() => null);
      }

      setTelemetryList((prev) =>
        prev.map((item) => (item.device_id === devId ? { ...item, note: trimmedNote } : item))
      );
      setDeviceRowsMap((prev) => {
        const key = dev.device_code || String(dev.device_id);
        if (!prev[key]) return prev;
        return {
          ...prev,
          [key]: prev[key].map((r) => ({ ...r, note: trimmedNote }))
        };
      });
      setEditingNoteDevId(null);
      setNoteDraftText('');
    } finally {
      setSavingNoteDevId(null);
    }
  };

  // Xoá thiết bị tương ứng khỏi bảng telemetry_data
  const handleDeleteDeviceTelemetry = async (dev: TelemetryDeviceRow) => {
    const devId = dev.device_id;
    setDeletingDevId(devId);
    try {
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const backendUrl = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : '');

      let ok = false;
      try {
        const res = await fetch(`${backendUrl}/api/telemetry-data/${devId}`, {
          method: 'DELETE'
        });
        if (res.ok) ok = true;
      } catch {
        // fallback
      }
      if (!ok) {
        await fetch(`/api/telemetry-data/${devId}`, {
          method: 'DELETE'
        }).catch(() => null);
      }

      setTelemetryList((prev) => prev.filter((item) => item.device_id !== devId));
      setDeviceRowsMap((prev) => {
        const key = dev.device_code || String(dev.device_id);
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } finally {
      setDeletingDevId(null);
    }
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
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const backendUrl = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : '');

      let dataRows: TelemetryDeviceRow[] = [];
      try {
        const res = await fetch(`${backendUrl}/api/telemetry-data`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            dataRows = json.data;
          }
        }
      } catch {
        const fallbackRes = await fetch('/api/telemetry-data');
        if (fallbackRes.ok) {
          const json = await fallbackRes.json();
          if (json.success && Array.isArray(json.data)) {
            dataRows = json.data;
          }
        }
      }

      if (dataRows.length > 0) {
        const grouped: Record<string, TelemetryDeviceRow[]> = {};
        dataRows.forEach((hRow: TelemetryDeviceRow) => {
          const key = hRow.device_code || String(hRow.device_id);
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(hRow);
        });
        const uniqueLatestDevices: TelemetryDeviceRow[] = [];
        Object.keys(grouped).forEach((k) => {
          grouped[k] = sortRowsNewestFirst(grouped[k]);
          if (grouped[k].length > 0) {
            uniqueLatestDevices.push(grouped[k][0]);
          }
        });
        setDeviceRowsMap(grouped);
        setTelemetryList(uniqueLatestDevices);
        const now = new Date();
        setLastFetched(now.toLocaleTimeString('vi-VN'));
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
        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = isLocal 
          ? `ws://${window.location.hostname}:5000/ws`
          : `${wsProtocol}//${window.location.host}/ws`;
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
    if (
      row.recorded_at &&
      (!grp.latest_recorded_at || parseRecordedAtMs(row.recorded_at) > parseRecordedAtMs(grp.latest_recorded_at))
    ) {
      grp.latest_recorded_at = row.recorded_at;
    }
  });

  const projectGroups = Array.from(groupMap.values())
    .map((grp) => ({
      ...grp,
      devices: sortRowsNewestFirst(grp.devices)
    }))
    .sort((a, b) => parseRecordedAtMs(b.latest_recorded_at) - parseRecordedAtMs(a.latest_recorded_at));

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
                                            <th style={{ padding: '10px 12px', width: '70px' }}>ID</th>
                                            <th style={{ padding: '10px 12px', width: '140px' }}>Mã thiết bị</th>
                                            <th style={{ padding: '10px 12px', width: '180px' }}>TÊN IOT GATEWAY</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'center' }}>Giá trị</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'center', width: '100px' }}>Trạng thái</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'center', width: '240px' }}>Ghi chú</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'center', width: '110px' }}>Thao tác</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {group.devices.length === 0 ? (
                                            <tr>
                                              <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                                Dự án này chưa có thiết bị nào truyền dữ liệu
                                              </td>
                                            </tr>
                                          ) : (
                                            group.devices.map((dev, devIdx) => {
                                              const devKey = dev.device_code || String(dev.device_id);
                                              const rawHistRows =
                                                deviceRowsMap[devKey] && deviceRowsMap[devKey].length > 0
                                                  ? deviceRowsMap[devKey]
                                                  : [dev];
                                              const combinedRows = rawHistRows.some(
                                                (r) => r.recorded_at === dev.recorded_at
                                              )
                                                ? rawHistRows
                                                : [dev, ...rawHistRows];
                                              const histRows = sortRowsNewestFirst(combinedRows);
                                              const mCols = getDeviceMColumns(devKey, [dev, ...histRows]);
                                              const valueTableHeight = 38 + Math.min(Math.max(histRows.length, 1), 10) * 34 + 2;

                                              return (
                                                <tr
                                                  key={dev.device_id}
                                                  style={{
                                                    borderBottom: '1px solid #f1f5f9',
                                                    backgroundColor: devIdx % 2 === 0 ? '#ffffff' : '#fafafa',
                                                    verticalAlign: 'top'
                                                  }}
                                                >
                                                  {/* ID */}
                                                  <td style={{ padding: '12px', fontWeight: 700, color: '#64748b' }}>
                                                    #{dev.device_id}
                                                  </td>

                                                  {/* Mã thiết bị */}
                                                  <td style={{ padding: '12px' }}>
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
                                                  <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>
                                                    {dev.device_name}
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                                                      Modbus #{dev.slave_address} {dev.floor ? `(${dev.floor})` : ''}
                                                    </div>
                                                  </td>

                                                  {/* Cột Giá trị: Bảng lồng gồm Cập nhật lúc, nút Thêm cột / Xoá cột và các cột m1, m2, m3, ... xếp bên phải theo thứ tự tăng dần */}
                                                  <td style={{ padding: '10px 12px' }}>
                                                    <div
                                                      style={{
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '8px',
                                                        display: 'inline-flex',
                                                        alignItems: 'flex-start',
                                                        height: `${valueTableHeight}px`,
                                                        maxHeight: `${valueTableHeight}px`,
                                                        boxSizing: 'border-box',
                                                        overflowY: histRows.length > 10 ? 'auto' : 'hidden',
                                                        overflowX: 'hidden',
                                                        backgroundColor: '#ffffff'
                                                      }}
                                                    >
                                                      {/* KHỐI TRÁI: CỘT CẬP NHẬT LÚC VÀ CỘT + THÊM CỘT / - XOÁ CỘT HIỂN THỊ ĐẦY ĐỦ */}
                                                      <div
                                                        style={{
                                                          flex: '0 0 auto',
                                                          borderRight: '1px solid #cbd5e1'
                                                        }}
                                                      >
                                                        <table
                                                          style={{
                                                            borderCollapse: 'separate',
                                                            borderSpacing: 0,
                                                            fontSize: '0.78rem',
                                                            textAlign: 'center'
                                                          }}
                                                        >
                                                          <thead>
                                                            <tr
                                                              style={{
                                                                height: '38px',
                                                                backgroundColor: '#f8fafc',
                                                                color: '#1e293b',
                                                                fontWeight: 700
                                                              }}
                                                            >
                                                              <th
                                                                style={{
                                                                  position: 'sticky',
                                                                  top: 0,
                                                                  zIndex: 2,
                                                                  height: '38px',
                                                                  backgroundColor: '#f8fafc',
                                                                  padding: '0 12px',
                                                                  borderBottom: '1px solid #cbd5e1',
                                                                  borderRight: '1px solid #e2e8f0',
                                                                  minWidth: '148px',
                                                                  color: '#475569',
                                                                  whiteSpace: 'nowrap',
                                                                  boxSizing: 'border-box'
                                                                }}
                                                              >
                                                                Cập nhật lúc
                                                              </th>
                                                              <th
                                                                style={{
                                                                  position: 'sticky',
                                                                  top: 0,
                                                                  zIndex: 2,
                                                                  height: '38px',
                                                                  backgroundColor: '#f8fafc',
                                                                  borderBottom: '1px solid #cbd5e1',
                                                                  padding: '0 10px',
                                                                  minWidth: '184px',
                                                                  whiteSpace: 'nowrap',
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
                                                                        deviceName: dev.device_name || dev.device_code,
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
                                                            {histRows.map((mRow, rIdx) => (
                                                              <tr
                                                                key={mRow.id ? `f-h-${mRow.id}` : `f-r-${rIdx}-${mRow.recorded_at}`}
                                                                style={{
                                                                  height: '34px',
                                                                  backgroundColor: rIdx === 0 ? '#f0fdf4' : '#ffffff'
                                                                }}
                                                              >
                                                                <td
                                                                  style={{
                                                                    height: '34px',
                                                                    padding: '0 12px',
                                                                    borderBottom: rIdx < histRows.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                                    borderRight: '1px solid #f1f5f9',
                                                                    color: '#64748b',
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '0.74rem',
                                                                    whiteSpace: 'nowrap',
                                                                    minWidth: '148px',
                                                                    boxSizing: 'border-box'
                                                                  }}
                                                                >
                                                                  {mRow.recorded_at || '--'}
                                                                </td>
                                                                <td
                                                                  style={{
                                                                    height: '34px',
                                                                    borderBottom: rIdx < histRows.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                                    padding: '0 10px',
                                                                    minWidth: '184px',
                                                                    fontSize: '0.7rem',
                                                                    color: '#16a34a',
                                                                    fontWeight: 600,
                                                                    whiteSpace: 'nowrap',
                                                                    boxSizing: 'border-box'
                                                                  }}
                                                                >
                                                                  {rIdx === 0 ? 'Mới nhất' : `#${rIdx + 1}`}
                                                                </td>
                                                              </tr>
                                                            ))}
                                                          </tbody>
                                                        </table>
                                                      </div>

                                                      {/* KHỐI PHẢI: CÁC CỘT M SẮP XẾP TĂNG DẦN (TỐI ĐA 5 CỘT, > 5 CỘT CÓ THANH CUỘN NGANG RIÊNG) */}
                                                      <div
                                                        style={{
                                                          width: mCols.length > 5 ? '360px' : `${Math.max(mCols.length, 1) * 72}px`,
                                                          maxWidth: '360px',
                                                          flex: '0 0 auto',
                                                          overflowX: mCols.length > 5 ? 'auto' : 'hidden'
                                                        }}
                                                      >
                                                        <table
                                                          style={{
                                                            width: `${Math.max(mCols.length, 1) * 72}px`,
                                                            borderCollapse: 'separate',
                                                            borderSpacing: 0,
                                                            fontSize: '0.78rem',
                                                            textAlign: 'center',
                                                            tableLayout: 'fixed'
                                                          }}
                                                        >
                                                          <thead>
                                                            <tr
                                                              style={{
                                                                height: '38px',
                                                                backgroundColor: '#f8fafc',
                                                                color: '#1e293b',
                                                                fontWeight: 700
                                                              }}
                                                            >
                                                              {mCols.length === 0 ? (
                                                                <th
                                                                  style={{
                                                                    position: 'sticky',
                                                                    top: 0,
                                                                    zIndex: 2,
                                                                    height: '38px',
                                                                    backgroundColor: '#f8fafc',
                                                                    padding: '0 8px',
                                                                    borderBottom: '1px solid #cbd5e1',
                                                                    color: '#94a3b8',
                                                                    width: '72px',
                                                                    boxSizing: 'border-box'
                                                                  }}
                                                                >
                                                                  --
                                                                </th>
                                                              ) : (
                                                                mCols.map((mKey, mIdx) => (
                                                                  <th
                                                                    key={mKey}
                                                                    style={{
                                                                      position: 'sticky',
                                                                      top: 0,
                                                                      zIndex: 2,
                                                                      height: '38px',
                                                                      backgroundColor: '#f8fafc',
                                                                      padding: '0 8px',
                                                                      borderBottom: '1px solid #cbd5e1',
                                                                      borderRight: mIdx < mCols.length - 1 ? '1px solid #e2e8f0' : 'none',
                                                                      fontFamily: 'monospace',
                                                                      color: '#1D58BB',
                                                                      width: '72px',
                                                                      minWidth: '72px',
                                                                      maxWidth: '72px',
                                                                      whiteSpace: 'nowrap',
                                                                      boxSizing: 'border-box'
                                                                    }}
                                                                  >
                                                                    {mKey}
                                                                  </th>
                                                                ))
                                                              )}
                                                            </tr>
                                                          </thead>
                                                          <tbody>
                                                            {histRows.map((mRow, rIdx) => {
                                                              const mVals = extractMValues(mRow);
                                                              return (
                                                                <tr
                                                                  key={mRow.id ? `m-h-${mRow.id}` : `m-r-${rIdx}-${mRow.recorded_at}`}
                                                                  style={{
                                                                    height: '34px',
                                                                    backgroundColor: rIdx === 0 ? '#f0fdf4' : '#ffffff'
                                                                  }}
                                                                >
                                                                  {mCols.length === 0 ? (
                                                                    <td
                                                                      style={{
                                                                        height: '34px',
                                                                        padding: '0 8px',
                                                                        borderBottom: rIdx < histRows.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                                        color: '#cbd5e1',
                                                                        fontFamily: 'monospace',
                                                                        boxSizing: 'border-box'
                                                                      }}
                                                                    >
                                                                      --
                                                                    </td>
                                                                  ) : (
                                                                    mCols.map((mKey, mIdx) => {
                                                                      const val = mVals[mKey];
                                                                      const hasVal = val !== undefined && val !== null && val !== '';
                                                                      return (
                                                                        <td
                                                                          key={mKey}
                                                                          style={{
                                                                            height: '34px',
                                                                            padding: '0 8px',
                                                                            borderBottom: rIdx < histRows.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                                            borderRight: mIdx < mCols.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                                            fontWeight: hasVal ? 700 : 400,
                                                                            color: hasVal ? '#0f172a' : '#cbd5e1',
                                                                            fontFamily: 'monospace',
                                                                            width: '72px',
                                                                            minWidth: '72px',
                                                                            maxWidth: '72px',
                                                                            whiteSpace: 'nowrap',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            boxSizing: 'border-box'
                                                                          }}
                                                                        >
                                                                          {hasVal ? String(val) : '--'}
                                                                        </td>
                                                                      );
                                                                    })
                                                                  )}
                                                                </tr>
                                                              );
                                                            })}
                                                          </tbody>
                                                        </table>
                                                      </div>
                                                    </div>
                                                  </td>

                                                  {/* Trạng thái */}
                                                  <td style={{ padding: '12px', textAlign: 'center' }}>
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

                                                  {/* Ghi chú */}
                                                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                    {(() => {
                                                      const currentNote = String(
                                                        dev.note ??
                                                          histRows.find((r) => r.note !== undefined && r.note !== null && String(r.note).trim() !== '')?.note ??
                                                          ''
                                                      ).trim();
                                                      const isEditing = editingNoteDevId === dev.device_id;

                                                      if (isEditing) {
                                                        return (
                                                          <div
                                                            style={{
                                                              display: 'flex',
                                                              alignItems: 'center',
                                                              justifyContent: 'center',
                                                              gap: '8px',
                                                              height: `${valueTableHeight}px`,
                                                              boxSizing: 'border-box'
                                                            }}
                                                          >
                                                            <textarea
                                                              value={noteDraftText}
                                                              onChange={(e) => setNoteDraftText(e.target.value)}
                                                              placeholder="Nhập nội dung ghi chú..."
                                                              style={{
                                                                width: '165px',
                                                                height: `${valueTableHeight}px`,
                                                                minHeight: `${valueTableHeight}px`,
                                                                maxHeight: `${valueTableHeight}px`,
                                                                padding: '8px 10px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #93c5fd',
                                                                fontSize: '0.78rem',
                                                                fontFamily: 'inherit',
                                                                color: '#0f172a',
                                                                backgroundColor: '#ffffff',
                                                                resize: 'none',
                                                                outline: 'none',
                                                                boxSizing: 'border-box'
                                                              }}
                                                            />
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                                                              <button
                                                                type="button"
                                                                disabled={savingNoteDevId === dev.device_id}
                                                                onClick={() => handleSaveNote(dev)}
                                                                style={{
                                                                  display: 'inline-flex',
                                                                  alignItems: 'center',
                                                                  justifyContent: 'center',
                                                                  gap: '4px',
                                                                  padding: '5px 12px',
                                                                  borderRadius: '6px',
                                                                  border: 'none',
                                                                  backgroundColor: '#1D58BB',
                                                                  color: '#ffffff',
                                                                  fontSize: '0.74rem',
                                                                  fontWeight: 700,
                                                                  cursor: savingNoteDevId === dev.device_id ? 'wait' : 'pointer'
                                                                }}
                                                              >
                                                                <span>{savingNoteDevId === dev.device_id ? 'Đang lưu...' : 'Lưu'}</span>
                                                              </button>
                                                              <button
                                                                type="button"
                                                                onClick={() => {
                                                                  setEditingNoteDevId(null);
                                                                  setNoteDraftText('');
                                                                }}
                                                                style={{
                                                                  padding: '4px 10px',
                                                                  borderRadius: '6px',
                                                                  border: '1px solid #cbd5e1',
                                                                  backgroundColor: '#ffffff',
                                                                  color: '#64748b',
                                                                  fontSize: '0.74rem',
                                                                  fontWeight: 600,
                                                                  cursor: 'pointer'
                                                                }}
                                                              >
                                                                Huỷ
                                                              </button>
                                                            </div>
                                                          </div>
                                                        );
                                                      }

                                                      if (!currentNote) {
                                                        return (
                                                          <div
                                                            style={{
                                                              height: `${valueTableHeight}px`,
                                                              display: 'flex',
                                                              alignItems: 'center',
                                                              justifyContent: 'center',
                                                              boxSizing: 'border-box'
                                                            }}
                                                          >
                                                            <button
                                                              type="button"
                                                              onClick={() => {
                                                                setEditingNoteDevId(dev.device_id);
                                                                setNoteDraftText('');
                                                              }}
                                                              style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                padding: '5px 12px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #1D58BB',
                                                                backgroundColor: '#eff6ff',
                                                                color: '#1D58BB',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                cursor: 'pointer'
                                                              }}
                                                            >
                                                              <Plus size={13} />
                                                              <span>Thêm</span>
                                                            </button>
                                                          </div>
                                                        );
                                                      }

                                                      return (
                                                        <div
                                                          style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px',
                                                            height: `${valueTableHeight}px`,
                                                            boxSizing: 'border-box'
                                                          }}
                                                        >
                                                          <div
                                                            onClick={() =>
                                                              setViewingNoteModal({
                                                                device_id: dev.device_id,
                                                                device_code: dev.device_code,
                                                                device_name: dev.device_name,
                                                                note: currentNote
                                                              })
                                                            }
                                                            title="Nhấn để mở cửa sổ xem nội dung ghi chú"
                                                            style={{
                                                              width: '165px',
                                                              height: `${valueTableHeight}px`,
                                                              minHeight: `${valueTableHeight}px`,
                                                              maxHeight: `${valueTableHeight}px`,
                                                              padding: '8px 10px',
                                                              borderRadius: '8px',
                                                              border: '1px solid #cbd5e1',
                                                              backgroundColor: '#f8fafc',
                                                              color: '#1e293b',
                                                              fontSize: '0.76rem',
                                                              lineHeight: 1.45,
                                                              whiteSpace: 'pre-wrap',
                                                              wordBreak: 'break-word',
                                                              overflowY: 'auto',
                                                              cursor: 'pointer',
                                                              textAlign: 'left',
                                                              boxSizing: 'border-box',
                                                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                                            }}
                                                          >
                                                            {currentNote}
                                                          </div>
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              setEditingNoteDevId(dev.device_id);
                                                              setNoteDraftText(currentNote);
                                                            }}
                                                            style={{
                                                              display: 'inline-flex',
                                                              alignItems: 'center',
                                                              gap: '4px',
                                                              padding: '5px 10px',
                                                              borderRadius: '6px',
                                                              border: '1px solid #f59e0b',
                                                              backgroundColor: '#fffbeb',
                                                              color: '#d97706',
                                                              fontSize: '0.74rem',
                                                              fontWeight: 700,
                                                              cursor: 'pointer',
                                                              flexShrink: 0
                                                            }}
                                                          >
                                                            <span>Sửa</span>
                                                          </button>
                                                        </div>
                                                      );
                                                    })()}
                                                  </td>

                                                  {/* Thao tác */}
                                                  <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <button
                                                      type="button"
                                                      disabled={deletingDevId === dev.device_id}
                                                      onClick={() => handleDeleteDeviceTelemetry(dev)}
                                                      style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '5px 10px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #fca5a5',
                                                        backgroundColor: '#fef2f2',
                                                        color: '#dc2626',
                                                        fontSize: '0.74rem',
                                                        fontWeight: 700,
                                                        cursor: deletingDevId === dev.device_id ? 'wait' : 'pointer',
                                                        whiteSpace: 'nowrap'
                                                      }}
                                                      title="Xoá hàng tương ứng trong bảng telemetry_data"
                                                    >
                                                      <Trash2 size={13} />
                                                      <span>{deletingDevId === dev.device_id ? 'Đang xoá...' : 'Xoá'}</span>
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            })
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

      {/* CỬA SỔ HIỂN THỊ NỘI DUNG GHI CHÚ (NOTE) */}
      {viewingNoteModal && (
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
          onClick={() => setViewingNoteModal(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                  Nội Dung Ghi Chú Thiết Bị
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Thiết bị: <strong>{viewingNoteModal.device_name}</strong> ({viewingNoteModal.device_code})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingNoteModal(null)}
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

            <div style={{ padding: '20px' }}>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              >
                {viewingNoteModal.note}
              </div>
            </div>

            <div
              style={{
                padding: '12px 20px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  const targetId = viewingNoteModal.device_id;
                  const targetNote = viewingNoteModal.note;
                  setViewingNoteModal(null);
                  setEditingNoteDevId(targetId);
                  setNoteDraftText(targetNote);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid #f59e0b',
                  backgroundColor: '#fffbeb',
                  color: '#d97706',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Sửa ghi chú
              </button>
              <button
                type="button"
                onClick={() => setViewingNoteModal(null)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#1D58BB',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
