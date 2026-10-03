import React from 'react';
import { Menu, RefreshCw, HelpCircle, LogOut } from 'lucide-react';

export interface EmpHeaderProps {
  title?: string;
  subtitle?: string;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  currentUser?: { username?: string; full_name?: string } | null;
  currentFullName?: string;
  onRefresh?: () => void;
  refreshTitle?: string;
  notificationTitle?: string;
  onNotification?: () => void;
  triggerToast?: (msg: string) => void;
  handleLogout?: () => void;
}

export const EmpHeader: React.FC<EmpHeaderProps> = ({
  title = 'Giao diện nhân viên công ty',
  subtitle = 'Hệ thống quản lý công việc và thông tin chuyên môn 3A',
  isMobileOpen,
  setIsMobileOpen,
  currentUser,
  currentFullName,
  onRefresh,
  refreshTitle = 'Làm mới dữ liệu',
  notificationTitle = 'Thông báo hệ thống (2 cảnh báo)',
  onNotification,
  triggerToast = () => {},
  handleLogout
}) => {
  const displayName =
    currentFullName ||
    currentUser?.full_name ||
    currentUser?.username ||
    'Nhân Viên 3A';

  const onLogoutClick = () => {
    localStorage.removeItem('aaa_admin_auth');
    sessionStorage.removeItem('aaa_admin_auth');

    if (handleLogout) {
      try {
        handleLogout();
      } catch {
        // ignore
      }
    }

    window.location.hash = '#home';
    window.history.pushState(null, '', '/#home');
    window.dispatchEvent(new Event('popstate'));
    window.dispatchEvent(new Event('hashchange'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
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
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="dash-navbar-right">
        <button
          type="button"
          className="dash-nav-action-btn"
          title={refreshTitle}
          onClick={
            onRefresh ||
            (() => triggerToast('Đã làm mới dữ liệu cảm biến & thiết bị!'))
          }
        >
          <RefreshCw size={17} />
        </button>

        <button
          type="button"
          className="dash-navbar-guide-btn"
          title={notificationTitle || 'Hướng dẫn sử dụng'}
          onClick={
            onNotification ||
            (() => triggerToast('Tài liệu hướng dẫn sử dụng đang được cập nhật!'))
          }
        >
          <HelpCircle size={15} />
          <span>Hướng dẫn</span>
        </button>

        {/* Khung hiển thị thông tin đăng nhập và nút Logout */}
        <div className="dash-user-nav-wrapper">
          <div className="dash-user-profile-badge">
            <div className="dash-user-avatar-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="dash-user-nav-info">
              <span className="dash-user-nav-name">{displayName}</span>
              <span className="dash-user-nav-role" style={{ color: '#10b981' }}>Nhân Viên</span>
            </div>
          </div>

          <button
            type="button"
            className="dash-navbar-logout-btn"
            onClick={onLogoutClick}
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut size={15} />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default EmpHeader;
