import React, { useState } from 'react';
import type { TimeSeriesDataPoint } from '@/src/types';

interface LightweightBarChartProps {
  data: TimeSeriesDataPoint[];
  height?: number;
  barColor?: string;
  unit?: string;
  maxValOverride?: number;
}

export function LightweightBarChart({
  data,
  height = 200,
  barColor = '#6366f1',
  unit = 'pts',
  maxValOverride,
}: LightweightBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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
  const maxVal = maxValOverride ?? Math.max(...values, 5);

  const paddingBottom = 26;
  const paddingTop = 16;
  const chartHeight = height - paddingBottom - paddingTop;

  return (
    <div className="relative w-full flex flex-col justify-end select-none" style={{ height }}>
      {/* Bars container */}
      <div className="relative flex items-end justify-between gap-1.5 w-full px-2" style={{ height: chartHeight }}>
        {data.map((item, idx) => {
          const barHeightPercent = maxVal > 0 ? Math.max(4, Math.round((item.value / maxVal) * 100)) : 4;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className="relative flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Value pill on hover */}
              {isHovered && (
                <div className="absolute -top-7 z-20 whitespace-nowrap rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow dark:bg-zinc-100 dark:text-zinc-900 pointer-events-none">
                  {item.value} {unit}
                </div>
              )}

              {/* Bar */}
              <div
                className="w-full max-w-[32px] rounded-t-sm transition-all duration-200"
                style={{
                  height: `${barHeightPercent}%`,
                  backgroundColor: isHovered ? barColor : `${barColor}cc`,
                  filter: isHovered ? 'brightness(1.1)' : 'none',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X Axis Labels */}
      <div className="flex items-center justify-between gap-1.5 w-full px-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        {data.map((item, idx) => {
          const showLabel =
            data.length <= 8 || idx === 0 || idx === data.length - 1 || idx % Math.ceil(data.length / 5) === 0;

          return (
            <div
              key={idx}
              className="flex-1 text-center text-[10px] text-zinc-400 font-medium truncate"
            >
              {showLabel ? item.label : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
