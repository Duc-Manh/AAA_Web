import React, { useState } from 'react';
import { BookOpen, X, ZoomIn } from 'lucide-react';
import { GuideLightbox } from './GuideLightbox';

export interface EmpGuideItem {
  category: string;
  image: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface EmpGuideProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  items?: EmpGuideItem[];
}

export const employeeGuideData: EmpGuideItem[] = [
  {
    category: 'Nhận việc & Tiến độ',
    image: '/images/slide1.png',
    title: 'Tiếp nhận công việc & Báo cáo tiến độ',
    content:
      'Xem danh mục công việc kỹ thuật được phân công hàng ngày, cập nhật tiến độ hoàn thành, nhập nhật ký thi công và tải lên biên bản nghiệm thu trực tiếp.',
    tags: ['Công việc', 'Tiến độ', 'Nghiệm thu']
  },
  {
    category: 'Đo kiểm & Cảm biến',
    image: '/images/slide2.png',
    title: 'Đo kiểm thông số thiết bị & Cảm biến',
    content:
      'Kiểm tra tín hiệu cảm biến nhiệt ẩm, lưu lượng điện áp tủ điện BMS, đối chiếu thông số đo đạc thực tế tại công trình với hệ thống quản lý tập trung.',
    tags: ['Đo kiểm', 'Cảm biến', 'Tủ điện']
  },
  {
    category: 'Sự cố & Đề xuất',
    image: '/images/slide4.png',
    title: 'Báo cáo sự cố khẩn cấp & Đề xuất vật tư',
    content:
      'Gửi phiếu báo hỏng thiết bị, yêu cầu hỗ trợ kỹ thuật trực tiếp từ ban quản lý khi phát hiện lỗi phần cứng, mất kết nối hoặc đề xuất xuất kho vật tư thay thế.',
    tags: ['Báo hỏng', 'Hỗ trợ', 'Vật tư']
  }
];

export const EmpGuide: React.FC<EmpGuideProps> = ({
  isOpen,
  onClose,
  title = 'Hướng dẫn công việc kỹ thuật (Nhân viên)',
  subtitle = 'Khung tra cứu quy trình nhận việc, đo kiểm thông số và xử lý sự cố thiết bị',
  items = employeeGuideData
}) => {
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="dash-guide-popover dash-guide-popover-emp" role="dialog" aria-modal="true">
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

export default EmpGuide;
