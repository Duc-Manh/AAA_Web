import React, { useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { 
  Building2, 
  Home as HomeIcon
} from 'lucide-react';

export const Intro: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page-root intro-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. Intro Hero Section */}
      <section className="intro-hero-section">
        <div className="intro-hero-container">
          <div className="intro-breadcrumb">
            <a href="#" className="breadcrumb-link">
              <HomeIcon size={14} />
              <span>Trang chủ</span>
            </a>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Giới thiệu</span>
          </div>

          <div className="intro-hero-badge">
            <Building2 size={16} />
            <span>Hồ sơ doanh nghiệp</span>
          </div>

          <h1 className="intro-hero-title">
            Công ty TNHH Công nghệ thông minh <br />
            <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span> Việt Nam
          </h1>

          <p className="intro-hero-subtitle">
            Nhà cung cấp giải pháp và thiết bị tiên phong trong lĩnh vực tự động hoá toà nhà (BMS), 
            điều khiển thông minh và quản lý năng lượng toàn diện cho các công trình hiện đại tại Việt Nam.
          </p>
        </div>
      </section>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
};

export default Intro;
