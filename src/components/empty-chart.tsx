"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function EmptyTrendChart({ label }: { label: string }) {
  return (
    <div className="chart-plot">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={[]} margin={{ top: 12, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="period" hide />
          <YAxis hide />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-line)"
            fill="var(--chart-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="chart-empty-overlay" role="status">
        <span className="chart-empty-icon"><ActivityIcon /></span>
        <strong>No {label.toLowerCase()} to display</strong>
        <span>Connect your workspace data to see this chart.</span>
      </div>
    </div>
  );
}

export function EmptyDistributionChart() {
  return (
    <div className="distribution-plot">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={[]} dataKey="value" nameKey="name" innerRadius={66} outerRadius={84} />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="distribution-empty-overlay" role="status">
        <strong>—</strong>
        <span>assets</span>
      </div>
    </div>
  );
}

function ActivityIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="M2.5 10h3l2-5 4 10 2-5h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
