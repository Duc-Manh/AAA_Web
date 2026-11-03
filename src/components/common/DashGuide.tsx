import React, { useState } from 'react';
import { BookOpen, X, ZoomIn } from 'lucide-react';
import { GuideLightbox } from './GuideLightbox';

export interface DashGuideItem {
  category: string;
  image: string | string[];
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
    image: '/uploads/guide/1-Home.png',
    title: 'Giao diện trang chủ ',
    content:
      'Người dùng đọc giới thiệu, hồ sơ năng lực, tin tức, xem thông tin dự án, thiết bị, lịch sử, mô phỏng, nhận tư vấn, liên hệ  ',
    tags: ['Giới thiệu', 'Hồ sơ năng lực', 'Tin tức', 'Dự án', 'Sản phẩm', 'Lịch sử', 'Mô phỏng', 'Tư vấn', 'Liên hệ']
  },
  {
    category: 'Mô phỏng',
    image: '/uploads/guide/2-Simu.png',
    title: 'Giao diện mô phỏng',
    content:
      'Người dùng nhập thông tin tại mục mô phỏng để vào trang mô phỏng',
    tags: ['Mô phỏng']
  },
  {
    category: 'Tư vấn',
    image: '/uploads/guide/3-Complain.png',
    title: 'Giao diện tư vấn',
    content:
      'Người dùng nhập thông tin tư vấn và gửi yêu cầu',
    tags: ['Tư vấn']
  },
  {
    category: 'Đăng nhập',
    image: '/uploads/guide/4-Login.png',
    title: 'Giao diện Đăng nhập',
    content:
      'Người dùng nhập thông tin đăng nhập để đăng nhập vào trang hệ thống, chú ý nhập sai quá 3 lần sẽ bị khoá tài khoản',
    tags: ['Đăng nhập']
  }, {
    category: 'Yêu cầu trình duyệt',
    image: '/uploads/guide/11-Require.png',
    title: 'Giao diện trình duyệt',
    content:
      'Sau khi đăng nhập thành công, nếu có thông tin dự án đăng bài hoặc tin tức cần duyệt để đăng lên trang chủ cho mọi người đọc thì sẽ có hiển thị',
    tags: ['Duyệt dự án đăng bài', 'Duyệt tin tức']
  }
  , {
    category: 'Tổng quan',
    image: ['/uploads/guide/12-Total.png', '/uploads/guide/12-Total1.png'],
    title: 'Giao diện tổng quan',
    content:
      'Tại mục Tổng quan, người dùng xem thông tin tài khoản, truy vết hành trình sử dụng của tài khoản. Thêm, bớt, sửa, xoá tài khoản nhân sự.',
    tags: ['Tổng quan']
  },
  {
    category: 'Thông tin dự án',
    image: '/uploads/guide/5-Project.png',
    title: 'Giao diện dự án đăng bài',
    content:
      'Tại mục Dự án đăng bài, người dùng nhập thông tin dự án để đăng bài dự án, nội dung sẽ hiển thị trên trang chủ',
    tags: ['Dự án']
  },
  {
    category: 'Tin tức đăng bài',
    image: '/uploads/guide/6-News.png',
    title: 'Giao diện tin tức đăng bài',
    content:
      'Tại mục Tin tức đăng bài, người dùng nhập thông tin tin tức để đăng bài dự án, nội dung sẽ hiển thị trên trang chủ, chú ý thể loại bài đăng',
    tags: ['Tin tức']
  },
  {
    category: 'Vật tư tồn kho',
    image: ['/uploads/guide/7-Equip1.png', '/uploads/guide/7-Equip.png'],
    title: 'Giao diện nhập kho vật tư',
    content:
      'Tại mục Vật tư tồn kho, người dùng nhập thông tin vật tư tồn kho để nhập kho, chú ý Mục Mã thiết bị (device_code) nên lấy số Serial Number của thiết bị, nếu không có thì tự đặt theo quy luật TB-1, TB-2, TB-3....(quy định ban hành sau) để kiểm soát, nội dung mục này sẽ nhập trùng trong IoT Gateway. Đây là nơi bắt đầu cho 1 thiết bị mới, sau khi khai báo ở đây thì có thể sử dụng thiết bị ở các mục dưới đây',
    tags: ['Vật tư tồn kho']
  },
  {
    category: 'Quản lý khách hàng',
    image: ['/uploads/guide/8-Custo.png', '/uploads/guide/8-Custo1.png'],
    title: 'Giao diện quản lý khách hàng',
    content:
      'Tại mục Quản lý khách hàng, người dùng nhập thông tin khách hàng đại diện cho dự án để tạo tài khoản quản lý, mật khẩu mặc định là 3AH@me. Tại ô Mã device_code (kho storage) hiển thị các mã thiết bị đang còn trong kho.',
    tags: ['Thông tin khách hàng']
  },
  {
    category: 'Quản lý vận hành',
    image: '/uploads/guide/9-Opera.png',
    title: 'Giao diện Quản lý vận hành',
    content:
      'Tại mục Quản lý vận hành, thông số các thiết bị kết nối với IoT Gateway dùng trong dự án hiện ra theo khai báo tại mục Quản lý khách hàng nếu mã device_code khai báo ở trên trùng với mã device_code khai báo trong cấu hình IoT Gateway.',
    tags: ['Quản lý vận hành']
  },
  {
    category: 'Lịch sử vận hành',
    image: '/uploads/guide/10-History.png',
    title: 'Giao diện Lịch sử vận hành',
    content:
      'Tại mục Lịch sử vận hành, người dùng xem thông số các thiết bị kết nối với IoT Gateway dùng trong dự án, theo khoảng thời gian đã chọn (Ngày/Tháng/Năm)',
    tags: ['Lịch sử vận hành']
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
                    {(() => {
                      const imgList = Array.isArray(item.image) ? item.image : [item.image];
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                          {imgList.map((imgSrc, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="dash-guide-img-card"
                              onClick={() => setPreviewImage({ src: imgSrc, title: imgList.length > 1 ? `${item.title} (Ảnh ${imgIdx + 1})` : item.title })}
                              title="Nhấp để xem ảnh lớn"
                            >
                              <img src={imgSrc} alt={`${item.title} ${imgIdx + 1}`} loading="lazy" />
                              <div className="dash-guide-img-overlay">
                                <ZoomIn size={14} />
                                <span>{imgList.length > 1 ? `Xem ảnh ${imgIdx + 1}` : 'Xem ảnh'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
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
