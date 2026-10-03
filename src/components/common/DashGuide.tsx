import React, { useState } from 'react';
import { BookOpen, X, ZoomIn } from 'lucide-react';
import { GuideLightbox } from './GuideLightbox';

export interface DashGuideItem {
  category: string;
  image: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface DashGuideProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  items?: DashGuideItem[];
}

export const adminGuideData: DashGuideItem[] = [
  {
    category: 'Trang chủ',
    image: '/uploads/news/1-Home.png',
    title: 'Tổng quan hệ thống & Giám sát vận hành',
    content:
      'Theo dõi trạng thái kết nối các bộ điều khiển trung tâm BMS, thông số cảm biến môi trường (nhiệt độ, độ ẩm, CO2, áp suất) và tình trạng an ninh trực quan theo thời gian thực.',
    tags: ['Dashboard', 'Cảm biến IoT', 'BMS']
  },
  {
    category: 'Mô phỏng thiết bị',
    image: '/uploads/news/2-Simu.png',
    title: 'Thao tác thiết bị cơ bản',
    content: 'Bật tắt, thay đổi chế độ, điều chỉnh thông số thiết bị một cách trực quan.',
    tags: ['Thiết bị', 'Kịch bản', 'Chiếu sáng', 'Điều hoà']
  },
  {
    category: 'Phòng mô phỏng thiết bị',
    image: '/uploads/news/3-SimuLive.png',
    title: 'Trải nghiệm trực tiếp (Live Demo)',
    content:
      'Thao tác mô phỏng thiết bị trong môi trường thực tế với đầy đủ các tính năng, đảm bảo trải nghiệm chính xác như sử dụng thật.',
    tags: ['Demo', 'Thực tế', 'Trực quan']
  },
  {
    category: 'Đăng nhập',
    image: '/uploads/news/4-Login.png',
    title: 'Đăng nhập vào hệ thống',
    content:
      'Đăng nhập vào hệ thống bằng tên đăng nhập và mật khẩu.',
    tags: ['Đăng nhập', 'Tài khoản', 'Bảo mật']
  },
  {
    category: 'Đăng nhập sai',
    image: '/uploads/news/4-LoginWrong.png',
    title: 'Sai tên đăng nhập hoặc mật khẩu',
    content:
      'Sai tên đăng nhập hoặc mật khẩu',
    tags: ['Tài khoản', 'Phân quyền', 'Bảo mật']
  },
  {
    category: 'Tài khoản bị khóa',
    image: '/uploads/news/4-LoginBlock.png',
    title: 'Tài khoản bị khóa',
    content:
      'Tài khoản bị khóa',
    tags: ['Tài khoản', 'Phân quyền', 'Bảo mật']
  },
  {
    category: 'Trang Admin',
    image: '/uploads/news/5-Admin.png',
    title: 'Trang Admin',
    content:
      'Trang Admin',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Thêm mới tài khoản',
    image: '/uploads/news/5-AdminAddUser.png',
    title: 'Thêm mới tài khoản',
    content:
      'Thêm mới tài khoản',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Xem thông tin tài khoản',
    image: '/uploads/news/5-AdminClear.png',
    title: 'Xem thông tin tài khoản',
    content:
      'Xem thông tin tài khoản',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Chỉnh sửa thông tin tài khoản',
    image: '/uploads/news/5-AdminFix.png',
    title: 'Chỉnh sửa thông tin tài khoản',
    content:
      'Chỉnh sửa thông tin tài khoản',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Reset mật khẩu',
    image: '/uploads/news/5-AdminReset.png',
    title: 'Reset mật khẩu',
    content:
      'Reset mật khẩu',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Danh sách dự án',
    image: '/uploads/news/6-Proj.png',
    title: 'Danh sách dự án',
    content:
      'Danh sách dự án',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Thêm mới dự án',
    image: '/uploads/news/6-ProjAdd.png',
    title: 'Thêm mới dự án',
    content:
      'Thêm mới dự án',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Xem thông tin dự án',
    image: '/uploads/news/6-ProjClear.png',
    title: 'Xem thông tin dự án',
    content:
      'Xem thông tin dự án',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Chỉnh sửa thông tin dự án',
    image: '/uploads/news/6-ProjFix.png',
    title: 'Chỉnh sửa thông tin dự án',
    content:
      'Chỉnh sửa thông tin dự án',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Tin tức',
    image: '/uploads/news/7-News.png',
    title: 'Tin tức',
    content:
      'Tin tức',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Thêm mới tin tức',
    image: '/uploads/news/7-NewsPost.png',
    title: 'Thêm mới tin tức',
    content:
      'Thêm mới tin tức',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Chỉnh sửa thông tin tin tức',
    image: '/uploads/news/7-NewsFix.png',
    title: 'Chỉnh sửa thông tin tin tức',
    content:
      'Chỉnh sửa thông tin tin tức',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Thiết bị',
    image: '/uploads/news/8-Device.png',
    title: 'Thiết bị',
    content:
      'Thiết bị',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  },
  {
    category: 'Thêm mới thiết bị',
    image: '/uploads/news/8-DevicePost.png',
    title: 'Thêm mới thiết bị',
    content:
      'Thêm mới thiết bị',
    tags: ['Trang Admin', 'Quản trị', 'Bảo mật']
  }
];

export const DashGuide: React.FC<DashGuideProps> = ({
  isOpen,
  onClose,
  title = 'Hướng dẫn sử dụng quản trị (Admin)',
  subtitle = 'Khung tra cứu thao tác vận hành, quản trị thiết bị và phân quyền hệ thống',
  items = adminGuideData
}) => {
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="dash-guide-popover dash-guide-popover-dash" role="dialog" aria-modal="true">
        {/* Header Modal */}
        <div className="dash-guide-popover-header">
          <div className="dash-guide-header-title-wrap">
            <div className="dash-guide-header-icon-box">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="dash-guide-header-title">{title}</h3>
              <p className="dash-guide-header-subtitle">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="dash-guide-popover-close-btn"
            onClick={onClose}
            title="Đóng hướng dẫn"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nội dung bảng 3 cột: Danh mục | Hình ảnh | Nội dung */}
        <div className="dash-guide-popover-body">
          <table className="dash-guide-table">
            <thead>
              <tr>
                <th className="th-category" style={{ width: '20%' }}>Danh mục</th>
                <th className="th-img" style={{ width: '40%' }}>Hình ảnh</th>
                <th className="th-content" style={{ width: '40%' }}>Nội dung</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="td-category" style={{ width: '20%' }}>
                    <span className="dash-guide-category-badge">{item.category}</span>
                  </td>
                  <td className="td-img" style={{ width: '40%' }}>
                    <div
                      className="dash-guide-img-card"
                      onClick={() => setPreviewImage({ src: item.image, title: item.title })}
                      title="Nhấp để xem ảnh lớn"
                    >
                      <img src={item.image} alt={item.title} loading="lazy" />
                      <div className="dash-guide-img-overlay">
                        <ZoomIn size={14} />
                        <span>Xem ảnh</span>
                      </div>
                    </div>
                  </td>
                  <td className="td-content" style={{ width: '40%' }}>
                    <h4 className="dash-guide-row-title">{item.title}</h4>
                    <p className="dash-guide-row-desc">{item.content}</p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="dash-guide-row-tags">
                        {item.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="dash-guide-tag-pill">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer thông tin */}
        <div className="dash-guide-popover-footer">
          <span>💡 Mẹo: Nhấp vào hình ảnh để phóng to xem chi tiết</span>
          <button
            type="button"
            className="dash-guide-footer-close-btn"
            onClick={onClose}
          >
            Đã hiểu
          </button>
        </div>
      </div>

      {/* Lightbox xem ảnh lớn với nút zoom -, + và hỗ trợ kéo di chuyển */}
      <GuideLightbox
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
};

export default DashGuide;
