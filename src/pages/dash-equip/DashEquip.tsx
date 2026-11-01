import React, { useState, useEffect } from 'react';
import '../dash/Dash.css';
import { DashAside } from '../../components/common/DashAside';
import { DashHeader } from '../../components/common/DashHeader';
import { DashPopup } from '../../components/common/DashPopup';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Boxes,
  DollarSign,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getAuthHeaders } from '../../utils/authHeaders';

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
  type?: string;
  unit: string;
  quantity: number;
  quantity_out?: number;
  quantity_remain?: number;
  'quantity-out'?: number;
  'quantity-remain'?: number;
  price?: number | string;
  total?: number | string;
  invoice?: string;
  time?: string;
  time_in?: string;
  time_out?: string;
  'time-in'?: string;
  'time-out'?: string;
  status: string;
}

export const DashEquip: React.FC = () => {
  const [activeTab] = useState('supplies');
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
  const [formType, setFormType] = useState('sensor');
  const [formUnit, setFormUnit] = useState('cái');
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formQuantityOut, setFormQuantityOut] = useState<number>(0);
  const [formStatus, setFormStatus] = useState('1');
  const [formTimeIn, setFormTimeIn] = useState('');
  const [formTimeOut, setFormTimeOut] = useState('');

  // Lấy danh sách từ API
  const fetchStorageData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/storage', { headers: getAuthHeaders() });
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

  const currentFullName = currentUser?.full_name || currentUser?.username || 'Quản Trị Viên';

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormDeviceCode('');
    setFormName('');
    setFormType('sensor');
    setFormUnit('cái');
    setFormQuantity(1);
    setFormQuantityOut(0);
    setFormStatus('1');
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
    setFormType(item.type || 'sensor');
    setFormUnit(item.unit || 'cái');
    setFormQuantity(Number(item.quantity) || 1);
    setFormQuantityOut(Number(item.quantity_out !== undefined ? item.quantity_out : (item['quantity-out'] ?? 0)));
    const s = String(item.status || '1').trim();
    setFormStatus(s === '2' || s === 'Tại dự án' || s === 'Đang sử dụng' ? '2' : '1');

    const rawIn = item.time_in || item['time-in'] || item.time;
    if (rawIn) {
      const d = new Date(rawIn);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setFormTimeIn(localIso);
    } else {
      setFormTimeIn('');
    }

    const rawOut = item.time_out || item['time-out'];
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

    const qty = Number(formQuantity) || 1;
    const qtyOut = Number(formQuantityOut) || 0;
    const qtyRemain = Math.max(0, qty - qtyOut);
    const computedStatus = qtyRemain > 0 ? '1' : '2';

    const payload = {
      device_code: formDeviceCode.trim().toUpperCase(),
      name: formName.trim(),
      type: formType,
      unit: formUnit.trim() || 'cái',
      quantity: qty,
      quantity_out: qtyOut,
      quantity_remain: qtyRemain,
      status: computedStatus,
      time_in: formTimeIn ? new Date(formTimeIn).toISOString() : null,
      time_out: formTimeOut ? new Date(formTimeOut).toISOString() : null,
      time: formTimeIn ? new Date(formTimeIn).toISOString() : new Date().toISOString()
    };

    try {
      if (editingItem) {
        // Cập nhật
        const res = await fetch(`/api/storage/${editingItem.id}`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
        method: 'DELETE',
        headers: getAuthHeaders()
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

    const matchStatus =
      filterStatus === 'all' ||
      String(item.status) === filterStatus ||
      (filterStatus === '1' && (item.status === 'Tại kho' || item.status === 'Tồn kho' || item.status === 'Mới')) ||
      (filterStatus === '2' && (item.status === 'Tại dự án' || item.status === 'Đang sử dụng'));
    return matchSearch && matchStatus;
  });

  // Tính thống kê
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalValue = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  // Hiển thị badge Loại thiết bị
  const renderDeviceTypeBadge = (type?: string) => {
    const rawVal = (type || '').trim();
    const val = rawVal.toLowerCase();

    const typeMap: Record<string, { label: string; bg: string; color: string }> = {
      sensor: { label: 'Cảm biến (sensor)', bg: '#eff6ff', color: '#1d4ed8' },
      motor: { label: 'Động cơ (motor)', bg: '#fef3c7', color: '#b45309' },
      valve: { label: 'Van (valve)', bg: '#f3e8ff', color: '#7e22ce' },
      gateway: { label: 'IoTGateway (gateway)', bg: '#ecfdf5', color: '#047857' },
      hmi: { label: 'Màn hình HMI (hmi)', bg: '#fdf2f8', color: '#be185d' },
      switch: { label: 'Công tắc (switch)', bg: '#e0f2fe', color: '#0369a1' },
      socket: { label: 'Ổ cắm (socket)', bg: '#e0e7ff', color: '#4338ca' },
      controller: { label: 'Bộ điều khiển (controller)', bg: '#ede9fe', color: '#6d28d9' },
      light: { label: 'Chiếu sáng (light)', bg: '#fef9c3', color: '#a16207' },
      meter: { label: 'Đo lường (meter)', bg: '#fae8ff', color: '#86198f' },
      line: { label: 'Dây điện (line)', bg: '#fee2e2', color: '#b91c1c' },
      cable: { label: 'Cáp mạng (cable)', bg: '#ccfbf1', color: '#0f766e' },
      signal: { label: 'Dây tín hiệu (signal)', bg: '#ffedd5', color: '#c2410c' },
      distribute: { label: 'Tủ điện (distribute)', bg: '#f1f5f9', color: '#334155' },
      cb: { label: 'Aptomat (cb)', bg: '#ffe4e6', color: '#be123c' },
      cc: { label: 'Cầu chì (cc)', bg: '#fef3c7', color: '#92400e' },
      crim: { label: 'Kìm bấm mạng (crim)', bg: '#f3f4f6', color: '#374151' },
      cut: { label: 'Kìm cắt (cut)', bg: '#f3f4f6', color: '#374151' },
      screw: { label: 'Tuốc nơ vít 4 chấu (screw)', bg: '#f3f4f6', color: '#374151' },
      flat: { label: 'Tuốc nơ vít dẹp (flat)', bg: '#f3f4f6', color: '#374151' },
      multi: { label: 'Đồng hồ vạn năng (multi)', bg: '#e0e7ff', color: '#3730a3' },
      trunk: { label: 'Máng nhựa (trunk)', bg: '#f1f5f9', color: '#475569' },
      lug: { label: 'Đầu cốt (lug)', bg: '#fef3c7', color: '#78350f' },
    };

    if (typeMap[val]) {
      const item = typeMap[val];
      return (
        <span style={{ backgroundColor: item.bg, color: item.color, padding: '3px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '0.78rem' }}>
          {item.label}
        </span>
      );
    }

    return (
      <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '0.78rem' }}>
        {rawVal || 'Cảm biến (sensor)'}
      </span>
    );
  };

  // Badge màu theo tình trạng
  const renderStatusBadge = (status: string | number) => {
    const s = String(status || '').trim();
    if (s === '1' || s === 'Tại kho' || s === 'Tồn kho' || s === 'Mới') {
      return (
        <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600, backgroundColor: '#eff6ff', color: '#1D58BB', border: '1px solid #bfdbfe' }}>
          📦 Tại kho
        </span>
      );
    }
    if (s === '2' || s === 'Tại dự án' || s === 'Đang sử dụng') {
      return (
        <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600, backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
          🏗️ Tại dự án
        </span>
      );
    }
    if (s === 'Bảo hành' || s === 'Hỏng') {
      return (
        <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          ⚠️ {s}
        </span>
      );
    }
    return (
      <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
        {s || 'Tại kho'}
      </span>
    );
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
          title="Quản Lý Thiết Bị Và Kho Hàng"
          subtitle="Quản lý danh mục thiết bị tự động hoá, cảm biến IoT và kho hàng 3AHOME"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
          refreshTitle="Làm mới danh sách vật tư"
          onRefresh={() => {
            fetchStorageData();
            triggerToast('Đã làm mới dữ liệu vật tư kho!');
          }}
          triggerToast={triggerToast}
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
                  <option value="1">📦 Tại kho</option>
                  <option value="2">🏗️ Tại dự án</option>
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
            <div
              className="dash-table-wrap"
              style={{
                width: '100%',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <table
                style={{
                  width: '100%',
                  minWidth: '1080px',
                  borderCollapse: 'collapse',
                  fontSize: '0.84rem',
                  textAlign: 'left'
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', whiteSpace: 'nowrap' }}>
                    <th style={{ padding: '12px 14px', width: '45px', textAlign: 'center' }}>STT</th>
                    <th style={{ padding: '12px 14px' }}>Mã thiết bị</th>
                    <th style={{ padding: '12px 14px', minWidth: '220px' }}>Tên vật tư</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', minWidth: '150px' }}>Loại thiết bị</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Đơn vị</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Số lượng</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Số lượng xuất</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Số lượng còn lại</th>
                    <th style={{ padding: '12px 14px' }}>Nhập kho</th>
                    <th style={{ padding: '12px 14px' }}>Xuất kho</th>
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
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1D58BB', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '6px' }}>
                            {item.device_code}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a', minWidth: '220px' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {renderDeviceTypeBadge(item.type)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#475569', whiteSpace: 'nowrap' }}>
                          {item.unit || 'Cái'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#f1f5f9' }}>
                            {item.quantity}
                          </span>
                        </td>
                        {/* Số lượng xuất (lấy từ cột quantity_out) */}
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, color: '#dc2626', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#fef2f2' }}>
                            {item.quantity_out !== undefined ? item.quantity_out : (item['quantity-out'] ?? 0)}
                          </span>
                        </td>
                        {/* Số lượng còn lại (lấy từ cột quantity_remain) */}
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, color: '#059669', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ecfdf5' }}>
                            {item.quantity_remain !== undefined
                              ? item.quantity_remain
                              : (item['quantity-remain'] ?? Math.max(0, (Number(item.quantity) || 0) - (Number(item.quantity_out || item['quantity-out']) || 0)))}
                          </span>
                        </td>
                        {/* Thời gian nhập kho (lấy từ cột time_in) */}
                        <td style={{ padding: '12px 14px', color: '#1e293b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDateTime(item.time_in || item['time-in'] || item.time)}
                        </td>
                        {/* Thời gian xuất kho (lấy từ cột time_out) */}
                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {(item.time_out || item['time-out']) ? (
                            <span style={{ color: '#059669', fontWeight: 600 }}>
                              {formatDateTime(item.time_out || item['time-out'])}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa xuất kho</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {renderStatusBadge(item.status)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
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
              <span>Cập nhật đồng bộ với các cột <code>time_in</code> &amp; <code>time_out</code> bảng <code>storage</code></span>
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
                    Tên vật tư <span style={{ color: '#ef4444' }}>*</span>
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
                    Loại thiết bị <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
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
                    <option value="sensor">Cảm biến (sensor)</option>
                    <option value="motor">Động cơ (motor)</option>
                    <option value="valve">Van (valve)</option>
                    <option value="gateway">IoTGateway (gateway)</option>
                    <option value="hmi">Màn hình HMI (hmi)</option>
                    <option value="switch">Công tắc (switch)</option>
                    <option value="socket">Ổ cắm (socket)</option>
                    <option value="controller">Bộ điều khiển (controller)</option>
                    <option value="light">Chiếu sáng (light)</option>
                    <option value="meter">Đo lường (meter)</option>
                    <option value="line">Dây điện (line)</option>
                    <option value="cable">Cáp mạng (cable)</option>
                    <option value="signal">Dây tín hiệu (signal)</option>
                    <option value="distribute">Tủ điện (distribute)</option>
                    <option value="cb">Aptomat (cb)</option>
                    <option value="cc">Cầu chì (cc)</option>
                    <option value="crim">Kìm bấm mạng (crim)</option>
                    <option value="cut">Kìm cắt (cut)</option>
                    <option value="screw">Tuốc nơ vít 4 chấu (screw)</option>
                    <option value="flat">Tuốc nơ vít dẹp (flat)</option>
                    <option value="multi">Đồng hồ vạn năng (multi)</option>
                    <option value="trunk">Máng nhựa (trunk)</option>
                    <option value="lug">Đầu cốt (lug)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Đơn vị tính <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formUnit.toLowerCase()}
                    onChange={(e) => setFormUnit(e.target.value)}
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
                    <option value="bộ">bộ</option>
                    <option value="cái">cái</option>
                    <option value="hộp">hộp</option>
                    <option value="m">m</option>
                    <option value="cuộn">cuộn</option>
                    <option value="sợi">sợi</option>
                    {!['bộ', 'cái', 'hộp', 'm', 'cuộn', 'sợi'].includes(formUnit.toLowerCase()) && formUnit && (
                      <option value={formUnit}>{formUnit}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Số lượng<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formQuantity}
                    onChange={(e) => {
                      const newQty = Number(e.target.value);
                      setFormQuantity(newQty);
                      const remain = Math.max(0, newQty - formQuantityOut);
                      setFormStatus(remain > 0 ? '1' : '2');
                    }}
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
                    Tình trạng<span style={{ color: '#ef4444' }}>*</span>
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
                    <option value="1">Tại kho</option>
                    <option value="2">Tại dự án</option>
                  </select>
                </div>

                <div style={{ gridColumn: !editingItem ? 'span 2' : 'span 1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Thời gian nhập kho<span style={{ color: '#ef4444' }}>*</span>
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

                {editingItem && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Thời gian xuất kho
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

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Số lượng xuất
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={formQuantity}
                        value={formQuantityOut}
                        onChange={(e) => {
                          const newOut = Number(e.target.value);
                          setFormQuantityOut(newOut);
                          const remain = Math.max(0, formQuantity - newOut);
                          setFormStatus(remain > 0 ? '1' : '2');
                        }}
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
                        Số lượng còn lại (Tự động tính)
                      </label>
                      <div
                        style={{
                          padding: '9px 12px',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#059669',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: '8px'
                        }}
                      >
                        {Math.max(0, (Number(formQuantity) || 0) - (Number(formQuantityOut) || 0))}
                      </div>
                    </div>
                  </>
                )}
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

      {/* Thông báo yêu cầu trình duyệt từ nhân viên */}
      <DashPopup />
    </div>
  );
};

export default DashEquip;
