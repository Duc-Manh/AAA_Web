import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  LayoutGrid,
  RefreshCw
} from 'lucide-react';
import type { LabTelemetryRow } from './MainDashboardWidget';
import {
  parseMeterMapping,
  extractMValuesFromRow
} from './MainDashboardWidget';

export interface DiagramDashboardWidgetProps {
  projectName: string;
  isGwOnline: boolean;
  devices: LabTelemetryRow[];
  onRefresh?: () => void;
}

interface TelemetryPoint {
  id: string;
  deviceCode: string;
  deviceName: string;
  recordedAt: string;
  timeLabel: string;
  values: Record<string, number>;
}

interface MetricOption {
  key: string;
  name: string;
}

const formatTimeShort = (raw: string): string => {
  if (!raw) return '--:--';
  const match = raw.match(/(\d{2}:\d{2}(?::\d{2})?)/);
  if (match) {
    return match[1].slice(0, 5);
  }
  return raw.slice(-5);
};

export const DiagramDashboardWidget: React.FC<DiagramDashboardWidgetProps> = ({
  isGwOnline,
  devices,
  onRefresh
}) => {
  const [chartDisplayMode, setChartDisplayMode] = useState<'both' | 'line' | 'bar'>('both');
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>('all');

  // Thu thập toàn bộ các bản ghi lịch sử và tên quy đổi từ meter + control
  const { dataPoints, availableMetrics } = useMemo(() => {
    const resolvedLabels: Record<string, string> = {};
    const activeKeys = new Set<string>();
    const rawRows: LabTelemetryRow[] = [];

    const collectLabels = (raw: any) => {
      const map = parseMeterMapping(raw);
      Object.entries(map).forEach(([k, v]) => {
        const lk = k.trim().toLowerCase();
        if (v && (!resolvedLabels[lk] || resolvedLabels[lk] === '')) {
          resolvedLabels[lk] = v.trim();
        }
      });
    };

    devices.forEach((dev) => {
      collectLabels(dev.meter);
      collectLabels(dev.control);
      const rows =
        Array.isArray(dev.history_rows) && dev.history_rows.length > 0 ? dev.history_rows : [dev];
      rows.forEach((r) => {
        collectLabels(r.meter);
        collectLabels(r.control);
        rawRows.push(r);
      });
    });

    const points: TelemetryPoint[] = [];
    rawRows.forEach((row, idx) => {
      const mVals = extractMValuesFromRow(row);
      const numericMap: Record<string, number> = {};
      Object.entries(mVals).forEach(([k, v]) => {
        const lk = k.trim().toLowerCase();
        if (/^m\d+$/i.test(lk)) {
          const num = typeof v === 'number' ? v : Number(String(v).trim());
          if (!Number.isNaN(num)) {
            numericMap[lk] = num;
            activeKeys.add(lk);
          }
        }
      });

      if (Object.keys(numericMap).length > 0) {
        points.push({
          id: `${row.id || idx}-${row.device_code || ''}-${row.recorded_at || idx}`,
          deviceCode: row.device_code || '',
          deviceName: row.device_name || row.device_code || 'Thiết bị',
          recordedAt: row.recorded_at || '',
          timeLabel: formatTimeShort(row.recorded_at || ''),
          values: numericMap
        });
      }
    });

    const sortedKeys = Array.from(activeKeys).sort((a, b) => {
      const na = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
      const nb = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
      return na - nb;
    });

    const metrics: MetricOption[] = sortedKeys.map((mKey) => ({
      key: mKey,
      name: resolvedLabels[mKey] || mKey
    }));

    // Sắp xếp điểm dữ liệu theo thứ tự thời gian từ cũ -> mới trên trục hoành (tối đa 10 điểm gần nhất)
    const chronological = [...points].reverse().slice(-10);

    return {
      dataPoints: chronological,
      availableMetrics: metrics
    };
  }, [devices]);

  const metricsToRender = useMemo(() => {
    if (selectedMetricKey === 'all') return availableMetrics;
    const filtered = availableMetrics.filter((m) => m.key === selectedMetricKey);
    return filtered.length > 0 ? filtered : availableMetrics;
  }, [availableMetrics, selectedMetricKey]);

  const renderLineSvg = (metric: MetricOption) => {
    const pts = dataPoints.filter((p) => metric.key in p.values);
    if (pts.length === 0) return null;

    const width = 460;
    const height = 170;
    const padLeft = 38;
    const padRight = 16;
    const padTop = 22;
    const padBottom = 28;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const vals = pts.map((p) => p.values[metric.key]);
    let minVal = Math.min(...vals);
    let maxVal = Math.max(...vals);
    if (minVal === maxVal) {
      minVal = Math.max(0, minVal - 5);
      maxVal = maxVal + 5;
    } else {
      const pad = (maxVal - minVal) * 0.15;
      minVal = Math.max(0, minVal - pad);
      maxVal = maxVal + pad;
    }

    const coords = pts.map((p, idx) => {
      const x =
        pts.length === 1
          ? padLeft + plotW / 2
          : padLeft + (idx / (pts.length - 1)) * plotW;
      const ratio = (p.values[metric.key] - minVal) / (maxVal - minVal || 1);
      const y = padTop + plotH - ratio * plotH;
      return { x, y, val: p.values[metric.key], label: p.timeLabel };
    });

    const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
    const areaPoints =
      coords.length > 1
        ? `${coords[0].x},${padTop + plotH} ${polylinePoints} ${
            coords[coords.length - 1].x
          },${padTop + plotH}`
        : '';

    const gridSteps = [0, 0.5, 1];
    const gradId = `lineGrad_${metric.key}`;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: '170px', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D58BB" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#1D58BB" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Lưới ngang & nhãn trục Y */}
        {gridSteps.map((step, i) => {
          const y = padTop + step * plotH;
          const yVal = maxVal - step * (maxVal - minVal);
          return (
            <g key={i}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padLeft - 6}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#64748B"
                fontFamily="monospace"
              >
                {Number.isInteger(yVal) ? yVal : yVal.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Vùng màu dưới đường biểu đồ */}
        {areaPoints && <polygon points={areaPoints} fill={`url(#${gradId})`} />}

        {/* Đường nối các điểm */}
        {coords.length > 1 && (
          <polyline
            fill="none"
            stroke="#1D58BB"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />
        )}

        {/* Các điểm dữ liệu & nhãn */}
        {coords.map((c, idx) => (
          <g key={idx}>
            <circle
              cx={c.x}
              cy={c.y}
              r="4"
              fill="#FFFFFF"
              stroke="#1D58BB"
              strokeWidth="2.2"
            />
            <text
              x={c.x}
              y={c.y - 8}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#1D58BB"
            >
              {c.val}
            </text>
            <text
              x={c.x}
              y={height - 6}
              textAnchor="middle"
              fontSize="9.5"
              fill="#64748B"
            >
              {c.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const renderBarSvg = (metric: MetricOption) => {
    const pts = dataPoints.filter((p) => metric.key in p.values);
    if (pts.length === 0) return null;

    const width = 460;
    const height = 170;
    const padLeft = 38;
    const padRight = 16;
    const padTop = 22;
    const padBottom = 28;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const vals = pts.map((p) => p.values[metric.key]);
    const maxVal = Math.max(...vals, 1) * 1.15;
    const minVal = 0;

    const stepW = plotW / pts.length;
    const barW = Math.min(26, Math.max(10, stepW * 0.55));
    const gridSteps = [0, 0.5, 1];

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: '170px', display: 'block', overflow: 'visible' }}
      >
        {gridSteps.map((step, i) => {
          const y = padTop + step * plotH;
          const yVal = maxVal - step * (maxVal - minVal);
          return (
            <g key={i}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padLeft - 6}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#64748B"
                fontFamily="monospace"
              >
                {Number.isInteger(yVal) ? yVal : yVal.toFixed(1)}
              </text>
            </g>
          );
        })}

        {pts.map((p, idx) => {
          const val = p.values[metric.key];
          const ratio = Math.max(0.04, Math.min(1, val / (maxVal || 1)));
          const barH = ratio * plotH;
          const x = padLeft + idx * stepW + (stepW - barW) / 2;
          const y = padTop + plotH - barH;

          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx="5"
                fill="#1D58BB"
                opacity="0.88"
              />
              <text
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#1D58BB"
              >
                {val}
              </text>
              <text
                x={x + barW / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize="9.5"
                fill="#64748B"
              >
                {p.timeLabel}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. Header Biểu đồ vận hành */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '7px',
              backgroundColor: 'rgba(29, 88, 187, 0.12)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BarChart3 size={20} color="#1D58BB" />
          </div>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0F172A'
            }}
          >
            Biểu đồ vận hành
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              padding: '4px 8px',
              borderRadius: '20px',
              backgroundColor: isGwOnline
                ? 'rgba(22, 163, 74, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${
                isGwOnline ? 'rgba(22, 163, 74, 0.3)' : 'rgba(239, 68, 68, 0.3)'
              }`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isGwOnline ? '#16A34A' : '#EF4444'
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: isGwOnline ? '#16A34A' : '#EF4444'
              }}
            >
              {isGwOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Làm mới dữ liệu biểu đồ"
              style={{
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Bộ chuyển chế độ hiển thị (Cả hai / Đường / Cột) */}
      <div
        style={{
          padding: '3px',
          backgroundColor: '#F1F5F9',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px'
        }}
      >
        {[
          { key: 'both', label: 'Cả hai biểu đồ', icon: LayoutGrid },
          { key: 'line', label: 'Biểu đồ đường', icon: TrendingUp },
          { key: 'bar', label: 'Biểu đồ cột', icon: BarChart3 }
        ].map((item) => {
          const IconComp = item.icon;
          const isSelected = chartDisplayMode === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setChartDisplayMode(item.key as 'both' | 'line' | 'bar')}
              style={{
                padding: '7px 6px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                boxShadow: isSelected ? '0 2px 4px rgba(0, 0, 0, 0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer',
                color: isSelected ? '#1D58BB' : '#64748B',
                fontSize: '12px',
                fontWeight: isSelected ? 700 : 500,
                transition: 'all 0.18s ease'
              }}
            >
              <IconComp size={14} />
              <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Thanh chọn thông số (Metric Filter Pills) */}
      {availableMetrics.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedMetricKey('all')}
            style={{
              padding: '6.5px 14px',
              borderRadius: '20px',
              border: `1px solid ${
                selectedMetricKey === 'all' ? '#1D58BB' : 'rgba(29, 88, 187, 0.3)'
              }`,
              backgroundColor: selectedMetricKey === 'all' ? '#1D58BB' : '#FFFFFF',
              color: selectedMetricKey === 'all' ? '#FFFFFF' : '#1D58BB',
              boxShadow:
                selectedMetricKey === 'all' ? '0 2px 6px rgba(29, 88, 187, 0.25)' : 'none',
              fontSize: '11.5px',
              fontWeight: selectedMetricKey === 'all' ? 700 : 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Tất cả thông số
          </button>

          {availableMetrics.map((meta) => {
            const isSelected = selectedMetricKey === meta.key;
            return (
              <button
                key={meta.key}
                type="button"
                onClick={() => setSelectedMetricKey(meta.key)}
                style={{
                  padding: '6.5px 14px',
                  borderRadius: '20px',
                  border: `1px solid ${isSelected ? '#1D58BB' : 'rgba(29, 88, 187, 0.3)'}`,
                  backgroundColor: isSelected ? '#1D58BB' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#1D58BB',
                  boxShadow: isSelected ? '0 2px 6px rgba(29, 88, 187, 0.25)' : 'none',
                  fontSize: '11.5px',
                  fontWeight: isSelected ? 700 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {meta.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Danh sách biểu đồ theo từng thông số */}
      {metricsToRender.length === 0 ? (
        <div
          style={{
            height: '180px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            fontSize: '13px',
            padding: '16px',
            textAlign: 'center'
          }}
        >
          Chưa có dữ liệu thông số vận hành cho dự án này.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {metricsToRender.map((meta) => (
            <div
              key={meta.key}
              style={{
                padding: '16px',
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#1D58BB'
                  }}
                >
                  {meta.name}
                </span>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#F8FAFC',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    color: '#64748B'
                  }}
                >
                  {chartDisplayMode === 'both'
                    ? 'Đường & Cột'
                    : chartDisplayMode === 'line'
                    ? 'Biểu đồ đường'
                    : 'Biểu đồ cột'}
                </span>
              </div>

              {(chartDisplayMode === 'both' || chartDisplayMode === 'line') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {chartDisplayMode === 'both' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#64748B'
                      }}
                    >
                      <TrendingUp size={14} color="#1D58BB" />
                      <span>Biểu đồ xu hướng (Line Chart)</span>
                    </div>
                  )}
                  {renderLineSvg(meta)}
                </div>
              )}

              {chartDisplayMode === 'both' && (
                <div style={{ height: '1px', backgroundColor: '#F1F5F9' }} />
              )}

              {(chartDisplayMode === 'both' || chartDisplayMode === 'bar') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {chartDisplayMode === 'both' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#64748B'
                      }}
                    >
                      <BarChart3 size={14} color="#1D58BB" />
                      <span>Biểu đồ phân phối theo giờ (Bar Chart)</span>
                    </div>
                  )}
                  {renderBarSvg(meta)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiagramDashboardWidget;

