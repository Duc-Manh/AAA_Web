import React from 'react';
import iconImg from '../../assets/images/icon.png';
import {
  LayoutDashboard,
  FolderKanban,
  Newspaper,
  Package,
  Users,
  Wallet,
  ClipboardList,
  Settings,
  Menu
} from 'lucide-react';

export interface EmpAsideProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  triggerToast?: (msg: string) => void;
}

export const EmpAside: React.FC<EmpAsideProps> = ({
  activeTab = 'overview',
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  triggerToast
}) => {
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

        {/* 1. Tổng Quan */}
        <button
          type="button"
          className={`dash-menu-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            if (setActiveTab) {
              setActiveTab('overview');
            }
            window.location.hash = '#employ';
          }}
        >
          <LayoutDashboard size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Tổng Quan</span>}
        </button>

        {/* 2. Dự án triển khai */}
        <button
          type="button"
          className={`dash-menu-item ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            window.location.hash = '#dash-project';
          }}
        >
          <FolderKanban size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Dự án triển khai</span>}
        </button>

        {/* 3. Tin tức truyền thông */}
        <button
          type="button"
          className={`dash-menu-item ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            window.location.hash = '#dash-new';
          }}
        >
          <Newspaper size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Tin tức truyền thông</span>}
        </button>

        {/* 4. Vật tư thiết bị */}
        <button
          type="button"
          className={`dash-menu-item ${activeTab === 'supplies' ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            window.location.hash = '#dash-equip';
          }}
        >
          <Package size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Vật tư thiết bị</span>}
        </button>

        {/* 5. Khách hàng */}
        <button
          type="button"
          className={`dash-menu-item ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            window.location.hash = '#dash-custo';
          }}
        >
          <Users size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Khách hàng</span>}
        </button>

        {/* 6. Tài chính kế toán */}
        <button
          type="button"
          className={`dash-menu-item ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            window.location.hash = '#dash-finan';
          }}
        >
          <Wallet size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Tài chính kế toán</span>}
        </button>

        {/* 7. Quản lý công việc */}
        <button
          type="button"
          className={`dash-menu-item ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            window.location.hash = '#dash-job';
          }}
        >
          <ClipboardList size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Quản lý công việc</span>}
        </button>

        <div className="dash-menu-group-label" style={{ marginTop: '12px' }}>
          {!isCollapsed ? 'Cấu Hình' : '•••'}
        </div>

        {/* 8. Cài Đặt Hệ Thống */}
        <button
          type="button"
          className={`dash-menu-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            if (setActiveTab) {
              setActiveTab('settings');
            } else {
              triggerToast?.('Tính năng Cài đặt hệ thống đang được cập nhật!');
            }
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
