import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  LineChart,
  Layers,
  RefreshCw,
  X,
  Thermometer,
  Droplets,
  Zap,
  Cpu,
  Activity,
  Maximize2,
  Table as TableIcon
} from 'lucide-react';

export interface TelemetryHistoryRecord {
  id: number;
  device_id: number;
  device_code: string;
  device_name: string;
  device_type: string;
  floor?: string;
  project_name: string;
  location_id?: number;
  temperature?: number | null;
  humidity?: number | null;
  power?: number | null;
  voltage?: number | null;
  current?: number | null;
  raw_data?: any;
  recorded_at: string;
  time_label: string;
}

export interface ProjectTelemetryChartModalProps {
  project: {
    project_name: string;
    project_address?: string;
    location_id?: number;
    gateway_sn?: string;
    gateway_ip?: string;
    gateway_status?: 'online' | 'offline';
    devices: Array<{
      device_id: number;
      device_code: string;
      device_name: string;
      device_type?: string;
      floor?: string;
    }>;
  } | null;
  onClose: () => void;
}

type MetricKey = 'voltage' | 'current' | 'power' | 'temperature' | 'humidity';

interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  gradientId: string;
  icon: React.ReactNode;
}

const METRICS_CONFIG: MetricConfig[] = [
  {
    key: 'voltage',
    label: 'Điện áp',
    unit: 'V',
    color: '#f59e0b',
    gradientId: 'grad-voltage',
    icon: <Zap size={14} />
  },
  {
    key: 'current',
    label: 'Dòng điện',
    unit: 'A',
    color: '#06b6d4',
    gradientId: 'grad-current',
    icon: <Cpu size={14} />
  },
  {
    key: 'power',
    label: 'Công suất',
    unit: 'W',
    color: '#8b5cf6',
    gradientId: 'grad-power',
    icon: <Activity size={14} />
  },
  {
    key: 'temperature',
    label: 'Nhiệt độ',
    unit: '°C',
    color: '#ef4444',
    gradientId: 'grad-temp',
    icon: <Thermometer size={14} />
  },
  {
    key: 'humidity',
    label: 'Độ ẩm',
    unit: '%',
    color: '#3b82f6',
    gradientId: 'grad-hum',
    icon: <Droplets size={14} />
  }
];

export const ProjectTelemetryChartModal: React.FC<ProjectTelemetryChartModalProps> = ({
  project,
  onClose
}) => {
  const [records, setRecords] = useState<TelemetryHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Chế độ hiển thị: Cả hai, Cột hoặc Đường
  const [chartMode, setChartMode] = useState<'both' | 'bar' | 'line'>('both');

  // Lọc thông số đang hiển thị: 'all' hoặc từng thông số
  const [selectedMetric, setSelectedMetric] = useState<'all' | MetricKey>('all');

  // Lọc theo thiết bị cụ thể trong dự án
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');

  // Giới hạn số lượng bản ghi tải về
  const [limit, setLimit] = useState<number>(100);

  // Hiển thị bảng chi tiết
  const [showTable, setShowTable] = useState<boolean>(false);

  // Tooltip hover
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Fetch dữ liệu từ backend
  const fetchTelemetryHistory = async () => {
    if (!project) return;
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (project.location_id) {
        params.append('location_id', String(project.location_id));
      } else if (project.project_name && project.project_name !== 'Dự án nội bộ') {
        params.append('project_name', project.project_name);
      } else if (project.devices && project.devices.length > 0) {
        params.append('device_ids', project.devices.map(d => d.device_id).join(','));
      }
      params.append('limit', String(limit));

      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/telemetry-history?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRecords(data.data);
      } else {
        setRecords([]);
      }
    } catch (err: any) {
      console.error('Lỗi tải lịch sử viễn trắc:', err);
      setError(err.message || 'Không thể tải dữ liệu lịch sử');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project) {
      fetchTelemetryHistory();
    }
  }, [project, limit]);

  // Lọc danh sách theo thiết bị nếu chọn
  const filteredRecords = useMemo(() => {
    if (selectedDeviceId === 'all') return records;
    const devId = Number(selectedDeviceId);
    return records.filter(r => r.device_id === devId);
  }, [records, selectedDeviceId]);

  // Tính toán số liệu thống kê (Latest, Min, Max, Avg) cho mỗi thông số
  const stats = useMemo(() => {
    const calc = (key: MetricKey) => {
      const vals = filteredRecords
        .map(r => r[key])
        .filter((v): v is number => v !== null && v !== undefined && !isNaN(Number(v)))
        .map(Number);
      if (vals.length === 0) return { latest: null, min: null, max: null, avg: null, count: 0 };
      const latest = vals[vals.length - 1];
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const avg = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
      return { latest, min, max, avg, count: vals.length };
    };

    return {
      voltage: calc('voltage'),
      current: calc('current'),
      power: calc('power'),
      temperature: calc('temperature'),
      humidity: calc('humidity')
    };
  }, [filteredRecords]);

  // Cấu hình vẽ đồ thị SVG
  // Khi `selectedMetric === 'all'`, ta có thể hiển thị 5 đồ thị nhỏ hoặc 1 đồ thị đa năng.
  // Ở đây ta dựng hàm render SVG cho 1 metric cụ thể:
  const renderSvgChart = (metric: MetricConfig, width = 860, height = 220) => {
    const vals = filteredRecords.map(r => {
      const val = r[metric.key];
      return {
        record: r,
        value: val !== null && val !== undefined && !isNaN(Number(val)) ? Number(val) : null,
        time: r.time_label || r.recorded_at?.substring(11, 16) || '',
        deviceName: r.device_name || r.device_code
      };
    });

    const validVals = vals.filter(v => v.value !== null).map(v => v.value as number);
    if (validVals.length === 0) {
      return (
        <div
          style={{
            height: height,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: '0.85rem',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            border: '1px dashed #cbd5e1',
            margin: '8px 0'
          }}
        >
          <Activity size={24} style={{ marginBottom: 6, opacity: 0.5 }} />
          <span>Chưa có dữ liệu thông số <strong>{metric.label} ({metric.unit})</strong> trong khoảng thời gian này</span>
        </div>
      );
    }

    const minVal = Math.min(...validVals);
    const maxVal = Math.max(...validVals);

    // Padding cho trục Y để đồ thị không bị dính sát đỉnh/đáy
    let yMin = minVal === maxVal ? (minVal > 0 ? minVal * 0.8 : 0) : minVal - (maxVal - minVal) * 0.12;
    if (yMin < 0 && minVal >= 0) yMin = 0;
    let yMax = minVal === maxVal ? (maxVal > 0 ? maxVal * 1.2 : 10) : maxVal + (maxVal - minVal) * 0.12;
    if (yMax === yMin) yMax = yMin + 10;

    const yRange = yMax - yMin;

    const plotLeft = 60;
    const plotRight = width - 20;
    const plotTop = 25;
    const plotBottom = height - 45;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    const colWidth = plotWidth / Math.max(vals.length, 1);
    const barWidth = Math.min(Math.max(colWidth * 0.55, 6), 36);

    // Tính toạ độ các điểm
    const points = vals.map((pt, idx) => {
      const cx = plotLeft + colWidth * (idx + 0.5);
      const val = pt.value;
      const cy = val !== null ? plotBottom - ((val - yMin) / yRange) * plotHeight : plotBottom;
      return {
        ...pt,
        x: cx,
        y: cy,
        hasVal: val !== null
      };
    });

    // Tạo đường cong Spline mượt mà cho Line chart
    const validPoints = points.filter(p => p.hasVal);
    let lineCurvePath = '';
    if (validPoints.length > 0) {
      if (validPoints.length === 1) {
        lineCurvePath = `M ${validPoints[0].x} ${validPoints[0].y}`;
      } else {
        lineCurvePath = `M ${validPoints[0].x} ${validPoints[0].y}`;
        for (let i = 0; i < validPoints.length - 1; i++) {
          const p0 = validPoints[Math.max(0, i - 1)];
          const p1 = validPoints[i];
          const p2 = validPoints[i + 1];
          const p3 = validPoints[Math.min(validPoints.length - 1, i + 2)];
          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;
          lineCurvePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }
      }
    }

    const areaCurvePath =
      validPoints.length > 0
        ? `${lineCurvePath} L ${validPoints[validPoints.length - 1].x} ${plotBottom} L ${validPoints[0].x} ${plotBottom} Z`
        : '';

    // 4 vạch trục Y
    const yTicks = [0, 0.33, 0.66, 1].map(r => yMin + yRange * r);

    // Mốc nhãn trục X (tối đa ~10 nhãn chia đều để không đè chữ)
    const stepX = Math.max(1, Math.floor(points.length / 8));

    return (
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', maxHeight: height, display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={`grad-bar-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metric.color} stopOpacity={0.85} />
              <stop offset="100%" stopColor={metric.color} stopOpacity={0.25} />
            </linearGradient>
            <linearGradient id={`grad-area-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metric.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={metric.color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Đường lưới ngang trục Y */}
          {yTicks.map((val, idx) => {
            const yPos = plotBottom - ((val - yMin) / yRange) * plotHeight;
            return (
              <g key={`ytick-${idx}`}>
                <line
                  x1={plotLeft}
                  y1={yPos}
                  x2={plotRight}
                  y2={yPos}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={plotLeft - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="11"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="500"
                >
                  {val.toFixed(val > 10 ? 0 : 1)} {metric.unit}
                </text>
              </g>
            );
          })}

          {/* Trục toạ độ */}
          <line
            x1={plotLeft}
            y1={plotBottom}
            x2={plotRight}
            y2={plotBottom}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
          <line
            x1={plotLeft}
            y1={plotTop}
            x2={plotLeft}
            y2={plotBottom}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Vùng bóng mờ Gradient dưới đường Line */}
          {(chartMode === 'line' || chartMode === 'both') && areaCurvePath && (
            <path d={areaCurvePath} fill={`url(#grad-area-${metric.key})`} />
          )}

          {/* CÁC CỘT (BAR CHART) */}
          {(chartMode === 'bar' || chartMode === 'both') &&
            points.map((pt, idx) => {
              if (!pt.hasVal || pt.value === null) return null;
              const barH = Math.max(2, plotBottom - pt.y);
              const isHovered = hoveredIdx === idx;
              return (
                <rect
                  key={`bar-${idx}`}
                  x={pt.x - barWidth / 2}
                  y={pt.y}
                  width={barWidth}
                  height={barH}
                  rx="4"
                  ry="4"
                  fill={isHovered ? metric.color : `url(#grad-bar-${metric.key})`}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    filter: isHovered ? `drop-shadow(0 4px 8px ${metric.color}66)` : 'none'
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}

          {/* ĐƯỜNG CONG (LINE CHART) */}
          {(chartMode === 'line' || chartMode === 'both') && lineCurvePath && (
            <path
              d={lineCurvePath}
              fill="none"
              stroke={metric.color}
              strokeWidth={chartMode === 'line' ? 2.5 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* CÁC ĐIỂM TRÊN ĐƯỜNG CONG (POINTS) */}
          {(chartMode === 'line' || chartMode === 'both') &&
            points.map((pt, idx) => {
              if (!pt.hasVal) return null;
              const isHovered = hoveredIdx === idx;
              return (
                <g key={`pt-${idx}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 3.5}
                    fill="#ffffff"
                    stroke={metric.color}
                    strokeWidth={isHovered ? 3 : 2}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      filter: isHovered ? `drop-shadow(0 0 6px ${metric.color})` : 'none'
                    }}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                  {/* Nhãn giá trị phía trên điểm khi hover */}
                  {isHovered && (
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      fill={metric.color}
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="system-ui, sans-serif"
                    >
                      {pt.value} {metric.unit}
                    </text>
                  )}
                </g>
              );
            })}

          {/* Nhãn trục hoành X (Thời gian) */}
          {points.map((pt, idx) => {
            if (idx % stepX !== 0 && idx !== points.length - 1) return null;
            return (
              <text
                key={`xlabel-${idx}`}
                x={pt.x}
                y={plotBottom + 18}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
                fontFamily="system-ui, monospace"
              >
                {pt.time}
              </text>
            );
          })}
        </svg>

        {/* TOOLTIP HIỂN THỊ KHI HOVER */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '20px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div>
              <span style={{ color: '#94a3b8' }}>Thời gian:</span>{' '}
              <strong>{points[hoveredIdx].record.recorded_at}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Thiết bị:</span>{' '}
              <strong>{points[hoveredIdx].deviceName}</strong>
            </div>
            <div style={{ color: metric.color, fontWeight: 700 }}>
              {metric.label}: {points[hoveredIdx].value ?? 'N/A'} {metric.unit}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!project) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#1D58BB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(29, 88, 187, 0.15)'
              }}
            >
              <BarChart3 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Biểu Đồ Lịch Sử Viễn Trắc ({project.project_name})
                </h3>
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#64748b',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Gateway: <strong>{project.gateway_sn || 'N/A'}</strong></span>
                <span>•</span>
                <span>{project.devices.length} Thiết bị con</span>
                {project.project_address && (
                  <>
                    <span>•</span>
                    <span>{project.project_address}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ACTIONS: Refresh, Limit, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                backgroundColor: '#ffffff',
                color: '#334155',
                cursor: 'pointer'
              }}
              title="Số lượng mẫu ghi gần nhất"
            >
              <option value={50}>50 bản ghi gần nhất</option>
              <option value={100}>100 bản ghi gần nhất</option>
              <option value={200}>200 bản ghi gần nhất</option>
              <option value={500}>500 bản ghi gần nhất</option>
            </select>

            <button
              type="button"
              onClick={fetchTelemetryHistory}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTable(!showTable)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: showTable ? '1px solid #1D58BB' : '1px solid #cbd5e1',
                backgroundColor: showTable ? '#eff6ff' : '#ffffff',
                color: showTable ? '#1D58BB' : '#334155',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Bật/tắt xem dạng bảng dữ liệu"
            >
              <TableIcon size={14} />
              <span>{showTable ? 'Ẩn Bảng' : 'Xem Bảng'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CONTROLS: Mode Đường / Cột, Tabs Thông Số, Lọc Thiết Bị */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* TABS METRIC: Tất cả | Điện áp | Dòng điện | Công suất | Nhiệt độ | Độ ẩm */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedMetric('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: selectedMetric === 'all' ? '1px solid #1D58BB' : '1px solid #e2e8f0',
                backgroundColor: selectedMetric === 'all' ? '#1D58BB' : '#f8fafc',
                color: selectedMetric === 'all' ? '#ffffff' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Maximize2 size={13} />
              <span>Tất cả thông số ({METRICS_CONFIG.length})</span>
            </button>

            {METRICS_CONFIG.map(m => {
              const active = selectedMetric === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedMetric(m.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: active ? `1px solid ${m.color}` : '1px solid #e2e8f0',
                    backgroundColor: active ? m.color : '#f8fafc',
                    color: active ? '#ffffff' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ color: active ? '#ffffff' : m.color }}>{m.icon}</span>
                  <span>{m.label} ({m.unit})</span>
                </button>
              );
            })}
          </div>

          {/* RIGHT CONTROLS: LỌC THIẾT BỊ & CHỌN KIỂU ĐƯỜNG/CỘT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Lọc Thiết bị */}
            {project.devices.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Thiết bị:</span>
                <select
                  value={selectedDeviceId}
                  onChange={e => setSelectedDeviceId(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Tất cả thiết bị ({project.devices.length})</option>
                  {project.devices.map(d => (
                    <option key={d.device_id} value={d.device_id}>
                      {d.device_name || d.device_code} ({d.device_code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Chế độ hiển thị: Cột | Đường | Cả hai */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: '#f1f5f9',
                padding: '3px',
                borderRadius: '8px',
                gap: '2px'
              }}
            >
              <button
                type="button"
                onClick={() => setChartMode('both')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: chartMode === 'both' ? '#ffffff' : 'transparent',
                  color: chartMode === 'both' ? '#1D58BB' : '#64748b',
                  fontWeight: chartMode === 'both' ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: chartMode === 'both' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Layers size={13} />
                <span>Cả hai</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMode('bar')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: chartMode === 'bar' ? '#ffffff' : 'transparent',
                  color: chartMode === 'bar' ? '#1D58BB' : '#64748b',
                  fontWeight: chartMode === 'bar' ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: chartMode === 'bar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <BarChart3 size={13} />
                <span>Cột</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMode('line')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: chartMode === 'line' ? '#ffffff' : 'transparent',
                  color: chartMode === 'line' ? '#1D58BB' : '#64748b',
                  fontWeight: chartMode === 'line' ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: chartMode === 'line' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <LineChart size={13} />
                <span>Đường</span>
              </button>
            </div>
          </div>
        </div>

        {/* THỐNG KÊ NHANH 5 CHỈ SỐ (KPI CARDS) */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #f1f5f9',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}
        >
          {METRICS_CONFIG.map(m => {
            const st = stats[m.key];
            const isSelected = selectedMetric === m.key || selectedMetric === 'all';
            return (
              <div
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  border: selectedMetric === m.key ? `2px solid ${m.color}` : '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  opacity: isSelected ? 1 : 0.6,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    <span style={{ color: m.color }}>{m.icon}</span>
                    <span>{m.label}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{m.unit}</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>
                  {st.latest !== null ? `${st.latest} ${m.unit}` : 'Chưa có dữ liệu'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', gap: '8px' }}>
                  <span>Min: <strong>{st.min ?? '-'}</strong></span>
                  <span>Avg: <strong>{st.avg ?? '-'}</strong></span>
                  <span>Max: <strong>{st.max ?? '-'}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* NỘI DUNG BIỂU ĐỒ (CHART BODY) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading && records.length === 0 ? (
            <div
              style={{
                height: '280px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                color: '#64748b'
              }}
            >
              <RefreshCw size={24} className="spin" color="#1D58BB" />
              <span>Đang tải lịch sử viễn trắc từ bảng telemetry_history...</span>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '24px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#b91c1c',
                textAlign: 'center'
              }}
            >
              <p style={{ fontWeight: 600 }}>Lỗi khi tải dữ liệu:</p>
              <p style={{ fontSize: '0.85rem' }}>{error}</p>
              <button
                type="button"
                onClick={fetchTelemetryHistory}
                style={{
                  marginTop: '10px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Thử lại
              </button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div
              style={{
                height: '260px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1',
                color: '#64748b'
              }}
            >
              <Activity size={32} style={{ color: '#94a3b8' }} />
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>
                Chưa có dữ liệu viễn trắc trong bảng telemetry_history cho dự án này
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '480px', textAlign: 'center' }}>
                Khi các thiết bị con của Gateway gửi gói tin MQTT hoặc viễn trắc chu kỳ định kỳ, dữ liệu sẽ được lưu tự động vào bảng telemetry_history và hiển thị tại đây.
              </div>
            </div>
          ) : selectedMetric === 'all' ? (
            /* HIỂN THỊ TẤT CẢ 5 THÔNG SỐ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {METRICS_CONFIG.map(metric => (
                <div
                  key={metric.key}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '14px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '3px',
                          backgroundColor: metric.color
                        }}
                      />
                      <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                        Biểu đồ {metric.label} ({metric.unit})
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        • Chế độ: {chartMode === 'both' ? 'Đường & Cột' : chartMode === 'bar' ? 'Cột' : 'Đường'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedMetric(metric.key)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#f8fafc',
                        color: '#475569',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Phóng to đồ thị này
                    </button>
                  </div>
                  {renderSvgChart(metric, 1000, 180)}
                </div>
              ))}
            </div>
          ) : (
            /* HIỂN THỊ ĐƠN THÔNG SỐ ĐƯỢC CHỌN (KHỔ LỚN) */
            (() => {
              const activeConfig = METRICS_CONFIG.find(m => m.key === selectedMetric)!;
              return (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '16px 20px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          backgroundColor: activeConfig.color
                        }}
                      />
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        Biểu đồ chi tiết {activeConfig.label} ({activeConfig.unit})
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        ({filteredRecords.length} mẫu dữ liệu)
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Trục tung Y: {activeConfig.label} ({activeConfig.unit}) | Trục hoành X: Mốc thời gian ghi
                    </div>
                  </div>
                  {renderSvgChart(activeConfig, 1050, 260)}
                </div>
              );
            })()
          )}

          {/* BẢNG DỮ LIỆU LỊCH SỬ VIỄN TRẮC (TOGGLE) */}
          {showTable && filteredRecords.length > 0 && (
            <div
              style={{
                marginTop: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}
              >
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                  Bảng Dữ Liệu telemetry_history ({filteredRecords.length} dòng)
                </h4>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  Sắp xếp theo thời gian tăng dần
                </div>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '280px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Thời gian</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Thiết bị</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Mã thiết bị</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>Điện áp (V)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#06b6d4', fontWeight: 600 }}>Dòng điện (A)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#8b5cf6', fontWeight: 600 }}>Công suất (W)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>Nhiệt độ (°C)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>Độ ẩm (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r, idx) => (
                      <tr
                        key={r.id || idx}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd'
                        }}
                      >
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#334155' }}>
                          {r.recorded_at}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>
                          {r.device_name || 'Thiết bị'}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#64748b', fontFamily: 'monospace' }}>
                          {r.device_code}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>
                          {r.voltage !== null && r.voltage !== undefined ? r.voltage : '-'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#06b6d4' }}>
                          {r.current !== null && r.current !== undefined ? r.current : '-'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#8b5cf6' }}>
                          {r.power !== null && r.power !== undefined ? r.power : '-'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                          {r.temperature !== null && r.temperature !== undefined ? `${r.temperature}°C` : '-'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>
                          {r.humidity !== null && r.humidity !== undefined ? `${r.humidity}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER MODAL */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            fontSize: '0.78rem',
            color: '#64748b'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
