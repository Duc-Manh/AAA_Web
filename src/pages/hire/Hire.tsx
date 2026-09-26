import React, { useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  ArrowRight,
  Home as HomeIcon,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Heart
} from 'lucide-react';

export const Hire: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const jobs = [
    {
      id: 1,
      title: 'Kỹ Sư Tự Động Hoá BMS (Commissioning Engineer)',
      department: 'Phòng Kỹ thuật & Dự án',
      location: 'Hà Nội / Đà Nẵng / TP.HCM',
      type: 'Toàn thời gian',
      salary: '18 - 30 triệu VNĐ',
      desc: 'Phụ trách lập trình DDC, cấu hình giao diện SCADA/BMS, chạy thử nghiệm Point-to-Point và bàn giao nghiệm thu hệ thống toà nhà.',
      requirements: [
        'Tốt nghiệp Đại học chuyên ngành Tự động hoá, Điện - Điện tử, Nhiệt lạnh hoặc Cơ điện tử',
        'Có kinh nghiệm từ 1 năm trong lập trình PLC/DDC hoặc tích hợp hệ thống BACnet, Modbus',
        'Có khả năng đọc hiểu bản vẽ cơ điện M&E và sơ đồ nguyên lý HVAC',
        'Tinh thần trách nhiệm cao, sẵn sàng đi công tác ngắn ngày theo tiến độ dự án'
      ]
    },
    {
      id: 2,
      title: 'Kỹ Sư Phát Triển Phần Mềm IoT & Web BMS',
      department: 'Phòng Nghiên cứu & Phát triển (R&D)',
      location: 'Hà Nội',
      type: 'Toàn thời gian',
      salary: '22 - 35 triệu VNĐ',
      desc: 'Phát triển nền tảng Dashboard quản lý năng lượng EMS, tích hợp IoT Gateway, xử lý dữ liệu cảm biến thời gian thực và giao diện 3D trực quan.',
      requirements: [
        'Thành thạo React / TypeScript, Node.js hoặc Python',
        'Hiểu biết về giao thức mạng công nghiệp MQTT, WebSocket, RESTful API',
        'Có kinh nghiệm làm việc với cơ sở dữ liệu Time-series (InfluxDB, TimescaleDB) là lợi thế',
        'Đam mê công nghệ nhà thông minh và tối ưu hóa năng lượng'
      ]
    },
    {
      id: 3,
      title: 'Kỹ Sư Giải Pháp Kỹ Thuật (Presales Engineer)',
      department: 'Phòng Giải pháp & Bán hàng',
      location: 'Hà Nội / TP.HCM',
      type: 'Toàn thời gian',
      salary: '20 - 32 triệu VNĐ + Thưởng dự án',
      desc: 'Khảo sát nhu cầu khách hàng, phối hợp thiết kế giải pháp BMS tổng thể, bóc tách khối lượng (BOQ) và thuyết trình kỹ thuật với chủ đầu tư.',
      requirements: [
        'Tốt nghiệp kỹ sư Điện, Tự động hoá hoặc Kỹ thuật Môi trường / Nhiệt lạnh',
        'Có từ 2 năm kinh nghiệm trong lĩnh vực tư vấn thiết kế M&E hoặc giải pháp BMS',
        'Kỹ năng thuyết trình, giao tiếp tự tin và thuyết phục khách hàng tốt',
        'Tiếng Anh giao tiếp và đọc hiểu tài liệu kỹ thuật tốt'
      ]
    },
    {
      id: 4,
      title: 'Chuyên Viên Kinh Doanh Thiết Bị Kỹ Thuật (Sales B2B)',
      department: 'Phòng Kinh doanh',
      location: 'Hà Nội / Đà Nẵng / TP.HCM',
      type: 'Toàn thời gian',
      salary: '15 - 25 triệu VNĐ + Hoa hồng hấp dẫn',
      desc: 'Tìm kiếm và chăm sóc khách hàng chủ đầu tư, tổng thầu cơ điện M&E, đơn vị tư vấn thiết kế trong mảng thiết bị BMS và điều khiển toà nhà.',
      requirements: [
        'Tốt nghiệp Cao đẳng/Đại học khối ngành Kinh tế, Kỹ thuật hoặc liên quan',
        'Có kinh nghiệm bán hàng dự án B2B trong ngành xây dựng, cơ điện hoặc thiết bị công nghiệp',
        'Kỹ năng đàm phán, thương lượng hợp đồng và xây dựng mối quan hệ tốt',
        'Chủ động, nhiệt huyết và có mục tiêu phát triển sự nghiệp rõ ràng'
      ]
    }
  ];

  return (
    <div className="landing-page-root intro-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. Hire Hero Section */}
      <section className="intro-hero-section">
        <div className="intro-hero-container">
          <div className="intro-breadcrumb">
            <a href="#" className="breadcrumb-link">
              <HomeIcon size={14} />
              <span>Trang chủ</span>
            </a>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Tuyển dụng</span>
          </div>

          <div className="intro-hero-badge">
            <Briefcase size={16} />
            <span>Cơ hội nghề nghiệp</span>
          </div>

          <h1 className="intro-hero-title">
            Gia Nhập Đội Ngũ Công Nghệ <br />
            <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span> Việt Nam
          </h1>

          <p className="intro-hero-subtitle">
            Cùng chúng tôi kiến tạo những công trình thông minh, tiết kiệm năng lượng tại Việt Nam.
            Môi trường làm việc năng động, tôn trọng sáng tạo cá nhân cùng chế độ đãi ngộ vượt trội.
          </p>

          <div className="intro-hero-actions">
            <a href="#positions" className="btn-hero-primary-saas">
              <span>Xem vị trí ứng tuyển</span>
              <ArrowRight size={16} />
            </a>
            <a href="#" className="btn-hero-outline-saas">
              <span>Quay lại Trang chủ</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Culture & Benefits */}
      <section className="intro-content-section">
        <div className="intro-content-container">
          <div className="section-header-centered">
            <h2 className="gradient-flow-title">Quyền Lợi & Môi Trường Làm Việc</h2>
            <p>3AHOME luôn coi con người là tài sản quý giá nhất cho sự phát triển bền vững.</p>
          </div>

          <div className="intro-values-grid" style={{ marginBottom: '64px' }}>
            <div className="value-card">
              <div className="value-number">
                <DollarSign size={26} color="#0b8645" />
              </div>
              <h4>Thu Nhập Hấp Dẫn</h4>
              <p>Mức lương cạnh tranh theo năng lực, thưởng dự án định kỳ và đánh giá tăng lương 2 lần/năm.</p>
            </div>

            <div className="value-card">
              <div className="value-number">
                <GraduationCap size={26} color="#0b8645" />
              </div>
              <h4>Đào Tạo Chuyên Sâu</h4>
              <p>Được tham gia các khoá chứng chỉ quốc tế từ Siemens, Schneider, Honeywell tài trợ 100% chi phí.</p>
            </div>

            <div className="value-card">
              <div className="value-number">
                <Sparkles size={26} color="#0b8645" />
              </div>
              <h4>Cơ Hội Thăng Tiến</h4>
              <p>Lộ trình phát triển rõ ràng từ kỹ sư dự án lên trưởng nhóm, chuyên gia giải pháp hoặc giám đốc kỹ thuật.</p>
            </div>

            <div className="value-card">
              <div className="value-number">
                <Heart size={26} color="#0b8645" />
              </div>
              <h4>Phúc Lợi Toàn Diện</h4>
              <p>Bảo hiểm sức khoẻ cao cấp, du lịch nghỉ dưỡng hàng năm, khám sức khoẻ định kỳ và các hoạt động thể thao gắn kết.</p>
            </div>
          </div>

          {/* 4. Open Positions */}
          <div id="positions" className="section-header-centered">
            <h2 className="gradient-flow-title">Vị Trí Đang Tuyển Dụng</h2>
            <p>Tìm kiếm vị trí phù hợp với năng lực và định hướng tương lai của bạn.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '28px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                      {job.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.9rem', color: '#64748b' }}>
                      <span style={{ color: '#105ca8', fontWeight: 600 }}>{job.department}</span>
                      <span>•</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={15} />
                        <span>{job.location}</span>
                      </div>
                      <span>•</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={15} />
                        <span>{job.type}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f0fdf4', color: '#0b8645', padding: '6px 16px', borderRadius: '999px', fontWeight: 700, fontSize: '0.95rem', border: '1px solid #bbf7d0' }}>
                    {job.salary}
                  </div>
                </div>

                <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6 }}>
                  {job.desc}
                </p>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    Yêu cầu công việc:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {job.requirements.map((req, rIdx) => (
                      <div key={rIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.9rem', color: '#475569' }}>
                        <CheckCircle2 size={16} color="#0b8645" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <a
                    href="mailto:tuyendung@3ahome.vn?subject=Ung tuyen vi tri: "
                    className="btn-hero-primary-saas"
                    style={{ padding: '10px 24px', fontSize: '0.9rem' }}
                  >
                    <span>Ứng tuyển ngay</span>
                    <ArrowRight size={15} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <Footer />
    </div>
  );
};

export default Hire;
