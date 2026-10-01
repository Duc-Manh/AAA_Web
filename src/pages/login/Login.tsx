import React, { useState, useEffect } from 'react';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RotateCw,
  Clock,
  ShieldAlert
} from 'lucide-react';
import loginVideo from '../../assets/images/login.mp4';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Số lần đăng nhập sai & thời gian tạm khóa (tính bằng giây)
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Định dạng thời gian đếm ngược dạng mm:ss
  const formatRemainingTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const generateCaptchaCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCaptcha(result);
  };

  // Khởi tạo kiểm tra trạng thái khóa từ localStorage (chống F5 tải lại trang để né đếm giờ)
  useEffect(() => {
    window.scrollTo(0, 0);
    generateCaptchaCode();

    try {
      const storedUntil = localStorage.getItem('3ahome_login_lockout_until');
      const storedAttempts = localStorage.getItem('3ahome_login_failed_attempts');
      if (storedAttempts) {
        setFailedAttempts(Number(storedAttempts) || 0);
      }
      if (storedUntil) {
        const diffSeconds = Math.ceil((Number(storedUntil) - Date.now()) / 1000);
        if (diffSeconds > 0) {
          setLockoutRemaining(diffSeconds);
        } else {
          localStorage.removeItem('3ahome_login_lockout_until');
          localStorage.removeItem('3ahome_login_failed_attempts');
          setFailedAttempts(0);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Bộ đếm ngược thời gian khóa 5 phút (300 giây)
  useEffect(() => {
    if (lockoutRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          try {
            localStorage.removeItem('3ahome_login_lockout_until');
            localStorage.removeItem('3ahome_login_failed_attempts');
          } catch {
            // ignore
          }
          setFailedAttempts(0);
          setErrorMessage('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  // Xử lý khi đăng nhập sai (tăng biến đếm, nếu đạt 3 lần thì khóa 5 phút)
  const handleLoginFailure = (customMsg?: string) => {
    setIsLoading(false);
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    if (nextAttempts >= 3) {
      const lockoutTime = 5 * 60; // 5 phút = 300 giây
      const lockoutUntil = Date.now() + lockoutTime * 1000;
      try {
        localStorage.setItem('3ahome_login_lockout_until', String(lockoutUntil));
        localStorage.setItem('3ahome_login_failed_attempts', '3');
      } catch {
        // ignore
      }
      setLockoutRemaining(lockoutTime);
      setErrorMessage('Đăng nhập sai 3 lần liên tiếp. Hệ thống tạm khóa 5 phút để chống bot rà mật khẩu!');
    } else {
      try {
        localStorage.setItem('3ahome_login_failed_attempts', String(nextAttempts));
      } catch {
        // ignore
      }
      const remain = 3 - nextAttempts;
      setErrorMessage(
        (customMsg || 'Gmail hoặc Mật khẩu không chính xác.') +
        ` Cảnh báo: Bạn còn ${remain} lần thử trước khi bị tạm khóa 5 phút!`
      );
    }
    generateCaptchaCode();
    setCaptchaInput('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Nếu đang trong thời gian tạm khóa thì chặn ngay lập tức
    if (lockoutRemaining > 0) {
      setErrorMessage(`Hệ thống đang tạm khóa an toàn. Vui lòng chờ ${formatRemainingTime(lockoutRemaining)} để thử lại.`);
      return;
    }

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ Gmail và Mật khẩu.');
      return;
    }

    if (!captchaInput.trim()) {
      setErrorMessage('Vui lòng nhập mã xác thực.');
      return;
    }

    if (captchaInput.trim().toUpperCase() !== generatedCaptcha.toUpperCase()) {
      handleLoginFailure('Mã xác thực không chính xác.');
      return;
    }

    setIsLoading(true);

    try {
      // Gửi yêu cầu đăng nhập tới API backend kết nối bảng login database 3ahome
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gmail: username.trim(),
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setSuccessMessage('Đăng nhập thành công! Đang chuyển hướng...');

        // Xóa trạng thái đếm sai khi đăng nhập thành công
        try {
          localStorage.removeItem('3ahome_login_lockout_until');
          localStorage.removeItem('3ahome_login_failed_attempts');
        } catch {
          // ignore
        }
        setFailedAttempts(0);
        setLockoutRemaining(0);

        // Lưu thông tin người dùng vào localStorage
        localStorage.setItem(
          'aaa_admin_auth',
          JSON.stringify({
            ...data.user,
            username: data.user.full_name || data.user.gmail,
            token: 'auth_' + Date.now(),
          })
        );

        setTimeout(() => {
          // Phân quyền theo cột authen: 1 -> Dash.tsx, 2 -> Employ.tsx
          if (Number(data.user.authen) === 1) {
            window.location.hash = '#dash';
          } else if (Number(data.user.authen) === 2) {
            window.location.hash = '#employ';
          } else {
            window.location.hash = '#dash';
          }
        }, 1000);
      } else {
        handleLoginFailure(data.message || 'Gmail hoặc Mật khẩu không chính xác.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Không thể kết nối đến máy chủ xác thực cơ sở dữ liệu.');
      generateCaptchaCode();
    }
  };

  return (
    <div className="landing-page-root login-page-root">
      {/* 1. Header điều hướng toàn trang */}
      <Header />

      {/* 2. Phần Form Đăng Nhập Chính */}
      <main className="login-main-section">
        <div className="login-container">
          <div className="login-card-wrapper">
            {/* Cột trái: Video công nghệ phát lặp lại login.mp4 */}
            <div className="login-brand-panel">
              <video
                src={loginVideo}
                autoPlay
                loop
                muted
                playsInline
                className="login-brand-video"
              />
            </div>

            {/* Cột phải: Form Đăng Nhập */}
            <div className="login-form-panel">
              <div className="form-header">
                <h3 className="form-subtitle">Nhập thông tin tài khoản</h3>
              </div>

              {/* Bảng đếm giờ 5 phút chống bot rà mật khẩu khi đăng nhập sai 3 lần */}
              {lockoutRemaining > 0 && (
                <div className="login-lockout-banner">
                  <div className="lockout-banner-header">
                    <ShieldAlert size={22} className="lockout-icon" />
                    <div>
                      <h4 className="lockout-title">Tạm khóa bảo vệ (Chống bot rà mật khẩu)</h4>
                      <p className="lockout-desc">
                        Bạn đã nhập sai thông tin 3 lần liên tiếp. Để ngăn chặn bot rà quét mật khẩu, vui lòng chờ hết thời gian đếm ngược để đăng nhập lại:
                      </p>
                    </div>
                  </div>
                  <div className="lockout-timer-display">
                    <Clock size={20} className="timer-clock-icon" />
                    <span className="lockout-time-digits">{formatRemainingTime(lockoutRemaining)}</span>
                    <span className="lockout-unit">phút : giây</span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="login-alert alert-error">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="login-alert alert-success">
                  <CheckCircle2 size={18} />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="login-form">
                {/* Tên đăng nhập */}
                <div className="form-group">
                  <div className="input-wrapper">
                    <User className="input-icon" size={18} />
                    <input
                      id="login-username"
                      type="text"
                      disabled={isLoading || lockoutRemaining > 0}
                      className="form-input"
                      placeholder="Nhập gmail..."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Mật khẩu */}
                <div className="form-group">
                  <div className="label-row" style={{ justifyContent: 'flex-end' }}>
                    <a href="#intro" className="forgot-password-link">
                      Quên mật khẩu?
                    </a>
                  </div>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      disabled={isLoading || lockoutRemaining > 0}
                      className="form-input"
                      placeholder="Nhập mật khẩu của bạn..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      disabled={isLoading || lockoutRemaining > 0}
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Mã xác thực */}
                <div className="form-group">
                  <label htmlFor="login-captcha" className="form-label">
                    Mã xác thực
                  </label>
                  <div className="captcha-input-group">
                    <div className="input-wrapper captcha-field-wrapper">
                      <ShieldCheck className="input-icon" size={18} />
                      <input
                        id="login-captcha"
                        type="text"
                        disabled={isLoading || lockoutRemaining > 0}
                        className="form-input captcha-input"
                        placeholder="Nhập mã xác thực..."
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                        maxLength={6}
                        autoComplete="off"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isLoading || lockoutRemaining > 0}
                      className="login-captcha-box"
                      onClick={generateCaptchaCode}
                      title="Bấm để đổi mã xác thực khác"
                    >
                      <span className="login-captcha-text">{generatedCaptcha}</span>
                      <RotateCw size={15} className="login-captcha-refresh" />
                    </button>
                  </div>
                </div>

                {/* Ghi nhớ đăng nhập */}
                <div className="form-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="checkbox-input"
                    />
                    <span>Ghi nhớ đăng nhập trên thiết bị này</span>
                  </label>
                </div>

                {/* Hàng nút bấm đăng nhập */}
                <div className="login-btn-row">
                  <button
                    type="submit"
                    disabled={isLoading || lockoutRemaining > 0}
                    className={`login-submit-btn ${isLoading ? 'btn-loading-border' : ''} ${lockoutRemaining > 0 ? 'btn-locked' : ''}`}
                  >
                    {isLoading && (
                      <svg
                        className="login-btn-beam-svg"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <rect
                          className="login-btn-beam-track"
                          x="1.5"
                          y="1.5"
                          width="97"
                          height="97"
                          rx="8"
                          vectorEffect="non-scaling-stroke"
                        />
                        <rect
                          className="login-btn-beam-runner"
                          x="1.5"
                          y="1.5"
                          width="97"
                          height="97"
                          rx="8"
                          pathLength="100"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    )}
                    <span>
                      {lockoutRemaining > 0
                        ? `Tạm khóa (${formatRemainingTime(lockoutRemaining)})`
                        : 'Đăng Nhập'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      alert('Tính năng Đăng nhập bằng Google đang kết nối máy chủ xác thực.');
                    }}
                    className="login-google-btn"
                    title="Đăng nhập bằng tài khoản Google"
                  >
                    <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer chân trang */}
      <Footer />
    </div>
  );
};

export default Login;
