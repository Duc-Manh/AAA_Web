import React, { useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { 
  Building2, 
  Target, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
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

          <div className="intro-hero-actions">
            <a href="#trial" className="btn-hero-primary-saas">
              <span>Liên hệ hợp tác</span>
              <ArrowRight size={16} />
            </a>
            <a href="#" className="btn-hero-outline-saas">
              <span>Quay lại Trang chủ</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Company Overview & Vision / Mission */}
      <section className="intro-content-section">
        <div className="intro-content-container">
          <div className="intro-grid-two-col">
            <div className="intro-card-box highlight">
              <div className="intro-card-icon">
                <Target size={28} />
              </div>
              <h3 className="intro-card-title">Tầm nhìn chiến lược</h3>
              <p className="intro-card-text">
                Trở thành thương hiệu kỹ thuật hàng đầu tại Việt Nam và khu vực trong lĩnh vực tự động hoá công trình,
                tiên phong ứng dụng các chuẩn giao thức quốc tế mở (BACnet, Modbus, IoT) mang lại hiệu quả vận hành tối ưu và bền vững.
              </p>
            </div>

            <div className="intro-card-box highlight">
              <div className="intro-card-icon">
                <Award size={28} />
              </div>
              <h3 className="intro-card-title">Sứ mệnh phát triển</h3>
              <p className="intro-card-text">
                Cung cấp giải pháp toà nhà thông minh chuẩn mực, tối ưu hóa năng lượng tiêu thụ, nâng cao tuổi thọ thiết bị
                và đem lại môi trường sống, làm việc an toàn, tiện nghi bậc nhất cho cộng đồng doanh nghiệp Việt Nam.
              </p>
            </div>
          </div>

          {/* 4. Core Values */}
          <div className="intro-core-values-wrapper">
            <div className="section-header-centered">
              <h2 className="gradient-flow-title">Giá trị cốt lõi</h2>
              <p>Nền tảng vững chắc định hình mọi hoạt động và dịch vụ kỹ thuật của 3AHOME.</p>
            </div>

            <div className="intro-values-grid">
              <div className="value-card">
                <div className="value-number">01</div>
                <h4>Chất lượng vượt trội</h4>
                <p>Cam kết sử dụng thiết bị đạt tiêu chuẩn quốc tế, kiểm tra nghiêm ngặt trước khi bàn giao đưa vào vận hành.</p>
              </div>

              <div className="value-card">
                <div className="value-number">02</div>
                <h4>Đổi mới & Sáng tạo</h4>
                <p>Liên tục cập nhật các công nghệ điều khiển BMS, IoT và giải pháp tối ưu năng lượng tiên tiến trên thế giới.</p>
              </div>

              <div className="value-card">
                <div className="value-number">03</div>
                <h4>Đồng hành tin cậy</h4>
                <p>Hỗ trợ kỹ thuật 24/7, bảo dưỡng định kỳ và đồng hành lâu dài cùng chủ đầu tư trong suốt vòng đời dự án.</p>
              </div>

              <div className="value-card">
                <div className="value-number">04</div>
                <h4>Hiệu quả thực tế</h4>
                <p>Đo lường trực tiếp mức độ tiết kiệm điện năng và chi phí bảo trì sau khi đưa hệ thống tự động hoá vào hoạt động.</p>
              </div>
            </div>
          </div>

          {/* 5. Business Scope */}
          <div className="intro-scope-wrapper">
            <div className="section-header-centered">
              <h2 className="gradient-flow-title">Lĩnh vực hoạt động chính</h2>
              <p>Hệ sinh thái sản phẩm và dịch vụ toàn diện từ thiết kế đến thi công.</p>
            </div>

            <div className="intro-scope-grid">
              <div className="scope-item">
                <CheckCircle2 size={20} className="scope-check-icon" />
                <div>
                  <strong>Hệ thống quản lý toà nhà (BMS / BAS)</strong>
                  <p>Giám sát và điều khiển tập trung HVAC, Chiller, chiếu sáng, thông gió, bơm nước và điện năng tiêu thụ.</p>
                </div>
              </div>

              <div className="scope-item">
                <CheckCircle2 size={20} className="scope-check-icon" />
                <div>
                  <strong>Điều khiển Chiller Plant & Tối ưu năng lượng</strong>
                  <p>Thuật toán điều khiển giải nhiệt tải biến thiên, tối ưu hệ số COP của trạm máy làm lạnh trung tâm.</p>
                </div>
              </div>

              <div className="scope-item">
                <CheckCircle2 size={20} className="scope-check-icon" />
                <div>
                  <strong>Cung ứng thiết bị DDC & Gateway công nghiệp</strong>
                  <p>Phân phối bộ điều khiển DDC khả trình, van điện từ, cảm biến đo đạc độ chính xác cao và thiết bị gateway đa giao thức.</p>
                </div>
              </div>

              <div className="scope-item">
                <CheckCircle2 size={20} className="scope-check-icon" />
                <div>
                  <strong>Dịch vụ bảo trì & Nâng cấp hệ thống cũ</strong>
                  <p>Khảo sát, cải tạo và tích hợp hệ thống điều khiển thế hệ mới cho các tòa nhà và nhà máy đang vận hành.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <Footer />
    </div>
  );
};

export default Intro;
