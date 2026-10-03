import React, { useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import {
  Lock,
  Eye,
  FileText,
  UserCheck,
  Server,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export const Privacy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page-root intro-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. Privacy Hero Section */}
      <section className="intro-hero-section">
        <div className="intro-hero-container">
          <h1 className="intro-hero-title">
            Chính Sách Bảo Mật <br />
            <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span> Việt Nam
          </h1>

          <p className="intro-hero-subtitle">
            Cam kết minh bạch, bảo vệ tối đa dữ liệu của bạn trên website <strong>3ahome.vn</strong> và ứng dụng di động <strong>Smart IOT</strong> theo chuẩn mực bảo mật quốc tế và quy định pháp luật.
          </p>

          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '12px' }}>
            <em>Cập nhật lần cuối: Tháng 10 năm 2026</em>
          </p>
        </div>
      </section>

      {/* 3. Main Privacy Content Section */}
      <section className="intro-content-section" style={{ background: '#f8fafc', padding: '60px 20px' }}>
        <div style={{ maxWidth: '920px', margin: '0 auto' }}>

          {/* Box tóm tắt nhanh */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
              marginBottom: '36px'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#105ca8', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={22} color="#105ca8" />
              Tuyên bố cam kết quyền riêng tư
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
              Công Ty TNHH Công Nghệ Thông Tin 3AHOME Việt Nam coi trọng sự riêng tư và bảo mật thông tin cá nhân của quý khách hàng, đối tác và người dùng ứng dụng di động <strong>Smart IOT</strong>. Chính sách này mô tả chi tiết cách thức chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu khi bạn truy cập website hoặc sử dụng các giải pháp của chúng tôi.
            </p>
          </div>

          {/* Điều 1: Dữ liệu thu thập */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
              marginBottom: '28px'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Eye size={20} color="#105ca8" />
              1. Thông tin chúng tôi thu thập
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '16px' }}>
              Khi bạn tương tác với website hoặc ứng dụng di động Smart IOT, chúng tôi có thể thu thập các danh mục thông tin sau:
            </p>
            <ul style={{ paddingLeft: '20px', color: '#475569', fontSize: '0.95rem', lineHeight: 1.8 }}>
              <li>
                <strong>Thông tin định danh liên hệ:</strong> Họ và tên, số điện thoại, địa chỉ email, tên cơ quan/doanh nghiệp do bạn chủ động cung cấp khi gửi biểu mẫu yêu cầu tư vấn, báo giá, hoặc bảo hành kỹ thuật.
              </li>
              <li>
                <strong>Dữ liệu vận hành thiết bị BMS/IoT:</strong> Trạng thái thiết bị, thông số cảm biến (nhiệt độ, độ ẩm, điện năng tiêu thụ, áp suất), nhật ký điều khiển kịch bản tự động hoá toà nhà được liên kết vào tài khoản quản lý.
              </li>
              <li>
                <strong>Thông tin kỹ thuật thiết bị di động:</strong> Loại thiết bị, phiên bản hệ điều hành (iOS / Android), mã định danh thiết bị ẩn danh và thông báo lỗi ứng dụng (Crash logs) để hỗ trợ vá lỗi và nâng cấp hiệu năng.
              </li>
              <li>
                <strong>Cam kết quyền nhạy cảm:</strong> Chúng tôi <strong>không</strong> thu thập danh bạ, tin nhắn riêng tư, vị trí GPS thời gian thực nền, hoặc truy cập camera/micro mà không có sự đồng ý tường minh từ người dùng.
              </li>
            </ul>
          </div>

          {/* Điều 2: Mục đích sử dụng dữ liệu */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
              marginBottom: '28px'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} color="#105ca8" />
              2. Mục đích sử dụng thông tin
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '16px' }}>
              Mọi dữ liệu thu thập được chỉ nhằm phục vụ các mục đích hợp pháp sau:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {[
                { title: 'Tư vấn & Triển khai', desc: 'Liên hệ giải đáp thắc mắc, gửi hồ sơ kỹ thuật, báo giá và hỗ trợ hợp đồng triển khai giải pháp BMS/IoT.' },
                { title: 'Vận hành ứng dụng Smart IOT', desc: 'Cho phép người dùng theo dõi, điều khiển và nhận cảnh báo sớm về hệ thống toà nhà thông minh thời gian thực.' },
                { title: 'Bảo trì & Hỗ trợ kỹ thuật', desc: 'Tiếp nhận yêu cầu bảo hành, sửa chữa, kiểm tra lỗi thiết bị và khắc phục sự cố kỹ thuật 24/7.' },
                { title: 'Bảo mật & Phòng chống gian lận', desc: 'Bảo vệ an toàn tài khoản người dùng, xác thực quyền truy cập và ngăn chặn các hành vi tấn công mạng.' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>{item.title}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Điều 3: Cam kết không chia sẻ dữ liệu */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
              marginBottom: '28px'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={20} color="#105ca8" />
              3. Chia sẻ thông tin với bên thứ ba
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Chúng tôi <strong>tuyệt đối không bán, cho thuê, trao đổi hay thương mại hoá thông tin cá nhân của bạn</strong> cho bất kỳ bên thứ ba nào vì mục đích quảng cáo hoặc tiếp thị không mong muốn.
            </p>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
              Dữ liệu chỉ được chia sẻ trong các trường hợp giới hạn: (1) Được sự cho phép trực tiếp từ bạn; (2) Các đối tác cung cấp dịch vụ hạ tầng đám mây đạt chuẩn bảo mật quốc tế ISO/IEC 27001 phục vụ lưu trữ hệ thống; hoặc (3) Khi có yêu cầu bắt buộc bằng văn bản từ cơ quan bảo vệ pháp luật có thẩm quyền theo quy định của pháp luật Việt Nam.
            </p>
          </div>

          {/* Điều 4: An toàn bảo mật */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
              marginBottom: '28px'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server size={20} color="#105ca8" />
              4. Bảo mật và lưu trữ thông tin
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '12px' }}>
              3AHOME áp dụng các biện pháp an ninh kỹ thuật và quản trị nghiêm ngặt để bảo vệ an toàn cho dữ liệu người dùng:
            </p>
            <ul style={{ paddingLeft: '20px', color: '#475569', fontSize: '0.95rem', lineHeight: 1.8, margin: 0 }}>
              <li>Toàn bộ dữ liệu truyền tải giữa thiết bị của bạn và máy chủ được mã hoá qua giao thức chuẩn HTTPS/TLS 1.3 và MQTT SSL.</li>
              <li>Hạ tầng máy chủ được bảo vệ bởi hệ thống tường lửa (Firewall), hệ thống phòng chống tấn công DDoS và cơ chế phân quyền truy cập nghiêm ngặt.</li>
              <li>Dữ liệu được lưu trữ an toàn tại các trung tâm dữ liệu đạt chuẩn Tier 3 và chỉ lưu giữ trong thời gian cần thiết để hoàn thành các mục đích đã công bố.</li>
            </ul>
          </div>

          {/* Điều 5: Quyền hạn của người dùng (Quy định bắt buộc của Apple Guideline 5.1.1) */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
              marginBottom: '28px'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RefreshCw size={20} color="#105ca8" />
              5. Quyền của người dùng & Xoá dữ liệu (Account & Data Deletion)
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '12px' }}>
              Theo chính sách bảo mật của Apple App Store và pháp luật về quyền riêng tư, bạn có đầy đủ các quyền sau đối với dữ liệu của mình:
            </p>
            <ul style={{ paddingLeft: '20px', color: '#475569', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '16px' }}>
              <li><strong>Quyền truy cập & kiểm tra:</strong> Yêu cầu xem lại các thông tin cá nhân và lịch sử thiết bị mà 3AHOME đang lưu trữ.</li>
              <li><strong>Quyền chỉnh sửa:</strong> Yêu cầu điều chỉnh, cập nhật các thông tin không chính xác hoặc đã thay đổi.</li>
              <li><strong>Quyền xoá dữ liệu vĩnh viễn:</strong> Yêu cầu xoá toàn bộ thông tin cá nhân, tài khoản hoặc dữ liệu thiết bị khỏi máy chủ hệ thống.</li>
              <li><strong>Quyền từ chối nhận thông báo:</strong> Huỷ đăng ký nhận các bản tin kỹ thuật hoặc thông báo tiếp thị bất kỳ lúc nào.</li>
            </ul>
            <div
              style={{
                background: '#eff6ff',
                borderRadius: '12px',
                padding: '16px 20px',
                border: '1px solid #bfdbfe'
              }}
            >
              <p style={{ color: '#1e40af', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                💡 <strong>Cách gửi yêu cầu xoá dữ liệu:</strong> Bạn chỉ cần gửi email tới <a href="mailto:3ahomeadmin@gmail.com" style={{ color: '#105ca8', fontWeight: 700 }}>3ahomeadmin@gmail.com</a> hoặc liên hệ hotline <strong style={{ color: '#105ca8' }}>0901.994.998</strong> kèm theo thông tin tài khoản/số điện thoại đã đăng ký. Đội ngũ quản trị sẽ xử lý và xác nhận xoá sạch dữ liệu trong vòng 48 giờ làm việc.
              </p>
            </div>
          </div>

          {/* Điều 6: Thông tin liên hệ */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
              6. Đơn vị chịu trách nhiệm và Thông tin liên hệ
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '16px' }}>
              Nếu quý khách có bất kỳ câu hỏi, thắc mắc hoặc đề nghị nào liên quan đến Chính sách bảo mật này, xin vui lòng liên hệ trực tiếp với chúng tôi:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#334155', fontSize: '0.92rem' }}>
                <MapPin size={18} color="#105ca8" />
                <span><strong>Công Ty TNHH Công Nghệ Thông Tin 3AHOME Việt Nam</strong> – 698 Nguyễn Lương Bằng, P.Hải Vân, TP. Đà Nẵng</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#334155', fontSize: '0.92rem' }}>
                <Phone size={18} color="#105ca8" />
                <span>Hotline hỗ trợ: <a href="tel:0901994998" style={{ color: '#105ca8', fontWeight: 600 }}>0901.994.998</a></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#334155', fontSize: '0.92rem' }}>
                <Mail size={18} color="#105ca8" />
                <span>Email hỗ trợ bảo mật: <a href="mailto:3ahomeadmin@gmail.com" style={{ color: '#105ca8', fontWeight: 600 }}>3ahomeadmin@gmail.com</a></span>
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

export default Privacy;
