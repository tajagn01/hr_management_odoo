"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

// New: Attendance trends (Daily) — recreated from scratch
export function AttendanceChart() {
  // Automatically use current month and year in IST (UTC+5:30)
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const DEFAULT_YEAR = istNow.getUTCFullYear();
  const DEFAULT_MONTH = istNow.getUTCMonth() + 1; // JavaScript months are 0-indexed

  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [month, setMonth] = useState<number>(DEFAULT_MONTH);
  const [loading, setLoading] = useState(true);
  const [rawRecords, setRawRecords] = useState<any[]>([]);
  const [totalEmployees, setTotalEmployees] = useState<number>(0);

  // Generate year options (current year and 2 years back)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  }, []);

  // Month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const fetchMonthly = async () => {
      try {
        // Calculate IST date range for the selected month
        const lastDay = new Date(year, month, 0).getDate();
        const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0) - IST_OFFSET_MS);
        const endDate = new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999) - IST_OFFSET_MS);

        console.log(`📅 Fetching attendance for ${year}-${month}:`, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

        // Fetch attendance records directly for the month
        const res = await fetch(
          `/api/attendance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&_t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error("Failed to fetch attendance");
        const json = await res.json();

        console.log(`📊 Received ${json.attendanceRecords?.length || 0} attendance records`);

        // Log first few records to debug
        if (json.attendanceRecords && json.attendanceRecords.length > 0) {
          console.log('Sample records:', json.attendanceRecords.slice(0, 3).map((r: any) => {
            const istDate = new Date(new Date(r.date).getTime() + IST_OFFSET_MS);
            return {
              date: r.date,
              status: r.status,
              day: istDate.getUTCDate()
            };
          }));
        }


        // Fetch total employee count (ALL employees, not excluding managers)
        // We need the TOTAL count to calculate attendance percentage correctly
        const empRes = await fetch("/api/employees");
        const empJson = await empRes.json();
        const totalEmpCount = empJson?.totalCount || empJson?.employees?.length || 0;

        console.log(`👥 Total employees: ${totalEmpCount}`);

        if (mounted) {
          setRawRecords(json.attendanceRecords || []);
          setTotalEmployees(totalEmpCount);
        }
      } catch (err) {
        console.error('❌ Error fetching attendance:', err);
        if (mounted) {
          setRawRecords([]);
          setTotalEmployees(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMonthly();
    return () => { mounted = false; };
  }, [year, month]);

  // Build a stable list of days for the current month
  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate(); // Get actual days in the month
  }, [year, month]);

  const baselineDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: (i + 1).toString(),
      attendance: 0,
    }));
  }, [daysInMonth]);

  // Aggregate present counts per day and convert to percentage
  const data = useMemo(() => {
    if (!rawRecords || rawRecords.length === 0) return baselineDays;

    // Use total employee count from API
    const employeeCount = totalEmployees > 0 ? totalEmployees : 1;

    // Initialize counters for each day
    const counts = new Array(daysInMonth).fill(0);

    // Process raw attendance records
    // Each record has: { date, status, employeeId, checkIn, checkOut }
    rawRecords.forEach((record: any) => {
      if (!record || !record.date) return;

      const istDate = new Date(new Date(record.date).getTime() + IST_OFFSET_MS);
      const day = istDate.getUTCDate();

      if (day >= 1 && day <= daysInMonth) {
        const status = (record.status || '').toString().toUpperCase();
        // Count as present if status is PRESENT, LATE, or HALF_DAY
        if (status === 'PRESENT' || status === 'LATE' || status === 'HALF_DAY') {
          counts[day - 1] += 1;
        }
      }
    });

    // Convert to percentage, clamp between 0 and 100
    const chartData = counts.map((c, idx) => {
      const pct = Math.round((c / employeeCount) * 100);
      return {
        day: (idx + 1).toString(),
        attendance: Math.max(0, Math.min(100, pct)),
      };
    });

    // Debug logging
    console.log(`📊 Chart Data for ${year}-${month}:`, {
      totalRecords: rawRecords.length,
      totalEmployees: employeeCount,
      daysInMonth,
      sampleCounts: counts.slice(0, 5),
      sampleChartData: chartData.slice(0, 5)
    });

    return chartData;
  }, [rawRecords, baselineDays, daysInMonth, totalEmployees, year, month]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full h-80 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading attendance trends...</p>
        </div>
      </div>
    );
  }

  const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => (
              <SelectItem key={m.value} value={m.value.toString()}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: any) => [`${value}%`, 'Attendance']}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                color: '#000000',
                padding: '8px'
              }}
              labelStyle={{ color: '#000000' }}
              itemStyle={{ color: '#000000' }}
              wrapperStyle={{ pointerEvents: 'none' }}
            />
            <Bar dataKey="attendance" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
