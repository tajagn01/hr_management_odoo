"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceCalendar } from "@/components/dashboard/attendance-calendar";
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  Loader2
} from "lucide-react";
import { useCurrentEmployee, useEmployeeAttendance, useCalendarMonth, useAttendanceCheckInOut } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  hours?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "present":
      return <Badge className="bg-green-500">Present</Badge>;
    case "absent":
      return <Badge variant="destructive">Absent</Badge>;
    case "half-day":
      return <Badge className="bg-amber-500">Half Day</Badge>;
    case "leave":
      return <Badge className="bg-blue-500">On Leave</Badge>;
    case "holiday":
      return <Badge variant="secondary">Holiday</Badge>;
    case "weekend":
      return <Badge variant="outline">Weekend</Badge>;
    case "checked-out":
      return <Badge className="bg-slate-500">Checked Out</Badge>;
    default:
      return <Badge variant="secondary">-</Badge>;
  }
};

export default function EmployeeAttendancePage() {
  const queryClient = useQueryClient();
  const { employeeId, isLoading: isEmployeeLoading } = useCurrentEmployee();
  const checkInOutMutation = useAttendanceCheckInOut();

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const [mounted, setMounted] = useState(false);
  
  // Add month/year selection state
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  
  // Year and month options
  const yearOptions = [2024, 2025, 2026, 2027];
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

  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30

  // ── Today's attendance query ────────────────────────────
  const now = new Date();
  const todayStart = useMemo(() => new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString(), [now.getFullYear(), now.getMonth(), now.getDate()]);
  const todayEnd = useMemo(() => new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1)).toISOString(), [now.getFullYear(), now.getMonth(), now.getDate()]);
  const todayQuery = useEmployeeAttendance(employeeId, todayStart, todayEnd);

  // ── Monthly attendance query (for table view) ──────────
  const monthStart = useMemo(() => new Date(Date.UTC(selectedYear, selectedMonth - 1, 1)).toISOString(), [selectedYear, selectedMonth]);
  const monthEnd = useMemo(() => new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999)).toISOString(), [selectedYear, selectedMonth]);
  const monthlyQuery = useEmployeeAttendance(employeeId, monthStart, monthEnd);

  // ── Calendar queries (current month + previous month) ──
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const calendarCurrentQuery = useCalendarMonth(employeeId, currentYear, currentMonth);
  const calendarPrevQuery = useCalendarMonth(employeeId, prevYear, prevMonth);

  // Track which extra months have been fetched for the calendar
  const fetchedMonthsRef = useRef<Set<string>>(new Set([`${currentYear}-${currentMonth}`, `${prevYear}-${prevMonth}`]));
  const [extraCalendarData, setExtraCalendarData] = useState<{date: string; status: string}[]>([]);

  // Combine calendar data from queries + any extra months fetched via navigation
  const calendarAttendance = useMemo(() => {
    const currentData = (calendarCurrentQuery.data || []).map((r: any) => ({ date: r.date, status: r.status }));
    const prevData = (calendarPrevQuery.data || []).map((r: any) => ({ date: r.date, status: r.status }));
    return [...prevData, ...currentData, ...extraCalendarData];
  }, [calendarCurrentQuery.data, calendarPrevQuery.data, extraCalendarData]);

  // When user navigates to a new month in the calendar, fetch that month's data
  const handleCalendarMonthChange = async (year: number, month: number) => {
    const key = `${year}-${month}`;
    if (fetchedMonthsRef.current.has(key) || !employeeId) return;
    fetchedMonthsRef.current.add(key);

    try {
      const firstDay = new Date(Date.UTC(year, month - 1, 1));
      const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      const res = await fetch(
        `/api/attendance?employeeId=${employeeId}&startDate=${firstDay.toISOString()}&endDate=${lastDay.toISOString()}`
      );
      const data = await res.json();
      if (data.attendanceRecords && Array.isArray(data.attendanceRecords)) {
        const mapped = data.attendanceRecords.map((record: any) => ({
          date: record.date,
          status: record.status?.toLowerCase().replace('_', '-') || 'not-marked',
        }));
        if (mapped.length > 0) {
          setExtraCalendarData(prev => {
            const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
            const filtered = prev.filter(r => !r.date.startsWith(monthPrefix));
            return [...filtered, ...mapped];
          });
        }
      }
    } catch (error) {
      console.error('Error fetching calendar month:', error);
    }
  };

  // Format monthly records for the table
  const monthlyAttendance: AttendanceRecord[] = useMemo(() => {
    const records = monthlyQuery.data?.attendanceRecords;
    if (!records || !Array.isArray(records)) return [];
    return records.map((record: any) => {
      const date = new Date(record.date);
      const checkIn = record.checkIn ? new Date(record.checkIn) : null;
      const checkOut = record.checkOut ? new Date(record.checkOut) : null;

      let hours = "-";
      if (checkIn && checkOut) {
        const diff = checkOut.getTime() - checkIn.getTime();
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        hours = `${h}h ${m}m`;
      }

      return {
        id: record.id,
        date: record.date,
        day: date.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' }),
        checkIn: checkIn ? new Date(checkIn.getTime() + IST_OFFSET_MS).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }) : null,
        checkOut: checkOut ? new Date(checkOut.getTime() + IST_OFFSET_MS).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }) : null,
        status: record.status?.toLowerCase().replace('_', '-') || 'not-marked',
        hours,
      };
    });
  }, [monthlyQuery.data, IST_OFFSET_MS]);

  const loading = isEmployeeLoading || todayQuery.isLoading || monthlyQuery.isLoading;

  // Initialize and update current time
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate elapsed time when checked in
  useEffect(() => {
    if (checkInTime && !isCheckedOut && currentTime) {
      const diff = currentTime.getTime() - checkInTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }
  }, [currentTime, checkInTime, isCheckedOut]);

  // Derive check-in/check-out state from today's attendance query
  useEffect(() => {
    if (todayQuery.data?.attendanceRecords?.length > 0) {
      const todayRecord = todayQuery.data.attendanceRecords[0];
      setIsCheckedIn(!!todayRecord.checkIn);
      setIsCheckedOut(!!todayRecord.checkOut);
      setCheckInTime(todayRecord.checkIn ? new Date(todayRecord.checkIn) : null);
      setCheckOutTime(todayRecord.checkOut ? new Date(todayRecord.checkOut) : null);
    }
  }, [todayQuery.data]);

  const handleCheckIn = async () => {
    if (!employeeId) return;

    // Snapshot previous state for rollback
    const prevIsCheckedIn = isCheckedIn;
    const prevIsCheckedOut = isCheckedOut;
    const prevCheckInTime = checkInTime;

    // Optimistic Update
    const optimisticNow = new Date();
    setCheckInTime(optimisticNow);
    setIsCheckedIn(true);
    setIsCheckedOut(false);
    setCheckOutTime(null);

    try {
      const data = await checkInOutMutation.mutateAsync({ employeeId, type: "checkIn" });
      // Update with server time
      const serverNow = data.attendance?.checkIn ? new Date(data.attendance.checkIn) : new Date();
      setCheckInTime(serverNow);
      setIsCheckedIn(!!data.attendance?.checkIn);
    } catch (error: any) {
      const message = error?.message || "Failed to check in";
      if (message.includes("leave")) {
        alert(`❌ Cannot Mark Attendance\n\nYou are on approved leave today.\n\nPlease contact HR if this is incorrect.`);
      } else {
        alert(message);
      }
      // Rollback on error
      setIsCheckedIn(prevIsCheckedIn);
      setIsCheckedOut(prevIsCheckedOut);
      setCheckInTime(prevCheckInTime);
    }
  };

  const handleCheckOut = async () => {
    if (!employeeId) return;

    // Snapshot previous state for rollback
    const prevIsCheckedOut = isCheckedOut;
    const prevCheckOutTime = checkOutTime;

    // Optimistic Update
    const optimisticNow = new Date();
    setCheckOutTime(optimisticNow);
    setIsCheckedOut(true);

    try {
      const data = await checkInOutMutation.mutateAsync({ employeeId, type: "checkOut" });
      const serverNow = data.attendance?.checkOut ? new Date(data.attendance.checkOut) : new Date();
      setCheckOutTime(serverNow);
      setIsCheckedOut(!!data.attendance?.checkOut);
    } catch (error: any) {
      alert(error?.message || "Failed to check out");
      // Rollback on error
      setIsCheckedOut(prevIsCheckedOut);
      setCheckOutTime(prevCheckOutTime);
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--";
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getTodayStatus = () => {
    if (isCheckedOut) return "checked-out";
    if (isCheckedIn) return "present";
    return "not-marked";
  };

  const todayDate = mounted && currentTime
    ? currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : "Loading...";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground">Track your daily attendance and work hours</p>
      </div>

      {/* Today's Attendance Card */}
      <Card className="border-2 border-blue-200 dark:border-blue-900 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Today&apos;s Attendance
              </CardTitle>
              <CardDescription className="mt-1">{todayDate}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {mounted && currentTime && (
                <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                  <Clock className="h-4 w-4 mr-2" />
                  {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </Badge>
              )}
              {getStatusBadge(getTodayStatus())}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Check In */}
            <div className="bg-card dark:bg-card/80 rounded-xl p-4 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Check In</span>
                <LogIn className="h-4 w-4 text-green-500" />
              </div>
              {isCheckedIn ? (
                <div>
                  <p className="text-2xl font-bold text-green-600">{formatTime(checkInTime)}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Checked in successfully
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleCheckIn}
                  className="w-full bg-green-500 hover:bg-green-600"
                  disabled={isCheckedIn || checkInOutMutation.isPending}
                >
                  {checkInOutMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
                  Check In
                </Button>
              )}
            </div>

            {/* Check Out */}
            <div className="bg-card dark:bg-card/80 rounded-xl p-4 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Check Out</span>
                <LogOut className="h-4 w-4 text-red-500" />
              </div>
              {isCheckedOut ? (
                <div>
                  <p className="text-2xl font-bold text-red-600">{formatTime(checkOutTime)}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-red-500" />
                    Checked out successfully
                  </p>
                </div>
              ) : isCheckedIn ? (
                <Button
                  onClick={handleCheckOut}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  disabled={checkInOutMutation.isPending}
                >
                  {checkInOutMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                  Check Out
                </Button>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">--:--</p>
                  <p className="text-xs text-muted-foreground mt-1">Check in first</p>
                </div>
              )}
            </div>

            {/* Work Hours - Live Timer */}
            <div className="bg-card dark:bg-card/80 rounded-xl p-4 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Work Hours</span>
                <Timer className={`h-4 w-4 ${isCheckedIn && !isCheckedOut ? "text-green-500 animate-pulse" : "text-blue-500"}`} />
              </div>
              <p className={`text-2xl font-bold font-mono ${isCheckedIn && !isCheckedOut ? "text-green-600" : "text-blue-600"}`}>
                {isCheckedIn ? elapsedTime : "00:00:00"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isCheckedIn && !isCheckedOut ? (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Working...
                  </span>
                ) : isCheckedOut ? (
                  "Day completed"
                ) : (
                  "Not started"
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <div className="space-y-4">
            {/* Month/Year Selectors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Select Month & Year
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Month</label>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">Year</label>
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Showing {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear} 
                  {monthlyAttendance.length > 0 && ` - ${monthlyAttendance.length} records found`}
                </p>
              </CardContent>
            </Card>

            {/* Attendance History */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>Your attendance records for {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading attendance data...</span>
                  </div>
                ) : monthlyAttendance.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attendance records found for this period</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {monthlyAttendance.map((record, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-lg ${record.status === "weekend" || record.status === "holiday"
                          ? "bg-muted/30"
                          : "bg-muted/50"
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-15">
                            <p className="text-lg font-bold">{new Date(record.date).getDate()}</p>
                            <p className="text-xs text-muted-foreground">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(record.status)}
                            </div>
                            {record.checkIn && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {record.checkIn} - {record.checkOut || "Working..."}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{record.hours}</p>
                          <p className="text-xs text-muted-foreground">Hours</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          {/* Attendance Calendar */}
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading attendance data...</span>
              </CardContent>
            </Card>
          ) : (
            <AttendanceCalendar attendanceData={calendarAttendance} onMonthChange={handleCalendarMonthChange} />
          )}
        </TabsContent>
      </Tabs>

      {/* Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Important Notice</h4>
              <p className="text-sm text-amber-700 mt-1">
                You cannot edit past attendance records. If you have any discrepancies,
                please contact your manager or HR department for corrections.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
