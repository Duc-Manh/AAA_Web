import React, { useState, useEffect } from 'react';
import '../dash/Dash.css';
import { EmpAside } from '../../components/common/EmpAside';
import { EmpHeader } from '../../components/common/EmpHeader';
import { Clock } from 'lucide-react';

interface CurrentUserData {
  id?: number;
  full_name?: string;
  gmail?: string;
  username?: string;
}

export const EmployEquip: React.FC = () => {
  const [activeTab] = useState('devices');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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

  const currentFullName = currentUser?.full_name || currentUser?.username || 'Nhân Viên 3A';

  return (
    <div className="dash-layout">
      {/* 1. SIDEBAR ĐIỀU HƯỚNG */}
      <EmpAside
        activeTab={activeTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        triggerToast={() => {}}
      />

      {/* 2. KHU VỰC NỘI DUNG CHÍNH */}
      <div className="dash-main">
        {/* TOP NAVBAR */}
        <EmpHeader
          title="Quản Lý Thiết Bị & Kho Hàng"
          subtitle="Quản lý danh mục thiết bị tự động hoá, cảm biến IoT và kho hàng 3AHOME"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
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
              Chức năng này sẽ phát triển sau
            </h3>
            <p style={{ fontSize: '0.93rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Tính năng đang được đội ngũ kỹ thuật 3AHOME hoàn thiện và sẽ sớm ra mắt trong các phiên bản cập nhật tiếp theo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployEquip;
