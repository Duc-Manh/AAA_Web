import React, { useState, useEffect, useRef } from 'react';
import '../dash/Dash.css';
import {
  CheckCircle2,
  Plus,
  Eye,
  Edit3,
  EyeOff,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
  Layers,
  FileText
} from 'lucide-react';
import { DashAside } from '../../components/common/DashAside';
import { DashHeader } from '../../components/common/DashHeader';

interface CurrentUserData {
  id?: number;
  full_name?: string;
  gmail?: string;
  username?: string;
}

export interface NewsItem {
  id: number;
  time: string;
  topic: string;
  title: string;
  content: string;
  image?: string | null;
  author: string;
  status: number; // 1: Đăng bài, 2: Đang ẩn
}

export const DashNews: React.FC = () => {
  const [activeTab] = useState('news');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);

  // Danh sách tin tức
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Tạo bài đăng
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [topic, setTopic] = useState<'Dự án' | 'Tin tức' | 'Sự kiện'>('Tin tức');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Sửa bài đăng
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [editTopic, setEditTopic] = useState<'Dự án' | 'Tin tức' | 'Sự kiện'>('Tin tức');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editStatus, setEditStatus] = useState<number>(1);
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [editImageBase64, setEditImageBase64] = useState<string>('');
  const [editImageFileName, setEditImageFileName] = useState<string>('');
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal Xem ảnh
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const authData = localStorage.getItem('aaa_admin_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setCurrentUser(parsed);
        setAuthor(parsed.full_name || parsed.username || 'Quản Trị Viên 3A');
      } catch {
        // ignore
      }
    }
    fetchNews();
  }, []);

  const currentFullName = currentUser?.full_name || currentUser?.username || 'Quản Trị Viên 3A';

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleLogout = () => {
    localStorage.removeItem('aaa_admin_auth');
    sessionStorage.removeItem('aaa_admin_auth');
    window.location.hash = '#home';
    window.history.pushState(null, '', '/#home');
    window.dispatchEvent(new Event('popstate'));
    window.dispatchEvent(new Event('hashchange'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Tải danh sách bài viết từ server
  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNewsList(data.data);
      }
    } catch (err) {
      console.error('Lỗi nạp bài đăng:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý chọn và nén hình ảnh
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Kiểm tra dung lượng > 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Chọn hình ảnh có dung lượng nhỏ hơn 5mb');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // 2. Định dạng tên file: [dd-mm-yyyy][codeimg]
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const codeimg = Math.random().toString(36).substring(2, 8).toUpperCase();
    const customName = `[${dd}-${mm}-${yyyy}][${codeimg}].jpg`;

    // 3. Resize và nén hình ảnh bằng HTML5 Canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Nén chất lượng JPEG 0.85
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setImagePreview(compressedBase64);
        setImageBase64(compressedBase64);
        setImageFileName(customName);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setImagePreview('');
    setImageBase64('');
    setImageFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Xử lý chọn và nén hình ảnh khi chỉnh sửa bài viết
  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Chọn hình ảnh có dung lượng nhỏ hơn 5mb');
      if (editFileInputRef.current) {
        editFileInputRef.current.value = '';
      }
      return;
    }

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const codeimg = Math.random().toString(36).substring(2, 8).toUpperCase();
    const customName = `[${dd}-${mm}-${yyyy}][${codeimg}].jpg`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setEditImagePreview(compressedBase64);
        setEditImageBase64(compressedBase64);
        setEditImageFileName(customName);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTopic('Tin tức');
    setTitle('');
    setContent('');
    setAuthor(currentFullName);
    removeSelectedImage();
  };

  // Nhấn nút "Trình duyệt" để đăng bài
  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      triggerToast('Vui lòng nhập Tiêu đề bài viết!');
      return;
    }
    if (!content.trim()) {
      triggerToast('Vui lòng nhập Nội dung bài viết!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          title: title.trim(),
          content: content.trim(),
          author: author.trim() || currentFullName,
          imageBase64,
          imageFileName
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerToast('Đã lưu bài viết vào bảng news thành công!');
        setIsCreateOpen(false);
        resetForm();
        fetchNews();
      } else {
        triggerToast(data.message || 'Lỗi lưu bài viết!');
      }
    } catch {
      triggerToast('Lỗi kết nối tới máy chủ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở modal sửa bài viết (cho phép thay thế image)
  const openEditModal = (item: NewsItem) => {
    setEditingItem(item);
    setEditTopic((item.topic as any) || 'Tin tức');
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditAuthor(item.author);
    setEditStatus(item.status);
    setEditImagePreview(item.image ? formatImageUrl(item.image) : '');
    setEditImageBase64('');
    const cleanName = item.image ? (item.image.split(/[\\/]/).pop() || '') : '';
    setEditImageFileName(cleanName);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  // Lưu chỉnh sửa bài viết
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editTitle.trim()) {
      triggerToast('Vui lòng nhập Tiêu đề!');
      return;
    }
    if (!editContent.trim()) {
      triggerToast('Vui lòng nhập Nội dung!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/news/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: editTopic,
          title: editTitle.trim(),
          content: editContent.trim(),
          author: editAuthor.trim() || currentFullName,
          status: editStatus,
          imageBase64: editImageBase64 || null,
          imageFileName: editImageFileName || null
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Đã lưu nội dung sửa vào bảng news thành công!');
        setEditingItem(null);
        fetchNews();
      } else {
        triggerToast(data.message || 'Lỗi cập nhật bài viết!');
      }
    } catch {
      triggerToast('Lỗi kết nối tới máy chủ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ẩn / Đăng lại bài đăng (chuyển status 1: Đăng bài <-> 2: Đang ẩn)
  const handleToggleHideNews = async (item: NewsItem) => {
    const nextStatus = Number(item.status) === 2 ? 1 : 2;
    const actionText = nextStatus === 2 ? 'ẩn' : 'đăng lại';
    try {
      const res = await fetch(`/api/news/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: item.topic,
          title: item.title,
          content: item.content,
          author: item.author,
          status: nextStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Đã ${actionText} bài viết thành công!`);
        fetchNews();
      } else {
        triggerToast(data.message || 'Lỗi thay đổi trạng thái!');
      }
    } catch {
      triggerToast('Lỗi kết nối máy chủ!');
    }
  };

  // Xoá bài đăng và file hình ảnh tương ứng
  const handleDeleteNews = async (item: NewsItem) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xoá bài viết: "${item.title}" và file hình ảnh tương ứng không?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/news/${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerToast('Đã xoá bài viết và hình ảnh thành công!');
        fetchNews();
      } else {
        triggerToast(data.message || 'Lỗi xoá bài viết!');
      }
    } catch {
      triggerToast('Lỗi kết nối máy chủ!');
    }
  };

  // Chuyển đổi đường dẫn ảnh lưu trong DB thành URL hiển thị
  const formatImageUrl = (imgPath?: string | null) => {
    if (!imgPath) return '';
    if (imgPath.startsWith('data:') || imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }
    const cleanFilename = imgPath.split(/[\\/]/).pop();
    return `/uploads/news/${cleanFilename}`;
  };

  // Format ngày giờ hiển thị
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${mins} - ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Thống kê nhanh theo yêu cầu:
  // Tổng số: tất cả hàng trong bảng news
  // Đăng bài: status = 1
  // Đang ẩn: status = 2
  const countPublished = newsList.filter((n) => Number(n.status) === 1).length;
  const countHidden = newsList.filter((n) => Number(n.status) === 2).length;

  return (
    <div className="dash-layout">
      {/* Toast thông báo nhanh */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}
        >
          <CheckCircle2 size={18} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. SIDEBAR ĐIỀU HƯỚNG */}
      <DashAside
        activeTab={activeTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        triggerToast={triggerToast}
      />

      {/* 2. KHU VỰC NỘI DUNG CHÍNH */}
      <div className="dash-main">
        {/* TOP NAVBAR */}
        <DashHeader
          title="Tin Tức và Truyền Thông"
          subtitle="Quản lý các bài đăng Dự án, Tin tức, Sự kiện và truyền thông doanh nghiệp 3AHOME"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
          refreshTitle="Làm mới danh sách tin tức"
          onRefresh={() => {
            fetchNews();
            triggerToast('Đã làm mới dữ liệu tin tức!');
          }}
          triggerToast={triggerToast}
          handleLogout={handleLogout}
        />

        {/* NỘI DUNG TRANG TIN TỨC */}
        <div className="news-dash-container">
          {/* Thanh công cụ và thống kê */}
          <div className="news-toolbar">
            <div className="news-stats-pills">
              <span className="news-stat-pill">
                <FileText size={14} /> Tổng số: <strong>{newsList.length}</strong> bài
              </span>
              <span className="news-stat-pill pill-published">
                <CheckCircle2 size={14} /> Đăng bài: <strong>{countPublished}</strong>
              </span>
              <span className="news-stat-pill pill-hidden">
                <EyeOff size={14} /> Đang ẩn: <strong>{countHidden}</strong>
              </span>
            </div>

            {/* Nút Tạo bài đăng */}
            <button
              type="button"
              className="btn-create-post"
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Tạo bài đăng</span>
            </button>
          </div>

          {/* Bảng dữ liệu bài đăng */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-header-left">
                <div className="dash-card-badge-icon">
                  <Layers size={18} color="#105ca8" />
                </div>
                <div>
                  <h3 className="dash-card-title">Danh sách bài đăng</h3>
                  <p className="dash-card-subtitle">
                    Theo dõi, kiểm duyệt và quản lý toàn bộ các bài đăng trên cổng thông tin 3AHOME
                  </p>
                </div>
              </div>
            </div>

            <div className="dash-table-wrap">
              <table className="dash-accounts-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                    <th style={{ width: '150px' }}>Thời gian đăng</th>
                    <th style={{ width: '110px' }}>Chủ đề</th>
                    <th style={{ minWidth: '220px' }}>Tiêu đề</th>
                    <th style={{ minWidth: '280px' }}>Nội dung</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Hình ảnh</th>
                    <th style={{ width: '150px' }}>Tác giả</th>
                    <th style={{ width: '140px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '180px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        Đang tải danh sách bài viết...
                      </td>
                    </tr>
                  ) : newsList.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <FileText size={36} color="#94a3b8" />
                          <span>Chưa có bài đăng nào. Nhấn <strong>"Tạo bài đăng"</strong> để thêm bài mới!</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    newsList.map((item, index) => {
                      const imgUrl = formatImageUrl(item.image);
                      const imgName = item.image ? item.image.split(/[\\/]/).pop() || '' : '';

                      return (
                        <tr key={item.id}>
                          {/* STT */}
                          <td style={{ textAlign: 'center' }}>
                            <span className="dash-stt-badge">{index + 1}</span>
                          </td>

                          {/* Thời gian đăng */}
                          <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                            {formatDateTime(item.time)}
                          </td>

                          {/* Chủ đề */}
                          <td>
                            <span
                              className={
                                item.topic === 'Dự án'
                                  ? 'topic-badge-duan'
                                  : item.topic === 'Tin tức'
                                    ? 'topic-badge-tintuc'
                                    : 'topic-badge-sukien'
                              }
                            >
                              {item.topic}
                            </span>
                          </td>

                          {/* Tiêu đề */}
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>
                            <div style={{ maxWidth: '280px', whiteSpace: 'normal', lineHeight: '1.4' }}>
                              {item.title}
                            </div>
                          </td>

                          {/* Nội dung */}
                          <td>
                            <div
                              style={{
                                maxWidth: '360px',
                                minWidth: '220px',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                lineHeight: '1.5',
                                color: '#475569',
                                fontSize: '0.84rem'
                              }}
                              title={item.content}
                            >
                              {item.content}
                            </div>
                          </td>

                          {/* Hình ảnh (Nút Xem) */}
                          <td style={{ textAlign: 'center' }}>
                            {item.image ? (
                              <button
                                type="button"
                                className="btn-tbl-action btn-tbl-view"
                                onClick={() => setViewingImage({ url: imgUrl, name: imgName })}
                                title="Xem hình ảnh đính kèm"
                              >
                                <Eye size={14} />
                                <span>Xem</span>
                              </button>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Không có</span>
                            )}
                          </td>

                          {/* Tác giả */}
                          <td style={{ fontWeight: 500, color: '#1e293b' }}>
                            {item.author}
                          </td>

                          {/* Trạng thái: hiển thị Đăng bài (status = 1) hoặc Đang ẩn (status = 2) */}
                          <td style={{ textAlign: 'center' }}>
                            {Number(item.status) === 1 ? (
                              <span className="status-pill-2">Đăng bài</span>
                            ) : (
                              <span className="status-pill-3">Đang ẩn</span>
                            )}
                          </td>

                          {/* Thao tác (Sửa, Ẩn/Hiện, Xoá) */}
                          <td style={{ textAlign: 'center' }}>
                            <div className="news-table-actions" style={{ justifyContent: 'center' }}>
                              {/* Nút Sửa */}
                              <button
                                type="button"
                                className="btn-tbl-action btn-tbl-edit"
                                onClick={() => openEditModal(item)}
                                title="Sửa nội dung bài viết"
                              >
                                <Edit3 size={13} />
                                <span>Sửa</span>
                              </button>

                              {/* Nút Ẩn / Hiện */}
                              <button
                                type="button"
                                className={`btn-tbl-action ${Number(item.status) === 2 ? 'btn-tbl-view' : 'btn-tbl-hide'}`}
                                onClick={() => handleToggleHideNews(item)}
                                title={Number(item.status) === 2 ? 'Đăng lại bài viết' : 'Ẩn bài viết khỏi trang chủ'}
                              >
                                <EyeOff size={13} />
                                <span>{Number(item.status) === 2 ? 'Hiện' : 'Ẩn'}</span>
                              </button>

                              {/* Nút Xoá */}
                              <button
                                type="button"
                                className="btn-tbl-action btn-tbl-del"
                                onClick={() => handleDeleteNews(item)}
                                title="Xoá bài viết và hình ảnh vĩnh viễn"
                              >
                                <Trash2 size={13} />
                                <span>Xoá</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MODAL: TẠO BÀI ĐĂNG
          ========================================================================= */}
      {isCreateOpen && (
        <div className="dash-modal-overlay" onClick={() => !isSubmitting && setIsCreateOpen(false)}>
          <div
            className="dash-modal-card"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="dash-modal-header">
              <div className="dash-modal-title">
                <FileText size={20} color="#105ca8" />
                <span>Tạo Bài Đăng Mới</span>
              </div>
              <button
                type="button"
                className="dash-modal-close-btn"
                onClick={() => !isSubmitting && setIsCreateOpen(false)}
                title="Đóng modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitNews}>
              <div className="dash-modal-body">
                {/* 1. Chọn Chủ đề */}
                <div className="dash-field-group dash-form-full">
                  <label>Chủ đề bài đăng *</label>
                  <div className="news-topic-group">
                    {(['Dự án', 'Tin tức', 'Sự kiện'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`news-topic-btn ${topic === t ? 'active' : ''}`}
                        onClick={() => setTopic(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Ô nhập Tiêu đề */}
                <div className="dash-field-group dash-form-full">
                  <label htmlFor="news-title">Tiêu đề bài viết *</label>
                  <input
                    id="news-title"
                    type="text"
                    placeholder="Nhập tiêu đề tin tức, dự án hoặc sự kiện..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* 3. Ô nhập Tác giả */}
                <div className="dash-field-group dash-form-full">
                  <label htmlFor="news-author">Tác giả *</label>
                  <input
                    id="news-author"
                    type="text"
                    placeholder="Tên tác giả..."
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    required
                  />
                </div>

                {/* 4. Ô nhập Nội dung */}
                <div className="dash-field-group dash-form-full">
                  <label htmlFor="news-content">Nội dung bài viết *</label>
                  <textarea
                    id="news-content"
                    rows={5}
                    placeholder="Soạn thảo nội dung chi tiết bài đăng..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>

                {/* 5. Nút Tải hình ảnh */}
                <div className="dash-field-group dash-form-full">
                  <label>Hình ảnh bài đăng</label>

                  {/* Input file ẩn */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                  />

                  {imagePreview ? (
                    <div className="news-preview-box">
                      <img src={imagePreview} alt="Preview" className="news-preview-thumb" />
                      <div className="news-preview-info">
                        <span className="news-preview-name">{imageFileName}</span>
                        <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>
                          ✓ Đã resize và nén chuẩn hoá
                        </span>
                      </div>
                      <button
                        type="button"
                        className="news-preview-remove"
                        onClick={removeSelectedImage}
                        title="Xoá ảnh đã chọn"
                      >
                        Xoá ảnh
                      </button>
                    </div>
                  ) : (
                    <div className="news-upload-card">
                      <ImageIcon size={32} color="#94a3b8" />
                      <button
                        type="button"
                        className="news-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={15} />
                        <span>Tải hình ảnh</span>
                      </button>
                      <p className="news-upload-hint">
                        💡 Hỗ trợ JPG, PNG, WEBP. Dung lượng tối đa: <strong>5MB</strong>. Tự động đổi tên dạng{' '}
                        <code>[dd-mm-yyyy][codeimg]</code> và nén ảnh.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer (Nút Đăng bài) */}
              <div className="dash-modal-footer">
                <button
                  type="button"
                  className="dash-modal-close-btn"
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontWeight: 600,
                    fontSize: '0.86rem'
                  }}
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-create-post"
                  style={{ padding: '9px 22px' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Đăng bài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. MODAL: SỬA BÀI ĐĂNG (KHÔNG SỬA IMAGE)
          ========================================================================= */}
      {editingItem && (
        <div className="dash-modal-overlay" onClick={() => !isSubmitting && setEditingItem(null)}>
          <div
            className="dash-modal-card"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-modal-header">
              <div className="dash-modal-title">
                <Edit3 size={20} color="#2563eb" />
                <span>Sửa Bài Đăng #{editingItem.id}</span>
              </div>
              <button
                type="button"
                className="dash-modal-close-btn"
                onClick={() => !isSubmitting && setEditingItem(null)}
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="dash-modal-body">
                {/* Chủ đề */}
                <div className="dash-field-group dash-form-full">
                  <label>Chủ đề bài đăng *</label>
                  <div className="news-topic-group">
                    {(['Dự án', 'Tin tức', 'Sự kiện'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`news-topic-btn ${editTopic === t ? 'active' : ''}`}
                        onClick={() => setEditTopic(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tiêu đề */}
                <div className="dash-field-group dash-form-full">
                  <label htmlFor="edit-news-title">Tiêu đề *</label>
                  <input
                    id="edit-news-title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Tác giả */}
                <div className="dash-field-group">
                  <label htmlFor="edit-news-author">Tác giả *</label>
                  <input
                    id="edit-news-author"
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    required
                  />
                </div>

                {/* Trạng thái */}
                <div className="dash-field-group">
                  <label htmlFor="edit-news-status">Trạng thái</label>
                  <select
                    id="edit-news-status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(Number(e.target.value))}
                  >
                    <option value={1}>1 - Đăng bài</option>
                    <option value={2}>2 - Đang ẩn</option>
                  </select>
                </div>

                {/* Nội dung */}
                <div className="dash-field-group dash-form-full">
                  <label htmlFor="edit-news-content">Nội dung *</label>
                  <textarea
                    id="edit-news-content"
                    rows={6}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    required
                  />
                </div>

                {/* Khung hiển thị & thay thế hình ảnh */}
                <div className="dash-field-group dash-form-full">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                      Hình ảnh bài viết
                    </label>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      (Chọn ảnh mới để thay thế, tối đa 5MB)
                    </span>
                  </div>

                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleEditImageSelect}
                  />

                  {editImagePreview ? (
                    <div className="news-preview-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="news-preview-box" style={{ flex: 1 }}>
                        <img
                          src={editImagePreview}
                          alt="Hình ảnh bài viết"
                          className="news-preview-thumb"
                          style={{ width: '80px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <div className="news-preview-info">
                          <span className="news-preview-name">
                            {editImageFileName || 'Hình ảnh hiện tại'}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: editImageBase64 ? '#16a34a' : '#64748b', fontWeight: editImageBase64 ? 600 : 400 }}>
                            {editImageBase64 ? '✓ Đã tải ảnh mới (sẽ cập nhật khi nhấn Lưu)' : 'Ảnh hiện tại trong cơ sở dữ liệu'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button
                          type="button"
                          className="news-upload-btn"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          onClick={() => editFileInputRef.current?.click()}
                          title="Chọn ảnh khác để thay thế"
                        >
                          <Upload size={14} />
                          <span>Thay đổi ảnh</span>
                        </button>
                        {editImageBase64 && (
                          <button
                            type="button"
                            className="news-preview-remove"
                            onClick={() => {
                              // Hoàn tác về ảnh ban đầu của bài viết
                              setEditImagePreview(editingItem.image ? formatImageUrl(editingItem.image) : '');
                              setEditImageBase64('');
                              setEditImageFileName(editingItem.image ? (editingItem.image.split(/[\\/]/).pop() || '') : '');
                              if (editFileInputRef.current) editFileInputRef.current.value = '';
                            }}
                            title="Huỷ ảnh mới, giữ lại ảnh cũ"
                          >
                            Hoàn tác
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="news-upload-card">
                      <ImageIcon size={32} color="#94a3b8" />
                      <button
                        type="button"
                        className="news-upload-btn"
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        <Upload size={15} />
                        <span>Tải hình ảnh thay thế</span>
                      </button>
                      <p className="news-upload-hint">
                        💡 Hỗ trợ JPG, PNG, WEBP. Dung lượng tối đa: <strong>5MB</strong>. Tự động đổi tên dạng{' '}
                        <code>[dd-mm-yyyy][codeimg]</code> và nén ảnh.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="dash-modal-footer">
                <button
                  type="button"
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setEditingItem(null)}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-create-post"
                  style={{ padding: '9px 22px' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. MODAL: XEM TRƯỚC HÌNH ẢNH [dd-mm-yyyy][codeimg]
          ========================================================================= */}
      {viewingImage && (
        <div className="dash-modal-overlay" onClick={() => setViewingImage(null)}>
          <div
            className="dash-modal-card"
            style={{ maxWidth: '720px', padding: '0', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-modal-header" style={{ padding: '14px 20px' }}>
              <div className="dash-modal-title">
                <ImageIcon size={18} color="#105ca8" />
                <span style={{ fontSize: '0.88rem' }}>{viewingImage.name}</span>
              </div>
              <button
                type="button"
                className="dash-modal-close-btn"
                onClick={() => setViewingImage(null)}
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px', background: '#0f172a', textAlign: 'center' }}>
              <img
                src={viewingImage.url}
                alt={viewingImage.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: '6px'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect fill="%23334155" width="300" height="200"/><text fill="%2394a3b8" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14">Không thể tải hình ảnh</text></svg>';
                }}
              />
            </div>
            <div
              style={{
                padding: '12px 20px',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: '#64748b'
              }}
            >
              <span>Mã ảnh: <strong>{viewingImage.name}</strong></span>
              <button
                type="button"
                style={{
                  background: '#e2e8f0',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setViewingImage(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashNews;
