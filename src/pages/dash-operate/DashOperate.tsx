import React, { useState, useEffect } from 'react';
import '../dash/Dash.css';
import { CheckCircle2, Clock } from 'lucide-react';
import { DashAside } from '../../components/common/DashAside';
import { DashHeader } from '../../components/common/DashHeader';
import { DashPopup } from '../../components/common/DashPopup';

interface CurrentUserData {
  id?: number;
  full_name?: string;
  gmail?: string;
  username?: string;
}

export const DashOperate: React.FC = () => {
  const [activeTab] = useState('operate');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);

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
    }, 3000);
  };

  const currentFullName = currentUser?.full_name || currentUser?.username || 'Quản Trị Viên 3A';

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
          title="Quản Lý Vận Hành Thiết Bị Các Dự Án"
          subtitle="Quản lý vận hành, bảo trì và tối ưu hóa hiệu suất thiết bị tại các công trình 3AHOME"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
          refreshTitle="Làm mới danh sách vận hành"
          onRefresh={() => triggerToast('Đã cập nhật danh sách vận hành!')}
          triggerToast={triggerToast}
          handleLogout={handleLogout}
        />

        {/* NỘI DUNG THÔNG BÁO PHÁT TRIỂN SAU */}
        <div
          className="dash-content"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 120px)',
            padding: '24px'
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '44px 32px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                color: '#1D58BB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '6px'
              }}
            >
              <Clock size={38} strokeWidth={2.2} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Chức năng Quản lý vận hành sẽ phát triển sau
            </h3>
            <p style={{ fontSize: '0.93rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Tính năng đang được đội ngũ kỹ thuật 3AHOME hoàn thiện và sẽ sớm ra mắt trong các phiên bản cập nhật tiếp theo.
            </p>
          </div>
        </div>
      </div>

      {/* Thông báo yêu cầu trình duyệt từ nhân viên */}
      <DashPopup />
    </div>
  );
};

export default DashOperate;
