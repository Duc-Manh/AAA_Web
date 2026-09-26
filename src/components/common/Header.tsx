import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
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
          <a href="#trial" className="btn-nav-primary">
            <span>Liên hệ</span>
            <ArrowRight size={15} />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
