import React, { useState } from 'react';
import {
  BarChart3,
  LineChart,
  Layers,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface DashVisitorChartProps {
  visitStats: {
    online: number;
    today: number;
    month: number;
    year: number;
    total: number;
    simu: number;
  };
  onRefresh: () => void;
}

export const DashVisitorChart: React.FC<DashVisitorChartProps> = ({ visitStats, onRefresh }) => {
  const [chartMode, setChartMode] = useState<'both' | 'bar' | 'line'>('both');
  const [hoveredMetricIdx, setHoveredMetricIdx] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Danh sách 6 chỉ số biểu diễn trên trục X
  const chartMetrics = [
    { key: 'online', label: 'Đang online', subLabel: 'Trực tuyến', value: visitStats.online, color: '#10b981', gradientId: 'grad-online' },
    { key: 'today', label: 'Trong ngày', subLabel: 'Hôm nay', value: visitStats.today, color: '#3b82f6', gradientId: 'grad-today' },
    { key: 'month', label: 'Trong tháng', subLabel: 'Tháng này', value: visitStats.month, color: '#8b5cf6', gradientId: 'grad-month' },
    { key: 'year', label: 'Trong năm', subLabel: 'Năm nay', value: visitStats.year, color: '#f59e0b', gradientId: 'grad-year' },
    { key: 'total', label: 'Tổng truy cập', subLabel: 'Hệ thống', value: visitStats.total, color: '#06b6d4', gradientId: 'grad-total' },
    { key: 'simu', label: 'Simu 3D', subLabel: 'Mô phỏng', value: visitStats.simu, color: '#ec4899', gradientId: 'grad-simu' },
  ];

  // Tính toán trục Y tự động làm tròn đẹp (Nice numbers)
  const rawMax = Math.max(...chartMetrics.map(m => m.value), 10);
  const getNiceMax = (val: number) => {
    const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
    const normalized = val / magnitude;
    let nice = 10;
    if (normalized <= 1) nice = 1;
    else if (normalized <= 2) nice = 2;
    else if (normalized <= 2.5) nice = 2.5;
    else if (normalized <= 5) nice = 5;
    else nice = 10;
    return Math.max(10, nice * magnitude);
  };
  const yAxisMax = getNiceMax(rawMax);

  // 5 mốc vạch kẻ trục tung Y (0%, 25%, 50%, 75%, 100%)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => Math.round(yAxisMax * ratio));

  // Tọa độ biểu đồ SVG gọn gàng (viewBox 0 0 860 270)
  const plotLeft = 75;
  const plotRight = 825;
  const plotWidth = plotRight - plotLeft; // 750
  const plotTop = 32;
  const plotBottom = 215;
  const plotHeight = plotBottom - plotTop; // 183

  const colWidth = plotWidth / chartMetrics.length;
  const barWidth = 44;

  const chartPoints = chartMetrics.map((m, idx) => {
    const cx = plotLeft + colWidth * (idx + 0.5);
    const cy = plotBottom - (m.value / yAxisMax) * plotHeight;
    return { x: cx, y: cy, ...m };
  });

  // Đường cong Spline mượt mà (Cubic Bezier)
  const getCurvePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const lineCurvePath = getCurvePath(chartPoints);
  const areaCurvePath = chartPoints.length > 0
    ? `${lineCurvePath} L ${chartPoints[chartPoints.length - 1].x} ${plotBottom} L ${chartPoints[0].x} ${plotBottom} Z`
    : '';

  return (
    <div className="dash-chart-card">
      <div className="dash-chart-header" style={{ marginBottom: isExpanded ? 16 : 0, paddingBottom: isExpanded ? 16 : 0, borderBottom: isExpanded ? '1px solid #f1f5f9' : 'none' }}>
        <div className="dash-chart-title-box">
          <div className="dash-chart-icon-badge">
            <BarChart3 size={22} />
          </div>
          <div>
            <h3 className="dash-chart-title">
              Biểu Đồ Thống Kê Truy Cập Hệ Thống
              <span className="live-pulse-dot" style={{ width: 8, height: 8 }} />
            </h3>
            <p className="dash-chart-subtitle">
              Theo dõi trực quan 6 chỉ số truy cập qua hệ trục tọa độ 2 chiều (Trục tung Y: Lượt truy cập - Trục hoành X: Phân loại chỉ số)
            </p>
          </div>
        </div>

        <div className="dash-chart-actions">
          {isExpanded && (
            <>
              <button
                type="button"
                className={`chart-toggle-btn ${chartMode === 'both' ? 'active' : ''}`}
                onClick={() => setChartMode('both')}
                title="Hiển thị kết hợp cả cột và đường xu hướng"
              >
                <Layers size={14} />
                <span>Kết hợp</span>
              </button>
              <button
                type="button"
                className={`chart-toggle-btn ${chartMode === 'bar' ? 'active' : ''}`}
                onClick={() => setChartMode('bar')}
                title="Chỉ hiển thị biểu đồ cột"
              >
                <BarChart3 size={14} />
                <span>Dạng Cột</span>
              </button>
              <button
                type="button"
                className={`chart-toggle-btn ${chartMode === 'line' ? 'active' : ''}`}
                onClick={() => setChartMode('line')}
                title="Chỉ hiển thị biểu đồ đường cong spline"
              >
                <LineChart size={14} />
                <span>Đường cong</span>
              </button>
              <button
                type="button"
                className="dash-pill-btn"
                onClick={onRefresh}
                title="Làm mới dữ liệu biểu đồ"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px' }}
              >
                <RefreshCw size={13} />
                <span>Cập nhật</span>
              </button>
            </>
          )}

          {/* NÚT THU GỌN / MỞ RỘNG BIỂU ĐỒ */}
          <button
            type="button"
            className="dash-pill-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Thu gọn biểu đồ để xem bảng nhân sự phía dưới dễ dàng hơn" : "Mở rộng biểu đồ"}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: isExpanded ? '#f8fafc' : '#eff6ff', color: isExpanded ? '#475569' : '#2563eb', borderColor: isExpanded ? '#cbd5e1' : '#93c5fd', fontWeight: 600 }}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            <span>{isExpanded ? 'Thu gọn biểu đồ' : 'Mở rộng biểu đồ'}</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="dash-chart-svg-wrap">
            <svg viewBox="0 0 860 270" className="dash-chart-svg" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="grad-online" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="grad-today" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="grad-month" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="grad-year" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="grad-simu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#be185d" stopOpacity="0.7" />
                </linearGradient>

                <linearGradient id="grad-spline-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>

                <filter id="bar-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.2" />
                </filter>
              </defs>

              {/* --- LƯỚI TỌA ĐỘ VÀ TRỤC TUNG Y --- */}
              {yTicks.map((val, idx) => {
                const y = plotBottom - (idx / (yTicks.length - 1)) * plotHeight;
                return (
                  <g key={`ytick-${idx}`}>
                    <line
                      x1={plotLeft}
                      y1={y}
                      x2={plotRight}
                      y2={y}
                      className="chart-grid-line"
                    />
                    <line
                      x1={plotLeft - 5}
                      y1={y}
                      x2={plotLeft}
                      y2={y}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />
                    <text
                      x={plotLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="chart-axis-text"
                    >
                      {val >= 1000000
                        ? `${(val / 1000000).toFixed(1)}M`
                        : val >= 1000
                        ? `${(val / 1000).toFixed(1)}k`
                        : val.toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* Tiêu đề trục tung Y */}
              <text
                x={plotLeft}
                y={plotTop - 14}
                textAnchor="start"
                fontSize="11"
                fontWeight="700"
                fill="#64748b"
              >
                (Lượt truy cập) ↑ Trục tung Y
              </text>

              {/* Trục tung Y chính */}
              <line
                x1={plotLeft}
                y1={plotTop - 4}
                x2={plotLeft}
                y2={plotBottom}
                className="chart-axis-line"
              />

              {/* Trục hoành X chính */}
              <line
                x1={plotLeft}
                y1={plotBottom}
                x2={plotRight}
                y2={plotBottom}
                className="chart-axis-line"
              />

              {/* Tiêu đề trục hoành X */}
              <text
                x={plotRight}
                y={plotBottom + 32}
                textAnchor="end"
                fontSize="11"
                fontWeight="700"
                fill="#64748b"
              >
                Trục hoành X → (Chỉ số hệ thống)
              </text>

              {/* CỘT HOVER BACKGROUND GUIDES */}
              {chartPoints.map((_, idx) => {
                const colX = plotLeft + idx * colWidth;
                const isHovered = hoveredMetricIdx === idx;
                return (
                  <rect
                    key={`col-hover-${idx}`}
                    x={colX}
                    y={plotTop}
                    width={colWidth}
                    height={plotHeight}
                    fill={isHovered ? 'rgba(59, 130, 246, 0.05)' : 'transparent'}
                    style={{ cursor: 'pointer', transition: 'fill 0.2s ease' }}
                    onMouseEnter={() => setHoveredMetricIdx(idx)}
                    onMouseLeave={() => setHoveredMetricIdx(null)}
                  />
                );
              })}

              {/* VÙNG TÔ DIỆN TÍCH ĐƯỜNG CONG (SPLINE AREA) */}
              {(chartMode === 'line' || chartMode === 'both') && areaCurvePath && (
                <path
                  d={areaCurvePath}
                  fill="url(#grad-spline-area)"
                  style={{ pointerEvents: 'none', transition: 'all 0.4s ease' }}
                />
              )}

              {/* CÁC CỘT (BAR CHART) */}
              {(chartMode === 'bar' || chartMode === 'both') &&
                chartPoints.map((pt, idx) => {
                  const barHeight = Math.max(4, (pt.value / yAxisMax) * plotHeight);
                  const barY = plotBottom - barHeight;
                  const barX = pt.x - barWidth / 2;
                  const isHovered = hoveredMetricIdx === idx;

                  return (
                    <g
                      key={`bar-${pt.key}`}
                      className={`chart-bar ${isHovered ? 'active' : ''}`}
                      onMouseEnter={() => setHoveredMetricIdx(idx)}
                      onMouseLeave={() => setHoveredMetricIdx(null)}
                    >
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        rx="6"
                        ry="6"
                        fill={`url(#${pt.gradientId})`}
                        opacity={hoveredMetricIdx !== null && !isHovered ? 0.45 : 1}
                        filter={isHovered ? 'url(#bar-shadow)' : undefined}
                      />
                      <text
                        x={pt.x}
                        y={barY - 7}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill={isHovered ? pt.color : '#475569'}
                        style={{ transition: 'all 0.2s ease', pointerEvents: 'none' }}
                      >
                        {pt.value.toLocaleString()}
                      </text>
                    </g>
                  );
                })}

              {/* ĐƯỜNG CONG SPLINE (LINE CHART) */}
              {(chartMode === 'line' || chartMode === 'both') && lineCurvePath && (
                <path
                  d={lineCurvePath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={chartMode === 'line' ? 3.5 : 2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ pointerEvents: 'none', transition: 'all 0.4s ease' }}
                />
              )}

              {/* ĐIỂM DỮ LIỆU TRÊN ĐƯỜNG CONG (DATA POINTS) */}
              {(chartMode === 'line' || chartMode === 'both') &&
                chartPoints.map((pt, idx) => {
                  const isHovered = hoveredMetricIdx === idx;
                  return (
                    <g
                      key={`pt-${pt.key}`}
                      onMouseEnter={() => setHoveredMetricIdx(idx)}
                      onMouseLeave={() => setHoveredMetricIdx(null)}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6.5 : 4.5}
                        fill="#ffffff"
                        stroke={pt.color}
                        strokeWidth={isHovered ? 3 : 2}
                        className={`chart-point ${isHovered ? 'active' : ''}`}
                      />
                      {chartMode === 'line' && (
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="700"
                          fill={isHovered ? pt.color : '#334155'}
                          style={{ pointerEvents: 'none' }}
                        >
                          {pt.value.toLocaleString()}
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* NHÃN VÀ VẠCH TRỤC HOÀNH X */}
              {chartPoints.map((pt, idx) => {
                const isHovered = hoveredMetricIdx === idx;
                return (
                  <g
                    key={`xlabel-${pt.key}`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredMetricIdx(idx)}
                    onMouseLeave={() => setHoveredMetricIdx(null)}
                  >
                    <line
                      x1={pt.x}
                      y1={plotBottom}
                      x2={pt.x}
                      y2={plotBottom + 5}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />
                    <text
                      x={pt.x}
                      y={plotBottom + 18}
                      textAnchor="middle"
                      className="chart-axis-label-x"
                      fill={isHovered ? pt.color : '#1e293b'}
                      fontWeight={isHovered ? '700' : '600'}
                    >
                      {pt.label}
                    </text>
                    <text
                      x={pt.x}
                      y={plotBottom + 31}
                      textAnchor="middle"
                      className="chart-axis-label-x-sub"
                    >
                      {pt.subLabel}
                    </text>
                  </g>
                );
              })}

              {/* HOVER TOOLTIP FLOATING BOX */}
              {hoveredMetricIdx !== null && (
                (() => {
                  const cur = chartPoints[hoveredMetricIdx];
                  const tooltipW = 140;
                  const tooltipH = 50;
                  let tooltipX = cur.x - tooltipW / 2;
                  if (tooltipX < plotLeft) tooltipX = plotLeft + 10;
                  if (tooltipX + tooltipW > plotRight) tooltipX = plotRight - tooltipW - 10;
                  const tooltipY = Math.max(plotTop + 5, cur.y - tooltipH - 14);

                  return (
                    <g style={{ pointerEvents: 'none', transition: 'all 0.15s ease' }}>
                      <line
                        x1={cur.x}
                        y1={plotTop}
                        x2={cur.x}
                        y2={plotBottom}
                        stroke={cur.color}
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.6"
                      />
                      <rect
                        x={tooltipX}
                        y={tooltipY}
                        width={tooltipW}
                        height={tooltipH}
                        rx="8"
                        fill="#0f172a"
                        opacity="0.94"
                        filter="url(#bar-shadow)"
                      />
                      <text
                        x={tooltipX + tooltipW / 2}
                        y={tooltipY + 18}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="10.5"
                        fontWeight="600"
                      >
                        {cur.label} ({cur.subLabel})
                      </text>
                      <text
                        x={tooltipX + tooltipW / 2}
                        y={tooltipY + 37}
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize="13"
                        fontWeight="700"
                      >
                        {cur.value.toLocaleString()} lượt
                      </text>
                    </g>
                  );
                })()
              )}
            </svg>
          </div>

          {/* CHÚ THÍCH (FOOTER LEGEND) */}
          <div className="chart-footer-legend">
            <div className="legend-items-list">
              {chartMetrics.map((m, idx) => (
                <div
                  key={`legend-${m.key}`}
                  className="legend-item"
                  onMouseEnter={() => setHoveredMetricIdx(idx)}
                  onMouseLeave={() => setHoveredMetricIdx(null)}
                  style={{
                    opacity: hoveredMetricIdx !== null && hoveredMetricIdx !== idx ? 0.45 : 1,
                    fontWeight: hoveredMetricIdx === idx ? 700 : 500
                  }}
                >
                  <span className="legend-color-dot" style={{ background: m.color }} />
                  <span>{m.label}: <strong>{m.value.toLocaleString()}</strong></span>
                </div>
              ))}
            </div>

            <div className="legend-hint">
              <Info size={13} />
              <span>Rê chuột vào cột hoặc điểm trên biểu đồ để xem chi tiết</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
