import React, { useState, useEffect } from 'react';
import { X, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';
import logo3aHome from '../../assets/images/logo_3ahome.png';
import { saveOrUpdateSimuUser } from '../../services/simuDb';

interface NavItem {
  id: string;
  name: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: '#solution', name: 'Giải pháp' },
  { id: '#product', name: 'Sản phẩm' },
  { id: '#project', name: 'Dự án' },
  { id: '#news', name: 'Tin tức' },
  { id: '#about', name: 'Về chúng tôi' },

  { id: '#simu', name: 'Mô phỏng' },
  { id: '#login', name: 'Đăng nhập' },
];

export const Header: React.FC = () => {
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || window.location.pathname);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // State quản lý khung đăng nhập Mô phỏng
  const [isSimuPopupOpen, setIsSimuPopupOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('7K9A');
  const [simuError, setSimuError] = useState('');
  const [simuSuccess, setSimuSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateCaptchaCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCaptcha(code);
    setCaptchaInput('');
    setSimuError('');
  };

  useEffect(() => {
    generateCaptchaCode();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-simu-container')) {
        setIsSimuPopupOpen(false);
      }
    };
    if (isSimuPopupOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSimuPopupOpen]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || window.location.pathname);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsContactModalOpen(false);
        setIsSimuPopupOpen(false);
      }
    };

    if (isContactModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isContactModalOpen]);

  const navigateTo = (hash: string) => {
    setCurrentHash(hash);
    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isItemActive = (id: string) => {
    const cleanId = id.replace('#', '');
    return currentHash === id || currentHash === `/${cleanId}`;
  };

  // Xử lý gửi form vào phòng mô phỏng
  const handleSimuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimuError('');
    setSimuSuccess('');

    if (!fullName.trim()) {
      setSimuError('Vui lòng nhập Họ và tên!');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setSimuError('Vui lòng nhập địa chỉ Email hợp lệ!');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setSimuError('Vui lòng nhập Số điện thoại hợp lệ!');
      return;
    }
    if (captchaInput.trim().toUpperCase() !== generatedCaptcha.toUpperCase()) {
      setSimuError('Mã xác thực không đúng. Vui lòng nhập lại!');
      generateCaptchaCode();
      return;
    }

    setIsSubmitting(true);
    try {
      // Lưu vào database 3ahome bảng simu
      const result = await saveOrUpdateSimuUser(fullName, email, phone);

      if (result.isReturning) {
        // Đã tồn tại: hiển thị thông báo Chào mừng bạn quay trở lại
        setSimuSuccess('Chào mừng bạn quay trở lại!');
      } else {
        setSimuSuccess('Đăng ký thành công! Đang chuyển tiếp...');
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setIsSimuPopupOpen(false);
        setSimuSuccess('');
        navigateTo('#simu');
      }, 700);
    } catch (err) {
      setIsSubmitting(false);
      setSimuError('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại!');
      console.error(err);
    }
  };

  return (
    <>
      <header className="saas-navbar">
        <div className="navbar-content">
          {/* Brand Logo */}
          <a
            href="#"
            className="nav-brand"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('');
            }}
          >
            <div className="brand-icon">
              <img src={logo3aHome} alt="3AHOME Logo" className="brand-logo-img" />
            </div>
          </a>

          {/* Navigation Menu */}
          <nav className="nav-links">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item.id);
              const isSimu = item.id === '#simu';

              if (isSimu) {
                return (
                  <div key={item.id} className="nav-simu-container">
                    <a
                      href={item.id}
                      className={active ? 'active simu-nav-link' : 'simu-nav-link'}
                      style={
                        active
                          ? {
                            color: '#105ca8',
                            transform: 'translateY(3px)',
                            fontWeight: 700,
                          }
                          : undefined
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSimuPopupOpen((prev) => !prev);
                        if (!isSimuPopupOpen) {
                          generateCaptchaCode();
                        }
                      }}
                    >
                      {item.name}
                    </a>

                    {/* Khung đăng nhập hiển thị ngay dưới mục Mô phỏng */}
                    {isSimuPopupOpen && (
                      <div className="simu-login-dropdown">
                        <div className="simu-login-header">
                          <h4>Đăng nhập Mô phỏng</h4>
                          <button
                            type="button"
                            className="simu-popup-close"
                            onClick={() => setIsSimuPopupOpen(false)}
                            aria-label="Đóng"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {simuError && (
                          <div className="simu-msg-box error">
                            <AlertCircle size={15} />
                            <span>{simuError}</span>
                          </div>
                        )}

                        {simuSuccess && (
                          <div className="simu-msg-box success">
                            <CheckCircle2 size={15} />
                            <span>{simuSuccess}</span>
                          </div>
                        )}

                        <form onSubmit={handleSimuSubmit} className="simu-login-form">
                          <div className="simu-field-group">
                            <label>Họ tên:</label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Nhập họ và tên..."
                              autoFocus
                            />
                          </div>

                          <div className="simu-field-group">
                            <label>Email:</label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="example@gmail.com..."
                            />
                          </div>

                          <div className="simu-field-group">
                            <label>Số điện thoại:</label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="0901 994 998..."
                            />
                          </div>

                          <div className="simu-field-group">
                            <label>Mã xác thực:</label>
                            <div className="simu-captcha-row">
                              <input
                                type="text"
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                                placeholder="Nhập mã..."
                                maxLength={6}
                              />
                              <button
                                type="button"
                                className="simu-captcha-box"
                                onClick={generateCaptchaCode}
                                title="Bấm để đổi mã mới"
                              >
                                <span className="captcha-text">{generatedCaptcha}</span>
                                <RotateCw size={14} className="captcha-icon" />
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-simu-enter"
                          >
                            <span>{isSubmitting ? 'Đang xác thực...' : 'Vào phòng mô phỏng'}</span>
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <a
                  key={item.id}
                  href={item.id}
                  className={active ? 'active' : ''}
                  style={
                    active
                      ? {
                        color: '#105ca8',
                        transform: 'translateY(3px)',
                        fontWeight: 700,
                      }
                      : undefined
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo(item.id);
                  }}
                >
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="nav-actions">
            <a href="#login" className="btn-nav-login"></a>
            <a
              href="#trial"
              className="btn-nav-primary"
              onClick={(e) => {
                e.preventDefault();
                setIsContactModalOpen(true);
              }}
            >
              <span>Liên hệ</span>
            </a>
          </div>
        </div>
      </header>

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
    </>
  );
};

export default Header;
