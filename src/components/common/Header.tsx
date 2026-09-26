import React from 'react';
import { ArrowRight } from 'lucide-react';
import logo3aHome from '../../assets/images/logo_3ahome.png';

export const Header: React.FC = () => {
  return (
    <header className="saas-navbar">
      <div className="navbar-content">
        {/* Brand Logo */}
        <a 
          href="#" 
          className="nav-brand"
          onClick={() => {
            if (window.location.hash) {
              window.location.hash = '';
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="brand-icon">
            <img src={logo3aHome} alt="3AHOME Logo" className="brand-logo-img" />
          </div>
        </a>

        {/* Navigation Menu */}
        <nav className="nav-links">
          <a 
            href="#intro"
            onClick={() => {
              window.location.hash = '#intro';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Giới thiệu
          </a>
          <a 
            href="#solution"
            onClick={() => {
              window.location.hash = '#solution';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Giải pháp
          </a>
          <a 
            href="#product"
            onClick={() => {
              window.location.hash = '#product';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Sản phẩm
          </a>
          <a 
            href="#project"
            onClick={() => {
              window.location.hash = '#project';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Dự án
          </a>
          <a 
            href="#news"
            onClick={() => {
              window.location.hash = '#news';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Tin tức
          </a>
          <a 
            href="#about"
            onClick={() => {
              window.location.hash = '#about';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Về chúng tôi
          </a>
          <a 
            href="#hire"
            onClick={() => {
              window.location.hash = '#hire';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Tuyển dụng
          </a>
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
