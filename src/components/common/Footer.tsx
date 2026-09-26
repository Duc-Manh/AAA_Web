import React from 'react';
import { MapPin } from 'lucide-react';
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
          <h5>Giải pháp</h5>
          <a href="#solution">Toà nhà văn phòng</a>
          <a href="#solution">Trung tâm thương mại</a>
          <a href="#solution">Khách sạn và Nghỉ dưỡng</a>
          <a href="#solution">Bệnh viện và Phòng sạch</a>
          <a href="#solution">Nhà máy và Khu công nghiệp</a>
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
          <a href="#about">Giới thiệu về <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span></a>
          <a href="#about">Hồ sơ năng lực</a>
          <a href="#project">Dự án tiêu biểu</a>
          <a href="#news">Tin tức và Sự kiện</a>
          <a href="#trial">Liên hệ tư vấn</a>
        </div>

        <div className="footer-map-column">
          <h5>Bản đồ vị trí</h5>
          <div className="footer-map-frame">
            <iframe
              title="Bản đồ vị trí 3AHOME"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3833.189949387617!2d108.12919537532451!3d16.107471884577617!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31421f506df47cfb%3A0x4ed3dfbc1809b9e5!2zQ8O0bmcgVHkgVG5oaCBDw7RuZyBOZ2jhu4cgVGjDtG5nIFRpbiAzYWhvbWUgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1790386874122!5m2!1svi!2s"
              width="100%"
              height="150"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div className="footer-map-info">
              <MapPin size={14} className="map-icon-pin" />
              <span>Đà Nẵng, Việt Nam</span>
            </div>
          </div>
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
