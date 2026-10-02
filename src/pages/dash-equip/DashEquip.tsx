import React, { useState, useEffect, useRef } from 'react';
import '../dash/Dash.css';
import {
  CheckCircle2,
  Plus,
  Search,
  X,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Cpu,
  RefreshCw,
  CheckCircle,
  Tag,
  UploadCloud
} from 'lucide-react';
import { DashAside } from '../../components/common/DashAside';
import { DashHeader } from '../../components/common/DashHeader';

interface CurrentUserData {
  id?: number;
  full_name?: string;
  gmail?: string;
  username?: string;
}

export interface DeviceItem {
  id: number;
  time: string;
  brand: string;
  name: string;
  image?: string | null;
  status: number; // 1: Đăng bài, 2: Đang ẩn
}

export const DashEquip: React.FC = () => {
  const [activeTab] = useState('supplies');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);

  // Danh sách thiết bị từ database
  const [devicesList, setDevicesList] = useState<DeviceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Bộ lọc và tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'hidden'>('all');
  const [filterBrand, setFilterBrand] = useState('all');

  // Modal Thêm sản phẩm mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formBrand, setFormBrand] = useState('');
  const [formName, setFormName] = useState('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Sửa thiết bị
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceItem | null>(null);
  const [editBrand, setEditBrand] = useState('');
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<number>(1);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modal Xem trước hình ảnh
  const [previewImageModal, setPreviewImageModal] = useState<{
    open: boolean;
    url: string;
    title: string;
    brand: string;
  }>({
    open: false,
    url: '',
    title: '',
    brand: ''
  });

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
    fetchDevices();
  }, []);

  // Lấy danh sách thiết bị từ database 3ahome
  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/device');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDevicesList(data.data);
      }
    } catch (err) {
      console.error('Lỗi nạp danh sách thiết bị:', err);
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
    if (imgPath.startsWith('data:image') || imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }
    const cleanFilename = imgPath.split(/[\\/]/).pop();
    if (imgPath.includes('device')) {
      return `/uploads/device/${cleanFilename}`;
    }
    return `/uploads/news/${cleanFilename}`;
  };

  // Format thời gian hiển thị
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
      return `${hours}:${mins} ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Xử lý chọn hình ảnh khi nhấn nút "Tải hình ảnh"
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

    // 2. Rename tên file có dạng device[dd-mm-yyyy][codeimg]
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const codeimg = Math.random().toString(36).substring(2, 8).toUpperCase();
    const customName = `device[${dd}-${mm}-${yyyy}][${codeimg}].jpg`;

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

  // Mở modal Thêm sản phẩm
  const handleOpenCreateModal = () => {
    setFormBrand('');
    setFormName('');
    setImageBase64('');
    setImageFileName('');
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsCreateModalOpen(true);
  };

  // Đăng thiết bị (Lưu vào bảng device database 3ahome)
  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBrand.trim()) {
      alert('Vui lòng nhập Hãng sản xuất!');
      return;
    }
    if (!formName.trim()) {
      alert('Vui lòng nhập Tên thiết bị!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: formBrand.trim(),
          name: formName.trim(),
          imageBase64: imageBase64 || null,
          imageFileName: imageFileName || ''
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast('Đăng thiết bị mới thành công!');
        setIsCreateModalOpen(false);
        fetchDevices();
      } else {
        alert(data.message || 'Lỗi lưu thiết bị!');
      }
    } catch {
      alert('Không thể kết nối máy chủ để lưu thiết bị.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở modal Sửa thiết bị
  const handleOpenEditModal = (dev: DeviceItem) => {
    setEditingDevice(dev);
    setEditBrand(dev.brand || '');
    setEditName(dev.name || '');
    setEditStatus(dev.status || 1);
    setIsEditModalOpen(true);
  };

  // Lưu chỉnh sửa thiết bị (không sửa cột image)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;
    if (!editBrand.trim()) {
      alert('Vui lòng nhập Hãng sản xuất!');
      return;
    }
    if (!editName.trim()) {
      alert('Vui lòng nhập Tên thiết bị!');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/device/${editingDevice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: editBrand.trim(),
          name: editName.trim(),
          status: editStatus
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Đã cập nhật thiết bị "${editName}" thành công!`);
        setIsEditModalOpen(false);
        setEditingDevice(null);
        fetchDevices();
      } else {
        alert(data.message || 'Lỗi cập nhật thiết bị!');
      }
    } catch {
      alert('Không thể kết nối máy chủ để cập nhật thiết bị.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Ẩn / Bỏ ẩn thiết bị
  const handleToggleHide = async (dev: DeviceItem) => {
    const newStatus = Number(dev.status) === 2 ? 1 : 2;
    const actionLabel = newStatus === 2 ? 'ẩn' : 'đăng lại';

    try {
      const res = await fetch(`/api/device/${dev.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Đã ${actionLabel} thiết bị "${dev.name}" thành công!`);
        setDevicesList((prev) =>
          prev.map((item) => (item.id === dev.id ? { ...item, status: newStatus } : item))
        );
      } else {
        triggerToast(data.message || `Lỗi ${actionLabel} thiết bị!`);
      }
    } catch {
      triggerToast('Không thể kết nối máy chủ!');
    }
  };

  // Xoá thiết bị khỏi bảng device và xoá hình ảnh trên server
  const handleDeleteDevice = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá thiết bị "${name}" và hình ảnh tương ứng không?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/device/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Đã xoá thiết bị "${name}" thành công!`);
        setDevicesList((prev) => prev.filter((item) => item.id !== id));
      } else {
        triggerToast(data.message || 'Lỗi xoá thiết bị!');
      }
    } catch {
      triggerToast('Không thể kết nối máy chủ để xoá thiết bị.');
    }
  };

  // Danh sách hãng sản xuất duy nhất để lọc
  const uniqueBrands = Array.from(new Set(devicesList.map((d) => d.brand).filter(Boolean)));

  // Dữ liệu sau khi lọc và tìm kiếm
  const filteredDevices = devicesList.filter((dev) => {
    const matchesSearch =
      (dev.name && dev.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (dev.brand && dev.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && Number(dev.status) === 1) ||
      (filterStatus === 'hidden' && Number(dev.status) === 2);

    const matchesBrand = filterBrand === 'all' || dev.brand === filterBrand;

    return matchesSearch && matchesStatus && matchesBrand;
  });

  // Thống kê nhanh
  const totalDevices = devicesList.length;
  const publishedDevices = devicesList.filter((d) => Number(d.status) === 1).length;
  const hiddenDevices = devicesList.filter((d) => Number(d.status) === 2).length;

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
          title="Quản Lý Danh Mục Vật Tư và Thiết Bị"
          subtitle="Quản lý chi tiết danh mục thiết bị, hãng sản xuất, hình ảnh và trạng thái hoạt động trong hệ thống 3AHOME"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
          refreshTitle="Làm mới danh sách thiết bị"
          onRefresh={() => {
            fetchDevices();
            triggerToast('Đã làm mới dữ liệu danh mục thiết bị!');
          }}
          triggerToast={triggerToast}
          handleLogout={handleLogout}
        />

        {/* CONTAINER NỘI DUNG */}
        <div className="dash-content" style={{ padding: '24px' }}>
          {/* THẺ THỐNG KÊ TỔNG QUAN */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}
          >
            {/* Card 1: Tổng số thiết bị */}
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
                  Tổng số thiết bị
                </p>
                <h3 style={{ margin: '6px 0 0', fontSize: '1.65rem', color: '#0f172a', fontWeight: 700 }}>
                  {totalDevices}
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
                <Cpu size={24} />
              </div>
            </div>

            {/* Card 2: Đang đăng bài */}
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
                  Đang đăng bài
                </p>
                <h3 style={{ margin: '6px 0 0', fontSize: '1.65rem', color: '#16a34a', fontWeight: 700 }}>
                  {publishedDevices}
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
                <h3 style={{ margin: '6px 0 0', fontSize: '1.65rem', color: '#ea580c', fontWeight: 700 }}>
                  {hiddenDevices}
                </h3>
              </div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#fff7ed',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <EyeOff size={24} />
              </div>
            </div>

            {/* Card 4: Tổng số hãng */}
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
                  Hãng sản xuất
                </p>
                <h3 style={{ margin: '6px 0 0', fontSize: '1.65rem', color: '#7c3aed', fontWeight: 700 }}>
                  {uniqueBrands.length}
                </h3>
              </div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#f5f3ff',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Tag size={24} />
              </div>
            </div>
          </div>

          {/* TOOLBAR: TÌM KIẾM, BỘ LỌC, NÚT THÊM SẢN PHẨM */}
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
                placeholder="Tìm hãng sản xuất, tên thiết bị..."
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

            {/* Filter buttons & Nút Thêm sản phẩm */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              {/* Lọc theo Hãng sản xuất nếu có */}
              {uniqueBrands.length > 0 && (
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '0.84rem',
                    color: '#0f172a',
                    fontWeight: 500,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Tất cả hãng sản xuất</option>
                  {uniqueBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              )}

              {/* Lọc theo Trạng thái */}
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
                  { id: 'published', label: 'Đăng bài' },
                  { id: 'hidden', label: 'Đang ẩn' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterStatus(tab.id as any)}
                    style={{
                      border: 'none',
                      background: filterStatus === tab.id ? '#ffffff' : 'transparent',
                      color: filterStatus === tab.id ? '#0f172a' : '#64748b',
                      fontWeight: filterStatus === tab.id ? 600 : 500,
                      fontSize: '0.82rem',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: filterStatus === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Nút Thêm sản phẩm */}
              <button
                type="button"
                onClick={handleOpenCreateModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2,132,199,0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <Plus size={16} />
                <span>Thêm sản phẩm</span>
              </button>
            </div>
          </div>

          {/* BẢNG DANH SÁCH THIẾT BỊ (THEO YÊU CẦU: 7 CỘT) */}
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
                    <th
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.82rem',
                        color: '#475569',
                        fontWeight: 600,
                        width: '60px',
                        textAlign: 'center'
                      }}
                    >
                      STT
                    </th>
                    <th
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.82rem',
                        color: '#475569',
                        fontWeight: 600,
                        width: '160px',
                        textAlign: 'center'
                      }}
                    >
                      THỜI GIAN ĐĂNG
                    </th>
                    <th
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.82rem',
                        color: '#475569',
                        fontWeight: 600,
                        minWidth: '160px'
                      }}
                    >
                      HÃNG SẢN XUẤT
                    </th>
                    <th
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.82rem',
                        color: '#475569',
                        fontWeight: 600,
                        minWidth: '220px'
                      }}
                    >
                      TÊN THIẾT BỊ
                    </th>
                    <th
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.82rem',
                        color: '#475569',
                        fontWeight: 600,
                        width: '130px',
                        textAlign: 'center'
                      }}
                    >
                      TRẠNG THÁI
                    </th>
                    <th
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.82rem',
                        color: '#475569',
                        fontWeight: 600,
                        width: '130px',
                        textAlign: 'center'
                      }}
                    >
                      HÌNH ẢNH
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
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                        <div>Đang nạp dữ liệu thiết bị từ database 3ahome...</div>
                      </td>
                    </tr>
                  ) : filteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <Cpu size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                        <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
                          Chưa có thiết bị nào trong danh sách. Hãy nhấn "Thêm sản phẩm" để bắt đầu!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDevices.map((dev, index) => (
                      <tr
                        key={dev.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* 1. Cột STT: tự động tăng lên 1 */}
                        <td
                          style={{
                            padding: '14px 16px',
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            color: '#64748b',
                            textAlign: 'center'
                          }}
                        >
                          {index + 1}
                        </td>

                        {/* 2. Cột Thời gian đăng: hiển thị giá trị trong cột time */}
                        <td
                          style={{
                            padding: '14px 16px',
                            fontSize: '0.82rem',
                            color: '#475569',
                            textAlign: 'center',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {formatDateTime(dev.time)}
                        </td>

                        {/* 3. Cột Hãng sản xuất: hiển thị giá trị trong cột brand */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: '#f1f5f9',
                              color: '#334155',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.82rem',
                              fontWeight: 600
                            }}
                          >
                            <Tag size={12} color="#0284c7" />
                            {dev.brand}
                          </span>
                        </td>

                        {/* 4. Cột Tên thiết bị: hiển thị giá trị trong cột name */}
                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                          {dev.name}
                        </td>

                        {/* 5. Cột Trạng thái: hiển thị Đăng bài hoặc Đang ẩn */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {Number(dev.status) === 1 ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#f0fdf4',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.78rem',
                                fontWeight: 600
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: '#16a34a'
                                }}
                              />
                              Đăng bài
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#fff7ed',
                                color: '#ea580c',
                                border: '1px solid #fed7aa',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.78rem',
                                fontWeight: 600
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: '#ea580c'
                                }}
                              />
                              Đang ẩn
                            </span>
                          )}
                        </td>

                        {/* 6. Cột Hình ảnh: hiển thị nút Xem khi nhấn nút Xem hiển thị cửa sổ xem trước hình ảnh */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {dev.image ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewImageModal({
                                  open: true,
                                  url: formatImageUrl(dev.image),
                                  title: dev.name,
                                  brand: dev.brand
                                })
                              }
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#eff6ff',
                                color: '#0284c7',
                                border: '1px solid #bae6fd',
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
                                e.currentTarget.style.background = '#eff6ff';
                                e.currentTarget.style.color = '#0284c7';
                              }}
                            >
                              <Eye size={13} />
                              <span>Xem</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              Không có ảnh
                            </span>
                          )}
                        </td>

                        {/* 7. Cột Thao tác: hiển thị nút chọn Sửa, Ẩn, Xoá */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            {/* Nút Sửa */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(dev)}
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
                              title="Chỉnh sửa thông tin thiết bị"
                            >
                              <Edit3 size={13} />
                              <span>Sửa</span>
                            </button>

                            {/* Nút Ẩn / Bỏ ẩn */}
                            <button
                              type="button"
                              onClick={() => handleToggleHide(dev)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: Number(dev.status) === 2 ? '#e0f2fe' : '#f8fafc',
                                color: Number(dev.status) === 2 ? '#0284c7' : '#64748b',
                                border: '1px solid #cbd5e1',
                                borderRadius: '7px',
                                padding: '5px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title={Number(dev.status) === 2 ? 'Đăng lại thiết bị' : 'Ẩn thiết bị khỏi hệ thống'}
                            >
                              <EyeOff size={13} />
                              <span>{Number(dev.status) === 2 ? 'Hiện' : 'Ẩn'}</span>
                            </button>

                            {/* Nút Xoá */}
                            <button
                              type="button"
                              onClick={() => handleDeleteDevice(dev.id, dev.name)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#fef2f2',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                borderRadius: '7px',
                                padding: '5px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title="Xoá thiết bị vĩnh viễn"
                            >
                              <Trash2 size={13} />
                              <span>Xoá</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Chân bảng */}
            <div
              style={{
                padding: '12px 18px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.82rem',
                color: '#64748b'
              }}
            >
              <span>
                Hiển thị <strong>{filteredDevices.length}</strong> / <strong>{devicesList.length}</strong> thiết bị
              </span>
              <span>Hệ thống cơ sở dữ liệu bảng <code>device</code></span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL THÊM SẢN PHẨM MỚI */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
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
                    background: '#eff6ff',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
                    Thêm Sản Phẩm Mới
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Nhập thông tin sản phẩm và tải hình ảnh lên bảng device
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateDevice} style={{ padding: '24px' }}>
              {/* 1. Ô nhập Hãng sản xuất */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '8px'
                  }}
                >
                  Hãng sản xuất <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập hãng sản xuất (VD: Xiaomi, Aqara, Tuya, Philips, Schneider...)"
                  value={formBrand}
                  onChange={(e) => setFormBrand(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 2. Ô nhập Tên thiết bị */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '8px'
                  }}
                >
                  Tên thiết bị <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên thiết bị (VD: Cảm biến chuyển động Aqara P1, Công tắc Zigbee...)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 3. Nút Tải hình ảnh & Khu vực Preview */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '8px'
                  }}
                >
                  Hình ảnh sản phẩm
                </label>

                {/* Ẩn input file thực tế */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: '#f8fafc',
                      transition: 'border-color 0.2s, background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0284c7';
                      e.currentTarget.style.background = '#f0f9ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                  >
                    <UploadCloud size={36} color="#0284c7" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                      Nhấn vào đây để tải hình ảnh
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                      Hỗ trợ JPG, PNG, WEBP. Dung lượng tối đa: 5MB
                    </div>
                    <button
                      type="button"
                      style={{
                        marginTop: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '7px 16px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <ImageIcon size={15} />
                      <span>Tải hình ảnh</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px'
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: '70px',
                        height: '70px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1'
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {imageFileName}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#16a34a', marginTop: '2px' }}>
                        ✓ Đã nén và chuẩn hoá tên file thành công
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          marginTop: '6px',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '0.78rem',
                          color: '#0284c7',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Chọn ảnh khác
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      style={{
                        background: '#fee2e2',
                        border: 'none',
                        color: '#ef4444',
                        padding: '6px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title="Xoá ảnh đã chọn"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Nút Đăng thiết bị */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSubmitting
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(2,132,199,0.3)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Đăng thiết bị</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SỬA THIẾT BỊ (THEO YÊU CẦU: SỬA CÁC CỘT TRỪ CỘT IMAGE) */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingDevice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
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
                    background: '#fefce8',
                    color: '#ca8a04',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                    Sửa Thông Tin Thiết Bị
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Cập nhật Hãng sản xuất, Tên thiết bị và Trạng thái (giữ nguyên hình ảnh)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Edit Form */}
            <form onSubmit={handleSaveEdit} style={{ padding: '24px' }}>
              {/* 1. Sửa Hãng sản xuất */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '8px'
                  }}
                >
                  Hãng sản xuất <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 2. Sửa Tên thiết bị */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '8px'
                  }}
                >
                  Tên thiết bị <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 3. Sửa Trạng thái */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '8px'
                  }}
                >
                  Trạng thái
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                    background: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <option value={1}>Đăng bài (Hiển thị)</option>
                  <option value={2}>Đang ẩn</option>
                </select>
              </div>

              {/* Nút Huỷ & Nút Lưu */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSavingEdit
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(2,132,199,0.3)'
                  }}
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL XEM TRƯỚC HÌNH ẢNH */}
      {/* ========================================================================= */}
      {previewImageModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPreviewImageModal({ open: false, url: '', title: '', brand: '' });
            }
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '680px',
              width: '100%',
              background: '#0f172a',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Header popup */}
            <div
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div>
                <div style={{ color: '#38bdf8', fontSize: '0.76rem', fontWeight: 600 }}>
                  {previewImageModal.brand}
                </div>
                <div style={{ color: '#ffffff', fontSize: '0.96rem', fontWeight: 700 }}>
                  {previewImageModal.title}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPreviewImageModal({ open: false, url: '', title: '', brand: '' })
                }
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Khung ảnh */}
            <div
              style={{
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#020617',
                maxHeight: '75vh',
                overflow: 'hidden'
              }}
            >
              <img
                src={previewImageModal.url}
                alt={previewImageModal.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '10px'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashEquip;
