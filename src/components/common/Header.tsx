import React from 'react';
import { ArrowRight } from 'lucide-react';
import logo3aHome from '../../assets/images/logo_3ahome.png';

export const Header: React.FC = () => {
  return (
    <header className="saas-navbar">
      <div className="navbar-content">
        {/* Brand Logo */}
        <a href="#" className="nav-brand">
          <div className="brand-icon">
            <img src={logo3aHome} alt="3AHOME Logo" className="brand-logo-img" />
          </div>

        </a>

        {/* Navigation Menu */}
        <nav className="nav-links">
          <a href="#home">Trang chủ</a>
          <a href="#solution">Giải pháp</a>
          <a href="#product">Sản phẩm</a>
          <a href="#project">Dự án</a>
          <a href="#news">Tin tức</a>
          <a href="#about">Về chúng tôi</a>
          <a href="#hire">Tuyển dụng</a>
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
