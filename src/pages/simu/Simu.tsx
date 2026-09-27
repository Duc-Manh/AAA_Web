import React, { useState, useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { Collect } from '../../components/common/Collect';
import { Entertain } from '../../components/common/Entertain';
import { User, Clock, History } from 'lucide-react';
import type { SimuRecord } from '../../services/simuDb';
import { Building3D } from './Building3D';

export const Simu: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<SimuRecord | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = localStorage.getItem('current_simu_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  return (
    <div className="landing-page-root simu-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. Simu Hero Banner */}
      <section className="simu-hero-section">
        <div className="simu-hero-container">
          <h1 className="simu-hero-title">
            Mô phỏng Vận hành Toà nhà Thông minh <br />
            <span className="brand-name-green">3A</span>
            <span className="brand-name-blue">HOME</span> SCADA / BMS
          </h1>

          {/* User Session Bar */}
          {currentUser && (
            <div className="simu-user-session-card">
              <div className="simu-user-cell">
                <User size={18} className="session-icon" />
                <span>
                  Họ tên: <strong>{currentUser.full_name}</strong>
                </span>
              </div>
              <div className="simu-user-cell">
                <History size={18} className="session-icon" />
                <span>
                  Số lượt vào phòng:{' '}
                  <strong className="count-badge">{currentUser.count} lần</strong>
                </span>
              </div>
              <div className="simu-user-cell">
                <Clock size={18} className="session-icon" />
                <span>
                  Phiên làm việc: <strong>{currentUser.time}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Khung hiển thị toà nhà 3 tầng 3D dạng Wireframe có thể xoay */}
      <section className="simu-content-section">
        <div className="simu-content-container">
          <Building3D />
        </div>
      </section>

      {/* 4. Common Components as requested */}
      <Collect />
      <Entertain />

      {/* 5. Footer */}
      <Footer />
    </div>
  );
};

export default Simu;
