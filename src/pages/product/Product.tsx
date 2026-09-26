import React, { useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import {
  Package,
  Cpu,
  Thermometer,
  Gauge,
  Activity,
  Radio,
  CheckCircle2,
  ArrowRight,
  Home as HomeIcon,
  ShieldCheck,
  SlidersHorizontal
} from 'lucide-react';

export const Product: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const productCategories = [
    {
      icon: <Cpu size={28} />,
      title: 'Bộ Điều khiển Khả trình DDC',
      desc: 'Bộ điều khiển trung tâm mạnh mẽ, hỗ trợ chuẩn giao thức BACnet IP/MSTP, Modbus RTU/TCP, tích hợp I/O đa năng.',
      items: [
        'DDC Master Controller 32-Point / 64-Point',
        'Module mở rộng I/O Analog & Digital',
        'Bộ điều khiển chuyên dụng cho VAV và FCU',
        'Lập trình linh hoạt theo khối chức năng Function Block'
      ]
    },
    {
      icon: <Thermometer size={28} />,
      title: 'Cảm biến Hiện trường Chuyên dụng',
      desc: 'Đầy đủ cảm biến đo nhiệt độ, độ ẩm, áp suất chênh lệch, nồng độ CO2, CO và bụi mịn PM2.5 với độ chính xác cao.',
      items: [
        'Cảm biến nhiệt độ & độ ẩm gắn đường ống gió và gắn phòng',
        'Cảm biến chênh áp nước và chênh áp gió',
        'Cảm biến đo chất lượng không khí IAQ, CO2, TVOC',
        'Cảm biến hiện diện chuyển động radar bước sóng cao'
      ]
    },
    {
      icon: <Gauge size={28} />,
      title: 'Van Điều khiển & Động cơ Actuator',
      desc: 'Van bi điều khiển điện, van bướm và động cơ van gió chính xác, đáp ứng kiểm soát lưu lượng dòng chảy hệ HVAC.',
      items: [
        'Van bi điều khiển 2 ngã, 3 ngã tỷ lệ (Modulating 0-10V)',
        'Động cơ điều khiển van gió có lò xo phản hồi tự động',
        'Van cân bằng tự động nhiệt tĩnh kết hợp PICV',
        'Van bướm điều khiển điện công suất lớn cho tháp và Chiller'
      ]
    },
    {
      icon: <Radio size={28} />,
      title: 'IoT Gateway & Chuyển đổi Giao thức',
      desc: 'Cầu nối truyền thông thông minh giúp thu thập dữ liệu từ mọi thiết bị hiện trường và đồng bộ lên đám mây hoặc Server nội bộ.',
      items: [
        'Gateway chuyển đổi BACnet sang Modbus / MQTT',
        'Bộ chuyển đổi truyền thông không dây LoRaWAN / Zigbee',
        'Bộ thu phát tín hiệu quang công nghiệp chống sét',
        'Hỗ trợ tích hợp hệ thống PLC SCADA công nghiệp'
      ]
    },
    {
      icon: <Activity size={28} />,
      title: 'Đồng hồ Đo Năng lượng Đa năng',
      desc: 'Thiết bị đo đếm điện năng đa pha, đo nhiệt lượng BTU và lưu lượng nước siêu âm chuẩn xác phục vụ hạch toán chi phí.',
      items: [
        'Đồng hồ đo điện đa chức năng (V, A, kW, kWh, THD, PF)',
        'Đồng hồ đo nhiệt lượng BTU Meter cho trạm Chiller',
        'Đồng hồ đo lưu lượng nước lạnh dạng siêu âm',
        'Cổng truyền thông RS-485 Modbus tích hợp sẵn'
      ]
    },
    {
      icon: <SlidersHorizontal size={28} />,
      title: 'Bàn Điều khiển Phòng & Thermostat',
      desc: 'Thiết bị cảm ứng gắn tường sang trọng, màn hình LCD hiển thị nhiệt độ, trạng thái quạt và điều khiển phòng thông minh.',
      items: [
        'Thermostat cảm ứng màn hình màu đa chức năng',
        'Tích hợp kết nối Modbus hoặc BACnet MS/TP',
        'Cảm biến nhiệt độ và độ ẩm tích hợp bên trong',
        'Thiết kế tối giản, tinh tế phù hợp văn phòng và khách sạn'
      ]
    }
  ];

  return (
    <div className="landing-page-root intro-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. Product Hero Section */}
      <section className="intro-hero-section">
        <div className="intro-hero-container">
          <div className="intro-breadcrumb">
            <a href="#" className="breadcrumb-link">
              <HomeIcon size={14} />
              <span>Trang chủ</span>
            </a>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Sản phẩm</span>
          </div>

          <div className="intro-hero-badge">
            <Package size={16} />
            <span>Danh mục sản phẩm</span>
          </div>

          <h1 className="intro-hero-title">
            Thiết bị & Phần cứng <br />
            Tự động hoá Toà nhà <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span>
          </h1>

          <p className="intro-hero-subtitle">
            Cung cấp đầy đủ thiết bị điều khiển DDC, cảm biến hiện trường, van động cơ và giải pháp IoT Gateway chất lượng cao,
            được chứng nhận đạt tiêu chuẩn kỹ thuật nghiêm ngặt của châu Âu và quốc tế.
          </p>

          <div className="intro-hero-actions">
            <a href="#trial" className="btn-hero-primary-saas">
              <span>Yêu cầu báo giá thiết bị</span>
              <ArrowRight size={16} />
            </a>
            <a href="#" className="btn-hero-outline-saas">
              <span>Quay lại Trang chủ</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Products Grid */}
      <section className="intro-content-section">
        <div className="intro-content-container">
          <div className="section-header-centered">
            <h2 className="gradient-flow-title">Hệ Sinh Thái Thiết Bị BMS Toàn Diện</h2>
            <p>Tương thích hoàn toàn với tất cả các chuẩn giao thức mở BACnet, Modbus và hệ thống SCADA công nghiệp.</p>
          </div>

          <div className="intro-grid-two-col" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {productCategories.map((cat, idx) => (
              <div key={idx} className="intro-card-box highlight" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="intro-card-icon" style={{ marginBottom: '16px' }}>
                  {cat.icon}
                </div>
                <h3 className="intro-card-title" style={{ fontSize: '1.25rem', marginBottom: '10px' }}>{cat.title}</h3>
                <p className="intro-card-text" style={{ marginBottom: '18px', flexGrow: 1 }}>{cat.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                  {cat.items.map((item, iIdx) => (
                    <div key={iIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569' }}>
                      <CheckCircle2 size={16} color="#0b8645" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quality Commitments */}
          <div className="intro-core-values-wrapper" style={{ marginTop: '64px' }}>
            <div className="section-header-centered">
              <h2 className="gradient-flow-title">Cam Kết Chất Lượng Sản Phẩm</h2>
              <p>Mỗi thiết bị do 3AHOME phân phối đều đi kèm chính sách bảo hành và hỗ trợ kỹ thuật tận tâm.</p>
            </div>

            <div className="intro-values-grid">
              <div className="value-card">
                <div className="value-number">
                  <ShieldCheck size={26} color="#0b8645" />
                </div>
                <h4>100% Chính Hãng</h4>
                <p>Đầy đủ giấy tờ chứng nhận xuất xứ CO và chứng nhận chất lượng CQ theo quy định pháp luật.</p>
              </div>

              <div className="value-card">
                <div className="value-number">
                  <Activity size={26} color="#0b8645" />
                </div>
                <h4>Độ Bền & Ổn Định</h4>
                <p>Thiết bị được thiết kế theo tiêu chuẩn công nghiệp, hoạt động bền bỉ trong môi trường khắc nghiệt 24/7.</p>
              </div>

              <div className="value-card">
                <div className="value-number">
                  <Cpu size={26} color="#0b8645" />
                </div>
                <h4>Tương Thích Mở</h4>
                <p>Không bị khóa nhà cung cấp, dễ dàng tích hợp và mở rộng thêm thiết bị mới trong tương lai.</p>
              </div>

              <div className="value-card">
                <div className="value-number">
                  <Package size={26} color="#0b8645" />
                </div>
                <h4>Bảo Hành 24 Tháng</h4>
                <p>Chính sách 1 đổi 1 đối với lỗi do nhà sản xuất cùng đội ngũ kỹ sư hỗ trợ kỹ thuật tại chỗ.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
};

export default Product;
