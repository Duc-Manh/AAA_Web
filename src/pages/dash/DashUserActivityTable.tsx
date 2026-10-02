import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Radio,
  RefreshCw,
  Search,
  X,
  Code,
  Copy,
  Download,
  Layers,
  Clock,
  FolderKanban,
  Newspaper,
  Cpu,
  UserCheck,
  CircleDollarSign,
  CheckSquare,
  Check
} from 'lucide-react';
import { getLoggedInUser, trackActivity } from '../../utils/activityTracker';

export interface ModuleStats {
  count: number;
  last_visited: string | null;
  timestamps: string[];
}

export interface UserActivityItem {
  id: number;
  full_name: string;
  gmail: string;
  room?: string;
  position?: string;
  authen: number;
  state?: string;
  last_online: string | null;
  is_online: boolean;
  online_statistics: {
    today: number;
    this_week: number;
    this_month: number;
    this_year: number;
  };
  modules: {
    overview: ModuleStats;
    projects: ModuleStats;
    news: ModuleStats;
    supplies: ModuleStats;
    customers: ModuleStats;
    finance: ModuleStats;
    tasks: ModuleStats;
  };
  raw_json?: any;
}

interface DashUserActivityTableProps {
  triggerToast?: (msg: string) => void;
}

const MODULE_DEFINITIONS: {
  key: keyof UserActivityItem['modules'];
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}[] = [
    {
      key: 'overview',
      label: 'Tổng quan',
      icon: <Layers size={13} />,
      color: '#2563eb',
      bg: '#eff6ff'
    },
    {
      key: 'projects',
      label: 'Dự án',
      icon: <FolderKanban size={13} />,
      color: '#0891b2',
      bg: '#ecfeff'
    },
    {
      key: 'news',
      label: 'Tin tức',
      icon: <Newspaper size={13} />,
      color: '#d97706',
      bg: '#fffbeb'
    },
    {
      key: 'supplies',
      label: 'Vật tư',
      icon: <Cpu size={13} />,
      color: '#7c3aed',
      bg: '#f5f3ff'
    },
    {
      key: 'customers',
      label: 'Khách hàng',
      icon: <UserCheck size={13} />,
      color: '#059669',
      bg: '#ecfdf5'
    },
    {
      key: 'finance',
      label: 'Tài chính',
      icon: <CircleDollarSign size={13} />,
      color: '#ea580c',
      bg: '#fff7ed'
    },
    {
      key: 'tasks',
      label: 'Công việc',
      icon: <CheckSquare size={13} />,
      color: '#db2777',
      bg: '#fdf2f8'
    }
  ];

export const DashUserActivityTable: React.FC<DashUserActivityTableProps> = ({ triggerToast }) => {
  const [userStats, setUserStats] = useState<UserActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'offline'>('all');
  const [selectedUserForJson, setSelectedUserForJson] = useState<UserActivityItem | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [activeJsonTab, setActiveJsonTab] = useState<'json' | 'timeline'>('timeline');

  // Lấy thông tin tài khoản đang đăng nhập trên trình duyệt này
  const currentUser = useMemo(() => getLoggedInUser(), []);

  // Hàm xác định một tài khoản có đang trực tuyến hay không
  const isUserOnline = (user: UserActivityItem): boolean => {
    // 1. Backend tính toán online (trong vòng 5 phút vừa có ping / login / visit)
    if (user.is_online) return true;
    // 2. Tài khoản đang mở phiên trực tiếp trên trình duyệt
    if (currentUser) {
      if (currentUser.id && Number(user.id) === Number(currentUser.id)) return true;
      if (currentUser.gmail && user.gmail && user.gmail.toLowerCase() === currentUser.gmail.toLowerCase()) return true;
    }
    return false;
  };

  // Fetch dữ liệu từ backend
  const fetchUserStats = async (isManual = false) => {
    try {
      if (isManual) setIsLoading(true);
      // Gửi ngay 1 tín hiệu ping để cập nhật last_online = NOW() cho tài khoản hiện tại
      await trackActivity('PING', 'overview');
      const res = await fetch('/api/user-stats');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setUserStats(json.data);
          if (isManual && triggerToast) {
            triggerToast('Đã làm mới dữ liệu người dùng & thời điểm truy cập!');
          }
        }
      }
    } catch (err) {
      console.error('Lỗi tải thống kê user-stats:', err);
    } finally {
      if (isManual) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
    // Tự động thăm dò trạng thái online mỗi 15 giây
    const interval = setInterval(() => {
      fetchUserStats(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Tính toán số lượng đang online
  const onlineCount = useMemo(() => {
    return userStats.filter((u) => isUserOnline(u)).length;
  }, [userStats, currentUser]);

  const filteredStats = useMemo(() => {
    return userStats.filter((user) => {
      const userOnline = isUserOnline(user);
      // Bộ lọc online/offline
      if (filterMode === 'online' && !userOnline) return false;
      if (filterMode === 'offline' && userOnline) return false;

      // Tìm kiếm
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (user.full_name || '').toLowerCase();
      const email = (user.gmail || '').toLowerCase();
      const room = (user.room || '').toLowerCase();
      const pos = (user.position || '').toLowerCase();
      return name.includes(q) || email.includes(q) || room.includes(q) || pos.includes(q);
    });
  }, [userStats, filterMode, searchQuery, currentUser]);

  // Format ngày giờ hiển thị
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa ghi nhận';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Sao chép JSON
  const handleCopyJson = (data: any) => {
    const jsonStr = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      setIsCopied(true);
      if (triggerToast) triggerToast('Đã sao chép cấu trúc JSON vào bộ nhớ tạm!');
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Tải file JSON
  const handleDownloadJson = (user: UserActivityItem) => {
    const filename = `activity_log_${user.id}_${(user.gmail || 'user').replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const jsonStr = JSON.stringify(user.raw_json || user, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (triggerToast) triggerToast(`Đã xuất file ${filename}!`);
  };

  return (
    <div className="dash-activity-section" style={{ marginTop: '16px', marginBottom: '24px', width: '100%', flexShrink: 0 }}>
      <div className="dash-accounts-card" style={{ boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', borderRadius: '16px', width: '100%', flexShrink: 0 }}>
        {/* Header khung thống kê */}
        <div
          className="dash-accounts-card-header"
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            borderBottom: '1px solid #e2e8f0',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Activity size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: '#0f172a' }}>
                  Giám Sát Tài Khoản Đang Online và Tần Suất Truy Cập
                </h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: onlineCount > 0 ? '#ecfdf5' : '#f1f5f9',
                    color: onlineCount > 0 ? '#059669' : '#64748b',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: `1px solid ${onlineCount > 0 ? '#a7f3d0' : '#e2e8f0'}`
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: onlineCount > 0 ? '#10b981' : '#94a3b8',
                      boxShadow: onlineCount > 0 ? '0 0 0 3px rgba(16, 185, 129, 0.3)' : 'none'
                    }}
                  />
                  {onlineCount} Đang online
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                • Thống kê online (ngày/tuần/tháng/năm)
              </p>
            </div>
          </div>

          {/* Action buttons & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => fetchUserStats(true)}
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.83rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Làm mới thống kê online"
            >
              <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
              <span>{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Bộ lọc online/offline & Ô tìm kiếm */}
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid #f1f5f9',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Tabs bộ lọc */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: filterMode === 'all' ? '#1e293b' : '#f1f5f9',
                color: filterMode === 'all' ? '#ffffff' : '#475569'
              }}
            >
              Tất cả ({userStats.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('online')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: filterMode === 'online' ? '#10b981' : '#f1f5f9',
                color: filterMode === 'online' ? '#ffffff' : '#047857',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Radio size={12} />
              Đang Online ({onlineCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('offline')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: filterMode === 'offline' ? '#64748b' : '#f1f5f9',
                color: filterMode === 'offline' ? '#ffffff' : '#64748b'
              }}
            >
              Ngoại tuyến ({userStats.length - onlineCount})
            </button>
          </div>

          {/* Ô tìm kiếm */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              placeholder="Tìm theo tên, email, phòng ban..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 32px 8px 34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Bảng dữ liệu chính - Luôn hiển thị đầy đủ, không bị thu nhỏ */}
        <div
          style={{
            overflowX: 'auto',
            width: '100%',
            position: 'relative'
          }}
        >
          <table className="dash-table" style={{ width: '100%', minWidth: '1050px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', width: '45px' }}>STT</th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', minWidth: '220px' }}>
                  Tài khoản / Nhân sự
                </th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', minWidth: '130px' }}>
                  Trạng thái
                </th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', minWidth: '190px' }}>
                  Số lần Online (Ngày/Tuần/Tháng/Năm)
                </th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', minWidth: '320px' }}>
                  Lượt vào 7 Mục Chuyên Môn
                </th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textAlign: 'center', width: '120px' }}>
                  Xem cụ thể
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                    Không có tài khoản nào phù hợp điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredStats.map((user, idx) => {
                  const userOnline = isUserOnline(user);
                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s',
                        background: userOnline ? '#f0fdf4' : '#ffffff'
                      }}
                    >
                      {/* 1. STT */}
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                        {idx + 1}
                      </td>

                      {/* 2. Tài khoản / Nhân sự */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: userOnline
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              flexShrink: 0
                            }}
                          >
                            {(user.full_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                                {user.full_name || 'Chưa đặt tên'}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: Number(user.authen) === 1 ? '#eff6ff' : '#f1f5f9',
                                  color: Number(user.authen) === 1 ? '#1d4ed8' : '#475569',
                                  fontWeight: 600
                                }}
                              >
                                {Number(user.authen) === 1 ? 'Admin' : 'Nhân sự'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                              {user.gmail}
                            </div>
                            {(user.room || user.position) && (
                              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                                {[user.room, user.position].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Trạng thái Online */}
                      <td style={{ padding: '12px 16px' }}>
                        {userOnline ? (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '16px',
                                background: '#dcfce7',
                                color: '#15803d',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                border: '1px solid #86efac'
                              }}
                            >
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  background: '#22c55e',
                                  boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.4)'
                                }}
                              />
                              Đang Online
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#16a34a' }}>
                              Vừa hoạt động
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 8px',
                                borderRadius: '16px',
                                background: '#f1f5f9',
                                color: '#64748b',
                                fontSize: '0.74rem',
                                fontWeight: 600
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }} />
                              Ngoại tuyến
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              Lần cuối: {formatDateTime(user.last_online)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 4. Số lần Online (Ngày/Tuần/Tháng/Năm) */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', maxWidth: '200px' }}>
                          <div
                            style={{
                              background: '#f8fafc',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              textAlign: 'center'
                            }}
                          >
                            <span style={{ display: 'block', fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>Hôm nay</span>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#2563eb' }}>
                              {user.online_statistics?.today || 0}
                            </span>
                          </div>

                          <div
                            style={{
                              background: '#f8fafc',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              textAlign: 'center'
                            }}
                          >
                            <span style={{ display: 'block', fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>Tuần này</span>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0891b2' }}>
                              {user.online_statistics?.this_week || 0}
                            </span>
                          </div>

                          <div
                            style={{
                              background: '#f8fafc',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              textAlign: 'center'
                            }}
                          >
                            <span style={{ display: 'block', fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>Tháng này</span>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#7c3aed' }}>
                              {user.online_statistics?.this_month || 0}
                            </span>
                          </div>

                          <div
                            style={{
                              background: '#f8fafc',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              textAlign: 'center'
                            }}
                          >
                            <span style={{ display: 'block', fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>Năm nay</span>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#059669' }}>
                              {user.online_statistics?.this_year || 0}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Lượt vào 7 mục chuyên môn */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {MODULE_DEFINITIONS.map((mod) => {
                            const modData = user.modules?.[mod.key] || { count: 0, last_visited: null, timestamps: [] };
                            const count = modData.count || 0;
                            return (
                              <div
                                key={mod.key}
                                title={`${mod.label}: ${count} lượt vào\nLần cuối: ${formatDateTime(modData.last_visited)}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: count > 0 ? mod.bg : '#f8fafc',
                                  border: `1px solid ${count > 0 ? mod.color + '40' : '#e2e8f0'}`,
                                  fontSize: '0.74rem',
                                  color: count > 0 ? mod.color : '#94a3b8'
                                }}
                              >
                                {mod.icon}
                                <span style={{ fontWeight: 600 }}>{mod.label}:</span>
                                <span style={{ fontWeight: 800 }}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* 6. Dữ liệu JSON */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForJson(user);
                              setActiveJsonTab('timeline');
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 10px',
                              borderRadius: '7px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            title="Xem thời điểm chi tiết & JSON"
                          >
                            <span>Xem</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyJson(user.raw_json || user)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              background: '#f8fafc',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              cursor: 'pointer'
                            }}
                            title="Sao chép JSON người dùng này"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XEM DỮ LIỆU JSON & THỜI ĐIỂM CHI TIẾT */}
      {selectedUserForJson && (
        <div
          className="dash-modal-overlay"
          onClick={() => setSelectedUserForJson(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            className="dash-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#3b82f6',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Code size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    Dữ Liệu Truy Cập & Thời Điểm Dạng JSON
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Tài khoản: <strong>{selectedUserForJson.full_name}</strong> ({selectedUserForJson.gmail})
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCopyJson(selectedUserForJson.raw_json || selectedUserForJson)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {isCopied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{isCopied ? 'Đã sao chép' : 'Sao chép JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadJson(selectedUserForJson)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} />
                  <span>Tải .json</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUserForJson(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Tabs: Timeline thời điểm vs JSON Thô */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #e2e8f0',
                background: '#ffffff',
                padding: '0 24px'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveJsonTab('timeline')}
                style={{
                  padding: '12px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeJsonTab === 'timeline' ? '2px solid #2563eb' : '2px solid transparent',
                  color: activeJsonTab === 'timeline' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Clock size={15} />
                <span>Thời Điểm Theo Từng Mục (7 Mục)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveJsonTab('json')}
                style={{
                  padding: '12px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeJsonTab === 'json' ? '2px solid #2563eb' : '2px solid transparent',
                  color: activeJsonTab === 'json' ? '#2563eb' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Code size={15} />
                <span>Cấu Trúc JSON Hoàn Chỉnh</span>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, maxHeight: '60vh' }}>
              {activeJsonTab === 'timeline' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {MODULE_DEFINITIONS.map((mod) => {
                    const modData = selectedUserForJson.modules?.[mod.key] || { count: 0, last_visited: null, timestamps: [] };
                    const timestamps = modData.timestamps || [];

                    return (
                      <div
                        key={mod.key}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: '#ffffff'
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 14px',
                            background: mod.bg,
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: mod.color }}>{mod.icon}</span>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                              Mục: {mod.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem' }}>
                            <span style={{ color: '#475569' }}>
                              Tổng lượt vào: <strong>{modData.count || 0}</strong>
                            </span>
                            <span style={{ color: '#64748b' }}>
                              Lần cuối: <strong>{formatDateTime(modData.last_visited)}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Danh sách các mốc thời gian */}
                        <div style={{ padding: '12px 14px' }}>
                          {timestamps.length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              Chưa ghi nhận thời điểm truy cập vào mục này.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {timestamps.map((t, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.74rem',
                                    color: '#334155'
                                  }}
                                >
                                  <Clock size={11} color="#64748b" />
                                  <span>{formatDateTime(t)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* JSON Viewer trực quan */
                <pre
                  style={{
                    margin: 0,
                    padding: '16px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    color: '#38bdf8',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '0.82rem',
                    lineHeight: '1.5',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}
                >
                  {JSON.stringify(selectedUserForJson.raw_json || selectedUserForJson, null, 2)}
                </pre>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px'
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedUserForJson(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
