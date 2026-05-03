"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/* ================================================================== */
/*  Lazy-load recharts to avoid SSR/prerender issues                   */
/* ================================================================== */

let ResponsiveContainer: any;
let RLineChart: any;
let RBarChart: any;
let RPieChart: any;
let RAreaChart: any;
let Line: any;
let Bar: any;
let Pie: any;
let Area: any;
let XAxis: any;
let YAxis: any;
let CartesianGrid: any;
let Tooltip: any;
let Cell: any;

let rechartsLoaded = false;
let rechartsPromise: Promise<void> | null = null;

function useRecharts() {
  const [loaded, setLoaded] = React.useState(rechartsLoaded);

  React.useEffect(() => {
    if (rechartsLoaded) {
      setLoaded(true);
      return;
    }
    if (!rechartsPromise) {
      rechartsPromise = import("recharts").then((mod) => {
        ResponsiveContainer = mod.ResponsiveContainer;
        RLineChart = mod.LineChart;
        RBarChart = mod.BarChart;
        RPieChart = mod.PieChart;
        RAreaChart = mod.AreaChart;
        Line = mod.Line;
        Bar = mod.Bar;
        Pie = mod.Pie;
        Area = mod.Area;
        XAxis = mod.XAxis;
        YAxis = mod.YAxis;
        CartesianGrid = mod.CartesianGrid;
        Tooltip = mod.Tooltip;
        Cell = mod.Cell;
        rechartsLoaded = true;
      });
    }
    rechartsPromise.then(() => setLoaded(true));
  }, []);

  return loaded;
}

/* ================================================================== */
/*  Shared types                                                       */
/* ================================================================== */

export interface ChartDataPoint {
  [key: string]: any;
}

export interface SeriesConfig {
  key: string;
  color: string;
  label: string;
}

/* ================================================================== */
/*  Unified Chart wrapper                                              */
/* ================================================================== */

export interface ChartProps {
  type: "line" | "bar" | "pie" | "area";
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  className?: string;
}

const DEFAULT_COLOR = "#D72638"; // brand red
const GRID_COLOR = "#3f3f46"; // zinc-700
const AXIS_COLOR = "#71717a"; // zinc-500
const LABEL_COLOR = "#a1a1aa"; // zinc-400

const PIE_COLORS = [
  "#D72638", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#84cc16",
];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#18181b",
    border: "1px solid #3f3f46",
    borderRadius: 6,
    fontSize: 12,
    color: "#e4e4e7",
  },
  itemStyle: { color: "#e4e4e7" },
  cursor: { stroke: "#D72638", strokeWidth: 1 },
};

export function Chart({
  type,
  data,
  xKey,
  yKey,
  color = DEFAULT_COLOR,
  height = 300,
  className,
}: ChartProps) {
  const loaded = useRecharts();
  if (!loaded || !data.length) return null;

  const axisProps = {
    stroke: AXIS_COLOR,
    tick: { fill: LABEL_COLOR, fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: GRID_COLOR },
  };

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        {type === "line" ? (
          <RLineChart data={data}>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...tooltipStyle} />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: "#18181b", stroke: color, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: color }}
            />
          </RLineChart>
        ) : type === "bar" ? (
          <RBarChart data={data}>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
          </RBarChart>
        ) : type === "area" ? (
          <RAreaChart data={data}>
            <defs>
              <linearGradient id="chart-area-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...tooltipStyle} />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2}
              fill="url(#chart-area-fill)"
            />
          </RAreaChart>
        ) : (
          <RPieChart>
            <Tooltip {...tooltipStyle} />
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius="80%"
              stroke="#18181b"
              strokeWidth={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
          </RPieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

Chart.displayName = "Chart";

/* ================================================================== */
/*  Individual chart exports (convenience wrappers)                     */
/* ================================================================== */

export interface LineChartProps {
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  series?: SeriesConfig[];
  color?: string;
  height?: number;
  className?: string;
}

export function LineChart({ data, xKey, yKey, series, color = DEFAULT_COLOR, height = 300, className }: LineChartProps) {
  const loaded = useRecharts();
  if (!loaded || !data.length) return null;

  const axisProps = {
    stroke: AXIS_COLOR,
    tick: { fill: LABEL_COLOR, fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: GRID_COLOR },
  };

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RLineChart data={data}>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip {...tooltipStyle} />
          {series ? (
            series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3, fill: "#18181b", stroke: s.color, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: s.color }}
                name={s.label}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: "#18181b", stroke: color, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: color }}
            />
          )}
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
}

LineChart.displayName = "LineChart";

export interface BarChartProps {
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  series?: SeriesConfig[];
  color?: string;
  height?: number;
  className?: string;
}

export function BarChart({ data, xKey, yKey, series, color = DEFAULT_COLOR, height = 300, className }: BarChartProps) {
  const loaded = useRecharts();
  if (!loaded || !data.length) return null;

  const axisProps = {
    stroke: AXIS_COLOR,
    tick: { fill: LABEL_COLOR, fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: GRID_COLOR },
  };

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RBarChart data={data}>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip {...tooltipStyle} />
          {series ? (
            series.map((s) => (
              <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[4, 4, 0, 0]} name={s.label} />
            ))
          ) : (
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
          )}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}

BarChart.displayName = "BarChart";

export interface PieChartProps {
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  colors?: string[];
  height?: number;
  donut?: boolean;
  className?: string;
}

export function PieChart({ data, xKey, yKey, colors = PIE_COLORS, height = 300, donut = false, className }: PieChartProps) {
  const loaded = useRecharts();
  if (!loaded || !data.length) return null;

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RPieChart>
          <Tooltip {...tooltipStyle} />
          <Pie
            data={data}
            dataKey={yKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            innerRadius={donut ? "45%" : 0}
            outerRadius="80%"
            stroke="#18181b"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
        </RPieChart>
      </ResponsiveContainer>
    </div>
  );
}

PieChart.displayName = "PieChart";

export interface AreaChartProps {
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  series?: SeriesConfig[];
  color?: string;
  height?: number;
  className?: string;
}

export function AreaChart({ data, xKey, yKey, series, color = DEFAULT_COLOR, height = 300, className }: AreaChartProps) {
  const loaded = useRecharts();
  if (!loaded || !data.length) return null;

  const axisProps = {
    stroke: AXIS_COLOR,
    tick: { fill: LABEL_COLOR, fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: GRID_COLOR },
  };

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RAreaChart data={data}>
          <defs>
            {series ? (
              series.map((s) => (
                <linearGradient key={s.key} id={`area-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))
            ) : (
              <linearGradient id="area-grad-default" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            )}
          </defs>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip {...tooltipStyle} />
          {series ? (
            series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#area-grad-${s.key})`}
                name={s.label}
              />
            ))
          ) : (
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2}
              fill="url(#area-grad-default)"
            />
          )}
        </RAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

AreaChart.displayName = "AreaChart";
