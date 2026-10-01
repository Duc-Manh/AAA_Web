import React from 'react';
import iconImg from '../../assets/images/icon.png';
import {
  LayoutDashboard,
  FolderKanban,
  Newspaper,
  Package,
  Users,
  Settings,
  Menu,
  Wallet,
  ClipboardList
} from 'lucide-react';

export interface DashAsideProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  triggerToast?: (msg: string) => void;
}

export const DashAside: React.FC<DashAsideProps> = ({
  activeTab,
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

        <button
          type="button"
          className={`dash-menu-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            if (setActiveTab) {
              setActiveTab('overview');
            }
            window.location.hash = '#dash';
          }}
        >
          <LayoutDashboard size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Tổng Quan</span>}
        </button>

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

export default DashAside;
