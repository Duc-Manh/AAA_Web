import React, { useState, useEffect, useRef } from 'react';
import '../dash/Dash.css';
import {
  CheckCircle2,
  FolderKanban,
  Search,
  Plus,
  Eye,
  Edit3,
  EyeOff,
  Trash2,
  Calendar,
  MapPin,
  Building,
  Upload,
  X,
  CheckCircle,
  Clock
} from 'lucide-react';
import { DashAside } from '../../components/common/DashAside';
import { DashHeader } from '../../components/common/DashHeader';
import { DashPopup } from '../../components/common/DashPopup';

interface CurrentUserData {
  id?: number;
  full_name?: string;
  gmail?: string;
  username?: string;
  room?: string;
  position?: string;
}

export interface ProjectItem {
  id: number;
  time: string;
  type: string;
  title: string;
  content: string;
  place: string;
  year?: string;
  start: string;
  image?: string | null;
  status: number; // 1: Trình duyệt, 2: Đăng bài, 3: Đang ẩn
}

export const DashProject: React.FC = () => {
  const [activeTab] = useState('projects');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);

  // Danh sách dự án từ database 3ahome
  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Modal Tạo / Chỉnh sửa dự án
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formType, setFormType] = useState('Toà nhà văn phòng');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPlace, setFormPlace] = useState('Hà Nội');
  const [formStart, setFormStart] = useState(new Date().getFullYear().toString());
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Xem trước hình ảnh
  const [previewImageModal, setPreviewImageModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: ''
  });

  // Modal Xem chi tiết dự án
  const [viewDetailProject, setViewDetailProject] = useState<ProjectItem | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const authData = localStorage.getItem('aaa_admin_auth');
    if (authData) {
      try {
        setCurrentUser(JSON.parse(authData));
      } catch {
        // ignore
      }
    }
    fetchProjects();
  }, []);

  // Lấy danh sách dự án từ database
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProjectsList(data.data);
      }
    } catch (err) {
      console.error('Lỗi nạp danh sách dự án:', err);
    } finally {
      setIsLoading(false);
    }
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

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const currentFullName = currentUser?.full_name || currentUser?.username || 'Quản Trị Viên 3A';

  // Format link hình ảnh từ database
  const formatImageUrl = (imgPath?: string | null) => {
    if (!imgPath) return '';
    if (imgPath.startsWith('data:image')) return imgPath;
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
    let cleanPath = imgPath.replace(/\\/g, '/');
    if (cleanPath.startsWith('/AAA_Backend/')) {
      cleanPath = cleanPath.replace('/AAA_Backend/', '/');
    } else if (cleanPath.startsWith('AAA_Backend/')) {
      cleanPath = cleanPath.replace('AAA_Backend/', '/');
    }
    return cleanPath;
  };

  // Xử lý chọn hình ảnh và nén
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

    // 2. Rename tên file có dạng proj[dd-mm-yy][codeimg]
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const codeimg = Math.random().toString(36).substring(2, 8).toUpperCase();
    const customName = `proj[${dd}-${mm}-${yy}][${codeimg}].jpg`;

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

  // Mở modal Thêm dự án mới
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormType('Toà nhà văn phòng');
    setFormTitle('');
    setFormContent('');
    setFormPlace('Hà Nội');
    setFormStart(new Date().getFullYear().toString());
    setImageBase64('');
    setImageFileName('');
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsModalOpen(true);
  };

  // Mở modal Sửa
  const handleOpenEditModal = (proj: ProjectItem) => {
    setModalMode('edit');
    setEditingId(proj.id);
    setFormType(proj.type || 'Toà nhà văn phòng');
    setFormTitle(proj.title || '');
    setFormContent(proj.content || '');
    setFormPlace(proj.place || '');
    setFormStart(proj.start || proj.year || '');
    setImageBase64('');
    setImageFileName('');
    setImagePreview(proj.image ? formatImageUrl(proj.image) : '');
    setIsModalOpen(true);
  };

  // Nhấn nút Trình duyệt (Lưu dữ liệu vào database)
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formType.trim()) {
      alert('Vui lòng nhập hoặc chọn Loại công trình!');
      return;
    }
    if (!formTitle.trim()) {
      alert('Vui lòng nhập Tên dự án!');
      return;
    }
    if (!formContent.trim()) {
      alert('Vui lòng nhập Hệ thống triển khai!');
      return;
    }
    if (!formPlace.trim()) {
      alert('Vui lòng nhập Địa điểm triển khai!');
      return;
    }
    if (!formStart.trim()) {
      alert('Vui lòng nhập Năm triển khai!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const payload = {
          type: formType.trim(),
          title: formTitle.trim(),
          content: formContent.trim(),
          place: formPlace.trim(),
          start: formStart.trim(),
          year: formStart.trim(),
          imageBase64: imageBase64 || null,
          imageFileName: imageFileName || null
        };

        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          triggerToast('Đã đăng bài dự án thành công!');
          setIsModalOpen(false);
          await fetchProjects();
        } else {
          alert(data.message || 'Lỗi lưu dự án vào cơ sở dữ liệu!');
        }
      } else if (modalMode === 'edit' && editingId) {
        const payload = {
          type: formType.trim(),
          title: formTitle.trim(),
          content: formContent.trim(),
          place: formPlace.trim(),
          start: formStart.trim(),
          year: formStart.trim()
        };

        const res = await fetch(`/api/projects/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          triggerToast('Đã cập nhật thông tin dự án thành công!');
          setIsModalOpen(false);
          await fetchProjects();
        } else {
          alert(data.message || 'Lỗi cập nhật dự án!');
        }
      }
    } catch (err) {
      console.error('Lỗi gửi dữ liệu dự án:', err);
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ẩn / Đăng lại dự án (status = 1: Trình duyệt, status = 2: Đăng bài, status = 3: Ẩn)
  const handleToggleHideProject = async (proj: ProjectItem) => {
    // Nếu status đang là 2 (Đăng bài) -> chuyển sang 3 (Ẩn)
    // Nếu status đang là 3 (Ẩn) hoặc 1 (Trình duyệt) -> chuyển sang 2 (Đăng bài)
    const nextStatus = Number(proj.status) === 2 ? 3 : 2;
    const actionText = nextStatus === 3 ? 'ẩn' : 'đăng bài';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} dự án "${proj.title}" không?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${proj.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Đã ${actionText} dự án "${proj.title}"!`);
        await fetchProjects();
      } else {
        alert(data.message || 'Lỗi thay đổi trạng thái!');
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
    }
  };

  // Xoá dự án
  const handleDeleteProject = async (id: number, title: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xoá hoàn toàn dự án "${title}" không?`)) {
      try {
        const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          triggerToast(`Đã xoá dự án "${title}" thành công!`);
          await fetchProjects();
        } else {
          alert(data.message || 'Lỗi khi xoá dự án!');
        }
      } catch (err) {
        console.error('Lỗi khi xoá dự án:', err);
      }
    }
  };

  // Thống kê: 3 card
  // Card 1: Tổng số dự án (tất cả hàng)
  // Card 2: Đăng bài (status = 2)
  // Card 3: Đang ẩn (status = 3)
  const totalProjects = projectsList.length;
  const publishedProjects = projectsList.filter((p) => Number(p.status) === 2).length;
  const hiddenProjects = projectsList.filter((p) => Number(p.status) === 3).length;

  // Lọc danh sách dự án: 4 tab (Tất cả, Trình duyệt, Đăng bài, Đang ẩn)
  const filteredProjects = projectsList.filter((p) => {
    const matchesSearch =
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.place || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.start || p.year || '').toString().toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'pending') return matchesSearch && Number(p.status) === 1;
    if (selectedFilter === 'published') return matchesSearch && Number(p.status) === 2;
    if (selectedFilter === 'hidden') return matchesSearch && Number(p.status) === 3;
    return matchesSearch;
  });

  // Hiển thị nhãn trạng thái theo giá trị cột status bảng project database 3ahome:
  // status = 1: Trình duyệt
  // status = 2: Đăng bài
  // status = 3: Đang ẩn
  const renderStatusBadge = (status: number) => {
    const num = Number(status);
    if (num === 1) {
      return (
        <span
          style={{
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: '#fef3c7',
            color: '#d97706',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Clock size={13} />
          Trình duyệt
        </span>
      );
    }
    if (num === 2) {
      return (
        <span
          style={{
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: '#dcfce7',
            color: '#16a34a',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <CheckCircle size={13} />
          Đăng bài
        </span>
      );
    }
    if (num === 3) {
      return (
        <span
          style={{
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: '#f1f5f9',
            color: '#64748b',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <EyeOff size={13} />
          Đang ẩn
        </span>
      );
    }
    return (
      <span
        style={{
          padding: '5px 12px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 600,
          background: '#f3f4f6',
          color: '#4b5563'
        }}
      >
        Không xác định
      </span>
    );
  };

  return (
    <div className="dash-layout">
      {/* Toast thông báo */}
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
          title="Quản Lý Dự Án Triển Khai"
          subtitle="Giám sát danh mục công trình BMS, hợp đồng kỹ thuật và tiến độ thi công thông minh 3AHOME"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
          refreshTitle="Làm mới dự án"
          onRefresh={() => {
            fetchProjects();
            triggerToast('Đã cập nhật danh sách dự án từ cơ sở dữ liệu!');
          }}
          triggerToast={triggerToast}
          handleLogout={handleLogout}
        />

        {/* NỘI DUNG TRANG DỰ ÁN */}
        <div className="dash-body" style={{ padding: '24px' }}>
          {/* STATS OVERVIEW CARDS: 3 CARDS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px',
              marginBottom: '24px'
            }}
          >
            {/* Card 1: Tổng số dự án */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '18px 22px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                  Tổng số dự án
                </p>
                <h3 style={{ margin: '6px 0 0', fontSize: '1.65rem', color: '#0f172a', fontWeight: 700 }}>
                  {totalProjects}
                </h3>
              </div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FolderKanban size={24} />
              </div>
            </div>

            {/* Card 2: Đăng bài */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '18px 22px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                  Đăng bài
                </p>
                <h3 style={{ margin: '6px 0 0', fontSize: '1.65rem', color: '#16a34a', fontWeight: 700 }}>
                  {publishedProjects}
                </h3>
              </div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle size={24} />
              </div>
            </div>

            {/* Card 3: Đang ẩn */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '18px 22px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                  Đang ẩn
                </p>
                <h3 style={{ margin: '6px 0 0', fontSize: '1.65rem', color: '#64748b', fontWeight: 700 }}>
                  {hiddenProjects}
                </h3>
              </div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <EyeOff size={24} />
              </div>
            </div>
          </div>

          {/* TOOLBAR: SEARCH, FILTERS, BUTTON ADD */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* Thanh tìm kiếm */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '8px 14px',
                width: '100%',
                maxWidth: '360px'
              }}
            >
              <Search size={18} color="#64748b" />
              <input
                type="text"
                placeholder="Tìm loại công trình, tên dự án, địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.88rem',
                  color: '#0f172a'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter buttons & Create button */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  background: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '10px'
                }}
              >
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'pending', label: 'Trình duyệt' },
                  { id: 'published', label: 'Đăng bài' },
                  { id: 'hidden', label: 'Đang ẩn' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedFilter(tab.id)}
                    style={{
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: selectedFilter === tab.id ? '#ffffff' : 'transparent',
                      color: selectedFilter === tab.id ? '#0284c7' : '#64748b',
                      boxShadow: selectedFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Nút Thêm Dự Án Mới */}
              <button
                type="button"
                onClick={handleOpenCreateModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 16px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2,132,199,0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <Plus size={16} />
                <span>Thêm Dự Án Mới</span>
              </button>
            </div>
          </div>

          {/* BẢNG DANH SÁCH DỰ ÁN (CHỈNH SỬA THEO YÊU CẦU: 9 CỘT) */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              overflow: 'hidden'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#475569', fontWeight: 600, width: '60px', textAlign: 'center' }}>
                      STT
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#475569', fontWeight: 600, minWidth: '150px' }}>
                      LOẠI CÔNG TRÌNH
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#475569', fontWeight: 600, minWidth: '220px' }}>
                      TÊN DỰ ÁN
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#475569', fontWeight: 600, minWidth: '240px' }}>
                      HỆ THỐNG TRIỂN KHAI
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#475569', fontWeight: 600, minWidth: '140px' }}>
                      ĐỊA ĐIỂM TRIỂN KHAI
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#475569', fontWeight: 600, width: '120px', textAlign: 'center' }}>
                      NĂM TRIỂN KHAI
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#475569', fontWeight: 600, width: '110px', textAlign: 'center' }}>
                      HÌNH ẢNH
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#475569', fontWeight: 600, width: '150px', textAlign: 'center' }}>
                      TRẠNG THÁI
                    </th>
                    <th
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.82rem',
                        color: '#475569',
                        fontWeight: 600,
                        width: '180px',
                        textAlign: 'center'
                      }}
                    >
                      THAO TÁC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        Đang nạp dữ liệu dự án từ máy chủ...
                      </td>
                    </tr>
                  ) : filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <FolderKanban size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                        <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
                          Không tìm thấy dự án nào trong cơ sở dữ liệu!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project, index) => (
                      <tr
                        key={project.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* 1. Cột STT: tự động tăng lên 1 */}
                        <td style={{ padding: '14px 16px', fontSize: '0.86rem', fontWeight: 600, color: '#64748b', textAlign: 'center' }}>
                          {index + 1}
                        </td>

                        {/* 2. Cột Loại công trình: hiển thị nội dung cột type */}
                        <td style={{ padding: '14px 16px', fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building size={15} color="#0284c7" />
                            <span>{project.type || 'Chưa cập nhật'}</span>
                          </div>
                        </td>

                        {/* 3. Cột Tên dự án: hiển thị nội dung cột title */}
                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                          {project.title}
                        </td>

                        {/* 4. Cột Hệ thống triển khai: hiển thị nội dung cột content */}
                        <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#334155', maxWidth: '300px' }}>
                          <span
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: '1.45'
                            }}
                            title={project.content}
                          >
                            {project.content || 'Chưa có thông tin'}
                          </span>
                        </td>

                        {/* 5. Cột Địa điểm triển khai: hiển thị nội dung cột place */}
                        <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#475569' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin size={14} color="#64748b" />
                            <span>{project.place || 'Chưa cập nhật'}</span>
                          </div>
                        </td>

                        {/* 6. Cột Năm triển khai: hiển thị nội dung cột start */}
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} color="#64748b" />
                            <span>{project.start || project.year || '2026'}</span>
                          </div>
                        </td>

                        {/* 7. Cột Hình ảnh: hiển thị nút Xem trước */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {project.image ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewImageModal({
                                  open: true,
                                  url: formatImageUrl(project.image),
                                  title: project.title
                                })
                              }
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                color: '#0284c7',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#0284c7';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#0284c7';
                              }}
                            >

                              <span>Xem</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              Không có ảnh
                            </span>
                          )}
                        </td>

                        {/* 8. Cột Trạng thái: hiển thị Đang trình duyệt / Đã duyệt xong / Đang ẩn */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {renderStatusBadge(project.status)}
                        </td>

                        {/* 9. Cột Thao tác: hiển thị các nút Sửa, Ẩn, Xem */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            {/* Nút Xem */}
                            <button
                              type="button"
                              onClick={() => setViewDetailProject(project)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#f0fdf4',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0',
                                borderRadius: '7px',
                                padding: '5px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title="Xem chi tiết dự án"
                            >
                              <Eye size={13} />
                              <span>Xem</span>
                            </button>

                            {/* Nút Sửa */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(project)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#fefce8',
                                color: '#ca8a04',
                                border: '1px solid #fef08a',
                                borderRadius: '7px',
                                padding: '5px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title="Chỉnh sửa thông tin dự án"
                            >
                              <Edit3 size={13} />
                              <span>Sửa</span>
                            </button>

                            {/* Nút Ẩn / Hiện */}
                            <button
                              type="button"
                              onClick={() => handleToggleHideProject(project)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: Number(project.status) === 2 ? '#f8fafc' : '#e0f2fe',
                                color: Number(project.status) === 2 ? '#64748b' : '#0284c7',
                                border: '1px solid #cbd5e1',
                                borderRadius: '7px',
                                padding: '5px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title={Number(project.status) === 2 ? 'Ẩn dự án' : 'Bỏ ẩn dự án (Đăng bài)'}
                            >
                              <EyeOff size={13} />
                              <span>{Number(project.status) === 2 ? 'Ẩn' : 'Hiện'}</span>
                            </button>

                            {/* Nút Xoá */}
                            <button
                              type="button"
                              onClick={() => handleDeleteProject(project.id, project.title)}
                              style={{
                                background: '#fef2f2',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                borderRadius: '7px',
                                padding: '5px 7px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Xoá dự án"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: TẠO MỚI / CHỈNH SỬA DỰ ÁN */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid #e2e8f0',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FolderKanban size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
                    {modalMode === 'create' ? 'Thêm Dự Án Mới' : 'Chỉnh Sửa Dự Án'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    {modalMode === 'create'
                      ? 'Nhập các thông tin dự án và tải ảnh để đăng bài lên cơ sở dữ liệu'
                      : 'Cập nhật lại các thông tin của dự án đã chọn'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Form nhập theo yêu cầu người dùng */}
            <form onSubmit={handleSaveProject} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Ô nhập: Loại công trình */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Loại công trình <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    list="project-types"
                    placeholder="VD: Toà nhà Văn phòng, Khu phức hợp, Bệnh viện..."
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <datalist id="project-types">
                    <option value="Toà nhà Văn phòng" />
                    <option value="Khu phức hợp" />
                    <option value="Bệnh viện & Y tế" />
                    <option value="Nhà máy Công nghiệp" />
                    <option value="Biệt thự cao cấp" />
                    <option value="Trung tâm thương mại" />
                    <option value="Trường học & Viện nghiên cứu" />
                  </datalist>
                </div>

                {/* 2. Ô nhập: Tên dự án */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Tên dự án <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Toà Nhà Văn Phòng Landmark Tower..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 3. Ô nhập: Hệ thống triển khai */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Hệ thống triển khai <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="VD: Hệ thống Quản lý BMS & Trạm Chiller Plant, Tích hợp PCCC & Chiếu sáng thông minh..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Grid 2 cột: Địa điểm & Năm triển khai */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                  {/* 4. Ô nhập: Địa điểm triển khai */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Địa điểm triển khai <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Hà Nội, TP. Hồ Chí Minh..."
                      value={formPlace}
                      onChange={(e) => setFormPlace(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 5. Ô nhập: Năm triển khai */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Năm triển khai <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 2026..."
                      value={formStart}
                      onChange={(e) => setFormStart(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* 6. Nút Tải hình ảnh (kèm input file ẩn) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Hình ảnh công trình
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#f8fafc',
                        border: '1px dashed #0284c7',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        color: '#0284c7',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Upload size={16} />
                      <span>Tải hình ảnh</span>
                    </button>

                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      (Hỗ trợ ảnh JPG/PNG/WebP, tự động nén, dung lượng &lt; 5MB)
                    </span>
                  </div>

                  {/* Preview ảnh sau khi tải */}
                  {imagePreview && (
                    <div
                      style={{
                        marginTop: '12px',
                        position: 'relative',
                        display: 'inline-block',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: '#f8fafc',
                        padding: '6px'
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          display: 'block',
                          maxWidth: '240px',
                          maxHeight: '140px',
                          objectFit: 'cover',
                          borderRadius: '6px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={removeSelectedImage}
                        title="Xoá ảnh đã chọn"
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={14} />
                      </button>
                      {imageFileName && (
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: '#475569',
                            marginTop: '4px',
                            fontFamily: 'monospace'
                          }}
                        >
                          Tên file: {imageFileName}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer: Nút Trình duyệt / Huỷ */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '16px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Huỷ Bỏ
                </button>

                {/* Nút ĐĂNG BÀI */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(2,132,199,0.3)',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Đăng bài'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XEM TRƯỚC HÌNH ẢNH LỚN */}
      {previewImageModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setPreviewImageModal({ open: false, url: '', title: '' })}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '800px',
              width: '100%',
              background: '#0f172a',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                {previewImageModal.title || 'Xem trước hình ảnh dự án'}
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageModal({ open: false, url: '', title: '' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', background: '#020617' }}>
              <img
                src={previewImageModal.url}
                alt={previewImageModal.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: XEM CHI TIẾT DỰ ÁN */}
      {viewDetailProject && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setViewDetailProject(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid #e2e8f0',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FolderKanban size={22} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
                  Chi Tiết Dự Án Triển Khai
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailProject(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {viewDetailProject.image && (
                <div style={{ marginBottom: '20px', borderRadius: '10px', overflow: 'hidden' }}>
                  <img
                    src={formatImageUrl(viewDetailProject.image)}
                    alt={viewDetailProject.title}
                    style={{ width: '100%', maxHeight: '250px', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  Mã ID: <strong>#{viewDetailProject.id}</strong>
                </span>
                {renderStatusBadge(viewDetailProject.status)}
              </div>

              <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem', color: '#0f172a' }}>
                {viewDetailProject.title}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Loại công trình:</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                    {viewDetailProject.type}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Địa điểm triển khai:</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                    {viewDetailProject.place}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Năm triển khai:</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                    {viewDetailProject.start || viewDetailProject.year}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Thời gian đăng:</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>
                    {viewDetailProject.time ? new Date(viewDetailProject.time).toLocaleString('vi-VN') : 'Đang cập nhật'}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Hệ thống triển khai & Mô tả kỹ thuật:</span>
                <p
                  style={{
                    margin: '6px 0 0',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    color: '#334155',
                    lineHeight: '1.5'
                  }}
                >
                  {viewDetailProject.content}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = viewDetailProject;
                    setViewDetailProject(null);
                    handleOpenEditModal(toEdit);
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#fff',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Chỉnh Sửa
                </button>
                <button
                  type="button"
                  onClick={() => setViewDetailProject(null)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo yêu cầu trình duyệt từ nhân viên */}
      <DashPopup onApprovalDone={fetchProjects} />
    </div>
  );
};

export default DashProject;
