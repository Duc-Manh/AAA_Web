import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import logo3aHome from '../../assets/images/logo_3ahome.png';

interface NavItem {
  id: string;
  name: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: '#intro', name: 'Giới thiệu' },
  { id: '#solution', name: 'Giải pháp' },
  { id: '#product', name: 'Sản phẩm' },
  { id: '#project', name: 'Dự án' },
  { id: '#news', name: 'Tin tức' },
  { id: '#about', name: 'Về chúng tôi' },
  { id: '#hire', name: 'Tuyển dụng' },
];

export const Header: React.FC = () => {
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || window.location.pathname);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || window.location.pathname);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsContactModalOpen(false);
      }
    };

    if (isContactModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isContactModalOpen]);

  const navigateTo = (hash: string) => {
    setCurrentHash(hash);
    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isItemActive = (id: string) => {
    const cleanId = id.replace('#', '');
    return currentHash === id || currentHash === `/${cleanId}`;
  };

  return (
    <>
      <header className="saas-navbar">
        <div className="navbar-content">
          {/* Brand Logo */}
          <a
            href="#"
            className="nav-brand"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('');
            }}
          >
            <div className="brand-icon">
              <img src={logo3aHome} alt="3AHOME Logo" className="brand-logo-img" />
            </div>
          </a>

          {/* Navigation Menu */}
          <nav className="nav-links">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item.id);
              return (
                <a
                  key={item.id}
                  href={item.id}
                  className={active ? 'active' : ''}
                  style={
                    active
                      ? {
                        color: '#105ca8',
                        transform: 'translateY(3px)',
                        fontWeight: 700,
                      }
                      : undefined
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo(item.id);
                  }}
                >
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="nav-actions">
            <a href="#login" className="btn-nav-login"></a>
            <a
              href="#trial"
              className="btn-nav-primary"
              onClick={(e) => {
                e.preventDefault();
                setIsContactModalOpen(true);
              }}
            >
              <span>Liên hệ</span>

            </a>
          </div>
        </div>
      </header>

      {/* Contact Info Modal */}
      {isContactModalOpen && (
        <div
          className="contact-modal-backdrop"
          onClick={() => setIsContactModalOpen(false)}
        >
          <div
            className="contact-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="contact-modal-close"
              onClick={() => setIsContactModalOpen(false)}
              aria-label="Đóng"
            >
              <X size={20} />
            </button>

            <div className="contact-modal-card">
              <div className="contact-card-header">
                <div className="contact-company-sub">CÔNG TY TNHH CÔNG NGHỆ THÔNG MINH</div>
                <div className="contact-company-main">
                  <span className="brand-name-green" style={{ color: '#22c55e' }}>3A</span><span className="brand-name-blue" style={{ color: '#38bdf8' }}>HOME</span> VIỆT NAM
                </div>
              </div>

              <div className="contact-card-divider" />

              <div className="contact-card-body">
                <p className="contact-card-row">
                  <span className="contact-row-label">Địa chỉ:</span> 698 Nguyễn Lương Bằng, P.Hải Vân, TP. Đà Nẵng
                </p>
                <p className="contact-card-row">
                  <span className="contact-row-label">Hotline:</span>{' '}
                  <a href="tel:+84901994998" className="contact-link">
                    (+84) 901 994 998
                  </a>
                </p>
                <p className="contact-card-row">
                  <span className="contact-row-label">Email:</span>{' '}
                  <a href="mailto:son.lm@3ahome.vn" className="contact-link">
                    son.lm@3ahome.vn
                  </a>
                </p>
                <p className="contact-card-row">
                  <span className="contact-row-label">Website:</span>{' '}
                  <a href="https://3ahome.vn" target="_blank" rel="noopener noreferrer" className="contact-link">
                    3ahome.vn
                  </a>
                </p>
              </div>

              {/* Decorative Corner Accents */}
              <div className="contact-card-accent-sub" />
              <div className="contact-card-accent-main" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
