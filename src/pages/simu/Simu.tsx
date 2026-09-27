import React, { useState, useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { Collect } from '../../components/common/Collect';
import { Entertain } from '../../components/common/Entertain';
import { 
  Cpu, 
  Wind, 
  Zap, 
  Gauge, 
  Activity, 
  Sliders, 
  ShieldCheck, 
  User, 
  Clock, 
  History,
  Power,
  RotateCw
} from 'lucide-react';
import type { SimuRecord } from '../../services/simuDb';

export const Simu: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<SimuRecord | null>(null);

  // Simulation interactive state
  const [chillerTemp, setChillerTemp] = useState(7.0);
  const [flowRate, setFlowRate] = useState(120);
  const [isChillerOn, setIsChillerOn] = useState(true);
  const [roomTemp, setRoomTemp] = useState(23.5);
  const [co2Level, setCo2Level] = useState(550);
  const [lightLevel, setLightLevel] = useState(75);
  const [activeTab, setActiveTab] = useState<'chiller' | 'ahu' | 'energy'>('chiller');

  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = localStorage.getItem('current_simu_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Tính toán COP giả lập
  const copValue = isChillerOn ? (6.2 - (chillerTemp - 6) * 0.15).toFixed(2) : '0.00';
  const powerKw = isChillerOn ? Math.round(180 + flowRate * 0.8) : 15;

  return (
    <div className="landing-page-root simu-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. Simu Hero Banner */}
      <section className="simu-hero-section">
        <div className="simu-hero-container">
          <div className="simu-hero-badge">
            <Cpu size={16} />
            <span>Phòng Mô Phỏng Trực Tuyến 3AHOME</span>
          </div>

          <h1 className="simu-hero-title">
            Mô phỏng Vận hành Toà nhà Thông minh <br />
            <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span> SCADA / BMS
          </h1>

          {/* User Session Bar */}
          {currentUser && (
            <div className="simu-user-session-card">
              <div className="simu-user-cell">
                <User size={18} className="session-icon" />
                <span>Kỹ sư: <strong>{currentUser.full_name}</strong></span>
              </div>
              <div className="simu-user-cell">
                <History size={18} className="session-icon" />
                <span>Số lượt vào phòng: <strong className="count-badge">{currentUser.count} lần</strong></span>
              </div>
              <div className="simu-user-cell">
                <Clock size={18} className="session-icon" />
                <span>Phiên làm việc: <strong>{currentUser.time}</strong></span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Interactive SCADA / BMS Simulation Dashboard */}
      <section className="simu-content-section">
        <div className="simu-content-container">
          {/* Simulation Navigation Tabs */}
          <div className="simu-tabs-row">
            <button
              type="button"
              className={`simu-tab-btn ${activeTab === 'chiller' ? 'active' : ''}`}
              onClick={() => setActiveTab('chiller')}
            >
              <Wind size={18} />
              <span>Trạm Lạnh Chiller Plant</span>
            </button>
            <button
              type="button"
              className={`simu-tab-btn ${activeTab === 'ahu' ? 'active' : ''}`}
              onClick={() => setActiveTab('ahu')}
            >
              <Activity size={18} />
              <span>Hệ thống AHU / IAQ Không khí</span>
            </button>
            <button
              type="button"
              className={`simu-tab-btn ${activeTab === 'energy' ? 'active' : ''}`}
              onClick={() => setActiveTab('energy')}
            >
              <Zap size={18} />
              <span>Giám sát Điện năng & Chiếu sáng</span>
            </button>
          </div>

          {/* Tab 1: Chiller Plant */}
          {activeTab === 'chiller' && (
            <div className="simu-grid-layout">
              <div className="simu-card-frame">
                <div className="simu-card-header">
                  <h3>Điều khiển Máy nén Chiller #01</h3>
                  <button
                    type="button"
                    className={`btn-power-toggle ${isChillerOn ? 'on' : 'off'}`}
                    onClick={() => setIsChillerOn(!isChillerOn)}
                  >
                    <Power size={16} />
                    <span>{isChillerOn ? 'ĐANG CHẠY' : 'ĐÃ TẮT'}</span>
                  </button>
                </div>

                <div className="simu-control-group">
                  <label>
                    <span>Nhiệt độ nước cấp (CHW Supply Temp):</span>
                    <strong>{chillerTemp.toFixed(1)} °C</strong>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="12"
                    step="0.1"
                    value={chillerTemp}
                    onChange={(e) => setChillerTemp(parseFloat(e.target.value))}
                    disabled={!isChillerOn}
                    className="simu-range-slider"
                  />
                  <div className="range-hints">
                    <span>5.0 °C (Tải cao)</span>
                    <span>7.0 °C (Tiêu chuẩn)</span>
                    <span>12.0 °C (Tiết kiệm)</span>
                  </div>
                </div>

                <div className="simu-control-group">
                  <label>
                    <span>Lưu lượng bơm tuần hoàn (Flow Rate):</span>
                    <strong>{flowRate} m³/h</strong>
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="200"
                    step="5"
                    value={flowRate}
                    onChange={(e) => setFlowRate(parseInt(e.target.value))}
                    disabled={!isChillerOn}
                    className="simu-range-slider"
                  />
                </div>
              </div>

              {/* Status & Telemetry */}
              <div className="simu-card-frame telemetry-card">
                <div className="simu-card-header">
                  <h3>Chỉ số Vận hành Thời gian thực</h3>
                  <RotateCw size={16} className="rotate-icon" />
                </div>

                <div className="telemetry-grid">
                  <div className="telemetry-metric">
                    <span className="metric-label">Hệ số hiệu quả COP</span>
                    <span className="metric-val green-text">{copValue}</span>
                    <span className="metric-sub">Tiêu chuẩn quốc tế &gt; 5.5</span>
                  </div>

                  <div className="telemetry-metric">
                    <span className="metric-label">Công suất tiêu thụ</span>
                    <span className="metric-val blue-text">{powerKw} kW</span>
                    <span className="metric-sub">Đo đếm qua Modbus RTU</span>
                  </div>

                  <div className="telemetry-metric">
                    <span className="metric-label">Nhiệt độ nước hồi (Return)</span>
                    <span className="metric-val orange-text">{(chillerTemp + 4.8).toFixed(1)} °C</span>
                    <span className="metric-sub">ΔT = 4.8 °C (Tối ưu)</span>
                  </div>

                  <div className="telemetry-metric">
                    <span className="metric-label">Trạng thái bảo vệ</span>
                    <span className="metric-val green-text">
                      <ShieldCheck size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      An toàn
                    </span>
                    <span className="metric-sub">Không có báo động lỗi</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: AHU & IAQ */}
          {activeTab === 'ahu' && (
            <div className="simu-grid-layout">
              <div className="simu-card-frame">
                <div className="simu-card-header">
                  <h3>Cài đặt Vi khí hậu AHU Văn phòng</h3>
                  <Sliders size={18} />
                </div>

                <div className="simu-control-group">
                  <label>
                    <span>Nhiệt độ phòng cài đặt (Set-point):</span>
                    <strong>{roomTemp.toFixed(1)} °C</strong>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="27"
                    step="0.5"
                    value={roomTemp}
                    onChange={(e) => setRoomTemp(parseFloat(e.target.value))}
                    className="simu-range-slider"
                  />
                </div>

                <div className="simu-control-group">
                  <label>
                    <span>Nồng độ CO2 mô phỏng trong phòng:</span>
                    <strong>{co2Level} ppm</strong>
                  </label>
                  <input
                    type="range"
                    min="400"
                    max="1500"
                    step="20"
                    value={co2Level}
                    onChange={(e) => setCo2Level(parseInt(e.target.value))}
                    className="simu-range-slider"
                  />
                  <div className="range-hints">
                    <span>400 ppm (Lý tưởng)</span>
                    <span>800 ppm (Trung bình)</span>
                    <span>&gt;1000 ppm (Cần cấp gió tươi)</span>
                  </div>
                </div>
              </div>

              <div className="simu-card-frame telemetry-card">
                <div className="simu-card-header">
                  <h3>Phản hồi Tự động hoá DDC 3AHOME</h3>
                  <Gauge size={18} />
                </div>

                <div className="telemetry-grid">
                  <div className="telemetry-metric">
                    <span className="metric-label">Độ mở van nước lạnh FCU</span>
                    <span className="metric-val blue-text">
                      {Math.min(100, Math.max(0, Math.round((roomTemp - 20) * 15)))} %
                    </span>
                    <span className="metric-sub">Tự động PID Control</span>
                  </div>

                  <div className="telemetry-metric">
                    <span className="metric-label">Độ mở van gió tươi (Fresh Air)</span>
                    <span className="metric-val green-text">
                      {co2Level > 800 ? '100% (Tối đa)' : co2Level > 600 ? '60%' : '30% (Tiết kiệm)'}
                    </span>
                    <span className="metric-sub">Theo cảm biến CO2</span>
                  </div>

                  <div className="telemetry-metric">
                    <span className="metric-label">Chất lượng không khí IAQ</span>
                    <span className={`metric-val ${co2Level < 700 ? 'green-text' : co2Level < 1000 ? 'orange-text' : 'red-text'}`}>
                      {co2Level < 700 ? 'RẤT TỐT' : co2Level < 1000 ? 'TRUNG BÌNH' : 'KÉM - CẢNH BÁO'}
                    </span>
                    <span className="metric-sub">Tiêu chuẩn ASHRAE 62.1</span>
                  </div>

                  <div className="telemetry-metric">
                    <span className="metric-label">Quạt cấp gió (Supply Fan)</span>
                    <span className="metric-val green-text">VFD 45 Hz</span>
                    <span className="metric-sub">Biến tần Inverter tiết kiệm điện</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Energy & Lighting */}
          {activeTab === 'energy' && (
            <div className="simu-grid-layout">
              <div className="simu-card-frame">
                <div className="simu-card-header">
                  <h3>Hệ thống Chiếu sáng Thông minh (Dimming)</h3>
                  <Zap size={18} />
                </div>

                <div className="simu-control-group">
                  <label>
                    <span>Cường độ sáng khu vực sảnh & văn phòng:</span>
                    <strong>{lightLevel} %</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={lightLevel}
                    onChange={(e) => setLightLevel(parseInt(e.target.value))}
                    className="simu-range-slider"
                  />
                  <div className="range-hints">
                    <span>0% (Tắt hết)</span>
                    <span>50% (Chế độ trưa)</span>
                    <span>100% (Toàn tải)</span>
                  </div>
                </div>

                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Line chiếu sáng Khẩn cấp:</span>
                    <strong style={{ color: '#10b981' }}>TỰ ĐỘNG BẬT 24/7</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cảm biến chuyển động PIR:</span>
                    <strong style={{ color: '#105ca8' }}>KÍCH HOẠT SẴN SÀNG</strong>
                  </div>
                </div>
              </div>

              <div className="simu-card-frame telemetry-card">
                <div className="simu-card-header">
                  <h3>Tổng hợp Tiết kiệm Năng lượng</h3>
                  <Activity size={18} />
                </div>

                <div className="telemetry-grid">
                  <div className="telemetry-metric">
                    <span className="metric-label">Điện năng tiết kiệm ước tính</span>
                    <span className="metric-val green-text">22.4 %</span>
                    <span className="metric-sub">So với vận hành thủ công</span>
                  </div>

                  <div className="telemetry-metric">
                    <span className="metric-label">Giảm phát thải CO2</span>
                    <span className="metric-val blue-text">14.8 Tấn/Tháng</span>
                    <span className="metric-sub">Công trình chuẩn LEED</span>
                  </div>

                  <div className="telemetry-metric">
                    <span className="metric-label">Chỉ số năng lượng EUI</span>
                    <span className="metric-val green-text">112 kWh/m²/năm</span>
                    <span className="metric-sub">Hạng xuất sắc tại Việt Nam</span>
                  </div>

                  <div className="telemetry-metric">
                    <span className="metric-label">Tình trạng hệ thống</span>
                    <span className="metric-val green-text">100% Online</span>
                    <span className="metric-sub">SCADA Gateway 3AHOME</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Common Components as requested */}
      <Collect />
      <Entertain />

      {/* 5. Footer */}
      <Footer />
    </div>
  );
};

export default Simu;
