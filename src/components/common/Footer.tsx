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
          <a href="#solution">Toà nhà văn phòng</a>
          <a href="#solution">Trung tâm thương mại</a>
          <a href="#solution">Khách sạn &amp; Nghỉ dưỡng</a>
          <a href="#solution">Bệnh viện &amp; Phòng sạch</a>
          <a href="#solution">Nhà máy &amp; Khu công nghiệp</a>
        </div>

        <div className="footer-links-column">
          <h5>Chính sách</h5>
          <a href="#">Chính sách bảo hành</a>
          <a href="#">Chính sách bảo mật</a>
          <a href="#">Quy chuẩn kỹ thuật</a>
          <a href="#">Chính sách tuyển dụng</a>
          <a href="#">Điều khoản dịch vụ</a>
        </div>

        <div className="footer-links-column">
          <h5>Về công ty</h5>
          <a href="#about">Giới thiệu về 3AHOME</a>
          <a href="#about">Hồ sơ năng lực</a>
          <a href="#project">Dự án tiêu biểu</a>
          <a href="#news">Tin tức và Sự kiện</a>
          <a href="#trial">Liên hệ tư vấn</a>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p>© 2026 3AHOME. All rights reserved.</p>
        <div className="footer-legal-links">
          <a href="#">Chính sách bảo mật</a>
          <a href="#">Điều khoản sử dụng</a>
          <a href="#">Cài đặt Cookie</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
