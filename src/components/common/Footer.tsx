import React from 'react';
import logo3aHome from '../../assets/images/logo_3ahome.png';

export const Footer: React.FC = () => {
  return (
    <footer className="saas-footer">
      <div className="footer-columns-container">
        <div className="footer-brand-column">
          <div className="nav-brand" style={{ marginBottom: 10 }}>
            <div className="brand-icon">
              <img src={logo3aHome} alt="3AHOME Logo" className="brand-logo-img" />
            </div>
          </div>
          <p className="footer-desc">
            Nhà cung cấp giải pháp và thiết bị trong lĩnh vực tự động hoá, hệ thống quản lý toà nhà thông minh (BMS) cho các công trình xây dựng và công nghiệp tại Việt Nam.
          </p>
          <div className="footer-cert-tags">
            <span>ISO 27001 Certified</span>
            <span>SOC 2 Type II</span>
            <span>GDPR Ready</span>
          </div>
        </div>

        <div className="footer-links-column">
          <h5>Sản phẩm</h5>
          <a href="#">Bộ điều khiển DDC</a>
          <a href="#">Cảm biến &amp; Đo lường</a>
          <a href="#">Van &amp; Động cơ điều khiển</a>
          <a href="#">Phần mềm giám sát BMS</a>
          <a href="#">Thiết bị Gateway &amp; Mạng</a>
        </div>

        <div className="footer-links-column">
          <h5>Giải pháp</h5>
          <a href="#">E-Commerce</a>
          <a href="#">SaaS &amp; Apps</a>
          <a href="#">Agencies</a>
          <a href="#">Enterprises</a>
          <a href="#">Publishers</a>
        </div>

        <div className="footer-links-column">
          <h5>Chính sách</h5>
          <a href="#">Compliance Guides</a>
          <a href="#">API Documentation</a>
          <a href="#">Integration Hub</a>
          <a href="#">Privacy Policy Generator</a>
          <a href="#">Status Page</a>
        </div>

        <div className="footer-links-column">
          <h5>Về công ty</h5>
          <a href="#">About Us</a>
          <a href="#">Careers</a>
          <a href="#">Press Kit</a>
          <a href="#">Contact Us</a>
          <a href="#">Privacy Notice</a>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p>© 2026 3AHOME. All rights reserved.</p>
        <div className="footer-legal-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Settings</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
