"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface PieData {
  name: string;
  value: number; // percentage 0-100
  color: string;
}

// Today's Attendance — recreated from scratch
export function AttendancePieChart() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PieData[]>([]);

  const fetchAndCompute = async () => {
    try {
      // Get total employees (active employees)
      const empRes = await fetch("/api/employees?includeActive=true");
      const empJson = await empRes.json();
      const employees = empJson.employees || empJson || [];
      const totalEmployees = Math.max(1, (employees.length || 0));

      // Today's date range
        const now = new Date();
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const tomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));

      // Fetch today's attendance records
      const attRes = await fetch(`/api/attendance?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`);
      const attJson = await attRes.json();
      const records = attJson.attendanceRecords || [];

      // Fetch leave requests (cached API currently doesn't accept date range reliably)
      const leaveRes = await fetch(`/api/leave`);
      const leaveJson = await leaveRes.json();
      const leaves = leaveJson.leaveRequests || [];

      // Compute counts
      const presentCount = records.filter((r: any) => {
        const status = (r.status || '').toString().toUpperCase();
        return status === 'PRESENT' || status === 'HALF_DAY' || !!r.checkIn;
      }).length;

      // Count only APPROVED leaves that overlap today's UTC date
      const todayISO = today.toISOString().split('T')[0];
      const onLeaveCount = leaves.filter((l: any) => {
        if (!l || !l.startDate || !l.endDate) return false;
        if ((l.status || '').toString().toUpperCase() !== 'APPROVED') return false;
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        // Normalize to UTC date-only comparison
        const startISO = start.toISOString().split('T')[0];
        const endISO = end.toISOString().split('T')[0];
        return startISO <= todayISO && todayISO <= endISO;
      }).length;

      // Remote: if API encodes remote status
      const remoteCount = records.filter((r: any) => (r.status || '').toString().toUpperCase() === 'REMOTE').length;

      // Absent: remaining employees not present and not on leave
      let absentCount = totalEmployees - presentCount - onLeaveCount;
      if (absentCount < 0) absentCount = 0;

      // Convert to percentages and ensure sum 100
      const raw = [
        { name: 'Present', value: presentCount, color: '#10b981' },
        { name: 'On Leave', value: onLeaveCount, color: '#f59e0b' },
        { name: 'Remote', value: remoteCount, color: '#3b82f6' },
        { name: 'Absent', value: absentCount, color: '#ef4444' },
      ];

      const totalCount = raw.reduce((s, r) => s + r.value, 0) || 1;
      let percentages = raw.map(r => ({ ...r, pct: Math.round((r.value / totalEmployees) * 100) }));

      // Normalize rounding so sum equals 100 (distribute remainder to Present)
      const sumPct = percentages.reduce((s, x) => s + x.pct, 0);
      const remainder = 100 - sumPct;
      if (remainder !== 0) {
        percentages = percentages.map((p, i) => i === 0 ? { ...p, pct: Math.max(0, Math.min(100, p.pct + remainder)) } : p);
      }

      const finalData: PieData[] = percentages.map(p => ({ name: p.name, value: Math.max(0, Math.min(100, p.pct)), color: p.color }));

      setData(finalData);
    } catch (err) {
      console.error(err);
      setData([
        { name: 'Present', value: 0, color: '#10b981' },
        { name: 'On Leave', value: 0, color: '#f59e0b' },
        { name: 'Remote', value: 0, color: '#3b82f6' },
        { name: 'Absent', value: 0, color: '#ef4444' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      setLoading(true);
      await fetchAndCompute();
    };
    run();

    // Poll every 30 seconds for near-real-time updates
    const id = setInterval(() => { if (mounted) fetchAndCompute(); }, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  if (loading) {
    return (
      <div className="w-full h-72 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading today's attendance...</p>
      </div>
    );
  }

  const totalPct = data.reduce((s, d) => s + d.value, 0);
  if (totalPct === 0) {
    return (
      <div className="w-full h-72 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No attendance data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72 flex flex-col md:flex-row items-center gap-4">
      <div className="w-full md:w-1/2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data as any} dataKey="value" innerRadius={40} outerRadius={80} paddingAngle={4}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip formatter={(v: any) => `${v}%`} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full md:w-1/2 grid grid-cols-2 gap-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
            <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ backgroundColor: d.color + '22' }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: d.color }} />
            </div>
            <div>
              <div className="text-sm font-medium">{d.name}</div>
              <div className="text-xs text-muted-foreground">{d.value}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
