import React, { useState, useRef, useEffect } from 'react';
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
  ClipboardList,
  Activity,
  History,
  Wrench,
  X
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
  setIsMobileOpen
}) => {
  // Kiểm tra mục nào đang active dựa trên prop activeTab hoặc URL hash
  const currentHash = typeof window !== 'undefined' ? (window.location.hash || window.location.pathname) : '';
  const isTabActive = (tabKey: string, patterns: string[]) => {
    if (activeTab === tabKey) return true;
    return patterns.some(p => currentHash === p || (p !== '#dash' && p !== '/dash' && currentHash.startsWith(p)));
  };

  // Trạng thái bảng thông báo bên cạnh cho Cài Đặt Hệ Thống
  const settingsBtnRef = useRef<HTMLButtonElement | null>(null);
  const noticeBoxRef = useRef<HTMLDivElement | null>(null);
  const [showSettingsNotice, setShowSettingsNotice] = useState(false);
  const [noticePos, setNoticePos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!showSettingsNotice) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        noticeBoxRef.current &&
        !noticeBoxRef.current.contains(e.target as Node) &&
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(e.target as Node)
      ) {
        setShowSettingsNotice(false);
      }
    };
    const handleClose = () => setShowSettingsNotice(false);
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [showSettingsNotice]);

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

        <button
          type="button"
          className={`dash-menu-item ${isTabActive('overview', ['#dash', '/dash']) && !currentHash.includes('-') ? 'active' : ''}`}
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
          className={`dash-menu-item ${isTabActive('projects', ['#dash-project', '/dash-project']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            window.location.hash = '#dash-project';
          }}
        >
          <FolderKanban size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Dự án đăng bài</span>}
        </button>

        <button
          type="button"
          className={`dash-menu-item ${isTabActive('news', ['#dash-new', '/dash-new']) ? 'active' : ''}`}
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
          className={`dash-menu-item ${isTabActive('supplies', ['#dash-equip', '/dash-equip']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            window.location.hash = '#dash-equip';
          }}
        >
          <Package size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Vật tư tồn kho</span>}
        </button>

        <button
          type="button"
          className={`dash-menu-item ${isTabActive('customers', ['#dash-custo', '/dash-custo']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            window.location.hash = '#dash-custo';
          }}
        >
          <Users size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Quản lý khách hàng</span>}
        </button>
        <button
          type="button"
          className={`dash-menu-item ${isTabActive('operate', ['#dash-operate', '/dash-operate']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            window.location.hash = '#dash-operate';
          }}
        >
          <Activity size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Quản lý vận hành</span>}
        </button>
        <button
          type="button"
          className={`dash-menu-item ${isTabActive('history', ['#dash-history', '/dash-history']) ? 'active' : ''}`}
          onClick={() => {
            setIsMobileOpen(false);
            window.location.hash = '#dash-history';
          }}
        >
          <History size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Lịch sử vận hành</span>}
        </button>
        <button
          type="button"
          className={`dash-menu-item ${isTabActive('finance', ['#dash-finan', '/dash-finan']) ? 'active' : ''}`}
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
          className={`dash-menu-item ${isTabActive('tasks', ['#dash-job', '/dash-job']) ? 'active' : ''}`}
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
          ref={settingsBtnRef}
          type="button"
          className={`dash-menu-item ${activeTab === 'settings' || showSettingsNotice ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileOpen(false);
            if (settingsBtnRef.current) {
              const rect = settingsBtnRef.current.getBoundingClientRect();
              setNoticePos({
                top: Math.max(10, rect.top - 8),
                left: rect.right + 12
              });
            }
            setShowSettingsNotice((prev) => !prev);
          }}
        >
          <Settings size={19} className="dash-menu-icon" />
          {!isCollapsed && <span>Cài Đặt Hệ Thống</span>}
        </button>
      </nav>

      {/* Bảng thông báo bên cạnh nút Cài Đặt Hệ Thống */}
      {showSettingsNotice && (
        <div
          ref={noticeBoxRef}
          style={{
            position: 'fixed',
            top: `${noticePos.top}px`,
            left: `${noticePos.left}px`,
            zIndex: 99999,
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.16), 0 8px 12px -6px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0',
            minWidth: '250px',
            maxWidth: '300px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Mũi tên trỏ sang bên trái */}
          <div
            style={{
              position: 'absolute',
              left: '-6px',
              top: '18px',
              width: '12px',
              height: '12px',
              transform: 'rotate(45deg)',
              backgroundColor: '#ffffff',
              borderLeft: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: '#eff6ff',
                  color: '#1D58BB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Wrench size={15} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>
                Cài Đặt Hệ Thống
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowSettingsNotice(false)}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ marginTop: '9px', fontSize: '0.83rem', color: '#475569', lineHeight: 1.5, fontWeight: 500 }}>
            Chức năng này đang hoàn thiện
          </div>
        </div>
      )}
    </aside>
  );
};

export default DashAside;
