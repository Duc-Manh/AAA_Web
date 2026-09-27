import React from 'react';
import { 
  Cpu, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Radio
} from 'lucide-react';

export interface DeviceData {
  id: string;
  name: string;
  location: string;
  type: string;
  value: string;
  standard: string;
  protocol: string;
  status: 'normal' | 'active' | 'safe';
  statusText: string;
  updatedAt: string;
}

const FLOOR_DATA: Record<number, { title: string; subtitle: string; devices: DeviceData[] }> = {
  0: {
    title: 'TẦNG 1 - KHU VỰC SẢNH TIẾP ĐÓN & TRIỂN LÃM',
    subtitle: 'Bố trí Cảm biến 1, Cảm biến 2, Cảm biến 3 và các thiết bị điều tiết sảnh chính',
    devices: [
      {
        id: 'CB-01',
        name: 'Cảm biến 1: Cảm biến Nhiệt độ Sảnh lễ tân',
        location: 'Khu vực quầy lễ tân & Cửa đón khách chính',
        type: 'Nhiệt độ môi trường',
        value: '24.2 °C',
        standard: '22.0 - 26.0 °C',
        protocol: 'Modbus RTU / RS485',
        status: 'normal',
        statusText: 'Bình thường',
        updatedAt: 'Thời gian thực (1s)',
      },
      {
        id: 'CB-02',
        name: 'Cảm biến 2: Cảm biến Độ ẩm Sảnh trung tâm',
        location: 'Không gian sảnh tiếp khách tầng 1',
        type: 'Độ ẩm không khí vi khí hậu',
        value: '56.5 %RH',
        standard: '45.0 - 65.0 %RH',
        protocol: 'Modbus RTU / RS485',
        status: 'normal',
        statusText: 'Bình thường',
        updatedAt: 'Thời gian thực (1s)',
      },
      {
        id: 'CB-03',
        name: 'Cảm biến 3: Cảm biến Chuyển động & Đếm người ra vào',
        location: 'Khu vực cửa kính tự động sảnh chính',
        type: 'Radar vi sóng & PIR phát hiện chuyển động',
        value: '18 lượt / giờ',
        standard: '< 80 lượt / giờ (Tải bình thường)',
        protocol: 'BACnet IP Gateway',
        status: 'active',
        statusText: 'Đang phát hiện',
        updatedAt: 'Thời gian thực',
      },
      {
        id: 'TB-01',
        name: 'Thiết bị 1: Van tuyến tính điều tiết nước lạnh FCU',
        location: 'Trần giả sảnh chính tầng 1',
        type: 'Điều khiển làm mát tự động PID',
        value: 'Độ mở 42 %',
        standard: '0 - 100 % (Theo nhiệt độ thực tế)',
        protocol: 'DDC Controller (0-10V)',
        status: 'active',
        statusText: 'Đang điều tiết',
        updatedAt: 'Thời gian thực',
      },
      {
        id: 'TB-02',
        name: 'Thiết bị 2: Đồng hồ đo đếm điện năng Tầng 1',
        location: 'Tủ điện hạ thế phân phối DB-F1',
        type: 'Đo lường điện năng 3 pha đa chức năng',
        value: '14.6 kW (Cosφ = 0.96)',
        standard: '< 25.0 kW (Ngưỡng an toàn)',
        protocol: 'Modbus RTU',
        status: 'safe',
        statusText: 'Ổn định',
        updatedAt: 'Thời gian thực',
      },
    ],
  },
  1: {
    title: 'TẦNG 2 - KHU VỰC VĂN PHÒNG LÀM VIỆC THÔNG MINH',
    subtitle: 'Bố trí Cảm biến 4, Cảm biến 5 và hệ thống kiểm soát vi khí hậu làm việc',
    devices: [
      {
        id: 'CB-04',
        name: 'Cảm biến 4: Cảm biến Nồng độ CO2 Vi khí hậu',
        location: 'Khu vực làm việc mở (Open Workspace)',
        type: 'Đo nồng độ CO2 quang học (NDIR)',
        value: '515 ppm',
        standard: '< 800 ppm (Chuẩn xanh ASHRAE 62.1)',
        protocol: 'Modbus RTU / RS485',
        status: 'safe',
        statusText: 'Rất trong lành',
        updatedAt: 'Thời gian thực (1s)',
      },
      {
        id: 'CB-05',
        name: 'Cảm biến 5: Cảm biến Nhiệt độ Phòng làm việc',
        location: 'Khu làm việc trung tâm tầng 2',
        type: 'Nhiệt độ tiện nghi văn phòng',
        value: '23.6 °C',
        standard: '23.0 - 25.0 °C (Tối ưu năng suất)',
        protocol: 'BACnet MS/TP',
        status: 'normal',
        statusText: 'Bình thường',
        updatedAt: 'Thời gian thực (1s)',
      },
      {
        id: 'CB-05B',
        name: 'Cảm biến Cường độ ánh sáng tự nhiên (Lux Sensor)',
        location: 'Khu vực vách kính lấy sáng tự nhiên',
        type: 'Đo độ rọi ánh sáng ban ngày',
        value: '425 Lux',
        standard: '350 - 500 Lux (TCVN 7114)',
        protocol: 'DALI-2 Protocol',
        status: 'normal',
        statusText: 'Đủ ánh sáng',
        updatedAt: 'Thời gian thực',
      },
      {
        id: 'TB-03',
        name: 'Thiết bị 3: Bộ điều hòa không khí FCU Văn phòng',
        location: 'Trần kỹ thuật khu làm việc tầng 2',
        type: 'Quạt biến tần VFD + Van điện từ',
        value: 'VFD 42.0 Hz • Quạt êm ái',
        standard: '30.0 - 50.0 Hz',
        protocol: 'Modbus RTU',
        status: 'active',
        statusText: 'Đang vận hành',
        updatedAt: 'Thời gian thực',
      },
      {
        id: 'TB-04',
        name: 'Thiết bị 4: Bộ giám sát điện năng chiếu sáng & ổ cắm',
        location: 'Tủ điện tầng 2 DB-F2',
        type: 'Đo lường năng lượng Smart Meter',
        value: '11.8 kW • 126 kWh/ngày',
        standard: '< 20.0 kW',
        protocol: 'Modbus TCP/IP',
        status: 'safe',
        statusText: 'Tiết kiệm 22%',
        updatedAt: 'Thời gian thực',
      },
    ],
  },
  2: {
    title: 'TẦNG 3 - TRUNG TÂM ĐIỀU HÀNH BMS / SCADA & PHÒNG MÁY CHỦ',
    subtitle: 'Bố trí Cảm biến 6, Cảm biến 7, Cảm biến an toàn kỹ thuật cao',
    devices: [
      {
        id: 'CB-06',
        name: 'Cảm biến 6: Cảm biến Nhiệt độ Phòng Server & Điều hành',
        location: 'Racks trung tâm phòng máy chủ Tầng 3',
        type: 'Nhiệt độ chính xác cao phòng kỹ thuật',
        value: '20.5 °C',
        standard: '18.0 - 22.0 °C (Chuẩn TIA-942 Data Center)',
        protocol: 'SNMP v3 / Modbus RTU',
        status: 'safe',
        statusText: 'An toàn tuyệt đối',
        updatedAt: 'Thời gian thực (1s)',
      },
      {
        id: 'CB-07',
        name: 'Cảm biến 7: Cảm biến Độ ẩm Phòng Máy chủ',
        location: 'Khu vực cụm máy chủ & UPS',
        type: 'Độ ẩm chống tĩnh điện phòng Server',
        value: '48.5 %RH',
        standard: '40.0 - 55.0 %RH',
        protocol: 'SNMP v3 / Modbus RTU',
        status: 'safe',
        statusText: 'Lý tưởng',
        updatedAt: 'Thời gian thực (1s)',
      },
      {
        id: 'CB-08',
        name: 'Cảm biến 8: Cảm biến Phát hiện rò rỉ nước (Water Leak)',
        location: 'Dưới sàn nâng kỹ thuật phòng máy Tầng 3',
        type: 'Dây dò rò rỉ chất lỏng',
        value: '0% (Khô ráo 100%)',
        standard: 'Không có hiện tượng rò rỉ',
        protocol: 'Dry Contact / DDC',
        status: 'safe',
        statusText: 'Khô ráo - An toàn',
        updatedAt: 'Thời gian thực',
      },
      {
        id: 'CB-09',
        name: 'Cảm biến 9: Cảm biến Khói quang học & Báo cháy sớm',
        location: 'Trần phòng điều hành trung tâm Tầng 3',
        type: 'Cảnh báo sớm PCCC quang điện tử',
        value: '0.01 mg/m³ (Môi trường sạch)',
        standard: '< 0.05 mg/m³ (An toàn PCCC)',
        protocol: 'Loop Addressable FACP',
        status: 'safe',
        statusText: 'Sẵn sàng 24/7',
        updatedAt: 'Thời gian thực',
      },
      {
        id: 'TB-05',
        name: 'Thiết bị 5: Máy lạnh chính xác PAC Phòng Server',
        location: 'Phòng kỹ thuật lạnh Tầng 3',
        type: 'Điều hòa chính xác Precision Air Cooling',
        value: 'Nhiệt độ gió cấp 16.2 °C • Tải 62%',
        standard: '15.0 - 18.0 °C (Dự phòng N+1)',
        protocol: 'BACnet IP',
        status: 'active',
        statusText: 'Đang chạy chính',
        updatedAt: 'Thời gian thực',
      },
      {
        id: 'TB-06',
        name: 'Thiết bị 6: Tủ cấp nguồn liên tục UPS 3-Phase BMS',
        location: 'Phòng nguồn điện phụ trợ Tầng 3',
        type: 'Bộ lưu điện Online Double Conversion',
        value: 'Dung lượng Pin 100% • Tải 38%',
        standard: 'Pin > 90% • Tải < 80%',
        protocol: 'SNMP / Modbus',
        status: 'safe',
        statusText: 'Cấp nguồn ổn định',
        updatedAt: 'Thời gian thực',
      },
    ],
  },
};

interface FloorDeviceTableProps {
  selectedFloor: number;
  onSelectFloor?: (floor: number) => void;
}

export const FloorDeviceTable: React.FC<FloorDeviceTableProps> = ({
  selectedFloor,
  onSelectFloor,
}) => {
  const currentFloorData = FLOOR_DATA[selectedFloor] || FLOOR_DATA[0];

  return (
    <div className="simu-floor-table-wrapper">
      {/* Header controls & Quick switcher */}
      <div className="table-top-bar">
        <div className="table-info-col">
          <div className="table-badge">
            <Layers size={16} />
            <span>DỮ LIỆU ĐO THỰC TẾ THEO TẦNG</span>
          </div>
          <h2 className="table-main-title">{currentFloorData.title}</h2>
          <p className="table-subtitle">{currentFloorData.subtitle}</p>
        </div>

        {/* Floor selection buttons synchronized with 3D model */}
        <div className="table-floor-selector">
          <span className="selector-label">Chọn tầng hiển thị:</span>
          <div className="selector-btn-group">
            {[0, 1, 2].map((fIndex) => (
              <button
                key={fIndex}
                type="button"
                className={`table-floor-tab-btn ${selectedFloor === fIndex ? 'active' : ''}`}
                onClick={() => onSelectFloor && onSelectFloor(fIndex)}
              >
                <span className="tab-tag">TẦNG {fIndex + 1}</span>
                <span className="tab-name">
                  {fIndex === 0
                    ? 'Cảm biến 1, 2, ...'
                    : fIndex === 1
                    ? 'Cảm biến 4, 5, ...'
                    : 'Cảm biến 6, 7, ...'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-responsive-container">
        <table className="simu-device-table">
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
              <th style={{ width: '100px' }}>Mã TB</th>
              <th>Tên thiết bị & Vị trí</th>
              <th>Loại thiết bị / Chức năng</th>
              <th style={{ minWidth: '160px' }}>Thông số đo được</th>
              <th>Ngưỡng tiêu chuẩn</th>
              <th>Giao thức</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {currentFloorData.devices.map((dev, index) => {
              const statusClass =
                dev.status === 'safe'
                  ? 'status-safe'
                  : dev.status === 'active'
                  ? 'status-active'
                  : 'status-normal';

              return (
                <tr key={dev.id} className="device-row">
                  <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                    {index + 1}
                  </td>
                  <td>
                    <span className="device-code-badge">{dev.id}</span>
                  </td>
                  <td>
                    <div className="device-name-text">{dev.name}</div>
                    <div className="device-location-text">{dev.location}</div>
                  </td>
                  <td>
                    <span className="device-type-text">{dev.type}</span>
                  </td>
                  <td>
                    <div className="device-value-highlight">
                      <Radio size={14} className="pulse-icon" />
                      <span>{dev.value}</span>
                    </div>
                  </td>
                  <td>
                    <span className="device-standard-text">{dev.standard}</span>
                  </td>
                  <td>
                    <span className="device-protocol-badge">{dev.protocol}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`device-status-badge ${statusClass}`}>
                      <CheckCircle2 size={13} />
                      <span>{dev.statusText}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer info summary */}
      <div className="table-summary-bar">
        <div className="summary-item">
          <Cpu size={15} />
          <span>Tổng số thiết bị giám sát: <strong>{currentFloorData.devices.length} điểm đo</strong></span>
        </div>
        <div className="summary-item">
          <Activity size={15} />
          <span>Trạng thái kết nối SCADA: <strong style={{ color: '#16a34a' }}>100% Hoạt động bình thường</strong></span>
        </div>
        <div className="summary-item">
          <Clock size={15} />
          <span>Cập nhật lần cuối: <strong>Vừa xong</strong></span>
        </div>
      </div>
    </div>
  );
};
