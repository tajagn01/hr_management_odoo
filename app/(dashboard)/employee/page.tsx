"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useCurrentEmployee, useEmployeeOverview, useAttendanceStatus, useCalendarMonth } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRealtime } from "@/contexts/realtime-context";
import { NotificationToast } from "@/components/notifications/toast";
import { AttendanceCalendar } from "@/components/dashboard/attendance-calendar";
import {
  CalendarCheck,
  CalendarPlus,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Bell,
  Loader2
} from "lucide-react";

interface EmployeeData {
  id: string;
  fullName: string;
  employeeCode: string;
  department: string;
  designation: string;
  email?: string;
}

interface TodayAttendance {
  status: string;
  checkIn: string | null;
  checkOut: string | null;
}

interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  remaining: number;
  total: number;
}

interface AttendanceStats {
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
}

export default function EmployeePage() {
  const { isConnected, connectionFailed } = useRealtime();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [calendarYear, setCalendarYear] = useState<number>(() => {
    const now = new Date();
    const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    return istNow.getUTCFullYear();
  });
  const [calendarMonth, setCalendarMonth] = useState<number>(() => {
    const now = new Date();
    const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    return istNow.getUTCMonth() + 1;
  });

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── React Query hooks ─────────────────────────────────
  const { employeeId } = useCurrentEmployee();
  const queryClient = useQueryClient();
  const { data: overviewData, isLoading: overviewLoading } = useEmployeeOverview(employeeId ?? undefined);

  // Today's date in IST for status lookup
  const todayDate = useMemo(() => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const now = new Date();
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);
    return `${istNow.getUTCFullYear()}-${String(istNow.getUTCMonth() + 1).padStart(2, '0')}-${String(istNow.getUTCDate()).padStart(2, '0')}`;
  }, []);

  const { data: statusData } = useAttendanceStatus(employeeId ?? undefined, todayDate);
  const { data: calendarData } = useCalendarMonth(employeeId, calendarYear, calendarMonth);

  // ── Derived state ─────────────────────────────────────
  const loading = overviewLoading;
  const employeeData = overviewData?.profile ?? null;

  const todayAttendance = useMemo<TodayAttendance | null>(() => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const todayRecords = overviewData?.attendance || [];
    const todayRecord = todayRecords.find((a: any) => a.date.startsWith(todayDate));
    let status = statusData?.status?.toLowerCase() || (todayRecord ? "not-marked" : "absent");

    if (!todayRecord) {
      const onLeave = overviewData?.leaves?.find((l: any) => {
        if (l.status !== "APPROVED") return false;
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now >= new Date(start.setHours(0, 0, 0, 0)) && now <= new Date(end.setHours(23, 59, 59, 999));
      });
      if (onLeave && status !== "on_leave") {
        return { status: "leave", checkIn: null, checkOut: null };
      }
    }

    return {
      status,
      checkIn: todayRecord?.checkIn
        ? new Date(new Date(todayRecord.checkIn).getTime() + IST_OFFSET_MS).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC'
          })
        : null,
      checkOut: todayRecord?.checkOut
        ? new Date(new Date(todayRecord.checkOut).getTime() + IST_OFFSET_MS).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC'
          })
        : null,
    };
  }, [overviewData?.attendance, overviewData?.leaves, statusData, todayDate]);

  const leaveStats = useMemo<LeaveStats>(() => {
    if (!overviewData?.leaves) return { pending: 0, approved: 0, rejected: 0, remaining: 0, total: 0 };
    const leaves = overviewData.leaves;
    const approvedCount = leaves.filter((l: any) => l.status === "APPROVED").length;
    return {
      pending: leaves.filter((l: any) => l.status === "PENDING").length,
      approved: approvedCount,
      rejected: leaves.filter((l: any) => l.status === "REJECTED").length,
      remaining: 0,
      total: approvedCount,
    };
  }, [overviewData?.leaves]);

  const monthlyAttendance = calendarData || [];

  const attendanceStats = useMemo<AttendanceStats>(() => {
    const records = calendarData || [];
    return {
      present: records.filter((a: any) => a.status === "present").length,
      absent: records.filter((a: any) => a.status === "absent").length,
      halfDay: records.filter((a: any) => a.status === "half-day").length,
      leave: 0,
    };
  }, [calendarData]);

  const handleCalendarMonthChange = useCallback((year: number, month: number) => {
    setCalendarYear(year);
    setCalendarMonth(month);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500">Present</Badge>;
      case "late":
        return <Badge className="bg-amber-500">Present (Late)</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "half-day":
        return <Badge className="bg-amber-500">Half Day</Badge>;
      case "leave":
        return <Badge className="bg-blue-500">On Leave</Badge>;
      default:
        return <Badge variant="secondary">Not Marked</Badge>;
    }
  };

  if (loading || !employeeData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NotificationToast />
      {/* Real-time connection indicator */}
      {mounted && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={`h-2 w-2 rounded-full ${isConnected
            ? "bg-green-500 animate-pulse"
            : connectionFailed
              ? "bg-gray-400"
              : "bg-yellow-500 animate-pulse"
            }`} />
          <span>
            {isConnected
              ? "Real-time connected"
              : connectionFailed
                ? "Real-time not available"
                : "Connecting..."}
          </span>
        </div>
      )}
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-linear-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-white/30">
            <AvatarFallback className="bg-white/20 text-white text-xl">
              {employeeData.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {employeeData.fullName.split(" ")[0]}!</h1>
            <p className="text-blue-100">{employeeData.designation} • {employeeData.department}</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-3xl font-bold">
            {mounted && currentTime ? currentTime.toLocaleTimeString() : "--:--:--"}
          </p>
          <p className="text-blue-100">
            {mounted && currentTime
              ? currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : "Loading..."}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusBadge(todayAttendance?.status || "not-marked")}
            </div>
            {todayAttendance?.checkIn && (
              <p className="text-xs text-muted-foreground mt-2">
                Check-in: {todayAttendance.checkIn}
                {todayAttendance.checkOut && ` • Check-out: ${todayAttendance.checkOut}`}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Leaves</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{leaveStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leaves Used</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{leaveStats.total}</div>
            <p className="text-xs text-muted-foreground">Approved this year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Leaves</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{leaveStats.approved}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks at your fingertips</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/employee/attendance">
              <Button className="w-full justify-start gap-3" variant="outline">
                <CalendarCheck className="h-5 w-5 text-green-500" />
                Mark Attendance
              </Button>
            </Link>
            <Link href="/employee/leave">
              <Button className="w-full justify-start gap-3" variant="outline">
                <CalendarPlus className="h-5 w-5 text-blue-500" />
                Apply for Leave
              </Button>
            </Link>
            <Link href="/employee/profile">
              <Button className="w-full justify-start gap-3" variant="outline">
                <User className="h-5 w-5 text-purple-500" />
                View Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Recent updates and alerts</CardDescription>
              </div>
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveStats.pending > 0 && (
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">You have {leaveStats.pending} pending leave request(s)</p>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </div>
                </div>
              )}
              {leaveStats.approved > 0 && (
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">You have {leaveStats.approved} approved leave(s) this year</p>
                    <p className="text-xs text-muted-foreground">Great job!</p>
                  </div>
                </div>
              )}
              {!todayAttendance?.checkIn && (
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Remember to check in today</p>
                    <p className="text-xs text-muted-foreground">Mark your attendance</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Attendance Calendar */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <AttendanceCalendar attendanceData={monthlyAttendance} onMonthChange={handleCalendarMonthChange} />
        </div>
        <div>
          {/* Attendance Stats Summary */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>This Month</CardTitle>
              <CardDescription>Summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <span className="text-sm font-medium">Present</span>
                <span className="text-xl font-bold text-green-600">{attendanceStats.present}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <span className="text-sm font-medium">Absent</span>
                <span className="text-xl font-bold text-red-600">{attendanceStats.absent}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <span className="text-sm font-medium">Half Day</span>
                <span className="text-xl font-bold text-amber-600">{attendanceStats.halfDay}</span>
              </div>
              {/* 
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <span className="text-sm font-medium">On Leave</span>
                        <span className="text-xl font-bold text-blue-600">{attendanceStats.leave}</span>
                    </div>
                    */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
