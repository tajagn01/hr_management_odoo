"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [monthlyAttendance, setMonthlyAttendance] = useState<AttendanceRecord[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  
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

  // Fetch employee ID
  const fetchEmployeeId = useCallback(async () => {
    if (!session?.user?.email) return null;

    try {
      const res = await fetch(`/api/employees?email=${session.user.email}`);
      const data = await res.json();
      if (data.employee) {
        setEmployeeId(data.employee.id);
        return data.employee.id;
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
    }
    return null;
  }, [session?.user?.email]);

  // Fetch today's attendance
  const fetchTodayAttendance = useCallback(async (empId: string) => {
    try {
      // Use UTC boundaries to avoid timezone drift when querying the API
      const now = new Date();
      const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const tomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));

      const res = await fetch(
        `/api/attendance?employeeId=${empId}&startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`
      );
      const data = await res.json();

      if (data.attendanceRecords && data.attendanceRecords.length > 0) {
        const todayRecord = data.attendanceRecords[0];
        setIsCheckedIn(!!todayRecord.checkIn);
        setIsCheckedOut(!!todayRecord.checkOut);
        setCheckInTime(todayRecord.checkIn ? new Date(todayRecord.checkIn) : null);
        setCheckOutTime(todayRecord.checkOut ? new Date(todayRecord.checkOut) : null);
      }
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
    }
  }, []);

  // Fetch monthly attendance for selected month/year
  const fetchMonthlyAttendance = useCallback(async (empId: string, year: number, month: number) => {
    try {
      // Use selected month/year instead of current month
      const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
      const lastDayOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      const res = await fetch(
        `/api/attendance?employeeId=${empId}&startDate=${firstDayOfMonth.toISOString()}&endDate=${lastDayOfMonth.toISOString()}`
      );
      const data = await res.json();

      if (data.attendanceRecords && Array.isArray(data.attendanceRecords)) {
        const formatted = data.attendanceRecords.map((record: any) => {
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
            day: date.toLocaleDateString('en-US', { weekday: 'long' }),
            checkIn: checkIn ? checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
            checkOut: checkOut ? checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
            status: record.status?.toLowerCase().replace('_', '-') || 'not-marked',
            hours,
          };
        });
        setMonthlyAttendance(formatted);
      } else {
        setMonthlyAttendance([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching monthly attendance:", error);
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const empId = await fetchEmployeeId();
      if (empId) {
        await Promise.all([
          fetchTodayAttendance(empId),
          fetchMonthlyAttendance(empId, selectedYear, selectedMonth),
        ]);
      } else {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchEmployeeId, fetchTodayAttendance, fetchMonthlyAttendance, selectedYear, selectedMonth]);

  // Reload monthly data when month/year changes
  useEffect(() => {
    if (employeeId) {
      setLoading(true);
      fetchMonthlyAttendance(employeeId, selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth, employeeId, fetchMonthlyAttendance]);

  const handleCheckIn = async () => {
    if (!employeeId) return;

    // Snapshot previous state for rollback
    const prevIsCheckedIn = isCheckedIn;
    const prevIsCheckedOut = isCheckedOut;
    const prevCheckInTime = checkInTime;

    // Optimistic Update
    const now = new Date();
    setCheckInTime(now);
    setIsCheckedIn(true);
    setIsCheckedOut(false);
    setCheckOutTime(null);

    try {
      setSubmitting(true);
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, type: "checkIn" }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update with server time just to be precise
        const serverNow = data.attendance?.checkIn ? new Date(data.attendance.checkIn) : new Date();
        setCheckInTime(serverNow);
        setIsCheckedIn(!!data.attendance?.checkIn);

        // Refresh data in background without blocking UI
        if (employeeId) {
          fetchMonthlyAttendance(employeeId, selectedYear, selectedMonth);
          fetchTodayAttendance(employeeId);
        }
      } else {
        // Rollback on error
        const error = await res.json();
        
        // Show detailed error message
        if (error.error && error.error.includes("leave")) {
          // Special handling for leave error
          const leaveType = error.leaveType || "leave";
          alert(`❌ Cannot Mark Attendance\n\nYou are on approved ${leaveType.toLowerCase()} today.\n\nPlease contact HR if this is incorrect.`);
        } else {
          alert(error.error || "Failed to check in");
        }
        
        setIsCheckedIn(prevIsCheckedIn);
        setIsCheckedOut(prevIsCheckedOut);
        setCheckInTime(prevCheckInTime);
      }
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Failed to check in");
      // Rollback on error
      setIsCheckedIn(prevIsCheckedIn);
      setIsCheckedOut(prevIsCheckedOut);
      setCheckInTime(prevCheckInTime);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!employeeId) return;

    // Snapshot previous state for rollback
    const prevIsCheckedOut = isCheckedOut;
    const prevCheckOutTime = checkOutTime;

    // Optimistic Update
    const now = new Date();
    setCheckOutTime(now);
    setIsCheckedOut(true);

    try {
      setSubmitting(true);
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, type: "checkOut" }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverNow = data.attendance?.checkOut ? new Date(data.attendance.checkOut) : new Date();
        setCheckOutTime(serverNow);
        setIsCheckedOut(!!data.attendance?.checkOut);

        // Refresh data in background without blocking UI
        if (employeeId) {
          fetchMonthlyAttendance(employeeId, selectedYear, selectedMonth);
          fetchTodayAttendance(employeeId);
        }
      } else {
        // Rollback on error
        const error = await res.json();
        alert(error.error || "Failed to check out");
        setIsCheckedOut(prevIsCheckedOut);
        setCheckOutTime(prevCheckOutTime);
      }
    } catch (error) {
      console.error("Error checking out:", error);
      alert("Failed to check out");
      // Rollback on error
      setIsCheckedOut(prevIsCheckedOut);
      setCheckOutTime(prevCheckOutTime);
    } finally {
      setSubmitting(false);
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
                  disabled={isCheckedIn}
                >
                  <LogIn className="h-4 w-4 mr-2" />
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
                >
                  <LogOut className="h-4 w-4 mr-2" />
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
            <AttendanceCalendar attendanceData={monthlyAttendance.map(record => ({
              date: record.date,
              status: record.status // Keep original status format
            }))} />
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
