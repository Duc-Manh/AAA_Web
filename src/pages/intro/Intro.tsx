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
        </div>
      </section>

      {/* 3. Intro Details Section */}
      <section className="intro-details-section">
        <div className="intro-details-container">
          <div className="intro-details-box">
            {/* Khung tên "Giới thiệu" đè lên bên phải cạnh trên */}
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

      {/* 4. Footer */}
      <Footer />
    </div>
  );
};

export default Intro;
