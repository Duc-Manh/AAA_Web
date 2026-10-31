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
  Activity,
  History,
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
  // Kiểm tra mục nào đang active dựa trên prop activeTab hoặc URL hash
  const currentHash = typeof window !== 'undefined' ? (window.location.hash || window.location.pathname) : '';
  const isTabActive = (tabKey: string, patterns: string[]) => {
    if (activeTab === tabKey) return true;
    return patterns.some(p => currentHash === p || (p !== '#employ' && p !== '/employ' && currentHash.startsWith(p)));
  };

  return (
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

        {/* 1. Tổng Quan */}
        <button
          type="button"
          className={`dash-menu-item ${isTabActive('overview', ['#employ', '/employ']) && !currentHash.includes('-') ? 'active' : ''}`}
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

        {/* 2. Dự án triển khai -> EmployProj.tsx (#employ-proj) */}
        <button
          type="button"
          className={`dash-menu-item ${isTabActive('projects', ['#employ-proj', '/employ-proj']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            if (setActiveTab) {
              setActiveTab('projects');
            }
            window.location.hash = '#employ-proj';
          }}
        >
          <FolderKanban size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Dự án đăng bài</span>}
        </button>

        {/* 3. Tin tức truyền thông -> EmployNews.tsx (#employ-news) */}
        <button
          type="button"
          className={`dash-menu-item ${isTabActive('news', ['#employ-news', '/employ-news']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            if (setActiveTab) {
              setActiveTab('news');
            }
            window.location.hash = '#employ-news';
          }}
        >
          <Newspaper size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Tin tức truyền thông</span>}
        </button>

        {/* 4. Vật tư thiết bị -> EmployEquip.tsx (#employ-equip) */}
        <button
          type="button"
          className={`dash-menu-item ${isTabActive('supplies', ['#employ-equip', '/employ-equip']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            if (setActiveTab) {
              setActiveTab('supplies');
            }
            window.location.hash = '#employ-equip';
          }}
        >
          <Package size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Vật tư tồn kho</span>}
        </button>

        {/* 5. Khách hàng -> EmployCusto.tsx (#employ-custo) */}
        <button
          type="button"
          className={`dash-menu-item ${isTabActive('customers', ['#employ-custo', '/employ-custo']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            if (setActiveTab) {
              setActiveTab('customers');
            }
            window.location.hash = '#employ-custo';
          }}
        >
          <Users size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Quản lý khách hàng</span>}
        </button>
        {/* 8. Quản lý vận hành -> EmployOperate.tsx (#employ-operate) */}
        <button
          type="button"
          className={`dash-menu-item ${isTabActive('operate', ['#employ-operate', '/employ-operate']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            if (setActiveTab) {
              setActiveTab('operate');
            }
            window.location.hash = '#employ-operate';
          }}
        >
          <Activity size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Quản lý vận hành</span>}
        </button>

        {/* 9. Lịch sử viễn trắc -> EmployHistory.tsx (#employ-history) */}
        <button
          type="button"
          className={`dash-menu-item ${isTabActive('history', ['#employ-history', '/employ-history']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            if (setActiveTab) {
              setActiveTab('history');
            }
            window.location.hash = '#employ-history';
          }}
        >
          <History size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Lịch sử vận hành</span>}
        </button>
        {/* 6. Tài chính kế toán -> EmployFinan.tsx (#employ-finan) */}
        <button
          type="button"
          className={`dash-menu-item ${isTabActive('finance', ['#employ-finan', '/employ-finan']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            if (setActiveTab) {
              setActiveTab('finance');
            }
            window.location.hash = '#employ-finan';
          }}
        >
          <Wallet size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Tài chính kế toán</span>}
        </button>

        {/* 7. Quản lý công việc -> EmployJob.tsx (#employ-job) */}
        <button
          type="button"
          className={`dash-menu-item ${isTabActive('tasks', ['#employ-job', '/employ-job']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            if (setActiveTab) {
              setActiveTab('tasks');
            }
            window.location.hash = '#employ-job';
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
