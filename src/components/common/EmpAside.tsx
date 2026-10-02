import React from 'react';
import iconImg from '../../assets/images/icon.png';
import {
  Menu,
  LayoutDashboard,
  Cpu,
  Building2,
  Zap,
  Video,
  Users,
  Settings
} from 'lucide-react';

export interface EmpAsideProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  devices?: any[];
  activeDeviceCount?: number;
}

export const EmpAside: React.FC<EmpAsideProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  devices = [],
  activeDeviceCount = 0
}) => {
  const totalCount = devices.length;

  return (
    <aside
      className={`dash-sidebar ${isCollapsed ? 'collapsed' : ''} ${
        isMobileOpen ? 'mobile-open' : ''
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
            <span className="dash-menu-badge">{activeDeviceCount}/{totalCount}</span>
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
  );
};

export default EmpAside;
