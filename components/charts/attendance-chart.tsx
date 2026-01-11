"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";

interface ChartData {
  month: string;
  attendance: number;
  leaves: number;
}

export function AttendanceChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        // ✅ Use optimized single API call instead of 12 separate calls
        const currentYear = new Date().getFullYear();
        const response = await fetch(`/api/attendance/yearly?year=${currentYear}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.chartData && data.chartData.length > 0) {
          setData(data.chartData);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading attendance data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No attendance data available</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorLeaves" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Area
          type="monotone"
          dataKey="attendance"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorAttendance)"
          name="Attendance %"
        />
        <Area
          type="monotone"
          dataKey="leaves"
          stroke="#ef4444"
          fillOpacity={1}
          fill="url(#colorLeaves)"
          name="Leaves %"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
