import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const Top: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Khi người dùng cuộn trang xuống > 100px thì nút nổi bật hơn
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      className={`top-back-btn ${isScrolled ? 'is-scrolled' : ''}`}
      onClick={scrollToTop}
      aria-label="Lên đầu trang"
      title="Lên đầu trang"
    >
      <div className="top-back-inner">
        <ArrowUp className="top-arrow-icon" size={24} strokeWidth={2.6} />
      </div>
      <span className="top-back-tooltip">Lên đầu trang</span>
    </button>
  );
};

export default Top;
