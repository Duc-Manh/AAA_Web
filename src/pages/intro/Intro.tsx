import React, { useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';

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
          <h1 className="intro-hero-title">
            Công ty TNHH Công nghệ thông minh <br />
            <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span> Việt Nam
          </h1>
        </div>
      </section>

      {/* 3. Intro Details Section */}
      <section className="intro-details-section">
        <div className="intro-details-container">
          <div className="intro-details-box">
            {/* Khung tên "Giới thiệu" đè lên bên trái cạnh trên */}
            <div className="intro-tag-badge">
              Giới thiệu
            </div>

            {/* Khung hiển thị nội dung */}
            <div className="intro-details-text">
              <p>
                Công ty TNHH Công Nghệ Thông Minh <span className="brand-name-green" style={{ color: '#0b8645', fontWeight: 600 }}>3A</span><span className="brand-name-blue" style={{ color: '#105ca8', fontWeight: 600 }}>Home</span> Việt Nam là một trong những nhà cung cấp giải pháp và thiết bị trong lĩnh vực tự động hoá, điều khiển.
              </p>
              <p>
                Với bề dày kinh nghiệm, năng lực của mình cùng nguồn nhân lực có chuyên môn cao, chúng tôi tư vấn cho khách hàng những giải pháp tối ưu, vừa đáp ứng yêu cầu kỹ thuật vừa phù hợp với chi phí đầu tư. Giải pháp của chúng tôi dựa trên sản phẩm của các thương hiệu công nghệ hàng đầu thế giới, đảm bảo sử dụng công nghệ tự động hoá tiên tiến nhất, giúp nâng cao hiệu quả sử dụng cũng như giá trị công trình.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Strategic Partners Section */}
      <section className="intro-partner-section">
        <div className="intro-details-container">
          <div className="intro-details-box">
            {/* Khung tên "Đối tác chiến lược" đè lên bên trái cạnh trên */}
            <div className="intro-tag-badge">
              Đối tác chiến lược
            </div>

            <div className="intro-details-text">
              <p>
                Năm 2019, chúng tôi là đối tác chiến lược của <strong>Optergy - USA</strong> trong việc phân phối và tư vấn giải pháp cho hệ thống tự động hoá toà nhà (BMS) tại Việt Nam.
              </p>
              <p>
                Tháng 12/2020, chúng tôi tiếp tục mở rộng phân khúc sản phẩm với việc trở thành đối tác cung cấp thiết bị hệ thống quản lý toà nhà của hãng <strong>Sauter Controls - Germany</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Development Milestones Section */}
      <section className="intro-milestones-section">
        <div className="intro-details-container">
          <div className="intro-details-box">
            {/* Khung tên "Các cột mốc phát triển" đè lên bên trái cạnh trên */}
            <div className="intro-tag-badge">
              Các cột mốc phát triển
            </div>

            {/* Khung hiển thị nội dung timeline */}
            <div className="intro-timeline">
              <div className="intro-timeline-item">
                <div className="intro-timeline-indicator">
                  <div className="intro-timeline-dot" />
                  <div className="intro-timeline-line" />
                </div>
                <div className="intro-timeline-content">
                  <span className="intro-timeline-year">2018</span>
                  <h4 className="intro-timeline-title">Thành lập công ty</h4>
                  <p className="intro-timeline-desc">
                    Khởi đầu hành trình với sứ mệnh mang giải pháp tự động hóa đến các công trình Việt Nam.
                  </p>
                </div>
              </div>

              <div className="intro-timeline-item">
                <div className="intro-timeline-indicator">
                  <div className="intro-timeline-dot" />
                  <div className="intro-timeline-line" />
                </div>
                <div className="intro-timeline-content">
                  <span className="intro-timeline-year">2019</span>
                  <h4 className="intro-timeline-title">Đối tác Optergy (USA)</h4>
                  <p className="intro-timeline-desc">
                    Trở thành đối tác chiến lược của Optergy, nhà cung cấp giải pháp BMS hàng đầu từ Mỹ.
                  </p>
                </div>
              </div>

              <div className="intro-timeline-item">
                <div className="intro-timeline-indicator">
                  <div className="intro-timeline-dot" />
                  <div className="intro-timeline-line" />
                </div>
                <div className="intro-timeline-content">
                  <span className="intro-timeline-year">2020</span>
                  <h4 className="intro-timeline-title">Mở rộng với SAUTER</h4>
                  <p className="intro-timeline-desc">
                    Hợp tác với SAUTER Controls (Đức), mở rộng danh mục sản phẩm HVAC cao cấp.
                  </p>
                </div>
              </div>

              <div className="intro-timeline-item">
                <div className="intro-timeline-indicator">
                  <div className="intro-timeline-dot" />
                  <div className="intro-timeline-line" />
                </div>
                <div className="intro-timeline-content">
                  <span className="intro-timeline-year">2023</span>
                  <h4 className="intro-timeline-title">50+ Dự án hoàn thành</h4>
                  <p className="intro-timeline-desc">
                    Cột mốc 50 dự án triển khai thành công trên khắp Việt Nam.
                  </p>
                </div>
              </div>

              <div className="intro-timeline-item">
                <div className="intro-timeline-indicator">
                  <div className="intro-timeline-dot" />
                </div>
                <div className="intro-timeline-content">
                  <span className="intro-timeline-year">2025</span>
                  <h4 className="intro-timeline-title">Mở rộng thị trường</h4>
                  <p className="intro-timeline-desc">
                    Tiếp tục phát triển, mở rộng thị phần và nâng cao năng lực kỹ thuật.
                  </p>
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
