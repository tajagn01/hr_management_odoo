"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// New: Attendance trends (Daily) — recreated from scratch
export function AttendanceChart() {
  // Default to January 2026 as requested
  const DEFAULT_YEAR = 2026;
  const DEFAULT_MONTH = 1; // January

  const [year] = useState<number>(DEFAULT_YEAR);
  const [month] = useState<number>(DEFAULT_MONTH);
  const [loading, setLoading] = useState(true);
  const [rawRecords, setRawRecords] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchMonthly = async () => {
      try {
        const res = await fetch(`/api/attendance/monthly?year=${year}&month=${month}`);
        if (!res.ok) throw new Error("Failed to fetch monthly attendance");
        const json = await res.json();
        if (mounted) setRawRecords(json.monthlyRecords || []);
      } catch (err) {
        console.error(err);
        if (mounted) setRawRecords([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMonthly();
    return () => { mounted = false; };
  }, [year, month]);

  // Build a stable list of days for January 2026 (1..31)
  const daysInMonth = 31; // Jan always 31
  const baselineDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: (i + 1).toString(),
      attendance: 0,
    }));
  }, []);

  // Aggregate present counts per day and convert to percentage
  const data = useMemo(() => {
    if (!rawRecords || rawRecords.length === 0) return baselineDays;

    // Count employees from records; fall back to 1 to avoid division by zero
    const employeeCount = rawRecords.length || 1;

    // Initialize counters for each day
    const counts = new Array(daysInMonth).fill(0);

    // rawRecords expected to contain per-employee dayWiseData array with { date, status }
    rawRecords.forEach((rec: any) => {
      const dayWise = rec.dayWiseData || [];
      if (!Array.isArray(dayWise)) return;
      dayWise.forEach((dw: any) => {
        if (!dw || !dw.date) return;
        const parts = dw.date.split("-");
        const d = parseInt(parts[2], 10);
        if (!isNaN(d) && d >= 1 && d <= daysInMonth) {
          const status = (dw.status || '').toString().toUpperCase();
          if (status === 'PRESENT' || status === 'P' || status === 'CHECKED_IN') {
            counts[d - 1] += 1;
          }
        }
      });
    });

    // Convert to percentage, clamp between 0 and 100
    return counts.map((c, idx) => {
      const pct = Math.round((c / employeeCount) * 100);
      return {
        day: (idx + 1).toString(),
        attendance: Math.max(0, Math.min(100, pct)),
      };
    });
  }, [rawRecords, baselineDays]);

  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading attendance trends...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: any) => `${value}%`}
            contentStyle={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
            wrapperStyle={{ pointerEvents: 'none' }}
          />
          <Bar dataKey="attendance" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
