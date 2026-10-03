import React, { useState } from 'react';
import { BookOpen, X, ZoomIn } from 'lucide-react';

export interface DashGuideItem {
  stt: string | number;
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
    stt: '01',
    image: '/images/slide1.png',
    title: 'Tổng quan hệ thống & Giám sát vận hành',
    content:
      'Theo dõi trạng thái kết nối các bộ điều khiển trung tâm BMS, thông số cảm biến môi trường (nhiệt độ, độ ẩm, CO2, áp suất) và tình trạng an ninh trực quan theo thời gian thực.',
    tags: ['Dashboard', 'Cảm biến IoT', 'BMS']
  },
  {
    stt: '02',
    image: '/images/slide2.png',
    title: 'Quản lý thiết bị & Kịch bản tự động hoá',
    content:
      'Bật / tắt, cấu hình thông số và điều khiển chiếu sáng thông minh, rèm tự động, HVAC điều hoà không khí, van tưới và kích hoạt các ngữ cảnh thông minh (Về nhà, Tiếp khách, Đi ngủ).',
    tags: ['Thiết bị', 'Kịch bản', 'Chiếu sáng', 'Điều hoà']
  },
  {
    stt: '03',
    image: '/images/slide3.png',
    title: 'Phân quyền nhân sự & Tra cứu lịch sử cảnh báo',
    content:
      'Phân quyền tài khoản kỹ thuật viên, theo dõi tiến độ thi công công trình, tiếp nhận tức thì các cảnh báo sự cố khẩn cấp và xuất báo cáo vận hành định kỳ.',
    tags: ['Phân quyền', 'Sự cố', 'Báo cáo']
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
      <div className="dash-guide-popover" role="dialog" aria-modal="true">
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

        {/* Nội dung bảng 3 cột: STT | Hình ảnh | Nội dung */}
        <div className="dash-guide-popover-body">
          <table className="dash-guide-table">
            <thead>
              <tr>
                <th className="th-stt">STT</th>
                <th className="th-img">Hình ảnh</th>
                <th className="th-content">Nội dung</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="td-stt">
                    <span className="dash-guide-stt-badge">{item.stt}</span>
                  </td>
                  <td className="td-img">
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
                  <td className="td-content">
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

      {/* Lightbox xem ảnh lớn */}
      {previewImage && (
        <div
          className="dash-guide-lightbox-overlay"
          onClick={() => setPreviewImage(null)}
          role="dialog"
        >
          <div
            className="dash-guide-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-guide-lightbox-header">
              <h4>{previewImage.title}</h4>
              <button
                type="button"
                className="dash-guide-lightbox-close"
                onClick={() => setPreviewImage(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="dash-guide-lightbox-body">
              <img src={previewImage.src} alt={previewImage.title} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashGuide;
