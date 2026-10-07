import React, { useEffect, useState } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import {
  MapPin,
  Calendar
} from 'lucide-react';
import project1 from '../../assets/project/1.webp';
import project2 from '../../assets/project/2.webp';
import project3 from '../../assets/project/3.webp';
import project4 from '../../assets/project/4.webp';
import project5 from '../../assets/project/5.webp';
import project6 from '../../assets/project/6.webp';

interface ProjectDbItem {
  id: number;
  type: string;
  title: string;
  content: string;
  place: string;
  start: string;
  year?: string;
  image?: string | null;
  status: number;
}

export const Project: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [projects, setProjects] = useState<ProjectDbItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fallbackImages = [project1, project2, project3, project4, project5, project6];

  const formatProjectImage = (imgPath?: string | null, index = 0) => {
    if (!imgPath) return fallbackImages[index % fallbackImages.length];
    if (imgPath.startsWith('data:') || imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }
    const cleanFilename = imgPath.split(/[\\/]/).pop();
    return `/uploads/project/${cleanFilename}`;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoading(true);
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          // Lọc các dự án hiển thị (status = 2: Đăng bài)
          const visible = data.data.filter((item: any) => Number(item.status) === 2);
          setProjects(visible);
        }
      })
      .catch((err) => {
        console.error('Lỗi tải danh sách dự án:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredProjects = selectedFilter === 'all'
    ? projects
    : projects.filter((p) => {
        const type = (p.type || '').toLowerCase();
        if (selectedFilter === 'commercial') return type.includes('toà nhà') || type.includes('văn phòng') || type.includes('khách sạn');
        if (selectedFilter === 'complex') return type.includes('phức hợp');
        if (selectedFilter === 'hospital') return type.includes('bệnh viện') || type.includes('y tế');
        if (selectedFilter === 'industrial') return type.includes('công nghiệp') || type.includes('nhà máy') || type.includes('dữ liệu') || type.includes('data');
        return type.includes(selectedFilter.toLowerCase());
      });

  return (
    <div className="landing-page-root intro-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. Project Hero Section */}
      <section className="intro-hero-section">
        <div className="intro-hero-container">
          <h1 className="intro-hero-title">

            Dự án <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span> Việt Nam đã triển khai
          </h1>

          <p className="intro-hero-subtitle">
            Khẳng định uy tín và năng lực kỹ thuật thông qua hàng loạt dự án toà nhà văn phòng, khu phức hợp thương mại,
            bệnh viện và nhà máy công nghiệp quy mô lớn trên toàn quốc.
          </p>
        </div>
      </section>

      {/* 3. Projects Showcase Grid */}
      <section className="intro-content-section">
        <div className="intro-content-container">

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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', gridColumn: '1 / -1', fontSize: '0.95rem' }}>
                Đang tải danh sách dự án từ cơ sở dữ liệu...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', gridColumn: '1 / -1', fontSize: '0.95rem' }}>
                Không tìm thấy dự án nào phù hợp!
              </div>
            ) : (
              filteredProjects.map((proj, idx) => (
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
                      src={formatProjectImage(proj.image, idx)}
                      alt={proj.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.src = fallbackImages[idx % fallbackImages.length];
                      }}
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
                      {proj.type}
                    </div>
                  </div>

                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                      {proj.title}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px', fontSize: '0.9rem', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#105ca8" />
                        <span>{proj.place}</span>
                        <span style={{ margin: '0 4px' }}>•</span>
                        <Calendar size={16} color="#105ca8" />
                        <span>{proj.start || proj.year}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '12px',
                        borderRadius: '8px',
                        borderLeft: '3px solid #105ca8'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Hệ thống triển khai:</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                        {proj.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
};

export default Project;
