import React from 'react';
import { Menu, RefreshCw, Bell, LogOut } from 'lucide-react';

export interface EmpHeaderProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  triggerToast: (msg: string) => void;
  currentUser?: { username?: string; full_name?: string } | null;
  handleLogout: () => void;
  title?: string;
  subtitle?: string;
}

export const EmpHeader: React.FC<EmpHeaderProps> = ({
  isMobileOpen,
  setIsMobileOpen,
  triggerToast,
  currentUser,
  handleLogout,
  title = 'Giao diện nhân viên công ty',
  subtitle = 'Hệ thống quản lý công việc được giao'
}) => {
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
  );
};

export default EmpHeader;
