import React, { useState, useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { ArrowRight, X, Cpu, Tag } from 'lucide-react';

interface DeviceProduct {
  id: number;
  brand: string;
  name: string;
  image?: string | null;
  status?: number;
}

// Danh sách sản phẩm mẫu tiêu biểu của 3AHome
const DEFAULT_PRODUCTS: DeviceProduct[] = [
  {
    id: 101,
    brand: 'Siemens',
    name: 'Bộ Điều Khiển Trung Tâm DDC Desigo PXC Series',
    image: null
  },
  {
    id: 102,
    brand: 'Honeywell',
    name: 'Cảm Biến Nhiệt Độ & Độ Ẩm Kênh Gió H7012',
    image: null
  },
  {
    id: 103,
    brand: 'Belimo',
    name: 'Van Động Cơ Tuyến Tính 2 Ngả CCV 24V',
    image: null
  },
  {
    id: 104,
    brand: 'Schneider Electric',
    name: 'Đồng Hồ Đo Năng Lượng Đa Năng PowerLogic PM5350',
    image: null
  },
  {
    id: 105,
    brand: 'Danfoss',
    name: 'Biến Tần Tiết Kiệm Năng Lượng HVAC VLT FC 102',
    image: null
  },
  {
    id: 106,
    brand: 'Johnson Controls',
    name: 'Cảm Biến Chất Lượng Không Khí CO2 & VOC T6000',
    image: null
  },
  {
    id: 107,
    brand: 'ABB',
    name: 'Aptomat Khối Đo Lường Tích Hợp Tmax XT Ekip',
    image: null
  },
  {
    id: 108,
    brand: '3AHome',
    name: 'Smart IoT Gateway 3A-GW500 BACnet/Modbus IP',
    image: null
  }
];

export const Product: React.FC = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [devices, setDevices] = useState<DeviceProduct[]>(DEFAULT_PRODUCTS);

  // Link format cho ảnh từ uploads
  const formatImageUrl = (imgPath?: string | null) => {
    if (!imgPath) return '';
    if (imgPath.startsWith('data:image') || imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }
    const cleanFilename = imgPath.split(/[\\/]/).pop();
    if (imgPath.includes('device') || cleanFilename?.startsWith('device[')) {
      return `/uploads/device/${cleanFilename}`;
    }
    return `/uploads/news/${cleanFilename}`;
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchDevices = async () => {
      try {
        const res = await fetch('/api/device');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            // Lọc các thiết bị đang đăng bài (status === 1 hoặc không set status)
            const activeItems: DeviceProduct[] = json.data
              .filter((d: any) => d.status === 1 || d.status === '1' || d.status === undefined)
              .map((d: any) => ({
                id: d.id,
                brand: d.brand || '3AHome',
                name: d.name || 'Thiết bị tự động hoá',
                image: d.image || null
              }));

            if (activeItems.length > 0) {
              setDevices(activeItems);
            }
          }
        }
      } catch (err) {
        console.error('Lỗi nạp sản phẩm:', err);
      }
    };

    fetchDevices();
  }, []);

  // Nhân bản danh sách sản phẩm để tạo hiệu ứng cuộn ngang liên tục không điểm dừng
  const marqueeItems = devices.length >= 6
    ? [...devices, ...devices]
    : [...devices, ...DEFAULT_PRODUCTS, ...devices, ...DEFAULT_PRODUCTS];

  return (
    <div className="landing-page-root intro-page-root">
      {/* 1. Header */}
      <Header />

      {/* 2. Product Hero Section */}
      <section className="intro-hero-section">
        <div className="intro-hero-container">
          <h1 className="intro-hero-title">
            Thiết bị tự động hoá <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span>
          </h1>

          <p className="intro-hero-subtitle">
            Cung cấp đầy đủ thiết bị điều khiển, cảm biến hiện trường, van động cơ và giải pháp IoT Gateway chất lượng cao,
            được chứng nhận đạt tiêu chuẩn kỹ thuật nghiêm ngặt của châu Âu và quốc tế.
          </p>

          <div className="intro-hero-actions">
            <a
              href="#trial"
              className="btn-hero-primary-saas"
              onClick={(e) => {
                e.preventDefault();
                setIsContactModalOpen(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              <span>Yêu cầu báo giá thiết bị</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* 3. Products Grid: Khung hiển thị sản phẩm di chuyển liên tục từ phải qua trái */}
      <section className="intro-content-section">
        <div className="product-marquee-container">
          <div className="product-marquee-frame">
            <div className="product-marquee-track">
              {marqueeItems.map((prod, idx) => {
                const imgUrl = prod.image ? formatImageUrl(prod.image) : '';

                return (
                  <div
                    key={`prod-${prod.id}-${idx}`}
                    className="product-marquee-card"
                    onClick={() => setIsContactModalOpen(true)}
                    title={`Nhấn để yêu cầu báo giá cho: ${prod.name}`}
                  >
                    {/* Hình ảnh */}
                    <div className="product-card-image-box">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={prod.name}
                          className="product-card-img"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback nếu ảnh lỗi tải
                            (e.target as HTMLElement).style.display = 'none';
                            const parent = (e.target as HTMLElement).parentElement;
                            if (parent) {
                              const fb = parent.querySelector('.product-card-placeholder') as HTMLElement;
                              if (fb) fb.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}

                      <div
                        className="product-card-placeholder"
                        style={{ display: imgUrl ? 'none' : 'flex' }}
                      >
                        <Cpu size={38} color="#2563eb" strokeWidth={1.5} />
                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b' }}>
                          3AHome Device
                        </span>
                      </div>
                    </div>

                    {/* Hãng sản xuất */}
                    <div className="product-card-brand-badge">
                      <Tag size={12} />
                      <span>{prod.brand}</span>
                    </div>

                    {/* Tên thiết bị */}
                    <h3 className="product-card-title" title={prod.name}>
                      {prod.name}
                    </h3>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <Footer />

      {/* Contact Info Modal */}
      {isContactModalOpen && (
        <div
          className="contact-modal-backdrop"
          onClick={() => setIsContactModalOpen(false)}
        >
          <div
            className="contact-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="contact-modal-close"
              onClick={() => setIsContactModalOpen(false)}
              aria-label="Đóng"
            >
              <X size={20} />
            </button>

            <div className="contact-modal-card">
              <div className="contact-card-header">
                <div className="contact-company-sub">CÔNG TY TNHH CÔNG NGHỆ THÔNG MINH</div>
                <div className="contact-company-main">
                  <span className="brand-name-green" style={{ color: '#0b8645' }}>3A</span><span className="brand-name-blue" style={{ color: '#105ca8' }}>HOME VIỆT NAM</span>
                </div>
              </div>

              <div className="contact-card-divider" />

              <div className="contact-card-body">
                <p className="contact-card-row">
                  <span className="contact-row-label">Địa chỉ:</span> 698 Nguyễn Lương Bằng, P.Hải Vân, TP. Đà Nẵng
                </p>
                <p className="contact-card-row">
                  <span className="contact-row-label">Hotline:</span>{' '}
                  <a href="tel:+84901994998" className="contact-link">
                    (+84) 901 994 998
                  </a>
                </p>
                <p className="contact-card-row">
                  <span className="contact-row-label">Email:</span>{' '}
                  <a href="mailto:son.lm@3ahome.vn" className="contact-link">
                    son.lm@3ahome.vn
                  </a>
                </p>
                <p className="contact-card-row">
                  <span className="contact-row-label">Website:</span>{' '}
                  <a href="https://3ahome.vn" target="_blank" rel="noopener noreferrer" className="contact-link">
                    3ahome.vn
                  </a>
                </p>
              </div>

              {/* Decorative Corner Accents */}
              <div className="contact-card-accent-sub" />
              <div className="contact-card-accent-main" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
