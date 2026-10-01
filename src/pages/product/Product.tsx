import React, { useState, useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { ArrowRight, X } from 'lucide-react';

export const Product: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <div className="landing-page-root intro-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. Product Hero Section */}
      <section className="intro-hero-section">
        <div className="intro-hero-container">
          <h1 className="intro-hero-title">
            Thiết bị tự động hoá <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span>
          </h1>

          <p className="intro-hero-subtitle">
            Cung cấp đầy đủ thiết bị điều khiển, cảm biến hiện trường, van động cơ và giải pháp IoT Gateway chất lượng cao,
            được chứng nhận đạt tiêu chuẩn kỹ thuật nghiêm ngặt của châu Âu và quốc tế.
          </p>

          <div className="intro-hero-actions">
            <a
              href="#trial"
              className="btn-hero-primary-saas"
              onClick={(e) => {
                e.preventDefault();
                setIsContactModalOpen(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              <span>Yêu cầu báo giá thiết bị</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* 3. Products Grid */}
      <section className="intro-content-section">
      </section>

      {/* 4. Footer */}
      <Footer />

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
                  <span className="brand-name-green" style={{ color: '#0b8645' }}>3A</span><span className="brand-name-blue" style={{ color: '#105ca8' }}>HOME VIỆT NAM</span>
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
    </div>
  );
};

export default Product;
