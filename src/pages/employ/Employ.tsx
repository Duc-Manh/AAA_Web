import React, { useState, useEffect } from 'react';
import '../dash/Dash.css';
import iconImg from '../../assets/images/icon.png';
import {
  LayoutDashboard,
  Building2,
  Cpu,
  Zap,
  Video,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

interface DeviceItem {
  id: string;
  name: string;
  room: string;
  category: 'light' | 'climate' | 'appliance' | 'security';
  status: boolean;
  power: string;
  lastActive: string;
}

export const Employ: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);

  // Danh sách thiết bị IoT thực tế
  const [devices] = useState<DeviceItem[]>([
    {
      id: 'dev-1',
      name: 'Đèn Chùm Thông Minh Smart Light',
      room: 'Phòng Khách',
      category: 'light',
      status: true,
      power: '45W',
      lastActive: 'Đang hoạt động'
    },
    {
      id: 'dev-2',
      name: 'Điều Hoà Inverter Dual Cool',
      room: 'Phòng Ngủ Master',
      category: 'climate',
      status: true,
      power: '850W - 24°C',
      lastActive: 'Đang hoạt động'
    },
    {
      id: 'dev-3',
      name: 'Rèm Cửa Tự Động Motorized',
      room: 'Phòng Khách',
      category: 'appliance',
      status: false,
      power: '0W (Đóng 100%)',
      lastActive: 'Đã đóng 2h trước'
    },
    {
      id: 'dev-4',
      name: 'Bình Nóng Lạnh Thông Minh',
      room: 'Phòng Tắm',
      category: 'appliance',
      status: true,
      power: '1500W - 55°C',
      lastActive: 'Đang đun nước'
    },
    {
      id: 'dev-5',
      name: 'Robot Hút Bụi Lau Nhà AI',
      room: 'Toàn Căn Hộ',
      category: 'appliance',
      status: false,
      power: 'Đang sạc (92%)',
      lastActive: 'Hoàn tất lúc 09:30'
    },
    {
      id: 'dev-6',
      name: 'Khoá Cửa Vân Tay FaceID DoorLock',
      room: 'Cửa Chính',
      category: 'security',
      status: true,
      power: 'Pin 88%',
      lastActive: 'Đã khoá an toàn'
    },
    {
      id: 'dev-7',
      name: 'Cảm Biến Khói & Khí Gas Zigbee',
      room: 'Nhà Bếp',
      category: 'security',
      status: true,
      power: 'Bình thường',
      lastActive: 'Kiểm tra 5 phút trước'
    },
    {
      id: 'dev-8',
      name: 'Hệ Thống Âm Thanh Đa Vùng',
      room: 'Phòng Khách',
      category: 'appliance',
      status: false,
      power: 'Chế độ chờ',
      lastActive: 'Tắt lúc 22:00'
    }
  ]);

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
    window.location.hash = '';
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const activeDeviceCount = devices.filter((d) => d.status).length;

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
      <aside
        className={`dash-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''
          }`}
      >
        <div className="dash-sidebar-header">
          <div className="dash-header-icon-box">
            <img src={iconImg} alt="3A Icon" className="dash-sidebar-icon" />
          </div>
          <button
            type="button"
            className="dash-sidebar-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="dash-sidebar-menu">
          <div className="dash-menu-group-label">{!isCollapsed ? 'Danh mục' : '•••'}</div>

          <button
            type="button"
            className={`dash-menu-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('overview');
              setIsMobileOpen(false);
            }}
          >
            <LayoutDashboard size={19} className="dash-menu-icon" />
            {!isCollapsed && <span>Tổng Quan</span>}
          </button>

          <button
            type="button"
            className={`dash-menu-item ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('devices');
              setIsMobileOpen(false);
            }}
          >
            <Cpu size={19} className="dash-menu-icon" />
            {!isCollapsed && <span>Thiết Bị IoT</span>}
            {!isCollapsed && (
              <span className="dash-menu-badge">{activeDeviceCount}/{devices.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`dash-menu-item ${activeTab === 'apartments' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('apartments');
              setIsMobileOpen(false);
            }}
          >
            <Building2 size={19} className="dash-menu-icon" />
            {!isCollapsed && <span>Căn Hộ & Toà Nhà</span>}
          </button>

          <button
            type="button"
            className={`dash-menu-item ${activeTab === 'energy' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('energy');
              setIsMobileOpen(false);
            }}
          >
            <Zap size={19} className="dash-menu-icon" />
            {!isCollapsed && <span>Điện Năng Tiêu Thụ</span>}
          </button>

          <button
            type="button"
            className={`dash-menu-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('security');
              setIsMobileOpen(false);
            }}
          >
            <Video size={19} className="dash-menu-icon" />
            {!isCollapsed && <span>Camera An Ninh</span>}
          </button>

          <button
            type="button"
            className={`dash-menu-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('users');
              setIsMobileOpen(false);
            }}
          >
            <Users size={19} className="dash-menu-icon" />
            {!isCollapsed && <span>Cư Dân & Người Dùng</span>}
          </button>

          <div className="dash-menu-group-label" style={{ marginTop: '12px' }}>
            {!isCollapsed ? 'Cấu Hình' : '•••'}
          </div>

          <button
            type="button"
            className={`dash-menu-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings');
              setIsMobileOpen(false);
            }}
          >
            <Settings size={19} className="dash-menu-icon" />
            {!isCollapsed && <span>Cài Đặt Hệ Thống</span>}
          </button>
        </nav>
      </aside>

      {/* 2. KHU VỰC NỘI DUNG CHÍNH */}
      <div className="dash-main">
        {/* TOP NAVBAR */}
        <header className="dash-navbar">
          <div className="dash-navbar-left">
            <button
              type="button"
              className="dash-mobile-menu-btn"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              <Menu size={20} />
            </button>

            <div className="dash-page-title-wrap">
              <h1>Giao diện quản trị công ty</h1>
              <p>Giám sát thời gian thực, tự động hoá thiết bị và phân tích chỉ số toà nhà thông minh 3A</p>
            </div>
          </div>

          <div className="dash-navbar-right">
            <button
              type="button"
              className="dash-nav-action-btn"
              title="Làm mới trạng thái kết nối"
              onClick={() => triggerToast('Đã làm mới dữ liệu cảm biến & thiết bị!')}
            >
              <RefreshCw size={17} />
            </button>

            <button
              type="button"
              className="dash-nav-action-btn"
              title="Thông báo hệ thống (2 cảnh báo)"
              onClick={() => triggerToast('Không có sự cố khẩn cấp nào!')}
            >
              <Bell size={17} />
              <span className="dash-nav-badge" />
            </button>

            {/* Khung hiển thị thông tin đăng nhập và nút Logout */}
            <div className="dash-user-nav-wrapper">
              <div className="dash-user-profile-badge">
                <div className="dash-user-avatar-sm">
                  {(currentUser?.username || '3A').slice(0, 2).toUpperCase()}
                </div>
                <div className="dash-user-nav-info">
                  <span className="dash-user-nav-name">
                    {currentUser?.username || 'Quản Trị Viên 3A'}
                  </span>
                  <span className="dash-user-nav-role">Super Admin</span>
                </div>
              </div>

              <button
                type="button"
                className="dash-navbar-logout-btn"
                onClick={handleLogout}
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut size={15} />
                <span>Đăng Xuất</span>
              </button>
            </div>
          </div>
        </header>

        {/* NỘI DUNG TRANG DASHBOARD */}
        <div className="dash-content">
        </div>
      </div>
    </div>
  );
};

export const Dash = Employ;
export default Employ;
