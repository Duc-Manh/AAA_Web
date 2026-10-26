import React, { useState, useEffect } from 'react';
import '../dash/Dash.css';
import { EmpAside } from '../../components/common/EmpAside';
import { EmpHeader } from '../../components/common/EmpHeader';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Boxes,
  DollarSign,
  FileText,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CurrentUserData {
  id?: number;
  full_name?: string;
  gmail?: string;
  username?: string;
}

export interface StorageItem {
  id: number;
  device_code: string;
  name: string;
  unit: string;
  quantity: number;
  price: number | string;
  total: number | string;
  invoice: string;
  time?: string;
  'time-in'?: string;
  'time-out'?: string;
  time_in?: string;
  time_out?: string;
  status: string;
}

export const EmployEquip: React.FC = () => {
  const [activeTab] = useState('devices');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);

  // Danh sách vật tư kho
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Toast thông báo
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StorageItem | null>(null);

  // Form states
  const [formDeviceCode, setFormDeviceCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('Cái');
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formInvoice, setFormInvoice] = useState('');
  const [formStatus, setFormStatus] = useState('Tồn kho');
  const [formTimeIn, setFormTimeIn] = useState('');
  const [formTimeOut, setFormTimeOut] = useState('');

  // Lấy danh sách từ API
  const fetchStorageData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/storage');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setItems(data.data);
      }
    } catch (err) {
      console.warn('Lỗi lấy dữ liệu storage:', err);
    } finally {
      setLoading(false);
    }
  };

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
    fetchStorageData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aaa_admin_auth');
    sessionStorage.removeItem('aaa_admin_auth');
    window.location.hash = '#home';
    window.history.pushState(null, '', '/#home');
    window.dispatchEvent(new Event('popstate'));
    window.dispatchEvent(new Event('hashchange'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentFullName = currentUser?.full_name || currentUser?.username || 'Nhân Viên 3A';

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormDeviceCode('');
    setFormName('');
    setFormUnit('Cái');
    setFormQuantity(1);
    setFormPrice(0);
    setFormInvoice('');
    setFormStatus('Tồn kho');
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFormTimeIn(localIso);
    setFormTimeOut('');
    setIsModalOpen(true);
  };

  // Mở modal sửa
  const handleOpenEditModal = (item: StorageItem) => {
    setEditingItem(item);
    setFormDeviceCode(item.device_code);
    setFormName(item.name);
    setFormUnit(item.unit || 'Cái');
    setFormQuantity(Number(item.quantity) || 1);
    setFormPrice(Number(item.price) || 0);
    setFormInvoice(item.invoice || '');
    setFormStatus(item.status || 'Tồn kho');

    const rawIn = item['time-in'] || item.time_in || item.time;
    if (rawIn) {
      const d = new Date(rawIn);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setFormTimeIn(localIso);
    } else {
      setFormTimeIn('');
    }

    const rawOut = item['time-out'] || item.time_out;
    if (rawOut) {
      const d = new Date(rawOut);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setFormTimeOut(localIso);
    } else {
      setFormTimeOut('');
    }

    setIsModalOpen(true);
  };

  // Lưu vật tư (Tạo mới hoặc Sửa)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDeviceCode.trim()) {
      alert('Vui lòng nhập Mã thiết bị!');
      return;
    }
    if (!formName.trim()) {
      alert('Vui lòng nhập Tên vật tư!');
      return;
    }

    const payload = {
      device_code: formDeviceCode.trim().toUpperCase(),
      name: formName.trim(),
      unit: formUnit.trim() || 'Cái',
      quantity: Number(formQuantity) || 1,
      price: Number(formPrice) || 0,
      total: (Number(formQuantity) || 1) * (Number(formPrice) || 0),
      invoice: formInvoice.trim(),
      status: formStatus,
      'time-in': formTimeIn ? new Date(formTimeIn).toISOString() : null,
      'time-out': formTimeOut ? new Date(formTimeOut).toISOString() : null,
      time_in: formTimeIn ? new Date(formTimeIn).toISOString() : null,
      time_out: formTimeOut ? new Date(formTimeOut).toISOString() : null,
      time: formTimeIn ? new Date(formTimeIn).toISOString() : new Date().toISOString()
    };

    try {
      if (editingItem) {
        // Cập nhật
        const res = await fetch(`/api/storage/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          triggerToast(`Đã cập nhật vật tư "${payload.name}" thành công!`);
          setIsModalOpen(false);
          await fetchStorageData();
        } else {
          alert(data.message || 'Lỗi cập nhật');
        }
      } else {
        // Thêm mới
        const res = await fetch('/api/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          triggerToast(`Đã thêm vật tư [${payload.device_code}] vào kho thành công!`);
          setIsModalOpen(false);
          await fetchStorageData();
        } else {
          alert(data.message || 'Lỗi thêm mới');
        }
      }
    } catch (err) {
      console.error('Lỗi khi gửi form storage:', err);
      alert('Không thể kết nối đến máy chủ!');
    }
  };

  // Xóa vật tư
  const handleDeleteItem = async (item: StorageItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vật tư "${item.name}" (${item.device_code}) không?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/storage/${item.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Đã xóa vật tư "${item.name}" khỏi kho!`);
        await fetchStorageData();
      } else {
        alert(data.message || 'Lỗi khi xóa');
      }
    } catch (err) {
      console.error('Lỗi xóa vật tư:', err);
      alert('Không thể kết nối đến máy chủ!');
    }
  };

  // Format tiền tệ VNĐ
  const formatVND = (num: number | string) => {
    const n = Number(num) || 0;
    return n.toLocaleString('vi-VN') + ' ₫';
  };

  // Format ngày giờ
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Lọc danh sách
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.device_code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      (item.invoice && item.invoice.toLowerCase().includes(q)) ||
      (item.unit && item.unit.toLowerCase().includes(q));

    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Tính thống kê
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalValue = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  // Badge màu theo tình trạng
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Mới':
        return (
          <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600, backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
            🟢 Mới
          </span>
        );
      case 'Đang sử dụng':
        return (
          <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600, backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
            ⚡ Đang sử dụng
          </span>
        );
      case 'Tồn kho':
        return (
          <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600, backgroundColor: '#eff6ff', color: '#1D58BB', border: '1px solid #bfdbfe' }}>
            📦 Tồn kho
          </span>
        );
      case 'Bảo hành':
      case 'Hỏng':
        return (
          <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            ⚠️ {status}
          </span>
        );
      default:
        return (
          <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="dash-layout">
      {/* TOAST THÔNG BÁO */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            fontWeight: 500
          }}
        >
          <CheckCircle size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. SIDEBAR ĐIỀU HƯỚNG */}
      <EmpAside
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
        <EmpHeader
          title="Quản Lý Thiết Bị Và Kho Hàng"
          subtitle="Quản lý danh mục thiết bị tự động hoá, cảm biến IoT và kho hàng 3AHOME"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
          handleLogout={handleLogout}
        />

        {/* NỘI DUNG CHÍNH: BẢNG QUẢN LÝ VẬT TƯ */}
        <div className="dash-content" style={{ padding: '24px' }}>
          {/* HÀNG THỐNG KÊ NHANH */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1D58BB'
                }}
              >
                <Package size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TỔNG MÃ VẬT TƯ</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{items.length}</div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}
              >
                <Boxes size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TỔNG SỐ LƯỢNG KHO</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{totalQuantity.toLocaleString('vi-VN')}</div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '18px 20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706'
                }}
              >
                <DollarSign size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TỔNG GIÁ TRỊ VẬT TƯ</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ea580c' }}>{formatVND(totalValue)}</div>
              </div>
            </div>
          </div>

          {/* BẢNG CHÍNH VÀ TOOLBAR */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              overflow: 'hidden'
            }}
          >
            {/* THANH CÔNG CỤ TÌM KIẾM & NÚT THAO TÁC */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px', maxWidth: '540px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    flex: 1
                  }}
                >
                  <Search size={16} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Tìm theo Mã thiết bị, Tên vật tư, Số chứng từ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '0.86rem',
                      width: '100%',
                      color: '#1e293b'
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={14} color="#94a3b8" />
                    </button>
                  )}
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.86rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Tất cả tình trạng</option>
                  <option value="Mới">Mới</option>
                  <option value="Tồn kho">Tồn kho</option>
                  <option value="Đang sử dụng">Đang sử dụng</option>
                  <option value="Bảo hành">Bảo hành</option>
                  <option value="Hỏng">Hỏng</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={fetchStorageData}
                  title="Tải lại dữ liệu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
                  <span>Làm mới</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: '#1D58BB',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(29, 88, 187, 0.25)'
                  }}
                >
                  <Plus size={16} />
                  <span>Thêm vật tư mới</span>
                </button>
              </div>
            </div>

            {/* BẢNG DỮ LIỆU VẬT TƯ */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 14px', width: '45px', textAlign: 'center' }}>STT</th>
                    <th style={{ padding: '12px 14px' }}>Mã thiết bị</th>
                    <th style={{ padding: '12px 14px' }}>Tên vật tư</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Đơn vị</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Số lượng</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Thành tiền</th>
                    <th style={{ padding: '12px 14px' }}>Số chứng từ</th>
                    <th style={{ padding: '12px 14px' }}>Thời gian nhập kho</th>
                    <th style={{ padding: '12px 14px' }}>Thời gian xuất kho</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Tình trạng</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', width: '90px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && items.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        Đang tải danh sách vật tư...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <AlertCircle size={32} color="#94a3b8" />
                          <div style={{ fontWeight: 600 }}>Không tìm thấy vật tư nào</div>
                          <div style={{ fontSize: '0.8rem' }}>Thử tìm kiếm với từ khóa khác hoặc nhấn "Thêm vật tư mới" để khởi tạo.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1D58BB', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '6px' }}>
                            {item.device_code}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#475569' }}>
                          {item.unit || 'Cái'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#f1f5f9' }}>
                            {item.quantity}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#475569' }}>
                          {formatVND(item.price)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#ea580c' }}>
                          {formatVND(item.total)}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#334155' }}>
                          {item.invoice ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                              <FileText size={13} color="#64748b" />
                              {item.invoice}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>---</span>
                          )}
                        </td>
                        {/* Thời gian nhập kho (lấy từ cột time-in) */}
                        <td style={{ padding: '12px 14px', color: '#1e293b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDateTime(item['time-in'] || item.time_in || item.time)}
                        </td>
                        {/* Thời gian xuất kho (lấy từ cột time-out) */}
                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {(item['time-out'] || item.time_out) ? (
                            <span style={{ color: '#059669', fontWeight: 600 }}>
                              {formatDateTime(item['time-out'] || item.time_out)}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa xuất kho</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {renderStatusBadge(item.status)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              title="Chỉnh sửa vật tư"
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: '#1D58BB',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              title="Xóa vật tư"
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: '#ef4444',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PHẦN DƯỚI BẢNG: ĐẾM KẾT QUẢ */}
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: '#64748b'
              }}
            >
              <span>Hiển thị <strong>{filteredItems.length}</strong> / <strong>{items.length}</strong> vật tư</span>
              <span>Cập nhật đồng bộ với các cột <code>time-in</code> &amp; <code>time-out</code> bảng <code>storage</code></span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: THÊM / CHỈNH SỬA VẬT TƯ */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#eff6ff',
                    color: '#1D58BB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Package size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    {editingItem ? 'Chỉnh Sửa Thông Tin Vật Tư' : 'Thêm Vật Tư Mới Vào Kho'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                    Lưu trữ vào bảng <code>storage</code> trong database 3ahome
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitForm} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Mã thiết bị (device_code) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: GW_3ONEDATA_01"
                    value={formDeviceCode}
                    onChange={(e) => setFormDeviceCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      outline: 'none',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Tên vật tư (name) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Cảm biến nhiệt độ SHT30"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Đơn vị tính (unit)
                  </label>
                  <input
                    type="text"
                    placeholder="Cái, Bộ, Mét, Chiếc, Bo mạch..."
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Đơn giá (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Thành tiền (Tự động tính)
                  </label>
                  <div
                    style={{
                      padding: '9px 12px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#ea580c',
                      backgroundColor: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: '8px'
                    }}
                  >
                    {formatVND((Number(formQuantity) || 0) * (Number(formPrice) || 0))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Số chứng từ (invoice)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: HD-2026-009"
                    value={formInvoice}
                    onChange={(e) => setFormInvoice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Tình trạng
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="Mới">🟢 Mới</option>
                    <option value="Tồn kho">📦 Tồn kho</option>
                    <option value="Đang sử dụng">⚡ Đang sử dụng</option>
                    <option value="Bảo hành">⚠️ Bảo hành</option>
                    <option value="Hỏng">❌ Hỏng</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Thời gian nhập kho (time-in)
                  </label>
                  <input
                    type="datetime-local"
                    value={formTimeIn}
                    onChange={(e) => setFormTimeIn(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Thời gian xuất kho (time-out)
                  </label>
                  <input
                    type="datetime-local"
                    value={formTimeOut}
                    onChange={(e) => setFormTimeOut(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 24px',
                    backgroundColor: '#1D58BB',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(29, 88, 187, 0.3)'
                  }}
                >
                  {editingItem ? 'Lưu thay đổi' : 'Thêm vào kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployEquip;
