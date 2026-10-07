import React, { useState, useEffect, useCallback } from 'react';
import './DashPopup.css';
import {
  Bell,
  CheckCircle2,
  X,
  Minus,
  RefreshCw,
  FolderKanban,
  Newspaper,
  Clock,
  MapPin,
  Calendar,
  Layers,
  User,
  Tag
} from 'lucide-react';

export interface PendingProjectItem {
  id: number;
  time: string;
  type: string;
  title: string;
  content: string;
  place: string;
  year?: string;
  start?: string;
  image?: string | null;
  status: number;
}

export interface PendingNewsItem {
  id: number;
  time: string;
  topic: string;
  title: string;
  content: string;
  image?: string | null;
  author: string;
  status: number;
}

interface DashPopupProps {
  onApprovalDone?: () => void;
}

export const DashPopup: React.FC<DashPopupProps> = ({ onApprovalDone }) => {
  const [pendingProjects, setPendingProjects] = useState<PendingProjectItem[]>([]);
  const [pendingNews, setPendingNews] = useState<PendingNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'projects' | 'news'>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Format thời gian hiển thị thân thiện
  const formatDateTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
      }
    } catch {
      // ignore
    }
    return timeStr;
  };

  // Nạp danh sách các mục có status = 1 (Trình duyệt) từ database 3ahome
  const fetchPendingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resProj, resNews] = await Promise.all([
        fetch('/api/projects').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/news').then((r) => r.json()).catch(() => ({ data: [] }))
      ]);

      if (resProj && Array.isArray(resProj.data)) {
        const filteredProjects = resProj.data.filter(
          (p: PendingProjectItem) => Number(p.status) === 1
        );
        setPendingProjects(filteredProjects);
      }

      if (resNews && Array.isArray(resNews.data)) {
        const filteredNews = resNews.data.filter(
          (n: PendingNewsItem) => Number(n.status) === 1
        );
        setPendingNews(filteredNews);
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu trình duyệt DashPopup:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingData();

    // Định kỳ kiểm tra mỗi 15 giây để tự động cập nhật
    const interval = setInterval(() => {
      fetchPendingData();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchPendingData]);

  const totalCount = pendingProjects.length + pendingNews.length;

  // Nếu không có bất kỳ hàng nào có status = 1 thì không hiển thị
  if (totalCount === 0) {
    return null;
  }

  // Khi người dùng bấm đóng tạm thời
  if (isDismissed) {
    return (
      <div className="dash-popup-container">
        <button
          type="button"
          className="dash-popup-minimized-btn"
          onClick={() => setIsDismissed(false)}
          title="Có yêu cầu trình duyệt mới! Nhấn để xem chi tiết"
        >
          <Bell size={18} className="dash-popup-bell-animated" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Trình duyệt</span>
          <span className="dash-popup-min-badge">{totalCount}</span>
        </button>
      </div>
    );
  }

  // Khi đang ở trạng thái thu nhỏ (minimized)
  if (isMinimized) {
    return (
      <div className="dash-popup-container">
        <button
          type="button"
          className="dash-popup-minimized-btn"
          onClick={() => setIsMinimized(false)}
          title="Mở rộng danh sách trình duyệt"
        >
          <Bell size={18} className="dash-popup-bell-animated" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Có {totalCount} yêu cầu chờ duyệt</span>
          <span className="dash-popup-min-badge">{totalCount}</span>
        </button>
      </div>
    );
  }

  // Phê duyệt dự án: Cập nhật status = 2 vào database và xoá ngay khỏi danh sách hiển thị
  const handleApproveProject = async (proj: PendingProjectItem) => {
    if (!window.confirm(`Xác nhận phê duyệt và đăng bài cho dự án "${proj.title}"?`)) {
      return;
    }
    setApprovingId(`proj-${proj.id}`);
    try {
      const res = await fetch(`/api/projects/${proj.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 2 })
      });
      const data = await res.json();
      if (data.success) {
        // Ngay lập tức loại bỏ khỏi danh sách không còn hiển thị trong popup nữa
        setPendingProjects((prev) => prev.filter((p) => p.id !== proj.id));
        if (onApprovalDone) onApprovalDone();
      } else {
        alert(data.message || 'Lỗi phê duyệt dự án!');
      }
    } catch (err) {
      console.error('Lỗi phê duyệt dự án:', err);
    } finally {
      setApprovingId(null);
    }
  };

  // Phê duyệt tin tức: Cập nhật status = 2 vào database và xoá ngay khỏi danh sách hiển thị
  const handleApproveNews = async (news: PendingNewsItem) => {
    if (!window.confirm(`Xác nhận phê duyệt và đăng bài cho bài viết "${news.title}"?`)) {
      return;
    }
    setApprovingId(`news-${news.id}`);
    try {
      // Gửi PATCH cập nhật status = 2
      let res = await fetch(`/api/news/${news.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 2 })
      });

      // Nếu PATCH không thành công, dự phòng gửi PUT cập nhật status
      if (!res.ok) {
        res = await fetch(`/api/news/${news.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: news.topic,
            title: news.title,
            content: news.content,
            author: news.author,
            status: 2
          })
        });
      }

      const data = await res.json();
      if (data.success) {
        // Ngay lập tức loại bỏ khỏi danh sách không còn hiển thị trong popup nữa
        setPendingNews((prev) => prev.filter((n) => n.id !== news.id));
        if (onApprovalDone) onApprovalDone();
      } else {
        alert(data.message || 'Lỗi phê duyệt bài viết!');
      }
    } catch (err) {
      console.error('Lỗi phê duyệt bài viết:', err);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="dash-popup-container" role="dialog" aria-label="Thông báo phê duyệt">
      <div className="dash-popup-card">
        {/* Header Thông báo */}
        <div className="dash-popup-header">
          <div className="dash-popup-header-title">
            <Bell size={18} className="dash-popup-bell-animated" />
            <span>Yêu cầu Trình duyệt</span>
            <span className="dash-popup-badge-count">{totalCount}</span>
          </div>
          <div className="dash-popup-actions">
            <button
              type="button"
              className="dash-popup-icon-btn"
              onClick={fetchPendingData}
              title="Làm mới dữ liệu"
              disabled={isLoading}
            >
              <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            </button>
            <button
              type="button"
              className="dash-popup-icon-btn"
              onClick={() => setIsMinimized(true)}
              title="Thu nhỏ thông báo"
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              className="dash-popup-icon-btn"
              onClick={() => setIsDismissed(true)}
              title="Đóng tạm thời"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab chuyển đổi Dự án / Tin tức */}
        <div className="dash-popup-tabs">
          <button
            type="button"
            className={`dash-popup-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả <span className="dash-popup-tab-count">{totalCount}</span>
          </button>
          <button
            type="button"
            className={`dash-popup-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FolderKanban size={13} />
            Dự án <span className="dash-popup-tab-count">{pendingProjects.length}</span>
          </button>
          <button
            type="button"
            className={`dash-popup-tab-btn ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => setActiveTab('news')}
          >
            <Newspaper size={13} />
            Bài viết <span className="dash-popup-tab-count">{pendingNews.length}</span>
          </button>
        </div>

        {/* Danh sách nội dung chờ duyệt */}
        <div className="dash-popup-body">
          {/* 1. DANH SÁCH DỰ ÁN CHỜ DUYỆT (bảng project) */}
          {(activeTab === 'all' || activeTab === 'projects') &&
            pendingProjects.map((proj) => {
              const isApproving = approvingId === `proj-${proj.id}`;
              return (
                <div key={`proj-${proj.id}`} className="dash-popup-item">
                  <div className="dash-popup-item-header">
                    {/* Hình ảnh theo cột image */}
                    {proj.image ? (
                      <img
                        src={proj.image}
                        alt={proj.title}
                        className="dash-popup-item-thumb"
                        onClick={() => setPreviewImage({ url: proj.image!, title: proj.title })}
                        title="Nhấn để xem trước hình ảnh phóng to"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="dash-popup-item-thumb-placeholder">
                        <FolderKanban size={26} />
                      </div>
                    )}

                    <div className="dash-popup-item-info">
                      {/* Cột type */}
                      <span className="dash-popup-item-type-badge dash-popup-badge-proj">
                        <FolderKanban size={10} /> {proj.type || 'Chung'}
                      </span>
                      {/* Cột title */}
                      <h4 className="dash-popup-item-title" title={proj.title}>
                        {proj.title}
                      </h4>
                    </div>
                  </div>

                  {/* Chi tiết các cột: time, place, year, start */}
                  <div className="dash-popup-fields-grid">
                    <div className="dash-popup-field-row" title={`Thời gian gửi: ${proj.time}`}>
                      <Clock size={12} className="dash-popup-field-label" />
                      <span className="dash-popup-field-label">Thời gian:</span>
                      <span className="dash-popup-field-value">{formatDateTime(proj.time)}</span>
                    </div>

                    <div className="dash-popup-field-row" title={`Địa điểm: ${proj.place}`}>
                      <MapPin size={12} className="dash-popup-field-label" />
                      <span className="dash-popup-field-label">Địa điểm:</span>
                      <span className="dash-popup-field-value">{proj.place || 'Chưa cập nhật'}</span>
                    </div>

                    <div className="dash-popup-field-row" title={`Năm thực hiện: ${proj.year}`}>
                      <Calendar size={12} className="dash-popup-field-label" />
                      <span className="dash-popup-field-label">Năm:</span>
                      <span className="dash-popup-field-value">{proj.year || '—'}</span>
                    </div>

                    <div className="dash-popup-field-row" title={`Bắt đầu: ${proj.start}`}>
                      <Layers size={12} className="dash-popup-field-label" />
                      <span className="dash-popup-field-label">Bắt đầu:</span>
                      <span className="dash-popup-field-value">{proj.start || '—'}</span>
                    </div>
                  </div>

                  {/* Cột content */}
                  {proj.content && (
                    <div className="dash-popup-content-box">
                      <span className="dash-popup-content-label">Nội dung dự án:</span>
                      {proj.content}
                    </div>
                  )}

                  {/* Nút hành động */}
                  <div className="dash-popup-item-actions">
                    <button
                      type="button"
                      className="dash-popup-btn-approve"
                      disabled={isApproving}
                      onClick={() => handleApproveProject(proj)}
                      title="Phê duyệt dự án (Chuyển sang Đăng bài)"
                    >
                      <CheckCircle2 size={14} />
                      {isApproving ? 'Đang duyệt...' : 'Duyệt đăng bài'}
                    </button>
                  </div>
                </div>
              );
            })}

          {/* 2. DANH SÁCH BÀI VIẾT CHỜ DUYỆT (bảng news) */}
          {(activeTab === 'all' || activeTab === 'news') &&
            pendingNews.map((item) => {
              const isApproving = approvingId === `news-${item.id}`;
              return (
                <div key={`news-${item.id}`} className="dash-popup-item">
                  <div className="dash-popup-item-header">
                    {/* Hình ảnh theo cột image */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="dash-popup-item-thumb"
                        onClick={() => setPreviewImage({ url: item.image!, title: item.title })}
                        title="Nhấn để xem trước hình ảnh phóng to"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="dash-popup-item-thumb-placeholder">
                        <Newspaper size={26} />
                      </div>
                    )}

                    <div className="dash-popup-item-info">
                      {/* Cột topic */}
                      <span className="dash-popup-item-type-badge dash-popup-badge-news">
                        <Tag size={10} /> {item.topic || 'Tin tức'}
                      </span>
                      {/* Cột title */}
                      <h4 className="dash-popup-item-title" title={item.title}>
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  {/* Chi tiết các cột: time, author */}
                  <div className="dash-popup-fields-grid">
                    <div className="dash-popup-field-row" title={`Thời gian đăng: ${item.time}`}>
                      <Clock size={12} className="dash-popup-field-label" />
                      <span className="dash-popup-field-label">Thời gian:</span>
                      <span className="dash-popup-field-value">{formatDateTime(item.time)}</span>
                    </div>

                    <div className="dash-popup-field-row" title={`Tác giả: ${item.author}`}>
                      <User size={12} className="dash-popup-field-label" />
                      <span className="dash-popup-field-label">Tác giả:</span>
                      <span className="dash-popup-field-value">{item.author || 'Chưa rõ'}</span>
                    </div>
                  </div>

                  {/* Cột content */}
                  {item.content && (
                    <div className="dash-popup-content-box">
                      <span className="dash-popup-content-label">Nội dung bài viết:</span>
                      {item.content}
                    </div>
                  )}

                  {/* Nút hành động */}
                  <div className="dash-popup-item-actions">
                    <button
                      type="button"
                      className="dash-popup-btn-approve"
                      disabled={isApproving}
                      onClick={() => handleApproveNews(item)}
                      title="Phê duyệt bài viết (Chuyển sang Đăng bài)"
                    >
                      <CheckCircle2 size={14} />
                      {isApproving ? 'Đang duyệt...' : 'Duyệt đăng bài'}
                    </button>
                  </div>
                </div>
              );
            })}

          {/* Trạng thái trống của Tab đang chọn */}
          {activeTab === 'projects' && pendingProjects.length === 0 && (
            <div className="dash-popup-empty">Không có dự án nào đang chờ duyệt.</div>
          )}
          {activeTab === 'news' && pendingNews.length === 0 && (
            <div className="dash-popup-empty">Không có bài viết nào đang chờ duyệt.</div>
          )}
        </div>

        {/* Footer tổng quan */}
        <div className="dash-popup-footer">
          <span>
            {pendingProjects.length} dự án &bull; {pendingNews.length} bài viết cần phê duyệt
          </span>
          <span>Hệ thống 3AHOME</span>
        </div>
      </div>

      {/* Cửa sổ xem trước hình ảnh phóng to */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '24px'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              animation: 'dashPopupSlideIn 0.25s ease forwards'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal xem ảnh */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}
            >
              <span
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '85%'
                }}
              >
                Xem trước hình ảnh: {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  color: '#64748b',
                  display: 'inline-flex'
                }}
                title="Đóng (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Vùng hiển thị ảnh */}
            <div
              style={{
                padding: '16px',
                background: '#090d16',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '260px',
                maxHeight: '70vh',
                overflow: 'hidden'
              }}
            >
              <img
                src={previewImage.url}
                alt={previewImage.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '66vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect fill="%23334155" width="300" height="200"/><text fill="%2394a3b8" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14">Không thể tải hình ảnh</text></svg>';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashPopup;
