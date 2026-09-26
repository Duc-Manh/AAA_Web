import React, { useState } from 'react';
import { 
  Users, 
  CalendarDays, 
  CalendarRange, 
  TrendingUp, 
  Globe2 
} from 'lucide-react';

export const Collect: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Thống kê truy cập trực quan
  const stats = [
    {
      label: 'Đang online',
      value: '16',
      icon: <Users size={16} className="collect-icon online-dot-icon" />,
      isOnline: true,
    },
    {
      label: 'Truy cập trong ngày',
      value: '284',
      icon: <CalendarDays size={16} className="collect-icon" />,
    },
    {
      label: 'Truy cập trong tháng',
      value: '5.120',
      icon: <CalendarRange size={16} className="collect-icon" />,
    },
    {
      label: 'Truy cập trong năm',
      value: '58.390',
      icon: <TrendingUp size={16} className="collect-icon" />,
    },
    {
      label: 'Tổng truy cập',
      value: '162.850',
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
