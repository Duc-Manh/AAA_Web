import React, { useEffect, useState } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import {
  Calendar,
  User,
  ArrowRight,
  FileText
} from 'lucide-react';
import project1 from '../../assets/project/1.webp';

interface ArticleItem {
  id: number;
  title: string;
  content: string;
  topic: string;
  time: string;
  author: string;
  image: string;
  status?: number;
}

export const News: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Tự động tải danh sách bài viết từ bảng news trong database 3ahome
    setIsLoading(true);
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          // Lọc các bài viết hiển thị (status === 1: Đăng bài)
          const dbArticles: ArticleItem[] = data.data
            .filter((item: any) => Number(item.status) === 1)
            .map((item: any) => ({
              id: item.id,
              title: item.title,
              content: item.content,
              topic: item.topic,
              time: item.time,
              author: item.author,
              image: item.image || '',
              status: item.status
            }));
          setArticles(dbArticles);
        } else {
          setArticles([]);
        }
      })
      .catch((err) => {
        console.error('Lỗi nạp bài viết từ bảng news:', err);
        setArticles([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Format ngày tháng hiển thị
  const formatDateTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return timeStr;
    }
  };

  // Format đường dẫn ảnh
  const formatImageUrl = (imgPath?: string | null) => {
    if (!imgPath) return project1;
    if (imgPath.startsWith('data:') || imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }
    const cleanFilename = imgPath.split(/[\\/]/).pop();
    return `/uploads/news/${cleanFilename}`;
  };

  const filteredArticles = activeTab === 'all'
    ? articles
    : articles.filter((a) => a.topic === activeTab);

  return (
    <div className="landing-page-root intro-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. News Hero Section */}
      <section className="intro-hero-section">
        <div className="intro-hero-container">
          <h1 className="intro-hero-title">
            Tin tức công nghệ và hoạt động <br />
            doanh nghiệp <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span>
          </h1>

          <p className="intro-hero-subtitle">
            Cập nhật liên tục các xu hướng công nghệ toà nhà thông minh, chính sách chuyển đổi xanh,
            hướng dẫn kỹ thuật và tin tức hoạt động mới nhất.
          </p>
        </div>
      </section>

      {/* 3. News Grid Section */}
      <section className="intro-content-section">
        <div className="intro-content-container">
          {/* Category Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '36px' }}>
            {[
              { id: 'all', name: 'Tất cả bài viết' },
              { id: 'Dự án', name: 'Dự án' },
              { id: 'Tin tức', name: 'Tin tức' },
              { id: 'Sự kiện', name: 'Sự kiện' }
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

          {/* Trạng thái tải bài viết */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <p style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>Đang tải bài viết...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            /* Thông báo khi bảng news trong database chưa có bài nào */
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                maxWidth: '540px',
                margin: '0 auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: '#94a3b8'
                }}
              >
                <FileText size={28} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                Chưa có bài viết nào
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                Hiện tại chưa có bài viết nào trong bảng <code>news</code> của cơ sở dữ liệu.
              </p>
            </div>
          ) : (
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
                      src={formatImageUrl(article.image)}
                      alt={article.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = project1;
                      }}
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
                      {article.topic}
                    </div>
                  </div>

                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="#105ca8" />
                        <span>{formatDateTime(article.time)}</span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.4, marginBottom: '12px' }}>
                      {article.title}
                    </h3>

                    <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px', flexGrow: 1 }}>
                      {article.content}
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
          )}
        </div>
      </section>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
};

export default News;
