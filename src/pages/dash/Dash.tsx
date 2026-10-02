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
  BarChart3,
  LineChart,
  Layers,
  Info
} from 'lucide-react';
import { DashAside } from '../../components/common/DashAside';
import { DashHeader } from '../../components/common/DashHeader';

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

  // Trạng thái và cấu hình biểu đồ 2 trục (Trục hoành X, Trục tung Y)
  const [chartMode, setChartMode] = useState<'both' | 'bar' | 'line'>('both');
  const [hoveredMetricIdx, setHoveredMetricIdx] = useState<number | null>(null);

  // Danh sách 6 chỉ số biểu diễn trên trục X
  const chartMetrics = [
    { key: 'online', label: 'Đang online', subLabel: 'Trực tuyến', value: visitStats.online, color: '#10b981', gradientId: 'grad-online' },
    { key: 'today', label: 'Trong ngày', subLabel: 'Hôm nay', value: visitStats.today, color: '#3b82f6', gradientId: 'grad-today' },
    { key: 'month', label: 'Trong tháng', subLabel: 'Tháng này', value: visitStats.month, color: '#8b5cf6', gradientId: 'grad-month' },
    { key: 'year', label: 'Trong năm', subLabel: 'Năm nay', value: visitStats.year, color: '#f59e0b', gradientId: 'grad-year' },
    { key: 'total', label: 'Tổng truy cập', subLabel: 'Hệ thống', value: visitStats.total, color: '#06b6d4', gradientId: 'grad-total' },
    { key: 'simu', label: 'Simu 3D', subLabel: 'Mô phỏng', value: visitStats.simu, color: '#ec4899', gradientId: 'grad-simu' },
  ];

  // Tính toán trục Y tự động làm tròn đẹp (Nice numbers)
  const rawMax = Math.max(...chartMetrics.map(m => m.value), 10);
  const getNiceMax = (val: number) => {
    const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
    const normalized = val / magnitude;
    let nice = 10;
    if (normalized <= 1) nice = 1;
    else if (normalized <= 2) nice = 2;
    else if (normalized <= 2.5) nice = 2.5;
    else if (normalized <= 5) nice = 5;
    else nice = 10;
    return Math.max(10, nice * magnitude);
  };
  const yAxisMax = getNiceMax(rawMax);

  // 5 mốc vạch kẻ trục tung Y (0%, 25%, 50%, 75%, 100%)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => Math.round(yAxisMax * ratio));

  // Tọa độ biểu đồ SVG (viewBox 0 0 860 360)
  const plotLeft = 75;
  const plotRight = 825;
  const plotWidth = plotRight - plotLeft; // 750
  const plotTop = 45;
  const plotBottom = 290;
  const plotHeight = plotBottom - plotTop; // 245

  const colWidth = plotWidth / chartMetrics.length;
  const barWidth = 46;

  const chartPoints = chartMetrics.map((m, idx) => {
    const cx = plotLeft + colWidth * (idx + 0.5);
    const cy = plotBottom - (m.value / yAxisMax) * plotHeight;
    return { x: cx, y: cy, ...m };
  });

  // Đường cong Spline mượt mà (Cubic Bezier)
  const getCurvePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const lineCurvePath = getCurvePath(chartPoints);
  const areaCurvePath = chartPoints.length > 0
    ? `${lineCurvePath} L ${chartPoints[chartPoints.length - 1].x} ${plotBottom} L ${chartPoints[0].x} ${plotBottom} Z`
    : '';

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

          {/* BIỂU ĐỒ 2 TRỤC (TRỤC HOÀNH X & TRỤC TUNG Y) THỐNG KÊ LƯỢT TRUY CẬP */}
          <div className="dash-chart-card">
            <div className="dash-chart-header">
              <div className="dash-chart-title-box">
                <div className="dash-chart-icon-badge">
                  <BarChart3 size={22} />
                </div>
                <div>
                  <h3 className="dash-chart-title">
                    Biểu Đồ Thống Kê Truy Cập Hệ Thống
                    <span className="live-pulse-dot" style={{ width: 8, height: 8 }} />
                  </h3>
                  <p className="dash-chart-subtitle">
                    Theo dõi trực quan phân bổ 6 chỉ số truy cập qua hệ trục tọa độ 2 chiều (Trục tung Y: Lượt truy cập - Trục hoành X: Phân loại chỉ số)
                  </p>
                </div>
              </div>

              <div className="dash-chart-actions">
                <button
                  type="button"
                  className={`chart-toggle-btn ${chartMode === 'both' ? 'active' : ''}`}
                  onClick={() => setChartMode('both')}
                  title="Hiển thị kết hợp cả cột và đường xu hướng"
                >
                  <Layers size={14} />
                  <span>Kết hợp</span>
                </button>
                <button
                  type="button"
                  className={`chart-toggle-btn ${chartMode === 'bar' ? 'active' : ''}`}
                  onClick={() => setChartMode('bar')}
                  title="Chỉ hiển thị biểu đồ cột"
                >
                  <BarChart3 size={14} />
                  <span>Dạng Cột</span>
                </button>
                <button
                  type="button"
                  className={`chart-toggle-btn ${chartMode === 'line' ? 'active' : ''}`}
                  onClick={() => setChartMode('line')}
                  title="Chỉ hiển thị biểu đồ đường cong spline"
                >
                  <LineChart size={14} />
                  <span>Đường cong</span>
                </button>
                <button
                  type="button"
                  className="dash-pill-btn"
                  onClick={fetchVisitStats}
                  title="Làm mới dữ liệu biểu đồ"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px' }}
                >
                  <RefreshCw size={13} />
                  <span>Cập nhật</span>
                </button>
              </div>
            </div>

            <div className="dash-chart-svg-wrap">
              <svg viewBox="0 0 860 360" className="dash-chart-svg" preserveAspectRatio="xMidYMid meet">
                <defs>
                  {/* Linear gradients cho từng cột */}
                  <linearGradient id="grad-online" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="grad-today" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="grad-month" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="grad-year" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="grad-simu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#be185d" stopOpacity="0.7" />
                  </linearGradient>

                  {/* Gradient cho vùng tô dưới đường spline */}
                  <linearGradient id="grad-spline-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Filter đổ bóng cột khi hover */}
                  <filter id="bar-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.2" />
                  </filter>
                </defs>

                {/* --- LƯỚI TỌA ĐỘ VÀ TRỤC TUNG Y --- */}
                {yTicks.map((val, idx) => {
                  const y = plotBottom - (idx / (yTicks.length - 1)) * plotHeight;
                  return (
                    <g key={`ytick-${idx}`}>
                      {/* Đường lưới ngang */}
                      <line
                        x1={plotLeft}
                        y1={y}
                        x2={plotRight}
                        y2={y}
                        className="chart-grid-line"
                      />
                      {/* Vạch kẻ trục Y */}
                      <line
                        x1={plotLeft - 5}
                        y1={y}
                        x2={plotLeft}
                        y2={y}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                      {/* Nhãn số liệu trục Y */}
                      <text
                        x={plotLeft - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="chart-axis-text"
                      >
                        {val >= 1000000
                          ? `${(val / 1000000).toFixed(1)}M`
                          : val >= 1000
                          ? `${(val / 1000).toFixed(1)}k`
                          : val.toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {/* Tiêu đề trục tung Y */}
                <text
                  x={plotLeft}
                  y={plotTop - 18}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="700"
                  fill="#64748b"
                >
                  (Lượt truy cập) ↑ Trục tung Y
                </text>

                {/* Trục tung Y chính */}
                <line
                  x1={plotLeft}
                  y1={plotTop - 6}
                  x2={plotLeft}
                  y2={plotBottom}
                  className="chart-axis-line"
                />

                {/* Trục hoành X chính */}
                <line
                  x1={plotLeft}
                  y1={plotBottom}
                  x2={plotRight}
                  y2={plotBottom}
                  className="chart-axis-line"
                />

                {/* Tiêu đề trục hoành X */}
                <text
                  x={plotRight}
                  y={plotBottom + 35}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="700"
                  fill="#64748b"
                >
                  Trục hoành X → (Chỉ số hệ thống)
                </text>

                {/* CỘT HOVER BACKGROUND GUIDES */}
                {chartPoints.map((_, idx) => {
                  const colX = plotLeft + idx * colWidth;
                  const isHovered = hoveredMetricIdx === idx;
                  return (
                    <rect
                      key={`col-hover-${idx}`}
                      x={colX}
                      y={plotTop}
                      width={colWidth}
                      height={plotHeight}
                      fill={isHovered ? 'rgba(59, 130, 246, 0.05)' : 'transparent'}
                      style={{ cursor: 'pointer', transition: 'fill 0.2s ease' }}
                      onMouseEnter={() => setHoveredMetricIdx(idx)}
                      onMouseLeave={() => setHoveredMetricIdx(null)}
                    />
                  );
                })}

                {/* VÙNG TÔ DIỆN TÍCH ĐƯỜNG CONG (SPLINE AREA) */}
                {(chartMode === 'line' || chartMode === 'both') && areaCurvePath && (
                  <path
                    d={areaCurvePath}
                    fill="url(#grad-spline-area)"
                    style={{ pointerEvents: 'none', transition: 'all 0.4s ease' }}
                  />
                )}

                {/* CÁC CỘT (BAR CHART) */}
                {(chartMode === 'bar' || chartMode === 'both') &&
                  chartPoints.map((pt, idx) => {
                    const barHeight = Math.max(4, (pt.value / yAxisMax) * plotHeight);
                    const barY = plotBottom - barHeight;
                    const barX = pt.x - barWidth / 2;
                    const isHovered = hoveredMetricIdx === idx;

                    return (
                      <g
                        key={`bar-${pt.key}`}
                        className={`chart-bar ${isHovered ? 'active' : ''}`}
                        onMouseEnter={() => setHoveredMetricIdx(idx)}
                        onMouseLeave={() => setHoveredMetricIdx(null)}
                      >
                        <rect
                          x={barX}
                          y={barY}
                          width={barWidth}
                          height={barHeight}
                          rx="6"
                          ry="6"
                          fill={`url(#${pt.gradientId})`}
                          opacity={hoveredMetricIdx !== null && !isHovered ? 0.45 : 1}
                          filter={isHovered ? 'url(#bar-shadow)' : undefined}
                        />
                        {/* Giá trị trên đỉnh cột */}
                        <text
                          x={pt.x}
                          y={barY - 8}
                          textAnchor="middle"
                          fontSize="11.5"
                          fontWeight="700"
                          fill={isHovered ? pt.color : '#475569'}
                          style={{ transition: 'all 0.2s ease', pointerEvents: 'none' }}
                        >
                          {pt.value.toLocaleString()}
                        </text>
                      </g>
                    );
                  })}

                {/* ĐƯỜNG CONG SPLINE (LINE CHART) */}
                {(chartMode === 'line' || chartMode === 'both') && lineCurvePath && (
                  <path
                    d={lineCurvePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={chartMode === 'line' ? 3.5 : 2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: 'none', transition: 'all 0.4s ease' }}
                  />
                )}

                {/* ĐIỂM DỮ LIỆU TRÊN ĐƯỜNG CONG (DATA POINTS) */}
                {(chartMode === 'line' || chartMode === 'both') &&
                  chartPoints.map((pt, idx) => {
                    const isHovered = hoveredMetricIdx === idx;
                    return (
                      <g
                        key={`pt-${pt.key}`}
                        onMouseEnter={() => setHoveredMetricIdx(idx)}
                        onMouseLeave={() => setHoveredMetricIdx(null)}
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 7 : 5}
                          fill="#ffffff"
                          stroke={pt.color}
                          strokeWidth={isHovered ? 3.5 : 2.5}
                          className={`chart-point ${isHovered ? 'active' : ''}`}
                        />
                        {chartMode === 'line' && (
                          <text
                            x={pt.x}
                            y={pt.y - 12}
                            textAnchor="middle"
                            fontSize="11.5"
                            fontWeight="700"
                            fill={isHovered ? pt.color : '#334155'}
                            style={{ pointerEvents: 'none' }}
                          >
                            {pt.value.toLocaleString()}
                          </text>
                        )}
                      </g>
                    );
                  })}

                {/* NHÃN VÀ VẠCH TRỤC HOÀNH X */}
                {chartPoints.map((pt, idx) => {
                  const isHovered = hoveredMetricIdx === idx;
                  return (
                    <g
                      key={`xlabel-${pt.key}`}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredMetricIdx(idx)}
                      onMouseLeave={() => setHoveredMetricIdx(null)}
                    >
                      {/* Vạch tick trục X */}
                      <line
                        x1={pt.x}
                        y1={plotBottom}
                        x2={pt.x}
                        y2={plotBottom + 6}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                      {/* Tên chỉ số chính */}
                      <text
                        x={pt.x}
                        y={plotBottom + 20}
                        textAnchor="middle"
                        className="chart-axis-label-x"
                        fill={isHovered ? pt.color : '#1e293b'}
                        fontWeight={isHovered ? '700' : '600'}
                      >
                        {pt.label}
                      </text>
                      {/* Nhãn phụ mô tả */}
                      <text
                        x={pt.x}
                        y={plotBottom + 34}
                        textAnchor="middle"
                        className="chart-axis-label-x-sub"
                      >
                        {pt.subLabel}
                      </text>
                    </g>
                  );
                })}

                {/* HOVER TOOLTIP FLOATING BOX */}
                {hoveredMetricIdx !== null && (
                  (() => {
                    const cur = chartPoints[hoveredMetricIdx];
                    const tooltipW = 150;
                    const tooltipH = 54;
                    let tooltipX = cur.x - tooltipW / 2;
                    if (tooltipX < plotLeft) tooltipX = plotLeft + 10;
                    if (tooltipX + tooltipW > plotRight) tooltipX = plotRight - tooltipW - 10;
                    const tooltipY = Math.max(plotTop + 5, cur.y - tooltipH - 18);

                    return (
                      <g style={{ pointerEvents: 'none', transition: 'all 0.15s ease' }}>
                        {/* Đường dóng dọc từ đỉnh xuống trục X */}
                        <line
                          x1={cur.x}
                          y1={plotTop}
                          x2={cur.x}
                          y2={plotBottom}
                          stroke={cur.color}
                          strokeWidth="1"
                          strokeDasharray="3 3"
                          opacity="0.6"
                        />
                        {/* Khung tooltip */}
                        <rect
                          x={tooltipX}
                          y={tooltipY}
                          width={tooltipW}
                          height={tooltipH}
                          rx="8"
                          fill="#0f172a"
                          opacity="0.94"
                          filter="url(#bar-shadow)"
                        />
                        {/* Text dòng 1: Tên chỉ số */}
                        <text
                          x={tooltipX + tooltipW / 2}
                          y={tooltipY + 20}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="11"
                          fontWeight="600"
                        >
                          {cur.label} ({cur.subLabel})
                        </text>
                        {/* Text dòng 2: Giá trị */}
                        <text
                          x={tooltipX + tooltipW / 2}
                          y={tooltipY + 41}
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="14"
                          fontWeight="700"
                        >
                          {cur.value.toLocaleString()} lượt
                        </text>
                      </g>
                    );
                  })()
                )}
              </svg>
            </div>

            {/* CHÚ THÍCH (FOOTER LEGEND) */}
            <div className="chart-footer-legend">
              <div className="legend-items-list">
                {chartMetrics.map((m, idx) => (
                  <div
                    key={`legend-${m.key}`}
                    className="legend-item"
                    onMouseEnter={() => setHoveredMetricIdx(idx)}
                    onMouseLeave={() => setHoveredMetricIdx(null)}
                    style={{
                      opacity: hoveredMetricIdx !== null && hoveredMetricIdx !== idx ? 0.45 : 1,
                      fontWeight: hoveredMetricIdx === idx ? 700 : 500
                    }}
                  >
                    <span className="legend-color-dot" style={{ background: m.color }} />
                    <span>{m.label}: <strong>{m.value.toLocaleString()}</strong></span>
                  </div>
                ))}
              </div>

              <div className="legend-hint">
                <Info size={13} />
                <span>Rê chuột vào cột hoặc điểm trên biểu đồ để xem chi tiết</span>
              </div>
            </div>
          </div>

          <div className="dash-accounts-card">
            <div className="dash-accounts-card-header">
              <div className="dash-accounts-card-title">
                <Users size={20} color="#2563eb" />
                <span>Danh Sách Tài Khoản Hệ Thống</span>
                <span className="dash-accounts-badge">{accounts.length} Tài khoản</span>
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
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                        {isLoadingAccounts ? 'Đang tải dữ liệu từ database 3ahome...' : 'Chưa có tài khoản nào trong bảng login.'}
                      </td>
                    </tr>
                  ) : (
                    accounts.map((acc, index) => (
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
