import React, { useState, useEffect } from 'react';
import logo3aHome from '../../assets/images/logo_3ahome.png';

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number; // duration in ms (default: 2000)
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 2000 }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 400); // 400ms smooth fadeout
      }
    }, 20);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <div className={`splash-screen-overlay ${isFadingOut ? 'splash-fade-out' : ''}`}>
      <div className="splash-ambient-glow" />

      <div className="splash-content-box">
        {/* Centered Logo */}
        <div className="splash-logo-container">
          <img src={logo3aHome} alt="3AHOME Logo" className="splash-logo-img" />
        </div>

        {/* Subtitle / Slogan */}
        <div className="splash-subtitle">
          Công Nghệ Thông Minh Cho Toà Nhà Hiện Đại
        </div>

        {/* Beautiful Animated Loading Bar */}
        <div className="splash-progress-track">
          <div 
            className="splash-progress-fill" 
            style={{ width: `${progress}%` }} 
          />
          <div className="splash-progress-shimmer" />
        </div>

        {/* Status text & percentage */}
        <div className="splash-status-row">
          <span className="splash-status-text">Đang tải hệ thống...</span>
          <span className="splash-status-pct">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
