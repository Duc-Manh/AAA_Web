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
  meter?: string | null;
  control?: string | null;
  recorded_at: string;
}

export const parseMeterControlMap = (raw?: string | null): Record<string, string> => {
  if (!raw || typeof raw !== 'string') return {};
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const map: Record<string, string> = {};
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => {
        const s = String(item || '').trim().toLowerCase();
        if (/^m\d+$/i.test(s)) {
          map[s] = '';
        }
      });
      return map;
    }
    if (parsed && typeof parsed === 'object') {
      Object.entries(parsed).forEach(([k, v]) => {
        const s = String(k || '').trim().toLowerCase();
        if (/^m\d+$/i.test(s)) {
          map[s] = v !== null && v !== undefined ? String(v).trim() : '';
        }
      });
      return map;
    }
  } catch {
    // fallback
  }
  trimmed.split(/[\r\n,;]+/).forEach((part) => {
    const line = part.trim();
    if (!line) return;
    const kv = line.match(/^\s*(m\d+)\s*[:=-]\s*(.*)\s*$/i);
    if (kv) {
      map[kv[1].toLowerCase()] = kv[2].trim();
      return;
    }
    line.split(/[\s|]+/).forEach((token) => {
      const s = token.trim().toLowerCase();
      if (/^m\d+$/i.test(s) && !(s in map)) {
        map[s] = '';
      }
    });
  });
  return map;
};

export const serializeMeterControlMap = (map: Record<string, string>): string => {
  const keys = Object.keys(map)
    .map((k) => k.trim().toLowerCase())
    .filter((k) => /^m\d+$/i.test(k))
    .sort((a, b) => (parseInt(a.slice(1), 10) || 0) - (parseInt(b.slice(1), 10) || 0));
  if (keys.length === 0) return '';
  const ordered: Record<string, string> = {};
  keys.forEach((k) => {
    ordered[k] = String(map[k] ?? '').trim();
  });
  return JSON.stringify(ordered);
};

export const parseMColList = (raw?: string | null): string[] => {
  const map = parseMeterControlMap(raw);
  return Object.keys(map).sort((a, b) => (parseInt(a.slice(1), 10) || 0) - (parseInt(b.slice(1), 10) || 0));
};

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
    parseMColList(r?.meter).forEach((k) => {
      const match = k.match(/^m(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIdx) maxIdx = num;
      }
    });
    parseMColList(r?.control).forEach((k) => {
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

export const TELEMETRY_PARAM_OPTIONS: string[] = [
  'Nhiệt độ',
  'Độ ẩm',
  'Điện áp',
  'Độ sáng',
  'Tốc độ',
  'Áp lực',
  'Lưu lượng',
  'Nồng độ',
  'Dòng điện',
  'Công suất',
  'Tần số',
  'Điện năng',
  'Mức độ',
  'Điều khiển quạt',
  'Cài đặt nhiệt độ'
];

export const parseNoteMapping = (rawNote?: string | null): Record<string, string> => {
  if (!rawNote || typeof rawNote !== 'string') return {};
  const trimmed = rawNote.trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const map: Record<string, string> = {};
      Object.entries(parsed).forEach(([k, v]) => {
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          map[k.toLowerCase()] = String(v).trim();
        }
      });
      return map;
    }
  } catch {
    const map: Record<string, string> = {};
    trimmed.split(/\r?\n|,/).forEach((line) => {
      const m = line.match(/^\s*(m\d+)\s*[:=-]\s*(.+)\s*$/i);
      if (m) {
        map[m[1].toLowerCase()] = m[2].trim();
      }
    });
    return map;
  }
  return {};
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
  // Trạng thái hiển thị khung chọn Đo lường / Điều khiển khi nhấn + Thêm cột
  const [addColMenu, setAddColMenu] = useState<{
    projectName: string;
    groupDevKeys: string[];
    devices: TelemetryDeviceRow[];
    currentCols: string[];
    top: number;
    left: number;
  } | null>(null);
  // Trạng thái hiển thị bảng chọn xoá nhiều cột m
  const [deleteColModal, setDeleteColModal] = useState<{
    devKey: string;
    groupDevKeys?: string[];
    devices?: TelemetryDeviceRow[];
    deviceName: string;
    columns: string[];
    selected: string[];
  } | null>(null);
  // Trạng thái nhập / sửa ghi chú (note) dạng JSON mapping m1, m2, m3... và xem cửa sổ chi tiết note
  const [editingNoteDevId, setEditingNoteDevId] = useState<number | null>(null);
  const [noteDraftMap, setNoteDraftMap] = useState<Record<string, string>>({});
  const [savingNoteDevId, setSavingNoteDevId] = useState<number | null>(null);
  const [viewingNoteModal, setViewingNoteModal] = useState<{
    device_id: number;
    device_code: string;
    device_name: string;
    note: string;
    mCols: string[];
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
    rows.forEach((r) => {
      parseMColList(r?.meter).forEach((c) => {
        if (!removed.has(c)) merged.add(c);
      });
      parseMColList(r?.control).forEach((c) => {
        if (!removed.has(c)) merged.add(c);
      });
    });
    return Array.from(merged).sort((a, b) => {
      const na = parseInt(a.replace(/^m/i, ''), 10) || 0;
      const nb = parseInt(b.replace(/^m/i, ''), 10) || 0;
      return na - nb;
    });
  };

  const persistMeterControlToDb = async (deviceIds: number[], payload: { meter?: string; control?: string }) => {
    if (!deviceIds || deviceIds.length === 0) return;
    const primaryId = deviceIds[0];
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const backendUrl = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : '');
    const bodyStr = JSON.stringify({ ...payload, device_ids: deviceIds });

    let ok = false;
    try {
      const res = await fetch(`${backendUrl}/api/telemetry-data/${primaryId}/meter-control`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      });
      if (res.ok) ok = true;
    } catch {
      // fallback
    }
    if (!ok) {
      await fetch(`/api/telemetry-data/${primaryId}/meter-control`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      }).catch(() => null);
    }
  };

  const handleSelectAddColumnType = async (colType: 'meter' | 'control') => {
    if (!addColMenu) return;
    const { groupDevKeys, devices, currentCols } = addColMenu;
    let maxNum = 0;
    currentCols.forEach((c) => {
      const n = parseInt(c.replace(/^m/i, ''), 10) || 0;
      if (n > maxNum) maxNum = n;
    });
    const nextCol = `m${maxNum + 1}`;
    setAddColMenu(null);

    setRemovedMColsMap((prev) => {
      const next = { ...prev };
      groupDevKeys.forEach((devKey) => {
        next[devKey] = (next[devKey] || []).filter((c) => c !== nextCol);
      });
      try {
        localStorage.setItem('aaa_telemetry_removed_m_cols', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    setCustomMColsMap((prev) => {
      const next = { ...prev };
      groupDevKeys.forEach((devKey) => {
        const existing = next[devKey] || currentCols;
        next[devKey] = Array.from(new Set([...existing, nextCol]));
      });
      try {
        localStorage.setItem('aaa_telemetry_m_col_list', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    // Cập nhật cột meter hoặc control cho các thiết bị trong nhóm và lưu xuống database 3ahome
    for (const dev of devices) {
      const dKey = dev.device_code || String(dev.device_id);
      const devRows = deviceRowsMap[dKey] || [dev];
      const existingMeterRaw =
        dev.meter ??
        devRows.find((r) => r.meter !== undefined && r.meter !== null && String(r.meter).trim() !== '')?.meter ??
        '';
      const existingControlRaw =
        dev.control ??
        devRows.find((r) => r.control !== undefined && r.control !== null && String(r.control).trim() !== '')?.control ??
        '';

      const meterMap = parseMeterControlMap(existingMeterRaw);
      const controlMap = parseMeterControlMap(existingControlRaw);

      if (colType === 'meter') {
        if (!(nextCol in meterMap)) {
          meterMap[nextCol] = controlMap[nextCol] || '';
        }
        delete controlMap[nextCol];
      } else {
        if (!(nextCol in controlMap)) {
          controlMap[nextCol] = meterMap[nextCol] || '';
        }
        delete meterMap[nextCol];
      }

      const newMeterStr = serializeMeterControlMap(meterMap);
      const newControlStr = serializeMeterControlMap(controlMap);

      setTelemetryList((prev) =>
        prev.map((item) =>
          item.device_id === dev.device_id
            ? { ...item, meter: newMeterStr, control: newControlStr }
            : item
        )
      );
      setDeviceRowsMap((prev) => {
        if (!prev[dKey]) return prev;
        return {
          ...prev,
          [dKey]: prev[dKey].map((r) => ({ ...r, meter: newMeterStr, control: newControlStr }))
        };
      });

      await persistMeterControlToDb([dev.device_id], {
        meter: newMeterStr,
        control: newControlStr
      });
    }
  };

  const handleConfirmDeleteColumns = async () => {
    if (!deleteColModal || deleteColModal.selected.length === 0) return;
    const { devKey, groupDevKeys, devices, selected, columns } = deleteColModal;
    const targetKeys = groupDevKeys && groupDevKeys.length > 0 ? groupDevKeys : [devKey];
    const toRemoveSet = new Set(selected.map((s) => s.toLowerCase()));

    setRemovedMColsMap((prev) => {
      const next = { ...prev };
      targetKeys.forEach((k) => {
        const existing = next[k] || [];
        next[k] = Array.from(new Set([...existing, ...selected]));
      });
      try {
        localStorage.setItem('aaa_telemetry_removed_m_cols', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    setCustomMColsMap((prev) => {
      const next = { ...prev };
      targetKeys.forEach((k) => {
        const existing = next[k] || columns;
        next[k] = existing.filter((c) => !toRemoveSet.has(c.toLowerCase()));
      });
      try {
        localStorage.setItem('aaa_telemetry_m_col_list', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    setDeleteColModal(null);

    if (devices && devices.length > 0) {
      for (const dev of devices) {
        const dKey = dev.device_code || String(dev.device_id);
        const devRows = deviceRowsMap[dKey] || [dev];
        const existingMeterRaw =
          dev.meter ??
          devRows.find((r) => r.meter !== undefined && r.meter !== null && String(r.meter).trim() !== '')?.meter ??
          '';
        const existingControlRaw =
          dev.control ??
          devRows.find((r) => r.control !== undefined && r.control !== null && String(r.control).trim() !== '')?.control ??
          '';

        const meterMap = parseMeterControlMap(existingMeterRaw);
        const controlMap = parseMeterControlMap(existingControlRaw);
        toRemoveSet.forEach((remKey) => {
          delete meterMap[remKey];
          delete controlMap[remKey];
        });

        const newMeterStr = serializeMeterControlMap(meterMap);
        const newControlStr = serializeMeterControlMap(controlMap);

        setTelemetryList((prev) =>
          prev.map((item) =>
            item.device_id === dev.device_id
              ? { ...item, meter: newMeterStr, control: newControlStr }
              : item
          )
        );
        setDeviceRowsMap((prev) => {
          if (!prev[dKey]) return prev;
          return {
            ...prev,
            [dKey]: prev[dKey].map((r) => ({ ...r, meter: newMeterStr, control: newControlStr }))
          };
        });

        await persistMeterControlToDb([dev.device_id], {
          meter: newMeterStr,
          control: newControlStr
        });
      }
    }
  };

  // Lưu tên nhập trong cột Ghi chú dạng JSON mapping vào cột meter (nếu m thuộc meter) hoặc cột control (nếu m thuộc control) của bảng telemetry_data
  const handleSaveNote = async (dev: TelemetryDeviceRow, mCols: string[]) => {
    const devId = dev.device_id;
    const dKey = dev.device_code || String(dev.device_id);
    const devRows = deviceRowsMap[dKey] || [dev];

    const existingMeterRaw =
      dev.meter ??
      devRows.find((r) => r.meter !== undefined && r.meter !== null && String(r.meter).trim() !== '')?.meter ??
      '';
    const existingControlRaw =
      dev.control ??
      devRows.find((r) => r.control !== undefined && r.control !== null && String(r.control).trim() !== '')?.control ??
      '';

    const meterMap = parseMeterControlMap(existingMeterRaw);
    const controlMap = parseMeterControlMap(existingControlRaw);

    const allKeys = Array.from(
      new Set([
        ...mCols.map((c) => c.toLowerCase()),
        ...Object.keys(noteDraftMap).map((c) => c.toLowerCase())
      ])
    );

    allKeys.forEach((k) => {
      if (!/^m\d+$/i.test(k)) return;
      const hasDraft =
        Object.prototype.hasOwnProperty.call(noteDraftMap, k) ||
        Object.prototype.hasOwnProperty.call(noteDraftMap, k.toUpperCase());
      const draftVal = hasDraft ? String(noteDraftMap[k] ?? noteDraftMap[k.toUpperCase()] ?? '').trim() : undefined;

      if (k in meterMap) {
        if (draftVal !== undefined) {
          meterMap[k] = draftVal;
        }
      }
      if (k in controlMap) {
        if (draftVal !== undefined) {
          controlMap[k] = draftVal;
        }
      }
    });

    const newMeterStr = serializeMeterControlMap(meterMap);
    const newControlStr = serializeMeterControlMap(controlMap);

    setSavingNoteDevId(devId);
    try {
      await persistMeterControlToDb([devId], {
        meter: newMeterStr,
        control: newControlStr
      });

      setTelemetryList((prev) =>
        prev.map((item) =>
          item.device_id === devId
            ? { ...item, meter: newMeterStr, control: newControlStr }
            : item
        )
      );
      setDeviceRowsMap((prev) => {
        if (!prev[dKey]) return prev;
        return {
          ...prev,
          [dKey]: prev[dKey].map((r) => ({ ...r, meter: newMeterStr, control: newControlStr }))
        };
      });
      setEditingNoteDevId(null);
      setNoteDraftMap({});
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

                                    {/* BẢNG CON CHI TIẾT ĐẦY ĐỦ CÁC CỘT (1 BẢNG DUY NHẤT) */}
                                    <div style={{ overflowX: 'auto' }}>
                                      {(() => {
                                        const groupDevKeys =
                                          group.devices.length > 0
                                            ? group.devices.map((d) => d.device_code || String(d.device_id))
                                            : [group.project_name];
                                        const primaryDevKey = groupDevKeys[0];
                                        const allGroupRows: TelemetryDeviceRow[] = [];
                                        let totalBodyRows = 0;
                                        group.devices.forEach((d) => {
                                          const dKey = d.device_code || String(d.device_id);
                                          const rRows =
                                            deviceRowsMap[dKey] && deviceRowsMap[dKey].length > 0
                                              ? deviceRowsMap[dKey]
                                              : [d];
                                          const cRows = rRows.some((r) => r.recorded_at === d.recorded_at)
                                            ? rRows
                                            : [d, ...rRows];
                                          totalBodyRows += cRows.length;
                                          allGroupRows.push(d, ...rRows);
                                        });
                                        const mCols = getDeviceMColumns(primaryDevKey, allGroupRows);

                                        // Độ rộng cố định của 10 cột bên trái để neo sticky khi cuộn ngang các cột m
                                        const leftColsWidth = 64 + 136 + 180 + 96 + 256 + 150 + 150 + 96 + 148 + 184; // 1460px
                                        const mTotalWidth = Math.max(mCols.length, 1) * 72;
                                        // Nếu số cột m > 3 thì hiển thị 3 cột và 1 nửa cột tiếp theo (3.5 * 72 = 252px)
                                        const mVisibleWidth = mCols.length > 3 ? 252 : mTotalWidth;
                                        const containerWidth = leftColsWidth + mVisibleWidth;
                                        // Hiển thị tối đa 5 hàng, nếu > 5 hàng thì hiển thị thanh cuộn dọc (header 40px + 5 * 52px = 300px)
                                        const hasVerticalScroll = totalBodyRows > 5;
                                        const hasHorizontalScroll = mCols.length > 3;

                                        return (
                                          <div
                                            style={{
                                              display: 'flex',
                                              alignItems: 'flex-start',
                                              width: `${containerWidth}px`,
                                              minWidth: `${containerWidth}px`,
                                              maxWidth: `${containerWidth}px`,
                                              maxHeight: hasVerticalScroll ? '300px' : undefined,
                                              overflowX: 'hidden',
                                              overflowY: hasVerticalScroll ? 'auto' : 'hidden',
                                              border: '1px solid #dbeafe',
                                              borderRadius: '8px',
                                              backgroundColor: '#ffffff',
                                              boxSizing: 'content-box'
                                            }}
                                          >
                                            <table
                                              style={{
                                                width: `${leftColsWidth}px`,
                                                minWidth: `${leftColsWidth}px`,
                                                maxWidth: `${leftColsWidth}px`,
                                                flexShrink: 0,
                                                tableLayout: 'fixed',
                                                borderCollapse: 'separate',
                                                borderSpacing: 0,
                                                fontSize: '0.82rem',
                                                textAlign: 'left'
                                              }}
                                            >
                                              <thead>
                                                <tr
                                                  style={{
                                                    height: '40px',
                                                    backgroundColor: '#eff6ff',
                                                    color: '#1e40af',
                                                    fontWeight: 700,
                                                    fontSize: '0.73rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.4px'
                                                  }}
                                                >
                                                  <th
                                                    style={{
                                                      position: 'sticky',
                                                      top: 0,
                                                      left: '0px',
                                                      zIndex: 4,
                                                      backgroundColor: '#eff6ff',
                                                      borderBottom: '1px solid #dbeafe',
                                                      padding: '0 10px',
                                                      width: '64px',
                                                      minWidth: '64px',
                                                      maxWidth: '64px',
                                                      whiteSpace: 'nowrap',
                                                      boxSizing: 'border-box'
                                                    }}
                                                  >
                                                    ID
                                                  </th>
                                                  <th
                                                    style={{
                                                      position: 'sticky',
                                                      top: 0,
                                                      left: '64px',
                                                      zIndex: 4,
                                                      backgroundColor: '#eff6ff',
                                                      borderBottom: '1px solid #dbeafe',
                                                      padding: '0 10px',
                                                      width: '136px',
                                                      minWidth: '136px',
                                                      maxWidth: '136px',
                                                      whiteSpace: 'nowrap',
                                                      boxSizing: 'border-box'
                                                    }}
                                                  >
                                                    Mã thiết bị
                                                  </th>
                                                  <th
                                                    style={{
                                                      position: 'sticky',
                                                      top: 0,
                                                      left: '200px',
                                                      zIndex: 4,
                                                      backgroundColor: '#eff6ff',
                                                      borderBottom: '1px solid #dbeafe',
                                                      padding: '0 10px',
                                                      width: '180px',
                                                      minWidth: '180px',
                                                      maxWidth: '180px',
                                                      whiteSpace: 'nowrap',
                                                      boxSizing: 'border-box'
                                                    }}
                                                  >
                                                    TÊN IOT GATEWAY
                                                  </th>
                                                  <th
                                                    style={{
                                                      position: 'sticky',
                                                      top: 0,
                                                      left: '380px',
                                                      zIndex: 4,
                                                      backgroundColor: '#eff6ff',
                                                      borderBottom: '1px solid #dbeafe',
                                                      padding: '0 8px',
                                                      textAlign: 'center',
                                                      width: '96px',
                                                      minWidth: '96px',
                                                      maxWidth: '96px',
                                                      whiteSpace: 'nowrap',
                                                      boxSizing: 'border-box'
                                                    }}
                                                  >
                                                    Trạng thái
                                                  </th>
                                                  <th
                                                    style={{
                                                      position: 'sticky',
                                                      top: 0,
                                                      left: '476px',
                                                      zIndex: 4,
                                                      backgroundColor: '#eff6ff',
                                                      borderBottom: '1px solid #dbeafe',
                                                      padding: '0 10px',
                                                      textAlign: 'center',
                                                      width: '256px',
                                                      minWidth: '256px',
                                                      maxWidth: '256px',
                                                      whiteSpace: 'nowrap',
                                                      boxSizing: 'border-box'
                                                    }}
                                                  >
                                                    Ghi chú
                                                  </th>
                                                  <th
                                                    style={{
                                                      position: 'sticky',
                                                      top: 0,
                                                      left: '732px',
                                                      zIndex: 4,
                                                      backgroundColor: '#eff6ff',
                                                      borderBottom: '1px solid #dbeafe',
                                                      borderLeft: '1px solid #dbeafe',
                                                      padding: '0 8px',
                                                      textAlign: 'center',
                                                      width: '150px',
                                                      minWidth: '150px',
                                                      maxWidth: '150px',
                                                      whiteSpace: 'nowrap',
                                                      boxSizing: 'border-box'
                                                    }}
                                                  >
                                                    Đo lường
                                                  </th>
                                                  <th
                                                    style={{
                                                      position: 'sticky',
                                                      top: 0,
                                                      left: '882px',
                                                      zIndex: 4,
                                                      backgroundColor: '#eff6ff',
                                                      borderBottom: '1px solid #dbeafe',
                                                      borderLeft: '1px solid #dbeafe',
                                                      padding: '0 8px',
                                                      textAlign: 'center',
                                                      width: '150px',
                                                      minWidth: '150px',
                                                      maxWidth: '150px',
                                                      whiteSpace: 'nowrap',
                                                      boxSizing: 'border-box'
                                                    }}
                                                  >
                                                    Điều khiển
                                                  </th>
                                                  <th
                                                    style={{
                                                      position: 'sticky',
                                                      top: 0,
                                                      left: '1032px',
                                                      zIndex: 4,
                                                      backgroundColor: '#eff6ff',
                                                      borderBottom: '1px solid #dbeafe',
                                                      borderLeft: '1px solid #dbeafe',
                                                      padding: '0 8px',
                                                      textAlign: 'center',
                                                      width: '96px',
                                                      minWidth: '96px',
                                                      maxWidth: '96px',
                                                      whiteSpace: 'nowrap',
                                                      boxSizing: 'border-box'
                                                    }}
                                                  >
                                                    Thao tác
                                                  </th>
                                                  <th
                                                    style={{
                                                      position: 'sticky',
                                                      top: 0,
                                                      left: '1128px',
                                                      zIndex: 4,
                                                      backgroundColor: '#eff6ff',
                                                      borderBottom: '1px solid #dbeafe',
                                                      borderLeft: '1px solid #dbeafe',
                                                      padding: '0 10px',
                                                      textAlign: 'center',
                                                      width: '148px',
                                                      minWidth: '148px',
                                                      maxWidth: '148px',
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
                                                      left: '1276px',
                                                      zIndex: 4,
                                                      backgroundColor: '#eff6ff',
                                                      borderBottom: '1px solid #dbeafe',
                                                      borderLeft: '1px solid #dbeafe',
                                                      borderRight: '1px solid #cbd5e1',
                                                      padding: '0 8px',
                                                      textAlign: 'center',
                                                      width: '184px',
                                                      minWidth: '184px',
                                                      maxWidth: '184px',
                                                      whiteSpace: 'nowrap',
                                                      textTransform: 'none',
                                                      letterSpacing: 'normal',
                                                      boxSizing: 'border-box'
                                                    }}
                                                  >
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          const rect = e.currentTarget.getBoundingClientRect();
                                                          setAddColMenu((prev) =>
                                                            prev && prev.projectName === group.project_name
                                                              ? null
                                                              : {
                                                                  projectName: group.project_name,
                                                                  groupDevKeys,
                                                                  devices: group.devices,
                                                                  currentCols: mCols,
                                                                  top: rect.bottom + 6,
                                                                  left: Math.max(
                                                                    12,
                                                                    Math.min(
                                                                      rect.left,
                                                                      typeof window !== 'undefined'
                                                                        ? window.innerWidth - 220
                                                                        : rect.left
                                                                    )
                                                                  )
                                                                }
                                                          );
                                                        }}
                                                        style={{
                                                          display: 'inline-flex',
                                                          alignItems: 'center',
                                                          gap: '3px',
                                                          padding: '4px 8px',
                                                          borderRadius: '6px',
                                                          border: '1px solid #1D58BB',
                                                          backgroundColor: '#ffffff',
                                                          color: '#1D58BB',
                                                          fontSize: '0.72rem',
                                                          fontWeight: 700,
                                                          cursor: 'pointer',
                                                          whiteSpace: 'nowrap'
                                                        }}
                                                        title="Chọn thêm cột Đo lường hoặc Điều khiển"
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
                                                            devKey: primaryDevKey,
                                                            groupDevKeys,
                                                            devices: group.devices,
                                                            deviceName:
                                                              group.devices[0]?.device_name ||
                                                              group.devices[0]?.device_code ||
                                                              group.project_name,
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
                                                {group.devices.length === 0 ? (
                                                  <tr>
                                                    <td
                                                      colSpan={10}
                                                      style={{ height: '52px', padding: '0 20px', textAlign: 'center', color: '#94a3b8' }}
                                                    >
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
                                                    const isLastDev = devIdx === group.devices.length - 1;
                                                    const rowHeight =
                                                      editingNoteDevId === dev.device_id && histRows.length === 1
                                                        ? '86px'
                                                        : '52px';

                                                    return histRows.map((mRow, rIdx) => {
                                                      const isLastHistRow = rIdx === histRows.length - 1;
                                                      const cellBorderBottom =
                                                        isLastDev && isLastHistRow
                                                          ? 'none'
                                                          : isLastHistRow
                                                            ? '1px solid #e2e8f0'
                                                            : '1px solid #f1f5f9';
                                                      const devCellBorderBottom = isLastDev
                                                        ? 'none'
                                                        : '1px solid #e2e8f0';

                                                      return (
                                                        <tr
                                                          key={
                                                            mRow.id
                                                              ? `row-${dev.device_id}-${mRow.id}`
                                                              : `row-${dev.device_id}-${rIdx}-${mRow.recorded_at}`
                                                          }
                                                          style={{
                                                            height: rowHeight,
                                                            color: '#000000',
                                                            verticalAlign: 'middle'
                                                          }}
                                                        >
                                                          {rIdx === 0 && (
                                                            <>
                                                              {/* ID */}
                                                              <td
                                                                rowSpan={histRows.length}
                                                                style={{
                                                                  position: 'sticky',
                                                                  left: '0px',
                                                                  zIndex: 3,
                                                                  borderBottom: devCellBorderBottom,
                                                                  padding: '6px 10px',
                                                                  fontWeight: 700,
                                                                  color: '#000000',
                                                                  width: '64px',
                                                                  minWidth: '64px',
                                                                  maxWidth: '64px',
                                                                  whiteSpace: 'nowrap',
                                                                  boxSizing: 'border-box'
                                                                }}
                                                              >
                                                                #{dev.device_id}
                                                              </td>

                                                              {/* Mã thiết bị */}
                                                              <td
                                                                rowSpan={histRows.length}
                                                                style={{
                                                                  position: 'sticky',
                                                                  left: '64px',
                                                                  zIndex: 3,
                                                                  borderBottom: devCellBorderBottom,
                                                                  padding: '6px 10px',
                                                                  color: '#000000',
                                                                  width: '136px',
                                                                  minWidth: '136px',
                                                                  maxWidth: '136px',
                                                                  whiteSpace: 'nowrap',
                                                                  boxSizing: 'border-box'
                                                                }}
                                                              >
                                                                <span
                                                                  style={{
                                                                    display: 'inline-block',
                                                                    padding: '3px 8px',
                                                                    color: '#000000',
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

                                                              {/* Tên IOT GATEWAY */}
                                                              <td
                                                                rowSpan={histRows.length}
                                                                style={{
                                                                  position: 'sticky',
                                                                  left: '200px',
                                                                  zIndex: 3,
                                                                  borderBottom: devCellBorderBottom,
                                                                  padding: '6px 10px',
                                                                  fontWeight: 600,
                                                                  color: '#000000',
                                                                  width: '180px',
                                                                  minWidth: '180px',
                                                                  maxWidth: '180px',
                                                                  whiteSpace: 'nowrap',
                                                                  overflow: 'hidden',
                                                                  textOverflow: 'ellipsis',
                                                                  boxSizing: 'border-box'
                                                                }}
                                                              >
                                                                {dev.device_name}
                                                                <div
                                                                  style={{
                                                                    fontSize: '0.7rem',
                                                                    color: '#000000',
                                                                    marginTop: '2px'
                                                                  }}
                                                                >
                                                                  Modbus #{dev.slave_address}{' '}
                                                                  {dev.floor ? `(${dev.floor})` : ''}
                                                                </div>
                                                              </td>

                                                              {/* Trạng thái */}
                                                              <td
                                                                rowSpan={histRows.length}
                                                                style={{
                                                                  position: 'sticky',
                                                                  left: '380px',
                                                                  zIndex: 3,
                                                                  borderBottom: devCellBorderBottom,
                                                                  padding: '6px 8px',
                                                                  textAlign: 'center',
                                                                  color: '#000000',
                                                                  width: '96px',
                                                                  minWidth: '96px',
                                                                  maxWidth: '96px',
                                                                  whiteSpace: 'nowrap',
                                                                  boxSizing: 'border-box'
                                                                }}
                                                              >
                                                                <span
                                                                  style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '3px',
                                                                    padding: '2px 7px',
                                                                    borderRadius: '6px',
                                                                    color: '#000000',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 600
                                                                  }}
                                                                >
                                                                  <CheckCircle2 size={11} /> Online
                                                                </span>
                                                              </td>

                                                              {/* Ghi chú */}
                                                              <td
                                                                rowSpan={histRows.length}
                                                                style={{
                                                                  position: 'sticky',
                                                                  left: '476px',
                                                                  zIndex: 3,
                                                                  borderBottom: devCellBorderBottom,
                                                                  padding: '4px 8px',
                                                                  textAlign: 'center',
                                                                  color: '#000000',
                                                                  width: '256px',
                                                                  minWidth: '256px',
                                                                  maxWidth: '256px',
                                                                  boxSizing: 'border-box'
                                                                }}
                                                              >
                                                                {(() => {
                                                                  const rawMeterForNote = String(
                                                                    dev.meter ??
                                                                      histRows.find(
                                                                        (r) =>
                                                                          r.meter !== undefined &&
                                                                          r.meter !== null &&
                                                                          String(r.meter).trim() !== ''
                                                                      )?.meter ??
                                                                      ''
                                                                  ).trim();
                                                                  const rawControlForNote = String(
                                                                    dev.control ??
                                                                      histRows.find(
                                                                        (r) =>
                                                                          r.control !== undefined &&
                                                                          r.control !== null &&
                                                                          String(r.control).trim() !== ''
                                                                      )?.control ??
                                                                      ''
                                                                  ).trim();
                                                                  const meterMapForNote = parseMeterControlMap(rawMeterForNote);
                                                                  const controlMapForNote = parseMeterControlMap(rawControlForNote);
                                                                  const parsedMap: Record<string, string> = {
                                                                    ...meterMapForNote,
                                                                    ...controlMapForNote
                                                                  };
                                                                  const nonEmptyMap: Record<string, string> = {};
                                                                  Object.entries(parsedMap).forEach(([k, v]) => {
                                                                    if (v && String(v).trim() !== '') {
                                                                      nonEmptyMap[k] = String(v).trim();
                                                                    }
                                                                  });
                                                                  const currentNote =
                                                                    Object.keys(nonEmptyMap).length > 0
                                                                      ? JSON.stringify(nonEmptyMap)
                                                                      : '';
                                                                  const displayMCols =
                                                                    mCols.length > 0 ? mCols : ['m1', 'm2', 'm3'];
                                                                  const isEditing = editingNoteDevId === dev.device_id;
                                                                  const noteBoxMaxH =
                                                                    Math.min(Math.max(histRows.length, 1), 5) * 52 - 10;

                                                                  if (isEditing) {
                                                                    return (
                                                                      <div
                                                                        style={{
                                                                          display: 'flex',
                                                                          alignItems: 'center',
                                                                          justifyContent: 'center',
                                                                          gap: '6px',
                                                                          boxSizing: 'border-box'
                                                                        }}
                                                                      >
                                                                        <div
                                                                          style={{
                                                                            width: '182px',
                                                                            maxHeight: `${Math.max(noteBoxMaxH, 76)}px`,
                                                                            padding: '4px 6px',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid #93c5fd',
                                                                            overflowY: 'auto',
                                                                            boxSizing: 'border-box',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: '4px'
                                                                          }}
                                                                        >
                                                                          {displayMCols.map((mKey) => {
                                                                            const k = mKey.toLowerCase();
                                                                            const selectedVal =
                                                                              noteDraftMap[k] ??
                                                                              noteDraftMap[mKey] ??
                                                                              '';
                                                                            return (
                                                                              <div
                                                                                key={mKey}
                                                                                style={{
                                                                                  display: 'flex',
                                                                                  alignItems: 'center',
                                                                                  gap: '5px'
                                                                                }}
                                                                              >
                                                                                <span
                                                                                  style={{
                                                                                    minWidth: '32px',
                                                                                    padding: '1px 4px',
                                                                                    borderRadius: '4px',
                                                                                    border: '1px solid #bfdbfe',
                                                                                    color: '#000000',
                                                                                    fontFamily: 'monospace',
                                                                                    fontWeight: 700,
                                                                                    fontSize: '0.72rem',
                                                                                    textAlign: 'center',
                                                                                    flexShrink: 0
                                                                                  }}
                                                                                >
                                                                                  {mKey}
                                                                                </span>
                                                                                <input
                                                                                  type="text"
                                                                                  value={selectedVal}
                                                                                  placeholder="Nhập tên..."
                                                                                  onChange={(e) => {
                                                                                    const val = e.target.value;
                                                                                    setNoteDraftMap((prev) => ({
                                                                                      ...prev,
                                                                                      [k]: val
                                                                                    }));
                                                                                  }}
                                                                                  style={{
                                                                                    flex: 1,
                                                                                    minWidth: 0,
                                                                                    padding: '2px 5px',
                                                                                    borderRadius: '4px',
                                                                                    border: '1px solid #cbd5e1',
                                                                                    color: '#000000',
                                                                                    fontSize: '0.73rem',
                                                                                    fontWeight: selectedVal ? 600 : 400,
                                                                                    outline: 'none'
                                                                                  }}
                                                                                />
                                                                              </div>
                                                                            );
                                                                          })}
                                                                        </div>
                                                                        <div
                                                                          style={{
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: '4px',
                                                                            flexShrink: 0
                                                                          }}
                                                                        >
                                                                          <button
                                                                            type="button"
                                                                            disabled={savingNoteDevId === dev.device_id}
                                                                            onClick={() =>
                                                                              handleSaveNote(dev, displayMCols)
                                                                            }
                                                                            style={{
                                                                              display: 'inline-flex',
                                                                              alignItems: 'center',
                                                                              justifyContent: 'center',
                                                                              padding: '3px 8px',
                                                                              borderRadius: '5px',
                                                                              border: '1px solid #cbd5e1',
                                                                              color: '#000000',
                                                                              fontSize: '0.72rem',
                                                                              fontWeight: 700,
                                                                              cursor:
                                                                                savingNoteDevId === dev.device_id
                                                                                  ? 'wait'
                                                                                  : 'pointer'
                                                                            }}
                                                                          >
                                                                            <span>
                                                                              {savingNoteDevId === dev.device_id
                                                                                ? '...'
                                                                                : 'Lưu'}
                                                                            </span>
                                                                          </button>
                                                                          <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                              setEditingNoteDevId(null);
                                                                              setNoteDraftMap({});
                                                                            }}
                                                                            style={{
                                                                              padding: '3px 8px',
                                                                              borderRadius: '5px',
                                                                              border: '1px solid #cbd5e1',
                                                                              color: '#000000',
                                                                              fontSize: '0.72rem',
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
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                          setEditingNoteDevId(dev.device_id);
                                                                          setNoteDraftMap(parsedMap);
                                                                        }}
                                                                        style={{
                                                                          display: 'inline-flex',
                                                                          alignItems: 'center',
                                                                          gap: '4px',
                                                                          padding: '5px 12px',
                                                                          borderRadius: '6px',
                                                                          border: '1px solid #1D58BB',
                                                                          color: '#000000',
                                                                          fontSize: '0.75rem',
                                                                          fontWeight: 700,
                                                                          cursor: 'pointer'
                                                                        }}
                                                                      >
                                                                        <Plus size={13} />
                                                                        <span>Thêm</span>
                                                                      </button>
                                                                    );
                                                                  }

                                                                  const mappedEntries = displayMCols
                                                                    .map((mKey) => ({
                                                                      mKey,
                                                                      label:
                                                                        parsedMap[mKey.toLowerCase()] ||
                                                                        parsedMap[mKey] ||
                                                                        ''
                                                                    }))
                                                                    .filter((item) => item.label !== '');

                                                                  return (
                                                                    <div
                                                                      style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: '6px',
                                                                        boxSizing: 'border-box'
                                                                      }}
                                                                    >
                                                                      <div
                                                                        onClick={() =>
                                                                          setViewingNoteModal({
                                                                            device_id: dev.device_id,
                                                                            device_code: dev.device_code,
                                                                            device_name: dev.device_name,
                                                                            note: currentNote,
                                                                            mCols: displayMCols
                                                                          })
                                                                        }
                                                                        title="Nhấn để mở cửa sổ xem chi tiết cấu hình ghi chú (JSON)"
                                                                        style={{
                                                                          width: '188px',
                                                                          maxHeight: `${noteBoxMaxH}px`,
                                                                          padding: '4px 6px',
                                                                          borderRadius: '6px',
                                                                          border: '1px solid #cbd5e1',
                                                                          color: '#000000',
                                                                          fontSize: '0.73rem',
                                                                          lineHeight: 1.35,
                                                                          overflowY: 'auto',
                                                                          cursor: 'pointer',
                                                                          textAlign: 'left',
                                                                          boxSizing: 'border-box',
                                                                          display: 'flex',
                                                                          flexDirection: 'column',
                                                                          gap: '3px'
                                                                        }}
                                                                      >
                                                                        {mappedEntries.length > 0 ? (
                                                                          mappedEntries.map(({ mKey, label }) => (
                                                                            <div
                                                                              key={mKey}
                                                                              style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'space-between',
                                                                                gap: '6px',
                                                                                padding: '1px 5px',
                                                                                borderRadius: '4px',
                                                                                border: '1px solid #e2e8f0'
                                                                              }}
                                                                            >
                                                                              <span
                                                                                style={{
                                                                                  fontFamily: 'monospace',
                                                                                  fontWeight: 700,
                                                                                  color: '#000000',
                                                                                  fontSize: '0.72rem'
                                                                                }}
                                                                              >
                                                                                {mKey}
                                                                              </span>
                                                                              <span
                                                                                style={{
                                                                                  fontWeight: 600,
                                                                                  color: '#000000',
                                                                                  fontSize: '0.72rem',
                                                                                  whiteSpace: 'nowrap',
                                                                                  overflow: 'hidden',
                                                                                  textOverflow: 'ellipsis'
                                                                                }}
                                                                              >
                                                                                {label}
                                                                              </span>
                                                                            </div>
                                                                          ))
                                                                        ) : (
                                                                          <span
                                                                            style={{
                                                                              color: '#000000',
                                                                              whiteSpace: 'pre-wrap',
                                                                              wordBreak: 'break-word'
                                                                            }}
                                                                          >
                                                                            {currentNote}
                                                                          </span>
                                                                        )}
                                                                      </div>
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                          setEditingNoteDevId(dev.device_id);
                                                                          setNoteDraftMap(parsedMap);
                                                                        }}
                                                                        style={{
                                                                          display: 'inline-flex',
                                                                          alignItems: 'center',
                                                                          gap: '4px',
                                                                          padding: '4px 8px',
                                                                          borderRadius: '6px',
                                                                          border: '1px solid #f59e0b',
                                                                          color: '#000000',
                                                                          fontSize: '0.73rem',
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

                                                              {/* Đo lường (meter) */}
                                                              <td
                                                                rowSpan={histRows.length}
                                                                style={{
                                                                  position: 'sticky',
                                                                  left: '732px',
                                                                  zIndex: 3,
                                                                  borderBottom: devCellBorderBottom,
                                                                  borderLeft: '1px solid #e2e8f0',
                                                                  padding: '4px 6px',
                                                                  textAlign: 'center',
                                                                  color: '#000000',
                                                                  width: '150px',
                                                                  minWidth: '150px',
                                                                  maxWidth: '150px',
                                                                  boxSizing: 'border-box'
                                                                }}
                                                              >
                                                                {(() => {
                                                                  const rawMeter = String(
                                                                    dev.meter ??
                                                                      histRows.find(
                                                                        (r) =>
                                                                          r.meter !== undefined &&
                                                                          r.meter !== null &&
                                                                          String(r.meter).trim() !== ''
                                                                      )?.meter ??
                                                                      ''
                                                                  ).trim();
                                                                  const meterMap = parseMeterControlMap(rawMeter);
                                                                  const meterCols = parseMColList(rawMeter);
                                                                  const colBoxMaxH =
                                                                    Math.min(Math.max(histRows.length, 1), 5) * 52 - 10;
                                                                  if (meterCols.length === 0) {
                                                                    return (
                                                                      <span
                                                                        style={{
                                                                          color: '#000000',
                                                                          fontFamily: 'monospace',
                                                                          fontSize: '0.76rem'
                                                                        }}
                                                                      >
                                                                        --
                                                                      </span>
                                                                    );
                                                                  }
                                                                  return (
                                                                    <div
                                                                      style={{
                                                                        maxHeight: `${colBoxMaxH}px`,
                                                                        overflowY: 'auto',
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: '3px',
                                                                        boxSizing: 'border-box'
                                                                      }}
                                                                    >
                                                                      {meterCols.map((mc) => {
                                                                        const label = String(
                                                                          meterMap[mc.toLowerCase()] ??
                                                                            meterMap[mc] ??
                                                                            ''
                                                                        ).trim();
                                                                        return (
                                                                          <div
                                                                            key={mc}
                                                                            style={{
                                                                              display: 'flex',
                                                                              alignItems: 'center',
                                                                              justifyContent: label
                                                                                ? 'space-between'
                                                                                : 'center',
                                                                              gap: '6px',
                                                                              padding: '2px 6px',
                                                                              borderRadius: '5px',
                                                                              border: '1px solid #bfdbfe'
                                                                            }}
                                                                            title={label ? `${mc}: ${label}` : mc}
                                                                          >
                                                                            <span
                                                                              style={{
                                                                                color: '#000000',
                                                                                fontFamily: 'monospace',
                                                                                fontWeight: 700,
                                                                                fontSize: '0.73rem',
                                                                                flexShrink: 0
                                                                              }}
                                                                            >
                                                                              {mc}
                                                                            </span>
                                                                            {label && (
                                                                              <span
                                                                                style={{
                                                                                  fontWeight: 600,
                                                                                  color: '#000000',
                                                                                  fontSize: '0.72rem',
                                                                                  whiteSpace: 'nowrap',
                                                                                  overflow: 'hidden',
                                                                                  textOverflow: 'ellipsis'
                                                                                }}
                                                                              >
                                                                                {label}
                                                                              </span>
                                                                            )}
                                                                          </div>
                                                                        );
                                                                      })}
                                                                    </div>
                                                                  );
                                                                })()}
                                                              </td>

                                                              {/* Điều khiển (control) */}
                                                              <td
                                                                rowSpan={histRows.length}
                                                                style={{
                                                                  position: 'sticky',
                                                                  left: '882px',
                                                                  zIndex: 3,
                                                                  borderBottom: devCellBorderBottom,
                                                                  borderLeft: '1px solid #e2e8f0',
                                                                  padding: '4px 6px',
                                                                  textAlign: 'center',
                                                                  color: '#000000',
                                                                  width: '150px',
                                                                  minWidth: '150px',
                                                                  maxWidth: '150px',
                                                                  boxSizing: 'border-box'
                                                                }}
                                                              >
                                                                {(() => {
                                                                  const rawControl = String(
                                                                    dev.control ??
                                                                      histRows.find(
                                                                        (r) =>
                                                                          r.control !== undefined &&
                                                                          r.control !== null &&
                                                                          String(r.control).trim() !== ''
                                                                      )?.control ??
                                                                      ''
                                                                  ).trim();
                                                                  const controlMap = parseMeterControlMap(rawControl);
                                                                  const controlCols = parseMColList(rawControl);
                                                                  const colBoxMaxH =
                                                                    Math.min(Math.max(histRows.length, 1), 5) * 52 - 10;
                                                                  if (controlCols.length === 0) {
                                                                    return (
                                                                      <span
                                                                        style={{
                                                                          color: '#000000',
                                                                          fontFamily: 'monospace',
                                                                          fontSize: '0.76rem'
                                                                        }}
                                                                      >
                                                                        --
                                                                      </span>
                                                                    );
                                                                  }
                                                                  return (
                                                                    <div
                                                                      style={{
                                                                        maxHeight: `${colBoxMaxH}px`,
                                                                        overflowY: 'auto',
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: '3px',
                                                                        boxSizing: 'border-box'
                                                                      }}
                                                                    >
                                                                      {controlCols.map((cc) => {
                                                                        const label = String(
                                                                          controlMap[cc.toLowerCase()] ??
                                                                            controlMap[cc] ??
                                                                            ''
                                                                        ).trim();
                                                                        return (
                                                                          <div
                                                                            key={cc}
                                                                            style={{
                                                                              display: 'flex',
                                                                              alignItems: 'center',
                                                                              justifyContent: label
                                                                                ? 'space-between'
                                                                                : 'center',
                                                                              gap: '6px',
                                                                              padding: '2px 6px',
                                                                              borderRadius: '5px',
                                                                              border: '1px solid #fde68a'
                                                                            }}
                                                                            title={label ? `${cc}: ${label}` : cc}
                                                                          >
                                                                            <span
                                                                              style={{
                                                                                color: '#000000',
                                                                                fontFamily: 'monospace',
                                                                                fontWeight: 700,
                                                                                fontSize: '0.73rem',
                                                                                flexShrink: 0
                                                                              }}
                                                                            >
                                                                              {cc}
                                                                            </span>
                                                                            {label && (
                                                                              <span
                                                                                style={{
                                                                                  fontWeight: 600,
                                                                                  color: '#000000',
                                                                                  fontSize: '0.72rem',
                                                                                  whiteSpace: 'nowrap',
                                                                                  overflow: 'hidden',
                                                                                  textOverflow: 'ellipsis'
                                                                                }}
                                                                              >
                                                                                {label}
                                                                              </span>
                                                                            )}
                                                                          </div>
                                                                        );
                                                                      })}
                                                                    </div>
                                                                  );
                                                                })()}
                                                              </td>

                                                              {/* Thao tác */}
                                                              <td
                                                                rowSpan={histRows.length}
                                                                style={{
                                                                  position: 'sticky',
                                                                  left: '1032px',
                                                                  zIndex: 3,
                                                                  borderBottom: devCellBorderBottom,
                                                                  borderLeft: '1px solid #e2e8f0',
                                                                  padding: '6px 8px',
                                                                  textAlign: 'center',
                                                                  color: '#000000',
                                                                  width: '96px',
                                                                  minWidth: '96px',
                                                                  maxWidth: '96px',
                                                                  whiteSpace: 'nowrap',
                                                                  boxSizing: 'border-box'
                                                                }}
                                                              >
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
                                                                    color: '#000000',
                                                                    fontSize: '0.74rem',
                                                                    fontWeight: 700,
                                                                    cursor:
                                                                      deletingDevId === dev.device_id
                                                                        ? 'wait'
                                                                        : 'pointer',
                                                                    whiteSpace: 'nowrap'
                                                                  }}
                                                                  title="Xoá hàng tương ứng trong bảng telemetry_data"
                                                                >
                                                                  <Trash2 size={13} />
                                                                  <span>
                                                                    {deletingDevId === dev.device_id
                                                                      ? 'Đang xoá...'
                                                                      : 'Xoá'}
                                                                  </span>
                                                                </button>
                                                              </td>
                                                            </>
                                                          )}

                                                          {/* Cập nhật lúc */}
                                                          <td
                                                            style={{
                                                              position: 'sticky',
                                                              left: '1128px',
                                                              zIndex: 3,
                                                              borderBottom: cellBorderBottom,
                                                              borderLeft: '1px solid #e2e8f0',
                                                              padding: '6px 10px',
                                                              textAlign: 'center',
                                                              color: '#000000',
                                                              fontFamily: 'monospace',
                                                              fontSize: '0.74rem',
                                                              whiteSpace: 'nowrap',
                                                              width: '148px',
                                                              minWidth: '148px',
                                                              maxWidth: '148px',
                                                              boxSizing: 'border-box'
                                                            }}
                                                          >
                                                            {mRow.recorded_at || '--'}
                                                          </td>

                                                          {/* Cột dưới + Thêm cột - Xoá cột */}
                                                          <td
                                                            style={{
                                                              position: 'sticky',
                                                              left: '1276px',
                                                              zIndex: 3,
                                                              borderBottom: cellBorderBottom,
                                                              borderLeft: '1px solid #e2e8f0',
                                                              borderRight: '1px solid #cbd5e1',
                                                              padding: '6px 8px',
                                                              textAlign: 'center',
                                                              width: '184px',
                                                              minWidth: '184px',
                                                              maxWidth: '184px',
                                                              fontSize: '0.72rem',
                                                              color: '#000000',
                                                              fontWeight: 600,
                                                              whiteSpace: 'nowrap',
                                                              boxSizing: 'border-box'
                                                            }}
                                                          >
                                                            {rIdx === 0 ? 'Mới nhất' : `#${rIdx + 1}`}
                                                          </td>
                                                        </tr>
                                                      );
                                                    });
                                                  })
                                                )}
                                              </tbody>
                                            </table>

                                            {/* Khu vực cuộn ngang chỉ dành cho các cột m */}
                                            <div
                                              style={{
                                                width: `${mVisibleWidth}px`,
                                                minWidth: `${mVisibleWidth}px`,
                                                maxWidth: `${mVisibleWidth}px`,
                                                flexShrink: 0,
                                                overflowX: hasHorizontalScroll ? 'auto' : 'hidden',
                                                overflowY: 'hidden'
                                              }}
                                            >
                                              <table
                                                style={{
                                                  width: `${mTotalWidth}px`,
                                                  minWidth: `${mTotalWidth}px`,
                                                  maxWidth: `${mTotalWidth}px`,
                                                  tableLayout: 'fixed',
                                                  borderCollapse: 'separate',
                                                  borderSpacing: 0,
                                                  fontSize: '0.82rem',
                                                  textAlign: 'left'
                                                }}
                                              >
                                                <thead>
                                                  <tr
                                                    style={{
                                                      height: '40px',
                                                      backgroundColor: '#eff6ff',
                                                      color: '#1e40af',
                                                      fontWeight: 700,
                                                      fontSize: '0.73rem',
                                                      textTransform: 'uppercase',
                                                      letterSpacing: '0.4px'
                                                    }}
                                                  >
                                                    {mCols.length === 0 ? (
                                                      <th
                                                        style={{
                                                          position: 'sticky',
                                                          top: 0,
                                                          zIndex: 2,
                                                          backgroundColor: '#eff6ff',
                                                          borderBottom: '1px solid #dbeafe',
                                                          padding: '0 8px',
                                                          textAlign: 'center',
                                                          color: '#94a3b8',
                                                          width: '72px',
                                                          minWidth: '72px',
                                                          maxWidth: '72px',
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
                                                            backgroundColor: '#eff6ff',
                                                            borderBottom: '1px solid #dbeafe',
                                                            borderRight:
                                                              mIdx < mCols.length - 1 ? '1px solid #dbeafe' : 'none',
                                                            padding: '0 8px',
                                                            textAlign: 'center',
                                                            fontFamily: 'monospace',
                                                            color: '#1D58BB',
                                                            textTransform: 'none',
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
                                                  {group.devices.length === 0 ? (
                                                    <tr>
                                                      <td
                                                        colSpan={Math.max(mCols.length, 1)}
                                                        style={{ height: '52px', padding: '0 8px', textAlign: 'center', color: '#94a3b8' }}
                                                      >
                                                        --
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
                                                      const isLastDev = devIdx === group.devices.length - 1;
                                                      const rowHeight =
                                                        editingNoteDevId === dev.device_id && histRows.length === 1
                                                          ? '86px'
                                                          : '52px';

                                                      return histRows.map((mRow, rIdx) => {
                                                        const mVals = extractMValues(mRow);
                                                        const isLastHistRow = rIdx === histRows.length - 1;
                                                        const cellBorderBottom =
                                                          isLastDev && isLastHistRow
                                                            ? 'none'
                                                            : isLastHistRow
                                                              ? '1px solid #e2e8f0'
                                                              : '1px solid #f1f5f9';

                                                        return (
                                                          <tr
                                                            key={
                                                              mRow.id
                                                                ? `m-row-${dev.device_id}-${mRow.id}`
                                                                : `m-row-${dev.device_id}-${rIdx}-${mRow.recorded_at}`
                                                            }
                                                            style={{
                                                              height: rowHeight,
                                                              color: '#000000',
                                                              verticalAlign: 'middle'
                                                            }}
                                                          >
                                                            {/* Các cột m */}
                                                            {mCols.length === 0 ? (
                                                              <td
                                                                style={{
                                                                  padding: '6px 8px',
                                                                  textAlign: 'center',
                                                                  borderBottom: cellBorderBottom,
                                                                  color: '#000000',
                                                                  fontFamily: 'monospace',
                                                                  width: '72px',
                                                                  minWidth: '72px',
                                                                  maxWidth: '72px',
                                                                  boxSizing: 'border-box'
                                                                }}
                                                              >
                                                                --
                                                              </td>
                                                            ) : (
                                                              mCols.map((mKey, mIdx) => {
                                                                const val = mVals[mKey];
                                                                const hasVal =
                                                                  val !== undefined && val !== null && val !== '';
                                                                return (
                                                                  <td
                                                                    key={mKey}
                                                                    style={{
                                                                      padding: '6px 8px',
                                                                      textAlign: 'center',
                                                                      borderBottom: cellBorderBottom,
                                                                      borderRight:
                                                                        mIdx < mCols.length - 1
                                                                          ? '1px solid #e2e8f0'
                                                                          : 'none',
                                                                      fontWeight: hasVal ? 700 : 400,
                                                                      color: '#000000',
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
                                                      });
                                                    })
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        );
                                      })()}
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

      {/* KHUNG CHỌN ĐO LƯỜNG HOẶC ĐIỀU KHIỂN KHI NHẤN + THÊM CỘT */}
      {addColMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998
            }}
            onClick={() => setAddColMenu(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: `${addColMenu.top}px`,
              left: `${addColMenu.left}px`,
              zIndex: 9999,
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #bfdbfe',
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
              padding: '8px',
              width: '200px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              let maxNum = 0;
              addColMenu.currentCols.forEach((c) => {
                const n = parseInt(c.replace(/^m/i, ''), 10) || 0;
                if (n > maxNum) maxNum = n;
              });
              const nextCol = `m${maxNum + 1}`;
              return (
                <>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#64748b',
                      padding: '2px 4px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Chọn loại cột thêm:</span>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        color: '#1D58BB',
                        backgroundColor: '#eff6ff',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid #bfdbfe'
                      }}
                    >
                      {nextCol}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectAddColumnType('meter')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '7px',
                      border: '1px solid #bfdbfe',
                      backgroundColor: '#eff6ff',
                      color: '#1D58BB',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>Đo lường</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>+{nextCol}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAddColumnType('control')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '7px',
                      border: '1px solid #fde68a',
                      backgroundColor: '#fffbeb',
                      color: '#d97706',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>Điều khiển</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>+{nextCol}</span>
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

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
              {(() => {
                const modalMap = parseNoteMapping(viewingNoteModal.note);
                const entries = Object.entries(modalMap);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {entries.length > 0 && (
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#eff6ff', borderBottom: '1px solid #cbd5e1', color: '#1e40af', fontWeight: 700 }}>
                              <th style={{ padding: '8px 14px', width: '110px' }}>Cột m</th>
                              <th style={{ padding: '8px 14px' }}>Thông số hiển thị trên App</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entries.map(([k, val], idx) => (
                              <tr key={k} style={{ borderBottom: idx < entries.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#1D58BB' }}>{k}</td>
                                <td style={{ padding: '8px 14px', fontWeight: 600, color: '#0f172a' }}>{val}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                        Dữ liệu JSON lưu trong cột note (telemetry_data):
                      </div>
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          color: '#0f172a',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxHeight: '160px',
                          overflowY: 'auto'
                        }}
                      >
                        {viewingNoteModal.note}
                      </div>
                    </div>
                  </div>
                );
              })()}
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
                  setNoteDraftMap(parseNoteMapping(targetNote));
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
