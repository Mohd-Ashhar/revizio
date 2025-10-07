// app/dashboard/ProgressChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartProps {
  // We revert this prop for simplicity, as the stringify method didn't help.
  // The underlying issue is not with the prop type itself.
  data: {
    date: string;
    score: number;
  }[];
}

// 1. Tooltip is modified to only show the date (label)
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 border bg-background rounded-md shadow-sm">
        <p className="label font-semibold">{`${label}`}</p>
      </div>
    );
  }
  return null;
};

export default function ProgressChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />

        {/* 2. Y-axis is configured to show a fixed domain and ticks */}
        <YAxis domain={[0, 4]} ticks={[1, 2, 3]} allowDecimals={false} />

        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
