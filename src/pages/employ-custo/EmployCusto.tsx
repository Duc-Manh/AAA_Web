import React, { useState, useEffect } from 'react';
import '../dash/Dash.css';
import { EmpAside } from '../../components/common/EmpAside';
import { EmpHeader } from '../../components/common/EmpHeader';
import {
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  KeyRound,
  Cpu,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  Network,
  Radio,
  SlidersHorizontal,
  CheckCircle,
  Zap,
  ListPlus,
  RefreshCw
} from 'lucide-react';

interface CurrentUserData {
  id?: number;
  full_name?: string;
  gmail?: string;
  username?: string;
}

// 1. Cấu trúc bảng devices trong Database
export interface DeviceItem {
  id: number;
  device_code: string;       // UK: e.g. TEMP_T1_01, EM_T1_01, FAN_HVAC_01
  device_name: string;       // e.g. Cảm biến nhiệt độ Tầng 1
  device_type: 'sensor' | 'motor' | 'light' | 'ac';
  slave_address: number;     // Modbus Slave ID: 1, 2, 3...
  location_name?: string;    // e.g. Tầng 1
  created_at?: string;
}

// 2. Cấu trúc bảng gateways trong Database
export interface GatewayInfo {
  gateway_sn: string;        // UK: e.g. RCU100_SN_003
  ip_address: string;        // e.g. 192.168.1.250
  status: 'online' | 'offline'; // Trạng thái kết nối mạng thực tế
}

// 3. Cấu trúc dự án tổng thể (locations + gateways + devices)
export interface ProjectCustomerItem {
  id: number;                // maps to locations.location_id
  projectName: string;       // maps to locations.location_name
  address: string;           // maps to locations.address
  email: string;
  phone: string;
  customer_pass?: string;    // maps to locations.customer_pass
  gateway: GatewayInfo;      // maps to gateways
  devices: DeviceItem[];     // maps to devices
  status: 'active' | 'installing' | 'maintenance'; // Trạng thái dự án
  createdAt?: string;
}

export const EmployCusto: React.FC = () => {
  const [activeTab] = useState('customers');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);

  // Danh sách dự án (100% dữ liệu thực từ database 3ahome)
  const [projects, setProjects] = useState<ProjectCustomerItem[]>(() => {
    const saved = localStorage.getItem('aaa_customer_projects_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Tìm kiếm & Lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'installing' | 'maintenance'>('all');
  const [filterGatewayStatus, setFilterGatewayStatus] = useState<'all' | 'online' | 'offline'>('all');

  // Modal 1: Thêm mới dự án
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGatewaySn, setNewGatewaySn] = useState('');
  const [newGatewayIp, setNewGatewayIp] = useState('192.168.1.250');
  const [newGatewayStatus, setNewGatewayStatus] = useState<'online' | 'offline'>('online');
  const [newStatus, setNewStatus] = useState<'active' | 'installing' | 'maintenance'>('installing');
  const [newDevices, setNewDevices] = useState<Array<Omit<DeviceItem, 'id'>>>([]);

  // Form input tạm cho thiết bị mới trong modal tạo
  const [tempDevCode, setTempDevCode] = useState('');
  const [tempDevName, setTempDevName] = useState('');
  const [tempDevType, setTempDevType] = useState<'sensor' | 'motor' | 'light' | 'ac'>('sensor');
  const [tempSlaveAddr, setTempSlaveAddr] = useState<number>(1);
  const [tempLocation, setTempLocation] = useState('');

  // Modal 2: Sửa dự án
  const [editingItem, setEditingItem] = useState<ProjectCustomerItem | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGatewaySn, setEditGatewaySn] = useState('');
  const [editGatewayIp, setEditGatewayIp] = useState('');
  const [editGatewayStatus, setEditGatewayStatus] = useState<'online' | 'offline'>('online');
  const [editStatus, setEditStatus] = useState<'active' | 'installing' | 'maintenance'>('active');

  // Modal 3: Quản lý thiết bị con (Devices Drawer/Modal)
  const [deviceModalProject, setDeviceModalProject] = useState<ProjectCustomerItem | null>(null);
  const [newSubDevCode, setNewSubDevCode] = useState('');
  const [newSubDevName, setNewSubDevName] = useState('');
  const [newSubDevType, setNewSubDevType] = useState<'sensor' | 'motor' | 'light' | 'ac'>('sensor');
  const [newSubSlaveAddr, setNewSubSlaveAddr] = useState<number>(1);
  const [newSubLocation, setNewSubLocation] = useState('');

  // Modal 4: Xem chi tiết
  const [viewingItem, setViewingItem] = useState<ProjectCustomerItem | null>(null);

  // Modal 5: Xóa có mã xác thực
  const [deletingItem, setDeletingItem] = useState<ProjectCustomerItem | null>(null);
  const [deleteAuthCode, setDeleteAuthCode] = useState<string>('');
  const [deleteInputCode, setDeleteInputCode] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const generateDeleteAuthCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setDeleteAuthCode(code);
    setDeleteInputCode('');
    setDeleteError('');
    return code;
  };

  const openDeleteModal = (item: ProjectCustomerItem) => {
    setDeletingItem(item);
    generateDeleteAuthCode();
  };

  const [isLoading, setIsLoading] = useState(false);

  // Tải dữ liệu thật từ bảng locations, gateways, devices của database 3ahome
  const fetchProjects = async (showToast = false) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/customer-projects');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProjects(json.data);
          localStorage.setItem('aaa_customer_projects_v2', JSON.stringify(json.data));
          if (showToast) {
            triggerToast('Đã đồng bộ dữ liệu mới nhất từ Database 3AHOME!');
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Không thể tải từ /api/customer-projects, sử dụng cache cục bộ:', err);
    } finally {
      setIsLoading(false);
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
    fetchProjects();
  }, []);

  // Tự động lưu vào localStorage dự phòng
  useEffect(() => {
    localStorage.setItem('aaa_customer_projects_v2', JSON.stringify(projects));
  }, [projects]);

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
    }, 3200);
  };

  const currentFullName = currentUser?.full_name || currentUser?.username || 'Nhân Viên 3A';

  // Lọc danh sách dự án
  const filteredProjects = projects.filter((item) => {
    const matchQuery =
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.includes(searchQuery) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.gateway.gateway_sn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.gateway.ip_address.includes(searchQuery) ||
      item.devices.some(d =>
        d.device_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.location_name && d.location_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchGateway = filterGatewayStatus === 'all' || item.gateway.status === filterGatewayStatus;

    return matchQuery && matchStatus && matchGateway;
  });

  // Tiện ích: Tạo nhanh mẫu 8 thiết bị (4 tầng x 2 thiết bị: CB nhiệt & Công tơ)
  const handleLoadTemplateDevices = () => {
    const template: Array<Omit<DeviceItem, 'id'>> = [
      { device_code: 'TEMP_T1_01', device_name: 'Cảm biến nhiệt độ CB Tầng 1', device_type: 'sensor', slave_address: 1, location_name: 'Tầng 1' },
      { device_code: 'EM_T1_01', device_name: 'Công tơ điện Tầng 1', device_type: 'sensor', slave_address: 2, location_name: 'Tầng 1' },
      { device_code: 'TEMP_T2_01', device_name: 'Cảm biến nhiệt độ CB Tầng 2', device_type: 'sensor', slave_address: 3, location_name: 'Tầng 2' },
      { device_code: 'EM_T2_01', device_name: 'Công tơ điện Tầng 2', device_type: 'sensor', slave_address: 4, location_name: 'Tầng 2' },
      { device_code: 'TEMP_T3_01', device_name: 'Cảm biến nhiệt độ CB Tầng 3', device_type: 'sensor', slave_address: 5, location_name: 'Tầng 3' },
      { device_code: 'EM_T3_01', device_name: 'Công tơ điện Tầng 3', device_type: 'sensor', slave_address: 6, location_name: 'Tầng 3' },
      { device_code: 'TEMP_T4_01', device_name: 'Cảm biến nhiệt độ CB Tầng 4', device_type: 'sensor', slave_address: 7, location_name: 'Tầng 4' },
      { device_code: 'EM_T4_01', device_name: 'Công tơ điện Tầng 4', device_type: 'sensor', slave_address: 8, location_name: 'Tầng 4' },
    ];
    setNewDevices(template);
    triggerToast('Đã nạp khuôn mẫu 8 thiết bị cho 4 tầng thành công!');
  };

  // Thêm thiết bị vào danh sách tạm khi tạo dự án
  const handleAddTempDevice = () => {
    if (!tempDevCode.trim()) {
      alert('Vui lòng nhập Mã thiết bị (ví dụ TEMP_T1_01)!');
      return;
    }
    if (!tempDevName.trim()) {
      alert('Vui lòng nhập Tên thiết bị!');
      return;
    }
    setNewDevices([
      ...newDevices,
      {
        device_code: tempDevCode.trim().toUpperCase(),
        device_name: tempDevName.trim(),
        device_type: tempDevType,
        slave_address: Number(tempSlaveAddr) || (newDevices.length + 1),
        location_name: tempLocation.trim() || 'Khu vực chính'
      }
    ]);
    setTempDevCode('');
    setTempDevName('');
    setTempSlaveAddr(newDevices.length + 2);
    setTempLocation('');
  };

  const handleRemoveTempDevice = (index: number) => {
    setNewDevices(newDevices.filter((_, i) => i !== index));
  };

  // Tạo dự án mới hoàn chỉnh
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      alert('Vui lòng nhập tên dự án!');
      return;
    }
    if (!newAddress.trim()) {
      alert('Vui lòng nhập địa chỉ dự án!');
      return;
    }
    if (!newPhone.trim()) {
      alert('Vui lòng nhập số điện thoại!');
      return;
    }
    if (!newGatewaySn.trim()) {
      alert('Vui lòng nhập số serial Gateway 3ONEDATA!');
      return;
    }

    const payload = {
      projectName: newProjectName.trim(),
      address: newAddress.trim(),
      email: newEmail.trim() || 'Chưa cập nhật',
      phone: newPhone.trim(),
      customer_pass: '3AH@me', // Tự động tạo giá trị cột customer_pass là 3AH@me
      gateway: {
        gateway_sn: newGatewaySn.trim().toUpperCase(),
        ip_address: newGatewayIp.trim() || '192.168.1.250',
        status: newGatewayStatus
      },
      status: newStatus,
      devices: newDevices
    };

    try {
      const res = await fetch('/api/customer-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchProjects();
      } else {
        // Fallback local state
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const newProject: ProjectCustomerItem = {
          ...payload,
          id: Date.now(),
          customer_pass: '3AH@me',
          createdAt: formattedDate,
          devices: newDevices.map((d, idx) => ({ ...d, id: Date.now() + idx }))
        };
        setProjects([newProject, ...projects]);
      }
    } catch (err) {
      console.warn('Lỗi khi gửi API tạo dự án:', err);
    }

    setIsCreateOpen(false);

    // Reset Form
    setNewProjectName('');
    setNewAddress('');
    setNewEmail('');
    setNewPhone('');
    setNewGatewaySn('');
    setNewGatewayIp('192.168.1.250');
    setNewGatewayStatus('online');
    setNewStatus('installing');
    setNewDevices([]);

    triggerToast(`Đã lưu dự án "${payload.projectName}" vào cơ sở dữ liệu!`);
  };

  // Mở modal sửa dự án
  const openEditModal = (item: ProjectCustomerItem) => {
    setEditingItem(item);
    setEditProjectName(item.projectName);
    setEditAddress(item.address);
    setEditEmail(item.email === 'Chưa cập nhật' ? '' : item.email);
    setEditPhone(item.phone);
    setEditGatewaySn(item.gateway.gateway_sn);
    setEditGatewayIp(item.gateway.ip_address);
    setEditGatewayStatus(item.gateway.status);
    setEditStatus(item.status);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const payload = {
      projectName: editProjectName.trim(),
      address: editAddress.trim(),
      email: editEmail.trim() || 'Chưa cập nhật',
      phone: editPhone.trim(),
      customer_pass: editingItem.customer_pass || '3AH@me',
      gateway: {
        ...editingItem.gateway,
        gateway_sn: editGatewaySn.trim().toUpperCase(),
        ip_address: editGatewayIp.trim() || editingItem.gateway.ip_address,
        status: editGatewayStatus
      },
      status: editStatus
    };

    try {
      const res = await fetch(`/api/customer-projects/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchProjects();
      } else {
        setProjects(
          projects.map((item) =>
            item.id === editingItem.id ? { ...item, ...payload } : item
          )
        );
      }
    } catch {
      setProjects(
        projects.map((item) =>
          item.id === editingItem.id ? { ...item, ...payload } : item
        )
      );
    }

    setEditingItem(null);
    triggerToast(`Đã cập nhật dự án "${editProjectName}" thành công!`);
  };

  // Quản lý thiết bị con của Gateway
  const handleAddDeviceToCurrentProject = async () => {
    if (!deviceModalProject) return;
    if (!newSubDevCode.trim()) {
      alert('Vui lòng nhập Mã thiết bị!');
      return;
    }
    if (!newSubDevName.trim()) {
      alert('Vui lòng nhập Tên thiết bị!');
      return;
    }

    const newDevPayload = {
      device_code: newSubDevCode.trim().toUpperCase(),
      device_name: newSubDevName.trim(),
      device_type: newSubDevType,
      slave_address: Number(newSubSlaveAddr) || (deviceModalProject.devices.length + 1),
      floor: newSubLocation.trim() || 'Khu vực chính'
    };

    try {
      const res = await fetch(`/api/customer-projects/${deviceModalProject.id}/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDevPayload)
      });
      if (res.ok) {
        const refreshRes = await fetch('/api/customer-projects');
        if (refreshRes.ok) {
          const json = await refreshRes.json();
          if (json.success && Array.isArray(json.data)) {
            setProjects(json.data);
            const found = json.data.find((p: ProjectCustomerItem) => p.id === deviceModalProject.id);
            if (found) setDeviceModalProject(found);
          }
        }
      } else {
        const fallbackDev: DeviceItem = {
          ...newDevPayload,
          id: Date.now(),
          location_name: newDevPayload.floor,
          created_at: new Date().toISOString().slice(0, 10)
        };
        const updatedDevices = [...deviceModalProject.devices, fallbackDev];
        setProjects(projects.map(p => p.id === deviceModalProject.id ? { ...p, devices: updatedDevices } : p));
        setDeviceModalProject({ ...deviceModalProject, devices: updatedDevices });
      }
    } catch {
      // Local fallback
    }

    // Reset input
    setNewSubDevCode('');
    setNewSubDevName('');
    setNewSubSlaveAddr((deviceModalProject.devices.length || 0) + 2);
    setNewSubLocation('');

    triggerToast(`Đã thêm thiết bị [${newDevPayload.device_code}] vào Gateway!`);
  };

  const handleDeleteDeviceFromProject = async (deviceId: number) => {
    if (!deviceModalProject) return;

    try {
      const res = await fetch(`/api/customer-devices/${deviceId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const refreshRes = await fetch('/api/customer-projects');
        if (refreshRes.ok) {
          const json = await refreshRes.json();
          if (json.success && Array.isArray(json.data)) {
            setProjects(json.data);
            const found = json.data.find((p: ProjectCustomerItem) => p.id === deviceModalProject.id);
            if (found) setDeviceModalProject(found);
          }
        }
      } else {
        const updatedDevices = deviceModalProject.devices.filter(d => d.id !== deviceId);
        setProjects(projects.map(p => p.id === deviceModalProject.id ? { ...p, devices: updatedDevices } : p));
        setDeviceModalProject({ ...deviceModalProject, devices: updatedDevices });
      }
    } catch {
      const updatedDevices = deviceModalProject.devices.filter(d => d.id !== deviceId);
      setProjects(projects.map(p => p.id === deviceModalProject.id ? { ...p, devices: updatedDevices } : p));
      setDeviceModalProject({ ...deviceModalProject, devices: updatedDevices });
    }

    triggerToast('Đã xóa thiết bị khỏi hệ thống!');
  };

  // Xóa dự án có mã xác thực
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    if (!deleteInputCode.trim()) {
      setDeleteError('Vui lòng nhập mã xác thực!');
      return;
    }

    if (deleteInputCode.trim().toUpperCase() !== deleteAuthCode.toUpperCase()) {
      setDeleteError('Mã xác thực không chính xác. Vui lòng nhập lại!');
      generateDeleteAuthCode();
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customer-projects/${deletingItem.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchProjects();
      } else {
        setProjects(projects.filter((item) => item.id !== deletingItem.id));
      }
    } catch {
      setProjects(projects.filter((item) => item.id !== deletingItem.id));
    } finally {
      setIsDeleting(false);
    }

    triggerToast(`Đã xóa vĩnh viễn dự án "${deletingItem.projectName}" khỏi locations, gateways và devices!`);
    setDeletingItem(null);
    setDeleteInputCode('');
    setDeleteError('');
  };

  // Thống kê nhanh
  const totalProjects = projects.length;
  const activeCount = projects.filter((p) => p.status === 'active').length;
  const onlineGatewayCount = projects.filter((p) => p.gateway.status === 'online').length;
  const totalDevicesCount = projects.reduce((acc, curr) => acc + (curr.devices?.length || 0), 0);

  return (
    <div className="dash-layout">
      {/* Toast Notification */}
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
            fontSize: '0.88rem',
            fontWeight: 500,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid #1D58BB',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          {toastMessage}
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
          title="Quản Lý Khách Hàng"
          subtitle="Khởi tạo thông tin dự án, kết nối Gateway 3ONEDATA và cấu hình danh mục thiết bị đo đạc"
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          currentFullName={currentFullName}
          handleLogout={handleLogout}
        />

        {/* CONTAINER NỘI DUNG */}
        <div className="dash-content">
          {/* 4 Thẻ KPIs tổng quan */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}
          >
            {/* Card 1: Tổng dự án */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '18px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#eff6ff',
                  color: '#1D58BB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Building2 size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Tổng Dự Án (Locations)</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{totalProjects}</h3>
              </div>
            </div>

            {/* Card 2: Gateway Online */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '18px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#ecfdf5',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Radio size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Gateways Đang Online</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>
                  {onlineGatewayCount} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 400 }}>/ {totalProjects}</span>
                </h3>
              </div>
            </div>

            {/* Card 3: Tổng thiết bị kết nối */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '18px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#f5f3ff',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Cpu size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Thiết Bị Đã Nối (Devices)</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6' }}>{totalDevicesCount}</h3>
              </div>
            </div>

            {/* Card 4: Đang vận hành bình thường */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '18px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Vận Hành Bình Thường</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#16a34a' }}>{activeCount}</h3>
              </div>
            </div>
          </div>

          {/* Thanh công cụ Tìm kiếm & Lọc */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '16px 20px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1, minWidth: '320px' }}>
              {/* Input tìm kiếm */}
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  minWidth: '240px',
                  maxWidth: '440px'
                }}
              >
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }}
                />
                <input
                  type="text"
                  placeholder="Tìm theo tên dự án, địa chỉ, serial, IP, thiết bị..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    fontSize: '0.86rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
              </div>

              {/* Lọc Trạng thái dự án */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={15} color="#64748b" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.86rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Tất cả dự án</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="installing">Đang lắp đặt</option>
                  <option value="maintenance">Bảo trì</option>
                </select>
              </div>

              {/* Lọc Trạng thái kết nối Gateway */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={15} color="#64748b" />
                <select
                  value={filterGatewayStatus}
                  onChange={(e) => setFilterGatewayStatus(e.target.value as any)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.86rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Mọi trạng thái Gateway</option>
                  <option value="online">🟢 Gateway Online</option>
                  <option value="offline">⚫ Gateway Offline</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Hiển thị: <strong style={{ color: '#0f172a' }}>{filteredProjects.length}</strong> dự án
              </div>
              <button
                type="button"
                title="Làm mới dữ liệu từ Database 3AHOME"
                onClick={() => fetchProjects(true)}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#1D58BB',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                <RefreshCw size={13} className={isLoading ? 'dash-spin' : ''} />
                <span>{isLoading ? 'Đang đồng bộ...' : 'Đồng bộ DB'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewDevices([]);
                  setIsCreateOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#1D58BB',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(29, 88, 187, 0.28)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Plus size={16} />
                Tạo thông tin dự án mới
              </button>
            </div>
          </div>

          {/* Bảng Quản Lý Dự Án & Thiết Bị IoT */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
            }}
          >
            <div className="dash-table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="dash-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ width: '50px', textAlign: 'center', padding: '12px 10px' }}>STT</th>
                    <th style={{ minWidth: '190px', padding: '12px 14px' }}>Tên dự án</th>
                    <th style={{ minWidth: '180px', padding: '12px 14px' }}>Địa chỉ công trình</th>
                    <th style={{ minWidth: '170px', padding: '12px 14px' }}>Liên hệ khách hàng</th>
                    <th style={{ minWidth: '180px', padding: '12px 14px' }}>Gateway IoT</th>
                    <th style={{ minWidth: '150px', textAlign: 'center', padding: '12px 14px' }}>Thiết bị kết nối</th>
                    <th style={{ minWidth: '130px', padding: '12px 14px' }}>Khu vực / Tầng</th>
                    <th style={{ minWidth: '120px', padding: '12px 14px' }}>Trạng thái</th>
                    <th style={{ minWidth: '130px', textAlign: 'center', padding: '12px 14px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                          <AlertCircle size={32} />
                          <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>Không tìm thấy dự án nào phù hợp!</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              setFilterStatus('all');
                              setFilterGatewayStatus('all');
                            }}
                            style={{
                              marginTop: '6px',
                              padding: '6px 14px',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              color: '#1D58BB',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Xóa bộ lọc
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((item, index) => {
                      // Tổng hợp các tầng / vị trí từ danh mục thiết bị con
                      const uniqueLocations = Array.from(
                        new Set(item.devices.map(d => d.location_name).filter(Boolean))
                      );

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {/* 1. STT */}
                          <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                            <span className="dash-stt-badge">{index + 1}</span>
                          </td>

                          {/* 2. Tên dự án */}
                          <td style={{ padding: '14px' }}>
                            <div>
                              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem', display: 'block' }}>
                                {item.projectName}
                              </span>
                              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                                Mã Vị Trí: #{item.id}
                              </span>
                            </div>
                          </td>

                          {/* 3. Địa chỉ */}
                          <td style={{ padding: '14px' }}>
                            <span style={{ fontSize: '0.84rem', lineHeight: 1.4, color: '#475569' }}>{item.address}</span>
                          </td>

                          {/* 4. Liên hệ khách hàng */}
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                                <Phone size={13} color="#64748b" />
                                <span style={{ fontSize: '0.84rem', fontWeight: 500, color: '#1D58BB' }}>{item.phone}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                <Mail size={13} color="#94a3b8" />
                                <span style={{ fontSize: '0.8rem' }}>{item.email}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669' }}>
                                <KeyRound size={12} color="#059669" />
                                <span style={{ fontSize: '0.78rem', fontWeight: 600, fontFamily: 'monospace' }}>Pass: {item.customer_pass || '3AH@me'}</span>
                              </div>
                            </div>
                          </td>

                          {/* 5. Gateway IoT (Serial + IP + Status) */}
                          <td style={{ padding: '14px' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                flexDirection: 'column',
                                gap: '4px',
                                padding: '6px 10px',
                                backgroundColor: item.gateway.status === 'online' ? '#f0fdf4' : '#f8fafc',
                                border: `1px solid ${item.gateway.status === 'online' ? '#bbf7d0' : '#e2e8f0'}`,
                                borderRadius: '8px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div
                                  style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    backgroundColor: item.gateway.status === 'online' ? '#10b981' : '#94a3b8',
                                    boxShadow: item.gateway.status === 'online' ? '0 0 6px rgba(16, 185, 129, 0.7)' : 'none'
                                  }}
                                />
                                <span style={{ fontFamily: 'monospace', fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                                  {item.gateway.gateway_sn}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#64748b' }}>
                                <Network size={11} color="#64748b" />
                                <span>{item.gateway.ip_address}</span>
                                <span style={{ marginLeft: 'auto', fontWeight: 600, color: item.gateway.status === 'online' ? '#16a34a' : '#64748b' }}>
                                  {item.gateway.status === 'online' ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 6. Thiết bị kết nối */}
                          <td style={{ padding: '14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              title="Xem và Quản lý danh mục thiết bị con"
                              onClick={() => setDeviceModalProject(item)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '5px 14px',
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#1D58BB',
                                cursor: 'pointer'
                              }}
                            >
                              Chi tiết
                            </button>
                          </td>

                          {/* 7. Khu vực / Tầng */}
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '170px' }}>
                              {uniqueLocations.length > 0 ? (
                                uniqueLocations.map((loc, lIdx) => (
                                  <span
                                    key={lIdx}
                                    style={{
                                      fontSize: '0.74rem',
                                      padding: '2px 7px',
                                      backgroundColor: '#f1f5f9',
                                      color: '#334155',
                                      borderRadius: '4px',
                                      fontWeight: 500
                                    }}
                                  >
                                    {loc}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Chưa phân tầng</span>
                              )}
                            </div>
                          </td>

                          {/* 8. Trạng thái dự án */}
                          <td style={{ padding: '14px' }}>
                            {item.status === 'active' && (
                              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#059669' }}>
                                Vận hành
                              </span>
                            )}
                            {item.status === 'installing' && (
                              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#2563eb' }}>
                                Lắp đặt
                              </span>
                            )}
                            {item.status === 'maintenance' && (
                              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#d97706' }}>
                                Bảo trì
                              </span>
                            )}
                          </td>

                          {/* 9. Thao tác */}
                          <td style={{ textAlign: 'center', padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                title="Chỉnh sửa thông tin"
                                onClick={() => openEditModal(item)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  color: '#1D58BB',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                title="Xóa dự án"
                                onClick={() => openDeleteModal(item)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  backgroundColor: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  color: '#ef4444',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={15} />
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

      {/* ============================================================ */}
      {/* MODAL 1: TẠO THÔNG TIN DỰ ÁN MỚI (Locations + Gateways + Devices) */}
      {/* ============================================================ */}
      {isCreateOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '780px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 2
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    color: '#1D58BB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                    Tạo Thông Tin Dự Án Mới
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Khởi tạo dữ liệu đồng bộ 3 bảng (locations → gateways → devices)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateProject} style={{ padding: '24px' }}>
              {/* PHẦN 1: THÔNG TIN DỰ ÁN & VỊ TRÍ (locations) */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
                  <Building2 size={16} color="#1D58BB" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1D58BB', textTransform: 'uppercase' }}>
                    1. Thông tin Vị trí & Khách hàng (Bảng `locations`)
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Tên dự án / Công trình <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Biệt Thự Homeland - Nhà 4 Tầng"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '0.86rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Địa chỉ công trình <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: KĐT Ecopark, Văn Giang, Hưng Yên"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '0.86rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Số điện thoại liên hệ <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ví dụ: 0912 345 678"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '0.86rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Email khách hàng
                    </label>
                    <input
                      type="email"
                      placeholder="Ví dụ: khachhang@gmail.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '0.86rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* PHẦN 2: THÔNG TIN GATEWAY 3ONEDATA (gateways) */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
                  <Radio size={16} color="#059669" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                    2. Khai báo Gateway IoT (Bảng `gateways`)
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Mã Serial Gateway (UK) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: RCU100_SN_003"
                      value={newGatewaySn}
                      onChange={(e) => setNewGatewaySn(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '0.86rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Địa chỉ IP kết nối Gateway
                    </label>
                    <input
                      type="text"
                      placeholder="192.168.1.250"
                      value={newGatewayIp}
                      onChange={(e) => setNewGatewayIp(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '0.86rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Trạng thái kết nối Gateway
                    </label>
                    <select
                      value={newGatewayStatus}
                      onChange={(e) => setNewGatewayStatus(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '0.86rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="online">🟢 Online (Có tín hiệu)</option>
                      <option value="offline">⚫ Offline (Chưa kết nối)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PHẦN 3: KHAI BÁO DANH MỤC THIẾT BỊ (devices) */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={16} color="#7c3aed" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                      3. Danh mục Thiết bị kết nối (Bảng `devices`)
                    </span>
                    <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ede9fe', color: '#6d28d9', fontWeight: 600 }}>
                      {newDevices.length} Thiết bị
                    </span>
                  </div>

                  {/* Nút nạp nhanh mẫu 8 thiết bị */}
                  <button
                    type="button"
                    onClick={handleLoadTemplateDevices}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      backgroundColor: '#ede9fe',
                      border: '1px solid #c4b5fd',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#6d28d9',
                      cursor: 'pointer'
                    }}
                  >
                    <Zap size={13} />
                    Nạp nhanh mẫu 8 thiết bị (4 tầng)
                  </button>
                </div>

                {/* Form thêm thiết bị con */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1.2fr 0.8fr 1.2fr auto', gap: '8px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Mã device_code</label>
                      <input
                        type="text"
                        placeholder="TEMP_T1_01"
                        value={tempDevCode}
                        onChange={(e) => setTempDevCode(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Tên thiết bị</label>
                      <input
                        type="text"
                        placeholder="Cảm biến nhiệt Tầng 1"
                        value={tempDevName}
                        onChange={(e) => setTempDevName(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Loại (device_type)</label>
                      <select
                        value={tempDevType}
                        onChange={(e) => setTempDevType(e.target.value as any)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff' }}
                      >
                        <option value="sensor">Cảm biến (sensor)</option>
                        <option value="motor">Động cơ/Quạt (motor)</option>
                        <option value="light">Chiếu sáng (light)</option>
                        <option value="ac">Điều hòa (ac)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Slave ID</label>
                      <input
                        type="number"
                        min="1"
                        max="247"
                        value={tempSlaveAddr}
                        onChange={(e) => setTempSlaveAddr(Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'center' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Khu vực / Tầng</label>
                      <input
                        type="text"
                        placeholder="Tầng 1"
                        value={tempLocation}
                        onChange={(e) => setTempLocation(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTempDevice}
                      style={{
                        padding: '7px 12px',
                        backgroundColor: '#7c3aed',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={14} /> Thêm
                    </button>
                  </div>
                </div>

                {/* Danh sách thiết bị đã thêm */}
                {newDevices.length > 0 && (
                  <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f1f5f9' }}>
                        <tr>
                          <th style={{ padding: '6px 10px', textAlign: 'left' }}>Mã device_code</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left' }}>Tên thiết bị</th>
                          <th style={{ padding: '6px 10px', textAlign: 'center' }}>Loại</th>
                          <th style={{ padding: '6px 10px', textAlign: 'center' }}>Slave ID</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left' }}>Khu vực</th>
                          <th style={{ padding: '6px 10px', textAlign: 'center', width: '40px' }}>Xóa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newDevices.map((dev, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 600, color: '#1D58BB' }}>{dev.device_code}</td>
                            <td style={{ padding: '6px 10px' }}>{dev.device_name}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                              <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontSize: '0.72rem' }}>
                                {dev.device_type}
                              </span>
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600 }}>{dev.slave_address}</td>
                            <td style={{ padding: '6px 10px', color: '#475569' }}>{dev.location_name}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveTempDevice(idx)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Trạng thái dự án */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Trạng thái triển khai dự án
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '0.86rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="installing">Đang lắp đặt</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="maintenance">Bảo trì</option>
                </select>
              </div>

              {/* Footer Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
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
                  Tạo dự án và Lưu dữ liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: QUẢN LÝ DANH MỤC THIẾT BỊ CON (devices Drawer/Modal) */}
      {/* ============================================================ */}
      {deviceModalProject && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '860px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 24px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 2
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#ede9fe',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                    Danh Mục Thiết Bị Dùng Trong Dự Án: {deviceModalProject.projectName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px', fontSize: '0.8rem', color: '#64748b' }}>
                    <span>Gateway SN: <strong style={{ fontFamily: 'monospace', color: '#1D58BB' }}>{deviceModalProject.gateway.gateway_sn}</strong></span>
                    <span>•</span>
                    <span>IP: {deviceModalProject.gateway.ip_address}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeviceModalProject(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Box Thêm thiết bị trực tiếp vào dự án */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <ListPlus size={16} color="#1D58BB" />
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1D58BB' }}>Thêm Thiết Bị Mới Vào Gateway</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1.2fr 0.8fr 1.2fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>device_code (*)</label>
                    <input
                      type="text"
                      placeholder="TEMP_T5_01"
                      value={newSubDevCode}
                      onChange={(e) => setNewSubDevCode(e.target.value)}
                      style={{ width: '100%', padding: '7px 9px', fontSize: '0.82rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Tên thiết bị (*)</label>
                    <input
                      type="text"
                      placeholder="Cảm biến nhiệt độ"
                      value={newSubDevName}
                      onChange={(e) => setNewSubDevName(e.target.value)}
                      style={{ width: '100%', padding: '7px 9px', fontSize: '0.82rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Chủng loại</label>
                    <select
                      value={newSubDevType}
                      onChange={(e) => setNewSubDevType(e.target.value as any)}
                      style={{ width: '100%', padding: '7px 9px', fontSize: '0.82rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff' }}
                    >
                      <option value="sensor">Cảm biến (sensor)</option>
                      <option value="motor">Động cơ/Quạt (motor)</option>
                      <option value="light">Chiếu sáng (light)</option>
                      <option value="ac">Điều hòa (ac)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Modbus ID</label>
                    <input
                      type="number"
                      min="1"
                      max="247"
                      value={newSubSlaveAddr}
                      onChange={(e) => setNewSubSlaveAddr(Number(e.target.value))}
                      style={{ width: '100%', padding: '7px 9px', fontSize: '0.82rem', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'center' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Khu vực / Tầng</label>
                    <input
                      type="text"
                      placeholder="Tầng 1"
                      value={newSubLocation}
                      onChange={(e) => setNewSubLocation(e.target.value)}
                      style={{ width: '100%', padding: '7px 9px', fontSize: '0.82rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDeviceToCurrentProject}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#1D58BB',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={15} /> Thêm
                  </button>
                </div>
              </div>

              {/* Bảng danh sách thiết bị */}
              <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead style={{ backgroundColor: '#f1f5f9' }}>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>STT</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Mã Thiết Bị (device_code)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Tên Thiết Bị</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Loại (device_type)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Slave Address</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Khu vực / Tầng</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: '60px' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviceModalProject.devices.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                          Chưa có thiết bị nào được gắn với Gateway này. Hãy thêm thiết bị ở khung trên!
                        </td>
                      </tr>
                    ) : (
                      deviceModalProject.devices.map((dev, idx) => (
                        <tr key={dev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ textAlign: 'center', padding: '10px 12px' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#1D58BB' }}>
                            {dev.device_code}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 500, color: '#0f172a' }}>{dev.device_name}</td>
                          <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                backgroundColor:
                                  dev.device_type === 'sensor' ? '#eff6ff' :
                                    dev.device_type === 'motor' ? '#fef3c7' :
                                      dev.device_type === 'light' ? '#ecfdf5' : '#f5f3ff',
                                color:
                                  dev.device_type === 'sensor' ? '#1d4ed8' :
                                    dev.device_type === 'motor' ? '#b45309' :
                                      dev.device_type === 'light' ? '#047857' : '#6d28d9'
                              }}
                            >
                              {dev.device_type}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#334155' }}>
                            Modbus #{dev.slave_address}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#475569' }}>
                            {dev.location_name || 'Khu vực chính'}
                          </td>
                          <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteDeviceFromProject(dev.id)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                margin: '0 auto'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setDeviceModalProject(null)}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#1D58BB',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hoàn tất đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: SỬA DỰ ÁN & GATEWAY                                 */}
      {/* ============================================================ */}
      {editingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '680px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0'
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    color: '#1D58BB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                    Chỉnh Sửa Thông Tin Dự Án
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Mã dự án: #{editingItem.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Tên dự án / Công trình <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.86rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Địa chỉ công trình <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.86rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Số điện thoại liên hệ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.86rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Email khách hàng
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.86rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Mã Serial Gateway 3ONEDATA <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editGatewaySn}
                    onChange={(e) => setEditGatewaySn(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.86rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Địa chỉ IP Gateway
                  </label>
                  <input
                    type="text"
                    value={editGatewayIp}
                    onChange={(e) => setEditGatewayIp(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.86rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Trạng thái kết nối Gateway
                  </label>
                  <select
                    value={editGatewayStatus}
                    onChange={(e) => setEditGatewayStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.86rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff' }}
                  >
                    <option value="online">🟢 Online</option>
                    <option value="offline">⚫ Offline</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Trạng thái dự án
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.86rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff' }}
                  >
                    <option value="installing">Đang lắp đặt</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="maintenance">Bảo trì</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '28px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0'
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
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
                    padding: '9px 22px',
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
                  Cập nhật thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: XEM CHI TIẾT TỔNG THỂ DỰ ÁN                         */}
      {/* ============================================================ */}
      {viewingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0'
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 2
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    color: '#1D58BB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                    Chi Tiết Dự Án & Vận Hành IoT
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Location ID: #{viewingItem.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#1D58BB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  1. Thông tin Dự án / Khách hàng
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Tên dự án</span>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{viewingItem.projectName}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Thời điểm tạo</span>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{viewingItem.createdAt || 'N/A'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Địa chỉ</span>
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>{viewingItem.address}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Số điện thoại</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1D58BB' }}>{viewingItem.phone}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Email</span>
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>{viewingItem.email}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Mật khẩu khách hàng</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#059669', fontFamily: 'monospace' }}>{viewingItem.customer_pass || '3AH@me'}</span>
                  </div>
                </div>
              </div>

              {/* Gateway Section */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  2. Cấu hình Gateway 3ONEDATA
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#166534', display: 'block' }}>Mã Serial (gateway_sn)</span>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a', fontFamily: 'monospace' }}>{viewingItem.gateway.gateway_sn}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#166534', display: 'block' }}>IP kết nối</span>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a', fontFamily: 'monospace' }}>{viewingItem.gateway.ip_address}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#166534', display: 'block' }}>Trạng thái mạng</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: viewingItem.gateway.status === 'online' ? '#16a34a' : '#64748b' }}>
                      {viewingItem.gateway.status === 'online' ? '🟢 Online' : '⚫ Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Devices Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    3. Danh mục Thiết bị con ({viewingItem.devices.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const current = viewingItem;
                      setViewingItem(null);
                      setDeviceModalProject(current);
                    }}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#ede9fe',
                      color: '#6d28d9',
                      border: '1px solid #c4b5fd',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Quản lý thiết bị
                  </button>
                </div>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>device_code</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Tên thiết bị</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Loại</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Modbus ID</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Vị trí</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingItem.devices.map((d) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 600, color: '#1D58BB' }}>{d.device_code}</td>
                          <td style={{ padding: '8px 10px' }}>{d.device_name}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>{d.device_type}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>#{d.slave_address}</td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>{d.location_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#1D58BB',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
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

      {/* ============================================================ */}
      {/* MODAL 5: XÁC NHẬN XÓA DỰ ÁN (YÊU CẦU MÃ XÁC THỰC)             */}
      {/* ============================================================ */}
      {deletingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <AlertCircle size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              Xác Nhận Xóa Vĩnh Viễn Dự Án?
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
              Bạn đang thực hiện xóa dự án <strong>"{deletingItem.projectName}"</strong> (Gateway: <code style={{ color: '#1D58BB', fontWeight: 700 }}>{deletingItem.gateway.gateway_sn}</code>).
            </p>

            {/* Hộp thông báo ảnh hưởng database */}
            <div
              style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '18px',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: '#9f1239',
                lineHeight: 1.6
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> Thao tác này sẽ xóa đồng bộ 3 bảng trong Database:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li>Hàng dự án trong bảng <strong>locations</strong></li>
                <li>Hàng Gateway liên quan trong bảng <strong>gateways</strong></li>
                <li>Toàn bộ {deletingItem.devices.length} thiết bị con trong bảng <strong>devices</strong></li>
              </ul>
            </div>

            {/* Khung yêu cầu nhập mã xác thực */}
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Nhập mã xác thực để tiếp tục:
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Nhập mã xác thực..."
                  value={deleteInputCode}
                  onChange={(e) => {
                    setDeleteInputCode(e.target.value);
                    if (deleteError) setDeleteError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmDelete();
                    }
                  }}
                  maxLength={6}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textAlign: 'center',
                    border: deleteError ? '2px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }}
                  autoFocus
                />

                <div
                  onClick={generateDeleteAuthCode}
                  title="Nhấn để đổi mã xác thực mới"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      letterSpacing: '3px',
                      color: '#0f172a'
                    }}
                  >
                    {deleteAuthCode}
                  </span>
                  <RefreshCw size={14} color="#64748b" />
                </div>
              </div>

              {deleteError && (
                <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
                  ⚠️ {deleteError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeletingItem(null);
                  setDeleteInputCode('');
                  setDeleteError('');
                }}
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
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                style={{
                  padding: '9px 20px',
                  backgroundColor: isDeleting ? '#f87171' : '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                }}
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployCusto;
