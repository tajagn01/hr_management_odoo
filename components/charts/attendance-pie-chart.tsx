"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface AttendancePieChartProps {
  data: {
    present: number
    absent: number
    late: number
    leave: number
  }
}

export function AttendancePieChart({ data }: AttendancePieChartProps) {
  const chartData = [
    { name: "Present", value: data.present, color: "#22c55e" }, // green-500
    { name: "Late", value: data.late, color: "#f59e0b" },      // amber-500
    { name: "Absent", value: data.absent, color: "#ef4444" },   // red-500
    { name: "On Leave", value: data.leave, color: "#3b82f6" },  // blue-500
  ].filter(item => item.value > 0)

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No attendance data today
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "6px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            color: "#000000",
            padding: "8px"
          }}
          formatter={(value: any) => [`${value} ${value === 1 ? 'Employee' : 'Employees'}`, "Count"]}
          itemStyle={{ color: "#000000" }}
          labelStyle={{ color: "#000000" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
