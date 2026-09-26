import React, { useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import {
  Users,
  Globe,
  CheckCircle2,
  ArrowRight,
  Home as HomeIcon,
  HeartHandshake
} from 'lucide-react';

export const About: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const milestones = [
    {
      year: '2018',
      title: 'Khởi đầu Hành trình',
      desc: 'Thành lập công ty với đội ngũ kỹ sư tự động hoá tâm huyết, cung ứng các thiết bị đo lường và cảm biến cho công trình văn phòng.'
    },
    {
      year: '2020',
      title: 'Phát triển Hệ thống BMS Toàn diện',
      desc: 'Nghiên cứu và triển khai thành công các giải pháp BMS tích hợp đa giao thức BACnet, mở rộng thị phần tại các toà cao ốc Hà Nội và TP.HCM.'
    },
    {
      year: '2023',
      title: 'Hợp tác Quốc tế & Mở rộng',
      desc: 'Trở thành đối tác tích hợp hệ thống chính thức của các thương hiệu hàng đầu thế giới (Schneider Electric, Siemens, Honeywell).'
    },
    {
      year: '2026',
      title: 'Dẫn đầu Giải pháp Toà nhà Xanh',
      desc: 'Cung cấp hệ sinh thái BMS thông minh tích hợp trí tuệ nhân tạo (AI), đồng hành cùng hơn 100 công trình trọng điểm trên toàn quốc.'
    }
  ];

  return (
    <div className="landing-page-root intro-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. About Hero Section */}
      <section className="intro-hero-section">
        <div className="intro-hero-container">
          <div className="intro-breadcrumb">
            <a href="#" className="breadcrumb-link">
              <HomeIcon size={14} />
              <span>Trang chủ</span>
            </a>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Về chúng tôi</span>
          </div>

          <div className="intro-hero-badge">
            <Users size={16} />
            <span>Câu chuyện thương hiệu</span>
          </div>

          <h1 className="intro-hero-title">
            Về Chúng Tôi – Công Ty <br />
            <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span> Việt Nam
          </h1>

          <p className="intro-hero-subtitle">
            Hành trình kiến tạo những giải pháp tự động hoá công trình thông minh, tiết kiệm năng lượng và nâng cao chuẩn mực sống hiện đại
            với đội ngũ chuyên gia kỹ thuật giàu kinh nghiệm và tận tâm.
          </p>

          <div className="intro-hero-actions">
            <a href="#trial" className="btn-hero-primary-saas">
              <span>Liên hệ chúng tôi</span>
              <ArrowRight size={16} />
            </a>
            <a href="#" className="btn-hero-outline-saas">
              <span>Quay lại Trang chủ</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. About Core Info */}
      <section className="intro-content-section">
        <div className="intro-content-container">
          <div className="intro-grid-two-col">
            <div className="intro-card-box highlight">
              <div className="intro-card-icon">
                <HeartHandshake size={28} />
              </div>
              <h3 className="intro-card-title">Cam Kết Với Khách Hàng</h3>
              <p className="intro-card-text">
                Chúng tôi không chỉ cung ứng thiết bị và phần mềm, mà là người bạn đồng hành tin cậy của mọi chủ đầu tư trong suốt vòng đời của công trình.
                Sự hài lòng, an toàn và mức tiết kiệm chi phí thực tế của quý khách là thước đo thành công cao nhất của 3AHOME.
              </p>
            </div>

            <div className="intro-card-box highlight">
              <div className="intro-card-icon">
                <Globe size={28} />
              </div>
              <h3 className="intro-card-title">Tầm Vóc & Đội Ngũ Kỹ Sư</h3>
              <p className="intro-card-text">
                100% đội ngũ kỹ sư giải pháp và thi công tại 3AHOME tốt nghiệp từ các trường đại học kỹ thuật hàng đầu,
                sở hữu các chứng chỉ chuyên nghiệp về BACnet, hệ thống lạnh Chiller và tự động hoá công nghiệp tiên tiến.
              </p>
            </div>
          </div>

          {/* Milestones */}
          <div className="intro-core-values-wrapper" style={{ marginTop: '64px' }}>
            <div className="section-header-centered">
              <h2 className="gradient-flow-title">Chặng Đường Phát Triển</h2>
              <p>Những cột mốc quan trọng khẳng định vị thế và năng lực của 3AHOME trên thị trường.</p>
            </div>

            <div className="intro-values-grid">
              {milestones.map((m, idx) => (
                <div key={idx} className="value-card">
                  <div className="value-number">{m.year}</div>
                  <h4>{m.title}</h4>
                  <p>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why choose us */}
          <div className="intro-scope-wrapper" style={{ marginTop: '64px' }}>
            <div className="section-header-centered">
              <h2 className="gradient-flow-title">Tại Sao Khách Hàng Chọn 3AHOME?</h2>
              <p>Những ưu thế cạnh tranh vượt trội mang lại giá trị thiết thực cho công trình.</p>
            </div>

            <div className="intro-scope-grid">
              <div className="scope-item">
                <CheckCircle2 size={20} className="scope-check-icon" />
                <div>
                  <strong>Giải pháp thiết kế may đo chuyên biệt</strong>
                  <p>Mỗi công trình được nghiên cứu kỹ lưỡng để đưa ra phương án tối ưu hóa chi phí đầu tư và chi phí vận hành.</p>
                </div>
              </div>

              <div className="scope-item">
                <CheckCircle2 size={20} className="scope-check-icon" />
                <div>
                  <strong>Làm chủ công nghệ điều khiển mở</strong>
                  <p>Tự do kết nối và mở rộng không phụ thuộc vào bất kỳ nhà sản xuất độc quyền nào.</p>
                </div>
              </div>

              <div className="scope-item">
                <CheckCircle2 size={20} className="scope-check-icon" />
                <div>
                  <strong>Thời gian phản hồi hỗ trợ dưới 2 giờ</strong>
                  <p>Đội ngũ kỹ thuật túc trực 24/7, cam kết xử lý sự cố nhanh chóng, đảm bảo tính liên tục của tòa nhà.</p>
                </div>
              </div>

              <div className="scope-item">
                <CheckCircle2 size={20} className="scope-check-icon" />
                <div>
                  <strong>Đo lường hiệu quả bằng số liệu thực</strong>
                  <p>Cung cấp báo cáo phân tích năng lượng chi tiết trước và sau khi triển khai hệ thống quản lý thông minh.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
};

export default About;
