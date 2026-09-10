import React, { useState, useId } from 'react';
import type { TimeSeriesDataPoint } from '@/src/types';

interface LightweightAreaChartProps {
  data: TimeSeriesDataPoint[];
  height?: number;
  color?: string; // hex or tailwind-compatible e.g. '#6366f1'
  gradientId?: string;
  unit?: string;
  showPoints?: boolean;
}

export function LightweightAreaChart({
  data,
  height = 200,
  color = '#6366f1',
  unit = 'pts',
  showPoints = true,
}: LightweightAreaChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const chartId = useId().replace(/:/g, '');

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800"
        style={{ height }}
      >
        No historical data recorded yet
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 10);
  const range = maxVal - minVal || 1;

  // Chart padding and dimensions
  const width = 600;
  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 28;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  // Coordinate computation
  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return paddingTop + innerHeight - ((val - minVal) / range) * innerHeight;
  };

  // Generate SVG path for line
  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`);
  const linePath = `M ${points.join(' L ')}`;

  // Generate SVG area fill path (closed to bottom)
  const areaPath = `M ${getX(0)},${paddingTop + innerHeight} L ${points.join(' L ')} L ${getX(
    data.length - 1
  )},${paddingTop + innerHeight} Z`;

  // Grid lines
  const gridTicks = [0, 0.5, 1];

  const hoveredItem = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="relative w-full select-none" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`gradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines & Y-axis labels */}
        {gridTicks.map((tick, i) => {
          const y = paddingTop + innerHeight * (1 - tick);
          const valLabel = Math.round(minVal + tick * range);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                className="text-zinc-200 dark:text-zinc-800"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[10px] fill-zinc-400 font-mono"
              >
                {valLabel}
              </text>
            </g>
          );
        })}

        {/* Gradient Area */}
        <path d={areaPath} fill={`url(#gradient-${chartId})`} />

        {/* Stroke Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X-axis labels (render subset to prevent crowding) */}
        {data.map((d, i) => {
          const showLabel =
            data.length <= 8 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0;
          if (!showLabel) return null;
          return (
            <text
              key={i}
              x={getX(i)}
              y={height - 6}
              textAnchor="middle"
              className="text-[10px] fill-zinc-400 font-medium"
            >
              {d.label}
            </text>
          );
        })}

        {/* Interactive Hover Vertical Guide and Dots */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.value);
          const isHovered = hoveredIdx === i;

          return (
            <g key={i}>
              {/* Invisible wide hit target for smooth mouse tracking */}
              <rect
                x={cx - innerWidth / (data.length * 2)}
                y={paddingTop}
                width={innerWidth / data.length}
                height={innerHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />

              {isHovered && (
                <line
                  x1={cx}
                  y1={paddingTop}
                  x2={cx}
                  y2={paddingTop + innerHeight}
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  className="pointer-events-none"
                />
              )}

              {(showPoints || isHovered) && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5.5 : 3}
                  fill={isHovered ? color : '#ffffff'}
                  stroke={color}
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150 pointer-events-none"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredItem && hoveredIdx !== null && (
        <div
          className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200"
          style={{
            left: `${(getX(hoveredIdx) / width) * 100}%`,
            top: `${Math.max(10, (getY(hoveredItem.value) / height) * 100 - 8)}%`,
          }}
        >
          <div className="font-semibold flex items-center gap-1.5 whitespace-nowrap">
            <span>{hoveredItem.label}:</span>
            <span className="font-mono text-amber-400 dark:text-amber-600 font-bold">
              {hoveredItem.value} {unit}
            </span>
          </div>
          {hoveredItem.meta && (
            <div className="text-[10px] opacity-80 whitespace-nowrap mt-0.5 font-normal">
              {hoveredItem.meta}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
