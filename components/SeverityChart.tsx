"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  High: "#f43f5e",
  Medium: "#f59e0b",
  Low: "#22c55e",
  Info: "#38bdf8",
};

export default function SeverityChart({
  high,
  medium,
  low,
  info,
}: {
  high: number;
  medium: number;
  low: number;
  info: number;
}) {
  const data = [
    { name: "High", value: high },
    { name: "Medium", value: medium },
    { name: "Low", value: low },
    { name: "Info", value: info },
  ].filter((d) => d.value > 0);

  const total = high + medium + low + info;

  if (total === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-500">
        No findings to chart yet.
      </div>
    );
  }

  return (
    <div className="relative h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            animationDuration={800}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={COLORS[d.name]} stroke="#0a0e17" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#161f2e",
              border: "1px solid #233047",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-gray-100">{total}</span>
        <span className="text-[10px] uppercase tracking-wider text-gray-500">Findings</span>
      </div>
    </div>
  );
}
