import React, { useState, useEffect } from 'react';
import '../dash/Dash.css';
import { EmpAside } from '../../components/common/EmpAside';
import { EmpHeader } from '../../components/common/EmpHeader';
import { CheckCircle2 } from 'lucide-react';

interface DeviceItem {
  id: string;
  name: string;
  room: string;
  category: 'light' | 'climate' | 'appliance' | 'security';
  status: boolean;
  power: string;
  lastActive: string;
}

export const Employ: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);

  // Danh sách thiết bị IoT thực tế
  const [devices] = useState<DeviceItem[]>([
    {
      id: 'dev-1',
      name: 'Đèn Chùm Thông Minh Smart Light',
      room: 'Phòng Khách',
      category: 'light',
      status: true,
      power: '45W',
      lastActive: 'Đang hoạt động'
    },
    {
      id: 'dev-2',
      name: 'Điều Hoà Inverter Dual Cool',
      room: 'Phòng Ngủ Master',
      category: 'climate',
      status: true,
      power: '850W - 24°C',
      lastActive: 'Đang hoạt động'
    },
    {
      id: 'dev-3',
      name: 'Rèm Cửa Tự Động Motorized',
      room: 'Phòng Khách',
      category: 'appliance',
      status: false,
      power: '0W (Đóng 100%)',
      lastActive: 'Đã đóng 2h trước'
    },
    {
      id: 'dev-4',
      name: 'Bình Nóng Lạnh Thông Minh',
      room: 'Phòng Tắm',
      category: 'appliance',
      status: true,
      power: '1500W - 55°C',
      lastActive: 'Đang đun nước'
    },
    {
      id: 'dev-5',
      name: 'Robot Hút Bụi Lau Nhà AI',
      room: 'Toàn Căn Hộ',
      category: 'appliance',
      status: false,
      power: 'Đang sạc (92%)',
      lastActive: 'Hoàn tất lúc 09:30'
    },
    {
      id: 'dev-6',
      name: 'Khoá Cửa Vân Tay FaceID DoorLock',
      room: 'Cửa Chính',
      category: 'security',
      status: true,
      power: 'Pin 88%',
      lastActive: 'Đã khoá an toàn'
    },
    {
      id: 'dev-7',
      name: 'Cảm Biến Khói & Khí Gas Zigbee',
      room: 'Nhà Bếp',
      category: 'security',
      status: true,
      power: 'Bình thường',
      lastActive: 'Kiểm tra 5 phút trước'
    },
    {
      id: 'dev-8',
      name: 'Hệ Thống Âm Thanh Đa Vùng',
      room: 'Phòng Khách',
      category: 'appliance',
      status: false,
      power: 'Chế độ chờ',
      lastActive: 'Tắt lúc 22:00'
    }
  ]);

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
    window.location.hash = '';
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const activeDeviceCount = devices.filter((d) => d.status).length;

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
      <EmpAside
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        devices={devices}
        activeDeviceCount={activeDeviceCount}
      />

      {/* 2. KHU VỰC NỘI DUNG CHÍNH */}
      <div className="dash-main">
        {/* TOP NAVBAR */}
        <EmpHeader
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          triggerToast={triggerToast}
          currentUser={currentUser}
          handleLogout={handleLogout}
        />

        {/* NỘI DUNG TRANG DASHBOARD */}
        <div className="dash-content">
        </div>
      </div>
    </div>
  );
};

export const Dash = Employ;
export default Employ;
