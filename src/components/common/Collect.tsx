import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CalendarDays, 
  CalendarRange, 
  TrendingUp, 
  Globe2 
} from 'lucide-react';
import { trackVisit, getCachedVisitStats, type VisitStats } from '../../services/visitService';

export const Collect: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [statsData, setStatsData] = useState<VisitStats>(getCachedVisitStats);

  useEffect(() => {
    // Thu thập lượt truy cập thực tế ngay khi tải trang
    const loadStats = async () => {
      const stats = await trackVisit();
      setStatsData(stats);
    };

    loadStats();

    // Heartbeat định kỳ mỗi 45 giây để duy trì trạng thái online và cập nhật thống kê mới
    const intervalId = window.setInterval(loadStats, 45000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  // Thống kê truy cập thực tế thu thập từ hệ thống và database 3ahome
  const stats = [
    {
      label: 'Đang online',
      value: statsData.online.toLocaleString('vi-VN'),
      icon: <Users size={16} className="collect-icon online-dot-icon" />,
      isOnline: true,
    },
    {
      label: 'Truy cập trong ngày',
      value: statsData.today.toLocaleString('vi-VN'),
      icon: <CalendarDays size={16} className="collect-icon" />,
    },
    {
      label: 'Truy cập trong tháng',
      value: statsData.month.toLocaleString('vi-VN'),
      icon: <CalendarRange size={16} className="collect-icon" />,
    },
    {
      label: 'Truy cập trong năm',
      value: statsData.year.toLocaleString('vi-VN'),
      icon: <TrendingUp size={16} className="collect-icon" />,
    },
    {
      label: 'Tổng truy cập',
      value: statsData.total.toLocaleString('vi-VN'),
      icon: <Globe2 size={16} className="collect-icon" />,
      isHighlight: true,
    },
  ];

  return (
    <aside 
      className={`collect-widget ${isOpen ? 'is-open' : ''}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      aria-label="Thống kê lượng truy cập"
    >
      {/* Khung con bên trái: Hiển thị thông tin thống kê */}
      <div className="collect-left-panel">
        <div className="collect-header">
          <span className="collect-header-title">Thống kê truy cập</span>
        </div>

        <div className="collect-stats-list">
          {stats.map((item, idx) => (
            <div 
              key={idx} 
              className={`collect-stat-row ${item.isHighlight ? 'highlight-row' : ''}`}
            >
              <div className="collect-row-left">
                {item.icon}
                <span className="collect-label">{item.label}</span>
              </div>
              <span className={`collect-value ${item.isOnline ? 'online-pulse' : ''}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Khung con bên phải: Nút tam giác mũi nhọn qua phải */}
      <button
        type="button"
        className="collect-right-tab"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Mở bảng thống kê truy cập"
        title="Thống kê truy cập"
      >
        <span className={`collect-triangle-icon ${isOpen ? 'expanded' : ''}`} aria-hidden="true" />
      </button>
    </aside>
  );
};

export default Collect;
