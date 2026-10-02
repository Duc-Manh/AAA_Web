import React, { useState, useEffect } from 'react';
import './Dash.css';
import {
  Users,
  RefreshCw,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
  UserPlus,
  RotateCcw,
  Activity,
  Calendar,
  TrendingUp,
  CalendarDays,
  Globe,
  Box,
  Search
} from 'lucide-react';
import { DashAside } from '../../components/common/DashAside';
import { DashHeader } from '../../components/common/DashHeader';
import { DashVisitorChart } from './DashVisitorChart';

interface LoginAccount {
  id: number;
  time: string;
  full_name: string;
  room: string;
  position: string;
  gmail: string;
  password?: string;
  phone: string;
  authen: number;
  state: string;
}

interface CurrentUserData {
  id?: number;
  full_name?: string;
  gmail?: string;
  username?: string;
  room?: string;
  position?: string;
  phone?: string;
  authen?: number;
  state?: string;
}

export const Dash: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);

  // Danh sách tài khoản từ bảng login database 3ahome
  const [accounts, setAccounts] = useState<LoginAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [editingAccount, setEditingAccount] = useState<LoginAccount | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    full_name: '',
    room: '',
    position: '',
    gmail: '',
    password: '',
    phone: '',
    authen: 2,
    state: 'active'
  });

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

  const handleLogout = () => {
    localStorage.removeItem('aaa_admin_auth');
    sessionStorage.removeItem('aaa_admin_auth');
    window.location.hash = '#home';
    window.history.pushState(null, '', '/#home');
    window.dispatchEvent(new Event('popstate'));
    window.dispatchEvent(new Event('hashchange'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Thống kê lượng truy cập hệ thống
  interface VisitStats {
    online: number;
    today: number;
    month: number;
    year: number;
    total: number;
    simu: number;
  }

  const [visitStats, setVisitStats] = useState<VisitStats>({
    online: 1,
    today: 0,
    month: 0,
    year: 0,
    total: 0,
    simu: 0
  });

  const fetchVisitStats = async () => {
    try {
      const res = await fetch('/api/visit');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setVisitStats({
            online: Math.max(1, Number(data.stats.online) || 1),
            today: Number(data.stats.today) || 0,
            month: Number(data.stats.month) || 0,
            year: Number(data.stats.year) || 0,
            total: Number(data.stats.total) || 0,
            simu: Number(data.stats.simu) || Number(data.stats.simuUsers) || 0
          });
        }
      }
    } catch (err) {
      console.error('Lỗi tải thống kê truy cập:', err);
    }
  };

  // Tìm kiếm và bộ lọc cho Bảng Theo Dõi Nhân Sự
  const [accountSearch, setAccountSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | '1' | '2'>('all');

  const filteredAccounts = accounts.filter((acc) => {
    const q = accountSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      acc.full_name?.toLowerCase().includes(q) ||
      acc.gmail?.toLowerCase().includes(q) ||
      acc.room?.toLowerCase().includes(q) ||
      acc.position?.toLowerCase().includes(q) ||
      acc.phone?.includes(q);
    const matchRole =
      roleFilter === 'all' || String(acc.authen) === roleFilter;
    return matchSearch && matchRole;
  });

  const fetchAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const res = await fetch('/api/login');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAccounts(json.data);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách tài khoản login:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchVisitStats();

    // Tự động làm mới số người online và truy cập mỗi 15 giây
    const interval = setInterval(() => {
      fetchVisitStats();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteAccount = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá tài khoản "${name}" không?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/login/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Đã xoá tài khoản "${name}" thành công!`);
        setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      } else {
        triggerToast(data.message || 'Lỗi xoá tài khoản');
      }
    } catch {
      triggerToast('Không thể kết nối máy chủ để xoá tài khoản.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    try {
      const res = await fetch(`/api/login/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAccount),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Đã cập nhật tài khoản "${editingAccount.full_name}" thành công!`);
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === editingAccount.id ? editingAccount : acc))
        );
        setEditingAccount(null);
      } else {
        triggerToast(data.message || 'Lỗi cập nhật tài khoản');
      }
    } catch {
      triggerToast('Không thể kết nối máy chủ để cập nhật tài khoản.');
    }
  };

  const handleResetPassword = async (id: number, name: string) => {
    const isConfirm = window.confirm(
      `Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản "${name}" về mật khẩu "3AHome@2026"?`
    );
    if (!isConfirm) return;

    try {
      const res = await fetch('/api/login/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: '3AHome@2026' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Đã reset mật khẩu tài khoản "${name}" về "3AHome@2026" thành công!`);
        fetchAccounts();
      } else {
        triggerToast(data.message || 'Lỗi đặt lại mật khẩu');
      }
    } catch {
      triggerToast('Không thể kết nối máy chủ để đặt lại mật khẩu.');
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Đã thêm tài khoản "${newAccount.full_name}" thành công!`);
        setIsAddingAccount(false);
        setNewAccount({
          full_name: '',
          room: '',
          position: '',
          gmail: '',
          password: '',
          phone: '',
          authen: 2,
          state: 'active'
        });
        fetchAccounts();
      } else {
        triggerToast(data.message || 'Lỗi thêm tài khoản');
      }
    } catch {
      triggerToast('Không thể kết nối máy chủ để thêm tài khoản.');
    }
  };

  const formatDbTime = (timeStr: string) => {
    if (!timeStr) return '---';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();
      const hour = pad(d.getHours());
      const min = pad(d.getMinutes());
      const sec = pad(d.getSeconds());
      return `${hour}:${min}:${sec} ${day}/${month}/${year}`;
    } catch {
      return timeStr;
    }
  };

  // Tìm tài khoản trong bảng login database 3ahome tương ứng với tài khoản đăng nhập
  const loggedInAccount = accounts.find(
    (acc) =>
      (currentUser?.gmail && acc.gmail?.toLowerCase() === currentUser.gmail.toLowerCase()) ||
      (currentUser?.id && acc.id === currentUser.id)
  );

  // Giá trị full_name trong bảng login của database 3ahome
  const currentFullName =
    loggedInAccount?.full_name ||
    currentUser?.full_name ||
    currentUser?.username ||
    'Quản Trị Viên 3A';

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
        setActiveTab={setActiveTab}
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
          title="Giao diện quản trị công ty"
          subtitle="Giám sát thời gian thực, tự động hoá thiết bị và phân tích chỉ số toà nhà thông minh 3A"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
          refreshTitle="Làm mới trạng thái kết nối"
          onRefresh={() => {
            fetchAccounts();
            fetchVisitStats();
            triggerToast('Đã làm mới dữ liệu thống kê & tài khoản!');
          }}
          notificationTitle="Thông báo hệ thống (2 cảnh báo)"
          onNotification={() => triggerToast('Không có sự cố khẩn cấp nào!')}
          triggerToast={triggerToast}
          handleLogout={handleLogout}
        />

        {/* NỘI DUNG TRANG DASHBOARD */}
        <div className="dash-content">
          {/* KHUNG THEO DÕI CÁC CHỈ SỐ TRUY CẬP HỆ THỐNG */}
          <div className="dash-metrics-grid">
            {/* 1. Số người đang online */}
            <div className="dash-metric-card metric-online" title="Số lượng người dùng đang truy cập trực tuyến">
              <div className="dash-metric-info">
                <p className="dash-metric-label">
                  <span className="live-pulse-dot" />
                  <span>Đang online</span>
                </p>
                <h3 className="dash-metric-value">
                  {visitStats.online.toLocaleString()}
                </h3>
              </div>
              <div className="dash-metric-icon-wrap">
                <Activity size={24} />
              </div>
            </div>

            {/* 2. Số người truy cập trong ngày */}
            <div className="dash-metric-card metric-today" title="Lượt truy cập trong ngày hôm nay">
              <div className="dash-metric-info">
                <p className="dash-metric-label">
                  <span>Hôm nay</span>
                </p>
                <h3 className="dash-metric-value">
                  {visitStats.today.toLocaleString()}
                </h3>
              </div>
              <div className="dash-metric-icon-wrap">
                <Calendar size={24} />
              </div>
            </div>

            {/* 3. Số người truy cập trong tháng */}
            <div className="dash-metric-card metric-month" title="Lượt truy cập trong tháng hiện tại">
              <div className="dash-metric-info">
                <p className="dash-metric-label">
                  <span>Trong tháng</span>
                </p>
                <h3 className="dash-metric-value">
                  {visitStats.month.toLocaleString()}
                </h3>
              </div>
              <div className="dash-metric-icon-wrap">
                <TrendingUp size={24} />
              </div>
            </div>

            {/* 4. Số người truy cập trong năm */}
            <div className="dash-metric-card metric-year" title="Lượt truy cập trong năm nay">
              <div className="dash-metric-info">
                <p className="dash-metric-label">
                  <span>Trong năm</span>
                </p>
                <h3 className="dash-metric-value">
                  {visitStats.year.toLocaleString()}
                </h3>
              </div>
              <div className="dash-metric-icon-wrap">
                <CalendarDays size={24} />
              </div>
            </div>

            {/* 5. Tổng số truy cập */}
            <div className="dash-metric-card metric-total" title="Tổng lượt truy cập toàn thời gian">
              <div className="dash-metric-info">
                <p className="dash-metric-label">
                  <span>Tổng truy cập</span>
                </p>
                <h3 className="dash-metric-value">
                  {visitStats.total.toLocaleString()}
                </h3>
              </div>
              <div className="dash-metric-icon-wrap">
                <Globe size={24} />
              </div>
            </div>

            {/* 6. Số người truy cập vào Simu.tsx */}
            <div className="dash-metric-card metric-simu" title="Số lượt truy cập vào phòng mô phỏng 3D Simu">
              <div className="dash-metric-info">
                <p className="dash-metric-label">
                  <span>Truy cập Simu 3D</span>
                </p>
                <h3 className="dash-metric-value">
                  {visitStats.simu.toLocaleString()}
                </h3>
              </div>
              <div className="dash-metric-icon-wrap">
                <Box size={24} />
              </div>
            </div>
          </div>

          {/* 2. BIỂU ĐỒ 2 TRỤC (TRỤC HOÀNH X & TRỤC TUNG Y) THỐNG KÊ LƯỢT TRUY CẬP */}
          <DashVisitorChart visitStats={visitStats} onRefresh={fetchVisitStats} />

          {/* 3. BẢNG THEO DÕI NHÂN SỰ (TÀI KHOẢN HỆ THỐNG DATABASE 3AHOME) */}
          <div className="dash-accounts-card">
            <div className="dash-accounts-card-header">
              <div className="dash-accounts-card-title">
                <Users size={20} color="#2563eb" />
                <span>Bảng Theo Dõi Nhân Sự (Tài Khoản Hệ Thống)</span>
                <span className="dash-accounts-badge">{filteredAccounts.length}/{accounts.length} Nhân sự</span>
              </div>

              {/* Thanh công cụ: Tìm kiếm & Lọc vai trò & Thao tác */}
              <div className="dash-accounts-toolbar">
                <div className="dash-accounts-search-wrap">
                  <Search size={14} className="dash-accounts-search-icon" />
                  <input
                    type="text"
                    className="dash-accounts-search-input"
                    placeholder="Tìm theo tên, Gmail, phòng ban..."
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                  />
                  {accountSearch && (
                    <button
                      type="button"
                      className="dash-accounts-search-clear"
                      onClick={() => setAccountSearch('')}
                      title="Xoá tìm kiếm"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="dash-role-filter-group">
                  <button
                    type="button"
                    className={`dash-pill-btn ${roleFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setRoleFilter('all')}
                  >
                    Tất cả ({accounts.length})
                  </button>
                  <button
                    type="button"
                    className={`dash-pill-btn ${roleFilter === '1' ? 'active' : ''}`}
                    onClick={() => setRoleFilter('1')}
                  >
                    Admin ({accounts.filter((a) => Number(a.authen) === 1).length})
                  </button>
                  <button
                    type="button"
                    className={`dash-pill-btn ${roleFilter === '2' ? 'active' : ''}`}
                    onClick={() => setRoleFilter('2')}
                  >
                    Nhân viên ({accounts.filter((a) => Number(a.authen) === 2).length})
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="dash-pill-btn active"
                    style={{ background: '#2563eb', color: '#ffffff', borderColor: '#2563eb' }}
                    onClick={() => setIsAddingAccount(true)}
                    title="Thêm tài khoản hệ thống mới"
                  >
                    <UserPlus size={14} />
                    <span>Thêm tài khoản</span>
                  </button>

                  <button
                    type="button"
                    className="dash-pill-btn"
                    onClick={fetchAccounts}
                    title="Tải lại danh sách từ MySQL"
                  >
                    <RefreshCw size={14} className={isLoadingAccounts ? 'spin-icon' : ''} />
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="dash-table-wrap">
              <table className="dash-accounts-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Thời điểm tạo tài khoản</th>
                    <th>Họ tên</th>
                    <th>Phòng</th>
                    <th>Chức danh</th>
                    <th>Gmail</th>
                    <th>Số điện thoại</th>
                    <th>Phân quyền</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}>Reset mật khẩu</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                        {isLoadingAccounts
                          ? 'Đang tải dữ liệu từ database 3ahome...'
                          : accounts.length === 0
                          ? 'Chưa có tài khoản nào trong bảng login.'
                          : 'Không tìm thấy tài khoản nhân sự phù hợp với bộ lọc.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc, index) => (
                      <tr key={acc.id}>
                        <td>
                          <span className="dash-stt-badge">{index + 1}</span>
                        </td>
                        <td style={{ color: '#64748b' }}>
                          {formatDbTime(acc.time)}
                        </td>
                        <td className="dash-user-name-cell">
                          {acc.full_name}
                        </td>
                        <td>{acc.room || '---'}</td>
                        <td>{acc.position || '---'}</td>
                        <td style={{ color: '#2563eb', fontWeight: 500 }}>
                          {acc.gmail}
                        </td>
                        <td>{acc.phone || '---'}</td>
                        <td>
                          <span
                            className={`dash-authen-badge ${Number(acc.authen) === 1 ? 'authen-admin' : 'authen-employ'
                              }`}
                            style={{ backgroundColor: 'transparent', background: 'none' }}
                          >
                            {acc.authen} ({Number(acc.authen) === 1 ? 'Admin' : 'Nhân Viên'})
                          </span>
                        </td>
                        <td>
                          <span
                            className={`dash-state-badge ${acc.state?.toLowerCase() === 'inactive' ? 'inactive' : ''
                              }`}
                            style={{ backgroundColor: 'transparent', background: 'none' }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: acc.state?.toLowerCase() === 'inactive' ? '#dc2626' : '#16a34a'
                              }}
                            />
                            {acc.state || 'active'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="dash-btn-reset-pass"
                            onClick={() => handleResetPassword(acc.id, acc.full_name)}
                            title="Reset mật khẩu về 3AHome@2026"
                          >
                            <RotateCcw size={13} />
                            <span>Reset</span>
                          </button>
                        </td>
                        <td>
                          <div className="dash-actions-cell" style={{ justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="dash-btn-edit"
                              onClick={() => setEditingAccount({ ...acc })}
                              title="Chỉnh sửa thông tin tài khoản"
                            >
                              <Pencil size={13} />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              className="dash-btn-delete"
                              onClick={() => handleDeleteAccount(acc.id, acc.full_name)}
                              title="Xóa tài khoản khỏi database"
                            >
                              <Trash2 size={13} />
                              <span>Xoá</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MODAL SỬA TÀI KHOẢN */}
          {editingAccount && (
            <div className="dash-modal-overlay" onClick={() => setEditingAccount(null)}>
              <div className="dash-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="dash-modal-header">
                  <h3 className="dash-modal-title" style={{ color: '#1d4ed8' }}>Sửa Thông Tin Tài Khoản</h3>
                  <button
                    type="button"
                    className="dash-modal-close-btn"
                    onClick={() => setEditingAccount(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit}>
                  <div className="dash-modal-body">
                    <div className="dash-field-group dash-form-full">
                      <label>Họ và tên</label>
                      <input
                        type="text"
                        value={editingAccount.full_name}
                        onChange={(e) =>
                          setEditingAccount({ ...editingAccount, full_name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="dash-field-group">
                      <label>Phòng ban</label>
                      <input
                        type="text"
                        value={editingAccount.room || ''}
                        onChange={(e) =>
                          setEditingAccount({ ...editingAccount, room: e.target.value })
                        }
                      />
                    </div>

                    <div className="dash-field-group">
                      <label>Chức danh</label>
                      <input
                        type="text"
                        value={editingAccount.position || ''}
                        onChange={(e) =>
                          setEditingAccount({ ...editingAccount, position: e.target.value })
                        }
                      />
                    </div>

                    <div className="dash-field-group">
                      <label>Gmail</label>
                      <input
                        type="text"
                        value={editingAccount.gmail}
                        onChange={(e) =>
                          setEditingAccount({ ...editingAccount, gmail: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="dash-field-group">
                      <label>Mật khẩu</label>
                      <input
                        type="text"
                        placeholder="Nhập mật khẩu..."
                        value={editingAccount.password || ''}
                        onChange={(e) =>
                          setEditingAccount({ ...editingAccount, password: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="dash-field-group">
                      <label>Số điện thoại</label>
                      <input
                        type="text"
                        value={editingAccount.phone || ''}
                        onChange={(e) =>
                          setEditingAccount({ ...editingAccount, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="dash-field-group">
                      <label>Phân quyền (authen)</label>
                      <select
                        value={editingAccount.authen}
                        onChange={(e) =>
                          setEditingAccount({ ...editingAccount, authen: Number(e.target.value) })
                        }
                      >
                        <option value={1}>1 - Quản trị viên (Dash.tsx)</option>
                        <option value={2}>2 - Nhân viên (Employ.tsx)</option>
                      </select>
                    </div>

                    <div className="dash-field-group">
                      <label>Trạng thái (state)</label>
                      <select
                        value={editingAccount.state || 'active'}
                        onChange={(e) =>
                          setEditingAccount({ ...editingAccount, state: e.target.value })
                        }
                      >
                        <option value="active">active (Hoạt động)</option>
                        <option value="inactive">inactive (Khóa)</option>
                      </select>
                    </div>
                  </div>

                  <div className="dash-modal-footer">
                    <button
                      type="button"
                      className="dash-pill-btn"
                      onClick={() => setEditingAccount(null)}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="dash-pill-btn active"
                      style={{ background: '#2563eb', color: '#ffffff', borderColor: '#2563eb' }}
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL THÊM TÀI KHOẢN */}
          {isAddingAccount && (
            <div className="dash-modal-overlay" onClick={() => setIsAddingAccount(false)}>
              <div className="dash-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="dash-modal-header">
                  <h3 className="dash-modal-title" style={{ color: '#1d4ed8' }}>Thêm tài khoản hệ thống</h3>
                  <button
                    type="button"
                    className="dash-modal-close-btn"
                    onClick={() => setIsAddingAccount(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateAccount}>
                  <div className="dash-modal-body">
                    <div className="dash-field-group dash-form-full">
                      <label>Họ và tên</label>
                      <input
                        type="text"
                        placeholder="Nhập họ và tên..."
                        value={newAccount.full_name}
                        onChange={(e) =>
                          setNewAccount({ ...newAccount, full_name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="dash-field-group">
                      <label>Phòng ban</label>
                      <input
                        type="text"
                        placeholder="Nhập phòng ban..."
                        value={newAccount.room}
                        onChange={(e) =>
                          setNewAccount({ ...newAccount, room: e.target.value })
                        }
                      />
                    </div>

                    <div className="dash-field-group">
                      <label>Chức danh</label>
                      <input
                        type="text"
                        placeholder="Nhập chức danh..."
                        value={newAccount.position}
                        onChange={(e) =>
                          setNewAccount({ ...newAccount, position: e.target.value })
                        }
                      />
                    </div>

                    <div className="dash-field-group">
                      <label>Gmail</label>
                      <input
                        type="text"
                        placeholder="Nhập địa chỉ Gmail..."
                        value={newAccount.gmail}
                        onChange={(e) =>
                          setNewAccount({ ...newAccount, gmail: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="dash-field-group">
                      <label>Mật khẩu</label>
                      <input
                        type="text"
                        placeholder="Nhập mật khẩu..."
                        value={newAccount.password}
                        onChange={(e) =>
                          setNewAccount({ ...newAccount, password: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="dash-field-group">
                      <label>Số điện thoại</label>
                      <input
                        type="text"
                        placeholder="Nhập số điện thoại..."
                        value={newAccount.phone}
                        onChange={(e) =>
                          setNewAccount({ ...newAccount, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="dash-field-group">
                      <label>Phân quyền (authen)</label>
                      <select
                        value={newAccount.authen}
                        onChange={(e) =>
                          setNewAccount({ ...newAccount, authen: Number(e.target.value) })
                        }
                      >
                        <option value={1}>1 - Quản trị viên (Dash.tsx)</option>
                        <option value={2}>2 - Nhân viên (Employ.tsx)</option>
                      </select>
                    </div>

                    <div className="dash-field-group">
                      <label>Trạng thái (state)</label>
                      <select
                        value={newAccount.state}
                        onChange={(e) =>
                          setNewAccount({ ...newAccount, state: e.target.value })
                        }
                      >
                        <option value="active">active (Hoạt động)</option>
                        <option value="inactive">inactive (Khóa)</option>
                      </select>
                    </div>
                  </div>

                  <div className="dash-modal-footer">
                    <button
                      type="button"
                      className="dash-pill-btn"
                      onClick={() => setIsAddingAccount(false)}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="dash-pill-btn active"
                      style={{ background: '#2563eb', color: '#ffffff', borderColor: '#2563eb' }}
                    >
                      Thêm tài khoản
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dash;
