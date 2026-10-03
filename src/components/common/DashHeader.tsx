import React, { useState, useRef, useEffect } from 'react';
import { Menu, HelpCircle, LogOut } from 'lucide-react';
import { DashGuide } from './DashGuide';

export interface DashHeaderProps {
  title: string;
  subtitle: string;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  currentFullName: string;
  onRefresh?: () => void;
  refreshTitle?: string;
  guideTitle?: string;
  onGuide?: () => void;
  notificationTitle?: string;
  onNotification?: () => void;
  triggerToast: (msg: string) => void;
  handleLogout?: () => void;
}

export const DashHeader: React.FC<DashHeaderProps> = ({
  title,
  subtitle,
  isMobileOpen,
  setIsMobileOpen,
  currentFullName,
  guideTitle = 'Hướng dẫn',
  onGuide,
  notificationTitle,
  onNotification,
  triggerToast: _triggerToast,
  handleLogout
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const guideContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        guideContainerRef.current &&
        !guideContainerRef.current.contains(event.target as Node)
      ) {
        setIsGuideOpen(false);
      }
    };
    if (isGuideOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isGuideOpen]);

  const onLogoutClick = () => {
    // 1. Xoá phiên đăng nhập quản trị
    localStorage.removeItem('aaa_admin_auth');
    sessionStorage.removeItem('aaa_admin_auth');

    // 2. Kích hoạt callback handleLogout nếu có
    if (handleLogout) {
      try {
        handleLogout();
      } catch {
        // ignore
      }
    }

    // 3. Đăng xuất và điều hướng trực tiếp ra giao diện trang chủ Home.tsx
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
        <div className="dash-navbar-guide-wrap" ref={guideContainerRef}>
          <button
            type="button"
            className="dash-navbar-guide-btn"
            title={guideTitle || notificationTitle || 'Hướng dẫn sử dụng'}
            onClick={() => {
              setIsGuideOpen(prev => !prev);
              if (onGuide) onGuide();
              else if (onNotification) onNotification();
            }}
          >
            <HelpCircle size={17} />
            <span>Hướng dẫn</span>
          </button>

          <DashGuide
            isOpen={isGuideOpen}
            onClose={() => setIsGuideOpen(false)}
          />
        </div>

        {/* Khung hiển thị thông tin đăng nhập và nút Logout */}
        <div className="dash-user-nav-wrapper">
          <div className="dash-user-profile-badge">
            <div className="dash-user-avatar-sm">
              {(currentFullName || '3A').slice(0, 2).toUpperCase()}
            </div>
            <div className="dash-user-nav-info">
              <span className="dash-user-nav-name">{currentFullName}</span>
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

export default DashHeader;
