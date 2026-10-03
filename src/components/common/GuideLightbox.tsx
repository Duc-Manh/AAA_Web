import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export interface GuideLightboxProps {
  image: { src: string; title: string } | null;
  onClose: () => void;
}

export const GuideLightbox: React.FC<GuideLightboxProps> = ({ image, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset zoom và vị trí khi mở ảnh mới hoặc đổi ảnh
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [image?.src]);

  // Hỗ trợ phím tắt Esc để đóng, + / - để zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale]);

  if (!image) return null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(Number((prev - 0.25).toFixed(2)), 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <div className="dash-guide-lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="dash-guide-lightbox-content" onClick={(e) => e.stopPropagation()}>
        {/* Header với Tiêu đề, Các nút Zoom -, +, Reset, và nút Đóng X */}
        <div className="dash-guide-lightbox-header">
          <div className="dash-guide-lightbox-header-left">
            <h4>{image.title}</h4>
            <span className="dash-guide-zoom-hint">
              {scale > 1
                ? 'Đã phóng to: Giữ chuột và kéo để di chuyển vùng nhìn'
                : 'Dùng nút + / - hoặc cuộn chuột để phóng to hình ảnh'}
            </span>
          </div>

          <div className="dash-guide-lightbox-actions">
            {/* Bộ điều khiển Zoom */}
            <div className="dash-guide-zoom-controls">
              <button
                type="button"
                className="dash-guide-zoom-btn"
                onClick={handleZoomOut}
                disabled={scale <= 1}
                title="Thu nhỏ (-)"
              >
                <ZoomOut size={16} />
              </button>

              <span className="dash-guide-zoom-level">
                {Math.round(scale * 100)}%
              </span>

              <button
                type="button"
                className="dash-guide-zoom-btn"
                onClick={handleZoomIn}
                disabled={scale >= 4}
                title="Phóng to (+)"
              >
                <ZoomIn size={16} />
              </button>

              {scale > 1 && (
                <button
                  type="button"
                  className="dash-guide-zoom-btn dash-guide-zoom-reset-btn"
                  onClick={handleResetZoom}
                  title="Đặt lại kích thước ban đầu"
                >
                  <RotateCcw size={14} />
                  <span>100%</span>
                </button>
              )}
            </div>

            {/* Nút đóng Lightbox */}
            <button
              type="button"
              className="dash-guide-lightbox-close"
              onClick={onClose}
              title="Đóng (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Khung Body chứa ảnh, hỗ trợ drag di chuyển mượt mà */}
        <div
          className={`dash-guide-lightbox-body ${scale > 1 ? 'is-zoomed' : ''} ${isDragging ? 'is-dragging' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <img
            src={image.src}
            alt={image.title}
            draggable={false}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GuideLightbox;
