"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface PieData {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  const { theme } = useTheme();

  if (!active || !payload || !payload.length) {
    return null;
  }

  const textColor = theme === "dark" ? "#ffffff" : "#0f172a";
  const isDark = theme === "dark";

  return (
    <div
      style={{
        backgroundColor: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "8px",
        padding: "10px 14px",
        color: textColor,
        boxShadow: isDark
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        fontSize: "13px",
        lineHeight: "1.5",
        minWidth: "120px",
        maxWidth: "140px",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: "6px", fontWeight: 600, color: textColor }}>
        {payload[0].name}
      </div>
      <div style={{ color: textColor, opacity: 0.9 }}>
        Value: <span style={{ fontWeight: 600 }}>{payload[0].value}</span>
      </div>
    </div>
  );
};

export function AttendancePieChart() {
  const [data, setData] = useState<PieData[]>([
    { name: "Present", value: 0, color: "#10b981" },
    { name: "Absent", value: 0, color: "#ef4444" },
    { name: "On Leave", value: 0, color: "#f59e0b" },
    { name: "Remote", value: 0, color: "#3b82f6" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const styleId = "attendance-pie-chart-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .recharts-tooltip-wrapper {
        transform: translate(-50%, -50%) !important;
        left: 50% !important;
        top: 50% !important;
        pointer-events: none !important;
        opacity: 1 !important;
        transition: opacity 0.05s linear !important;
      }
      
      .recharts-tooltip-wrapper[style*="display: none"] {
        opacity: 0 !important;
        transition: opacity 0.05s linear !important;
      }
      
      .recharts-tooltip-wrapper > div {
        opacity: 1 !important;
        transform: none !important;
        animation: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch today's attendance
        const attendanceRes = await fetch(
          `/api/attendance?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`
        );
        const attendanceData = await attendanceRes.json();
        const records = attendanceData.attendanceRecords || [];

        // Count by status
        const present = records.filter((r: any) => r.status === "PRESENT" || r.status === "HALF_DAY").length;
        const absent = records.filter((r: any) => r.status === "ABSENT").length;
        const onLeave = records.filter((r: any) => r.status === "ON_LEAVE").length;
        const remote = records.filter((r: any) => r.status === "REMOTE").length;

        setData([
          { name: "Present", value: present, color: "#10b981" },
          { name: "Absent", value: absent, color: "#ef4444" },
          { name: "On Leave", value: onLeave, color: "#f59e0b" },
          { name: "Remote", value: remote, color: "#3b82f6" },
        ]);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
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

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No attendance data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data as any}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={<CustomTooltip />}
          animationDuration={0}
          animationEasing="linear"
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
