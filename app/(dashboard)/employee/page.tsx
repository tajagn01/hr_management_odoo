"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
  const { data: session } = useSession();
  const { isConnected, connectionFailed } = useRealtime();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [leaveStats, setLeaveStats] = useState<LeaveStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    remaining: 0,
    total: 20,
  });
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
  });
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to check if late
  const isLateCheckIn = (checkInTimeStr: string | null) => {
    if (!checkInTimeStr) return false;
    // We need the Date object, but checkInTimeStr here is formatted string (10:00 AM).
    // Better to check original data in fetchDashboardData
    return false; // Handled in state
  };

  const fetchDashboardData = useCallback(async () => {
    if (!session?.user?.employeeId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/employees/${session.user.employeeId}/overview`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");

      const data = await res.json();

      // 1. Employee Profile
      if (data.profile) {
        setEmployeeData(data.profile);
      }

      // 2. Today's Attendance & Late Logic
      const todayDate = new Date().toISOString().split('T')[0];
      const todayRecord = data.attendance?.find((a: any) => a.date.startsWith(todayDate));

      if (todayRecord) {
        let status = todayRecord.status?.toLowerCase() || "not-marked";
        let isLate = false;

        if (todayRecord.checkIn) {
          const checkInTime = new Date(todayRecord.checkIn);
          const thresholdTime = new Date(checkInTime);
          thresholdTime.setHours(9, 30, 0, 0);
          if (checkInTime > thresholdTime) {
            isLate = true;
            status = "late"; // Internal status for badge
          }
        }

        setTodayAttendance({
          status: status,
          checkIn: todayRecord.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
          }) : null,
          checkOut: todayRecord.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
          }) : null,
        });
      } else {
        setTodayAttendance({ status: "absent", checkIn: null, checkOut: null }); // Default to absent if no record/leave
        // Check if On Leave (Override)
        const onLeave = data.leaves?.find((l: any) => {
          if (l.status !== "APPROVED") return false;
          const start = new Date(l.startDate);
          const end = new Date(l.endDate);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          return now >= new Date(start.setHours(0, 0, 0, 0)) && now <= new Date(end.setHours(23, 59, 59, 999));
        });

        if (onLeave) {
          setTodayAttendance({ status: "leave", checkIn: null, checkOut: null });
        } else if (!todayRecord) {
          // If literally no record and no leave, it's Absent (unless it's future/weekend - minimal logic: assume absent for today if active day)
          setTodayAttendance({ status: "absent", checkIn: null, checkOut: null });
        }
      }

      // 3. Leave Stats (Remove hardcoded remaining)
      if (data.leaves) {
        const approvedCount = data.leaves.filter((l: any) => l.status === "APPROVED").length;
        setLeaveStats((prev) => ({
          ...prev,
          pending: data.leaves.filter((l: any) => l.status === "PENDING").length,
          approved: approvedCount,
          rejected: data.leaves.filter((l: any) => l.status === "REJECTED").length,
          remaining: 0, // Schema doesn't support balance yet
          total: approvedCount, // Show Usage instead
        }));
      }

      // 4. Attendance Stats
      if (data.summary?.attendance) {
        setAttendanceStats({
          present: data.summary.attendance.present,
          absent: data.summary.attendance.absent,
          halfDay: data.summary.attendance.halfDay,
          leave: 0 // Not in summary yet
        });
      }

      // 5. Calendar Data
      if (data.attendance) {
        setMonthlyAttendance(data.attendance);
      }

    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.employeeId]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, session?.user?.id]);

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
              {employeeData.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
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
          <AttendanceCalendar attendanceData={monthlyAttendance} />
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
