import React, { useEffect, useState } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import {
  Building2,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Home as HomeIcon,
  TrendingUp
} from 'lucide-react';
import project1 from '../../assets/project/1.webp';
import project2 from '../../assets/project/2.webp';
import project3 from '../../assets/project/3.webp';
import project4 from '../../assets/project/4.webp';
import project5 from '../../assets/project/5.webp';
import project6 from '../../assets/project/6.webp';

export const Project: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const projects = [
    {
      id: 1,
      title: 'Toà Nhà Văn Phòng Landmark Tower',
      category: 'commercial',
      categoryName: 'Toà nhà Văn phòng',
      image: project1,
      location: 'Hà Nội',
      year: '2024',
      scale: '38 Tầng - 65,000 m²',
      system: 'Hệ thống Quản lý BMS & Trạm Chiller Plant',
      savings: 'Tiết kiệm 22% điện năng'
    },
    {
      id: 2,
      title: 'Khu Phức Hợp Smart Metro Center',
      category: 'complex',
      categoryName: 'Khu phức hợp',
      image: project2,
      location: 'TP. Hồ Chí Minh',
      year: '2023',
      scale: '2 Tháp 45 Tầng - 110,000 m²',
      system: 'BMS Tích hợp PCCC, Bơm nước & Chiếu sáng',
      savings: 'Tiết kiệm 18% điện năng'
    },
    {
      id: 3,
      title: 'Bệnh Viện Đa Khoa Quốc Tế GreenMed',
      category: 'hospital',
      categoryName: 'Bệnh viện & Y tế',
      image: project3,
      location: 'Đà Nẵng',
      year: '2024',
      scale: '800 Giường - Phòng mổ áp lực âm',
      system: 'Kiểm soát Vi khí hậu IAQ & AHU phòng sạch',
      savings: 'Đạt chuẩn vi sinh phòng mổ'
    },
    {
      id: 4,
      title: 'Nhà Máy Công Nghệ Cao Precision Tech',
      category: 'industrial',
      categoryName: 'Nhà máy Công nghiệp',
      image: project4,
      location: 'Bắc Ninh',
      year: '2023',
      scale: 'Nhà xưởng 45,000 m²',
      system: 'SCADA giám sát trạm biến áp & giám sát EMS',
      savings: 'Giảm 25% lãng phí năng lượng'
    },
    {
      id: 5,
      title: 'Khách Sạn & Khu Nghỉ Dưỡng Grand Resort',
      category: 'commercial',
      categoryName: 'Khách sạn & Resort',
      image: project5,
      location: 'Nha Trang',
      year: '2024',
      scale: '500 Phòng tiêu chuẩn 5 sao',
      system: 'Hệ thống RCMS điều khiển phòng khách thông minh',
      savings: 'Nâng cao 30% tiện nghi khách hàng'
    },
    {
      id: 6,
      title: 'Trung Tâm Dữ Liệu Data Hub Quốc Gia',
      category: 'industrial',
      categoryName: 'Trung tâm Dữ liệu',
      image: project6,
      location: 'Hà Nội',
      year: '2024',
      scale: 'Tier III - 1,200 Racks',
      system: 'Hệ thống lạnh chính xác CRAC & BMS giám sát 24/7',
      savings: 'Hệ số PUE tối ưu 1.35'
    }
  ];

  const filteredProjects = selectedFilter === 'all' 
    ? projects 
    : projects.filter(p => p.category === selectedFilter);

  return (
    <div className="landing-page-root intro-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. Project Hero Section */}
      <section className="intro-hero-section">
        <div className="intro-hero-container">
          <div className="intro-breadcrumb">
            <a href="#" className="breadcrumb-link">
              <HomeIcon size={14} />
              <span>Trang chủ</span>
            </a>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Dự án</span>
          </div>

          <div className="intro-hero-badge">
            <Building2 size={16} />
            <span>Hồ sơ công trình</span>
          </div>

          <h1 className="intro-hero-title">
            Dự Án Tiêu Biểu Đã Triển Khai <br />
            Bởi <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span> Việt Nam
          </h1>

          <p className="intro-hero-subtitle">
            Khẳng định uy tín và năng lực kỹ thuật thông qua hàng loạt dự án toà nhà văn phòng, khu phức hợp thương mại,
            bệnh viện và nhà máy công nghiệp quy mô lớn trên toàn quốc.
          </p>

          <div className="intro-hero-actions">
            <a href="#trial" className="btn-hero-primary-saas">
              <span>Đăng ký tham quan dự án</span>
              <ArrowRight size={16} />
            </a>
            <a href="#" className="btn-hero-outline-saas">
              <span>Quay lại Trang chủ</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Projects Showcase Grid */}
      <section className="intro-content-section">
        <div className="intro-content-container">
          <div className="section-header-centered">
            <h2 className="gradient-flow-title">Công Trình Biểu Tượng</h2>
            <p>Giải pháp BMS của 3AHOME đã giúp các chủ đầu tư tiết kiệm hàng tỷ đồng chi phí vận hành mỗi năm.</p>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '36px' }}>
            {[
              { id: 'all', name: 'Tất cả dự án' },
              { id: 'commercial', name: 'Toà nhà & Khách sạn' },
              { id: 'complex', name: 'Khu phức hợp' },
              { id: 'hospital', name: 'Bệnh viện & Y tế' },
              { id: 'industrial', name: 'Công nghiệp & Data Center' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: selectedFilter === tab.id ? '#105ca8' : '#e2e8f0',
                  background: selectedFilter === tab.id ? '#105ca8' : '#ffffff',
                  color: selectedFilter === tab.id ? '#ffffff' : '#475569',
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
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
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
                <div style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden' }}>
                  <img
                    src={proj.image}
                    alt={proj.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(16, 92, 168, 0.9)',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    {proj.categoryName}
                  </div>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                    {proj.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px', fontSize: '0.9rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} color="#105ca8" />
                      <span>{proj.location}</span>
                      <span style={{ margin: '0 4px' }}>•</span>
                      <Calendar size={16} color="#105ca8" />
                      <span>{proj.year}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={16} color="#105ca8" />
                      <span>{proj.scale}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      borderLeft: '3px solid #105ca8'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Hệ thống triển khai:</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{proj.system}</div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0b8645', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp size={16} />
                      {proj.savings}
                    </span>
                    <a
                      href="#trial"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#105ca8',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      <span>Chi tiết</span>
                      <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Project Stats */}
          <div className="intro-core-values-wrapper" style={{ marginTop: '64px' }}>
            <div className="section-header-centered">
              <h2 className="gradient-flow-title">Năng Lực Triển Khai Thực Tế</h2>
              <p>Các con số minh chứng cho uy tín và sự tín nhiệm của đối tác đối với 3AHOME.</p>
            </div>

            <div className="intro-values-grid">
              <div className="value-card">
                <div className="value-number">100+</div>
                <h4>Dự án Hoàn thành</h4>
                <p>Hơn 100 công trình quy mô lớn từ Bắc vào Nam đã đưa vào vận hành ổn định.</p>
              </div>

              <div className="value-card">
                <div className="value-number">20%</div>
                <h4>Tiết kiệm Năng lượng TB</h4>
                <p>Mức tiết kiệm điện bình quân hàng tháng cho các toà nhà áp dụng giải pháp tối ưu Chiller.</p>
              </div>

              <div className="value-card">
                <div className="value-number">99.8%</div>
                <h4>Độ Sẵn Sàng Hệ Thống</h4>
                <p>Hệ thống giám sát SCADA/BMS hoạt động bền bỉ 24/7 với độ trễ thấp và độ tin cậy tuyệt đối.</p>
              </div>

              <div className="value-card">
                <div className="value-number">100%</div>
                <h4>Hài Lòng Từ Chủ Đầu Tư</h4>
                <p>Cam kết đồng hành bảo trì, xử lý kỹ thuật trong vòng 2 giờ kể từ khi tiếp nhận thông tin.</p>
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

export default Project;
