import React, { useEffect, useState } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import {
  Newspaper,
  Calendar,
  User,
  ArrowRight,
  Home as HomeIcon,
  Clock
} from 'lucide-react';
import project1 from '../../assets/project/1.webp';
import project2 from '../../assets/project/2.webp';
import project3 from '../../assets/project/3.webp';
import project4 from '../../assets/project/4.webp';

export const News: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const articles = [
    {
      id: 1,
      title: 'Xu Hướng Ứng Dụng IoT và Trí Tuệ Nhân Tạo (AI) Trong Quản Lý Toà Nhà 2026',
      desc: 'Công nghệ AI đang cách mạng hóa cách các tòa nhà vận hành: từ dự báo phụ tải nhiệt đến bảo trì dự đoán thiết bị cơ điện trước khi xảy ra sự cố.',
      category: 'technology',
      categoryName: 'Công nghệ BMS',
      date: '24/09/2026',
      readTime: '5 phút đọc',
      author: 'Ban Kỹ thuật 3AHOME',
      image: project1
    },
    {
      id: 2,
      title: 'Giải Pháp Tối Ưu Năng Lượng Cho Trạm Lạnh Chiller Đạt Tiêu Chuẩn Công Trình Xanh',
      desc: 'Hướng dẫn chi tiết thuật toán điều khiển Chiller Plant giúp các toà nhà văn phòng tiết kiệm từ 15-25% điện năng tiêu thụ hàng tháng.',
      category: 'solution',
      categoryName: 'Giải pháp Xanh',
      date: '18/09/2026',
      readTime: '7 phút đọc',
      author: 'Chuyên gia Năng lượng',
      image: project2
    },
    {
      id: 3,
      title: '3AHOME Ký Kết Hợp Tác Chiến Lược Với Đối Tác Quốc Tế Cung Cấp Thiết Bị DDC',
      desc: 'Lễ ký kết đánh dấu bước tiến quan trọng trong việc phân phối độc quyền các dòng thiết bị điều khiển BACnet thế hệ mới tại thị trường Việt Nam.',
      category: 'event',
      categoryName: 'Sự kiện Doanh nghiệp',
      date: '10/09/2026',
      readTime: '4 phút đọc',
      author: 'Phòng Truyền thông',
      image: project3
    },
    {
      id: 4,
      title: 'Tầm Quan Trọng Của Việc Kiểm Soát Chất Lượng Không Khí Trong Nhà (IAQ)',
      desc: 'Nghiên cứu về tác động của nồng độ CO2 và bụi mịn PM2.5 đến sức khoẻ và hiệu suất làm việc của nhân viên văn phòng trong các toà cao ốc.',
      category: 'technology',
      categoryName: 'Công nghệ BMS',
      date: '02/09/2026',
      readTime: '6 phút đọc',
      author: 'Ban Kỹ thuật 3AHOME',
      image: project4
    }
  ];

  const filteredArticles = activeTab === 'all' 
    ? articles 
    : articles.filter(a => a.category === activeTab);

  return (
    <div className="landing-page-root intro-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. News Hero Section */}
      <section className="intro-hero-section">
        <div className="intro-hero-container">
          <div className="intro-breadcrumb">
            <a href="#" className="breadcrumb-link">
              <HomeIcon size={14} />
              <span>Trang chủ</span>
            </a>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Tin tức</span>
          </div>

          <div className="intro-hero-badge">
            <Newspaper size={16} />
            <span>Tin tức & Sự kiện</span>
          </div>

          <h1 className="intro-hero-title">
            Tin Tức Công Nghệ & Hoạt Động <br />
            Doanh Nghiệp <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span>
          </h1>

          <p className="intro-hero-subtitle">
            Cập nhật liên tục các xu hướng công nghệ toà nhà thông minh mới nhất, chính sách chuyển đổi xanh,
            hướng dẫn kỹ thuật và tin tức hoạt động từ 3AHOME.
          </p>

          <div className="intro-hero-actions">
            <a href="#trial" className="btn-hero-primary-saas">
              <span>Đăng ký nhận bản tin</span>
              <ArrowRight size={16} />
            </a>
            <a href="#" className="btn-hero-outline-saas">
              <span>Quay lại Trang chủ</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. News Grid Section */}
      <section className="intro-content-section">
        <div className="intro-content-container">
          {/* Category Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '36px' }}>
            {[
              { id: 'all', name: 'Tất cả bài viết' },
              { id: 'technology', name: 'Công nghệ BMS' },
              { id: 'solution', name: 'Giải pháp Xanh' },
              { id: 'event', name: 'Sự kiện Doanh nghiệp' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: activeTab === tab.id ? '#105ca8' : '#e2e8f0',
                  background: activeTab === tab.id ? '#105ca8' : '#ffffff',
                  color: activeTab === tab.id ? '#ffffff' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
                  <img
                    src={article.image}
                    alt={article.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(11, 134, 69, 0.9)',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    {article.categoryName}
                  </div>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#105ca8" />
                      <span>{article.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="#105ca8" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.4, marginBottom: '12px' }}>
                    {article.title}
                  </h3>

                  <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px', flexGrow: 1 }}>
                    {article.desc}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                      <User size={14} />
                      <span>{article.author}</span>
                    </div>
                    <a
                      href="#trial"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#105ca8',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        textDecoration: 'none'
                      }}
                    >
                      <span>Xem tiếp</span>
                      <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
};

export default News;
