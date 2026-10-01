import React, { useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import {
  Globe,
  CheckCircle2,
  HeartHandshake,
  MapPin,
  Phone,
  Mail,
  Clock
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
          <h1 className="intro-hero-title">
            Về Chúng Tôi – Công Ty <br />
            <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span> Việt Nam
          </h1>

          <p className="intro-hero-subtitle">
            Hành trình kiến tạo những giải pháp tự động hoá công trình thông minh, tiết kiệm năng lượng và nâng cao chuẩn mực sống hiện đại
            với đội ngũ chuyên gia kỹ thuật giàu kinh nghiệm và tận tâm.
          </p>
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
              <h2 className="brand-name-blue" style={{ color: '#105ca8' }}>Tại Sao Khách Hàng Chọn 3AHOME?</h2>
              <p>Những ưu thế cạnh tranh vượt trội mang lại giá trị thiết thực cho công trình.</p>
            </div>

            <div className="intro-scope-grid">
              <div className="scope-item">
                <CheckCircle2 size={20} className="scope-check-icon" />
                <div>
                  <strong>Làm chủ công nghệ BMS và Tự động hoá mở</strong>
                  <p>
                    Tự chủ hoàn toàn trong thiết kế, lập trình và tích hợp đa hệ thống cơ điện (HVAC, Chiller, Chiếu sáng, PCCC, Điện năng EMS) trên nền tảng giao thức mở quốc tế BACnet, Modbus, MQTT, không bị phụ thuộc vào bất kỳ hãng độc quyền nào.
                  </p>
                </div>
              </div>

              <div className="scope-item">
                <CheckCircle2 size={20} className="scope-check-icon" />
                <div>
                  <strong>Tối ưu hoá năng lượng và Tiêu chuẩn Công trình Xanh</strong>
                  <p>
                    Ứng dụng thuật toán điều khiển trạm lạnh Chiller Plant thông minh và hệ thống quản trị năng lượng EMS chuyên sâu, giúp các tòa nhà và nhà máy tiết kiệm thực tế từ 15% – 25% điện năng tiêu thụ hàng tháng, đạt chuẩn LOTUS và LEED.
                  </p>
                </div>
              </div>

              <div className="scope-item">
                <CheckCircle2 size={20} className="scope-check-icon" />
                <div>
                  <strong>Giải pháp thiết kế may đo và Tối ưu chi phí đầu tư</strong>
                  <p>
                    Mỗi dự án đều được đội ngũ kỹ sư 3AHOME khảo sát kỹ lưỡng và thiết kế phương án may đo chuyên biệt theo đặc thù công trình, đảm bảo tính khả thi cao, cân bằng tối ưu giữa chi phí đầu tư ban đầu (CapEx) và chi phí vận hành (OpEx).
                  </p>
                </div>
              </div>

              <div className="scope-item">
                <CheckCircle2 size={20} className="scope-check-icon" />
                <div>
                  <strong>Đồng hành trọn vòng đời và Phản hồi kỹ thuật 24/7</strong>
                  <p>
                    Cam kết dịch vụ hỗ trợ kỹ thuật nhanh chóng trong vòng 2 giờ kể từ khi tiếp nhận thông tin. Đội ngũ chuyên gia kỹ thuật tận tâm cung cấp dịch vụ bảo trì định kỳ, nâng cấp công nghệ và đào tạo chuyển giao vận hành bài bản cho chủ đầu tư.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Liên hệ chúng tôi */}
          <div className="intro-contact-wrapper" style={{ marginTop: '72px', marginBottom: '24px' }}>
            <div className="section-header-centered">
              <h2 className="brand-name-blue" style={{ color: '#105ca8' }}>Liên Hệ Chúng Tôi</h2>
              <p>
                Đội ngũ kỹ sư và chuyên gia giải pháp của 3AHOME luôn sẵn sàng tư vấn, khảo sát thực địa và đồng hành cùng Quý khách hàng.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '28px',
                marginTop: '36px'
              }}
            >
              {/* Cột 1: Thông tin liên hệ & Trụ sở 3AHOME */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '36px 32px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px'
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, lineHeight: 1.4 }}>
                    CÔNG TY TNHH CÔNG NGHỆ THÔNG MINH <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span> VIỆT NAM
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748b', lineHeight: 1.6 }}>
                    Đơn vị chuyên sâu về giải pháp Hệ thống Quản trị Toà nhà (BMS), Tối ưu hoá năng lượng HVAC/Chiller và Tự động hoá công trình thông minh.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <MapPin size={20} />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Địa chỉ văn phòng
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: '#2563eb' }}>
                        698 Nguyễn Lương Bằng, P.Hải Vân, TP. Đà Nẵng
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Phone size={20} />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Hotline / Hỗ trợ kỹ thuật
                      </span>
                      <a
                        href="tel:0901994998"
                        style={{ fontSize: '1.05rem', color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}
                      >
                        (+84) 901 994 998
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Mail size={20} />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#d97706', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Email liên hệ
                      </span>
                      <a
                        href="mailto:son.lm@3ahome.vn"
                        style={{ fontSize: '0.95rem', color: '#d97706', fontWeight: 600, textDecoration: 'none' }}
                      >
                        son.lm@3ahome.vn
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        color: '#ff0000ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Clock size={20} />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#ff0000ff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Thời gian làm việc
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: '#ff0000ff' }}>
                        Thứ 2 – Thứ 7: 08:00 – 17:30
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: '#ff0000ff', marginTop: '2px', fontWeight: 500 }}>
                        (Trực hỗ trợ kỹ thuật khẩn cấp 24/7)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột 2: Bản đồ vị trí 3AHOME */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                <div style={{ width: '100%', height: '100%', minHeight: '340px', flex: 1, borderRadius: '14px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <iframe
                    title="Bản đồ vị trí 3AHOME"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3833.189949387617!2d108.12919537532451!3d16.107471884577617!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31421f506df47cfb%3A0x4ed3dfbc1809b9e5!2zQ8O0bmcgVHkgVG5oaCBDw7RuZyBOZ2jhu4cgVGjDtG5nIFRpbiAzYWhvbWUgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1790386874122!5m2!1svi!2s"
                    width="100%"
                    height="100%"
                    style={{ border: 0, display: 'block', minHeight: '340px' }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
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
