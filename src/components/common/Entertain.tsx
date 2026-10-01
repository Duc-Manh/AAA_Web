import React from 'react';

export const Entertain: React.FC = () => {
  const currentPath =
    typeof window !== 'undefined'
      ? window.location.hash || window.location.pathname
      : '';

  if (currentPath.includes('dash')) {
    return null;
  }

  return (
    <aside className="entertain-widget" aria-label="Kênh truyền thông giải trí 3AHOME">
      {/* Nút TikTok */}
      <a
        href="https://www.tiktok.com"
        target="_blank"
        rel="noopener noreferrer"
        className="entertain-btn entertain-tiktok"
        title="TikTok 3AHOME"
        aria-label="Kênh TikTok 3AHOME"
      >
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="currentColor"
          className="entertain-icon"
          aria-hidden="true"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.48 6.3 6.3 0 0 0 1.87-4.48V8.71a8.21 8.21 0 0 0 4.86 1.58V6.84a4.84 4.84 0 0 1-.96-.15z" />
        </svg>
        <span className="entertain-tooltip">TikTok</span>
      </a>

      {/* Đường phân cách nhỏ */}
      <div className="entertain-divider" />

      {/* Nút YouTube */}
      <a
        href="https://www.youtube.com"
        target="_blank"
        rel="noopener noreferrer"
        className="entertain-btn entertain-youtube"
        title="YouTube 3AHOME"
        aria-label="Kênh YouTube 3AHOME"
      >
        <svg
          viewBox="0 0 24 24"
          width="30"
          height="30"
          fill="currentColor"
          className="entertain-icon"
          aria-hidden="true"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        <span className="entertain-tooltip">YouTube</span>
      </a>
    </aside>
  );
};

export default Entertain;
