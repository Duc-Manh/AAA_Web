import React, { useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import {
  Cpu,
  Zap,
  Wind,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Server
} from 'lucide-react';

export const Solution: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const solutions = [
    {
      icon: <Cpu size={28} />,
      title: 'Hệ thống Quản lý Toà nhà (BMS / BAS)',
      desc: 'Giám sát và điều khiển tự động toàn bộ hệ thống cơ điện (M&E) trong công trình, tích hợp đa giao thức BACnet, Modbus, MQTT.',
      features: [
        'Giám sát trạng thái thiết bị thời gian thực',
        'Cảnh báo sự cố tức thời qua SMS / Email / Dashboard',
        'Lập lịch vận hành tự động theo ca làm việc',
        'Tối ưu hóa chi phí nhân sự vận hành toà nhà'
      ]
    },
    {
      icon: <Wind size={28} />,
      title: 'Điều khiển Trạm Lạnh Chiller Tối ưu',
      desc: 'Thuật toán điều khiển Chiller Plant thông minh, điều chỉnh công suất theo tải thực tế, nâng cao hệ số hiệu quả COP trạm lạnh.',
      features: [
        'Phối hợp điều khiển Chiller, tháp giải nhiệt, bơm nước',
        'Tự động cân bằng tải và luân phiên thiết bị',
        'Giảm tiêu hao điện năng từ 15% đến 25%',
        'Bảo vệ kéo dài tuổi thọ cụm máy nén'
      ]
    },
    {
      icon: <Zap size={28} />,
      title: 'Quản lý Năng lượng Toàn diện (EMS)',
      desc: 'Hệ thống đo đếm và phân tích điện năng tiêu thụ đa điểm, phát hiện rò rỉ hoặc lãng phí năng lượng trong toàn bộ công trình.',
      features: [
        'Đo đếm điện, nước, khí gas đa điểm chính xác',
        'Báo cáo tự động theo chu kỳ ngày, tuần, tháng',
        'So sánh định mức tiêu thụ theo diện tích sàn',
        'Hỗ trợ đạt chứng chỉ công trình xanh (LOTUS, LEED)'
      ]
    },
    {
      icon: <Sliders size={28} />,
      title: 'Điều khiển Chiếu sáng Thông minh',
      desc: 'Hệ thống chiếu sáng tự động điều chỉnh độ sáng (Dimming) theo ánh sáng tự nhiên và cảm biến hiện diện chuyển động.',
      features: [
        'Điều khiển chiếu sáng khu vực công cộng, hầm xe, văn phòng',
        'Kịch bản chiếu sáng linh hoạt theo thời gian biểu',
        'Tiết kiệm điện năng chiếu sáng lên tới 40%',
        'Điều khiển trung tâm qua giao diện đồ họa 3D'
      ]
    },
    {
      icon: <Server size={28} />,
      title: 'Hệ thống Điều hoà Thông gió (HVAC & IAQ)',
      desc: 'Tự động kiểm soát nhiệt độ, độ ẩm và nồng độ CO2, mang lại luồng không khí trong lành, tiện nghi tối đa cho người sử dụng.',
      features: [
        'Điều khiển AHU, PAU, FCU và quạt thông gió hầm',
        'Kiểm soát chất lượng không khí IAQ, bụi mịn PM2.5',
        'Thuật toán cấp gió tươi thông minh theo mật độ người',
        'Đảm bảo tiêu chuẩn vi khí hậu và tiết kiệm điện'
      ]
    },
    {
      icon: <ShieldAlert size={28} />,
      title: 'Tích hợp An toàn & Báo cháy Tự động',
      desc: 'Liên động tự động với hệ thống PCCC, thang máy, hút khói hành lang và chiếu sáng khẩn cấp khi phát sinh sự cố.',
      features: [
        'Kịch bản liên động PCCC tiêu chuẩn quốc tế',
        'Tự động mở cửa thoát hiểm và điều áp cầu thang',
        'Dừng quạt cấp khí tươi, kích hoạt quạt hút khói độc',
        'Đảm bảo an toàn tính mạng tối đa cho cư dân'
      ]
    }
  ];

  return (
    <div className="landing-page-root intro-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. Solution Hero Section */}
      <section className="intro-hero-section">
        <div className="intro-hero-container">
          <h1 className="intro-hero-title">
            <span className="brand-name-blue">Giải pháp và Dịch vụ</span>
          </h1>

          <p className="intro-hero-subtitle">
            Cung cấp dịch vụ trọn gói từ tư vấn, thiết kế, cung cấp thiết bị đến triển khai và bảo trì hệ thống BMS/HVAC.
          </p>
        </div>
      </section>

      {/* 3. Solution Cards Grid */}
      <section className="intro-content-section">
        <div className="intro-content-container">
          <div className="intro-grid-two-col" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {solutions.map((item, idx) => (
              <div key={idx} className="intro-card-box highlight" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="intro-card-icon" style={{ marginBottom: '16px' }}>
                  {item.icon}
                </div>
                <h3 className="intro-card-title" style={{ fontSize: '1.25rem', marginBottom: '10px' }}>{item.title}</h3>
                <p className="intro-card-text" style={{ marginBottom: '18px', flexGrow: 1 }}>{item.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                  {item.features.map((feat, fIdx) => (
                    <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569' }}>
                      <CheckCircle2 size={16} color="#0b8645" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Steps */}
          <div className="intro-core-values-wrapper" style={{ marginTop: '64px' }}>
            <div className="section-header-centered">
              <h2 className="gradient-flow-title">Quy trình Triển khai Giải pháp</h2>
              <p>Chuẩn mực kỹ thuật chuyên sâu qua từng giai đoạn dự án.</p>
            </div>

            <div className="intro-values-grid">
              <div className="value-card">
                <div className="value-number">01</div>
                <h4>Khảo sát & Tư vấn</h4>
                <p>Khảo sát hiện trạng công trình, tính toán phụ tải và tư vấn kiến trúc hệ thống BMS phù hợp nhất.</p>
              </div>

              <div className="value-card">
                <div className="value-number">02</div>
                <h4>Thiết kế & Lập trình</h4>
                <p>Thiết kế sơ đồ nguyên lý, bản vẽ đấu nối và lập trình thuật toán điều khiển chuyên biệt cho từng thiết bị.</p>
              </div>

              <div className="value-card">
                <div className="value-number">03</div>
                <h4>Lắp đặt & Thử nghiệm</h4>
                <p>Lắp đặt tủ điều khiển DDC, cảm biến hiện trường và chạy thử nghiệm từng phần (Point-to-Point Testing).</p>
              </div>

              <div className="value-card">
                <div className="value-number">04</div>
                <h4>Bàn giao & Vận hành</h4>
                <p>Đào tạo kỹ thuật viên toà nhà, bàn giao tài liệu hoàn công và hỗ trợ kỹ thuật bảo trì lâu dài.</p>
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

export default Solution;
