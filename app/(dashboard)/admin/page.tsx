"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceChart } from "@/components/charts/attendance-chart";
import { DepartmentChart } from "@/components/charts/department-chart";
import { AttendancePieChart } from "@/components/charts/attendance-pie-chart";
import { PayrollChart } from "@/components/charts/payroll-chart";
import { useRealtime } from "@/contexts/realtime-context";
import { NotificationToast } from "@/components/notifications/toast";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  Clock,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  CheckCircle2,
  RefreshCw,
  Loader2,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Plus
} from "lucide-react";

// Memoize sub-components to prevent re-renders on parent state changes
const MemoizedAttendanceChart = memo(AttendanceChart);
const MemoizedDepartmentChart = memo(DepartmentChart);
const MemoizedAttendancePieChart = memo(AttendancePieChart);
const MemoizedPayrollChart = memo(PayrollChart);

export default function AdminPage() {
  const { isConnected, connectionFailed, attendanceStats } = useRealtime();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Use UTC day boundaries to avoid local timezone mismatches between client and server
  const today = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);

  const tomorrow = useMemo(() => {
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));
  }, [today]);

  // 1. Fetch Employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'with-payroll'],
    queryFn: async () => {
      const res = await fetch("/api/employees?includePayroll=true");
      return res.json();
    },
    // Use keepPreviousData to show stale data while refetching if needed (rare due to Infinity staleTime)
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

  // 2. Fetch Attendance
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', 'dashboard', today.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/attendance?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`);
      return res.json();
    },
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

  // 3. Fetch Leave Requests
  const { data: leaveData } = useQuery({
    queryKey: ['leave-requests', 'all'],
    queryFn: async () => {
      const res = await fetch("/api/leave");
      return res.json();
    },
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

  // 3b. Fetch Recent Leave Requests (Last 5, newest first, from last 2 days)
  const { data: recentLeaveData } = useQuery({
    queryKey: ['leave-requests', 'recent'],
    queryFn: async () => {
      console.log("🔄 [ADMIN] Fetching recent leave requests...");
      const res = await fetch("/api/leave?recentDays=2&limit=5");
      const data = await res.json();
      console.log("✅ [ADMIN] Recent leave data received:", data);
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 0, // Always fetch fresh data
  });

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Listen for leave events from realtime and refresh leave queries
  useEffect(() => {
    const onLeaveCreated = (e: any) => {
      console.log("🔔 admin: leave:created event received", e?.detail);
      const detail = e?.detail;

      // Optimistically insert the new leave into the cached leave list so UI updates immediately
      try {
        queryClient.setQueryData(['leave-requests', 'all'], (old: any) => {
          const existing = old?.leaveRequests || [];
          const newLeave = {
            id: detail.leaveRequestId || detail.id || `tmp-${Date.now()}`,
            type: detail.type || detail.leaveType || "OTHER",
            startDate: detail.startDate || detail.start || new Date().toISOString(),
            endDate: detail.endDate || detail.end || new Date().toISOString(),
            days: detail.days || 1,
            status: detail.status || "PENDING",
            reason: detail.reason || null,
            createdAt: detail.timestamp || new Date().toISOString(),
            employee: { fullName: detail.employeeName || "Unknown" },
          };

          return { ...old, leaveRequests: [newLeave, ...existing] };
        });
      } catch (err) {
        console.error("Failed to optimistic-insert leave into cache:", err);
      }

      // Also trigger an invalidation/refetch to ensure canonical data arrives
      queryClient.invalidateQueries({ queryKey: ['leave-requests', 'all'] });
      queryClient.refetchQueries({ queryKey: ['leave-requests', 'all'] });
    };

    const onLeaveStatusChange = (e: any) => {
      console.log("🔔 admin: leave status event received", e?.detail);
      const detail = e?.detail;
      if (!detail?.leaveRequestId) return;

      try {
        queryClient.setQueryData(['leave-requests', 'all'], (old: any) => {
          const existing = old?.leaveRequests || [];
          const updated = existing.map((lr: any) => {
            if (lr.id === detail.leaveRequestId || lr.id === detail.id) {
              return { ...lr, status: detail.status || lr.status };
            }
            return lr;
          });
          return { ...old, leaveRequests: updated };
        });
      } catch (err) {
        console.error("Failed to update leave status in cache:", err);
      }

      queryClient.invalidateQueries({ queryKey: ['leave-requests', 'all'] });
      queryClient.refetchQueries({ queryKey: ['leave-requests', 'all'] });
    };

    window.addEventListener('leave:created', onLeaveCreated as EventListener);
    window.addEventListener('leave:approved', onLeaveStatusChange as EventListener);
    window.addEventListener('leave:rejected', onLeaveStatusChange as EventListener);

    return () => {
      window.removeEventListener('leave:created', onLeaveCreated as EventListener);
      window.removeEventListener('leave:approved', onLeaveStatusChange as EventListener);
      window.removeEventListener('leave:rejected', onLeaveStatusChange as EventListener);
    };
  }, [queryClient]);

  // Combine isFetching from all queries
  const isGlobalFetching = useQueryClient().isFetching() > 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Add a minimum delay of 800ms for better UX
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));

    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['employees', 'with-payroll'] }),
      // Refetch all attendance queries (dashboard stats, yearly chart, etc.)
      // Refetch all attendance queries (dashboard stats, yearly chart, etc.)
      queryClient.refetchQueries({ queryKey: ['attendance'] }),
      queryClient.refetchQueries({ queryKey: ['attendance-status'] }), // Refresh cached status
      queryClient.refetchQueries({ queryKey: ['leave-requests', 'all'] }),
      queryClient.refetchQueries({ queryKey: ['leave-requests', 'recent'] }), // Added: Refetch recent leaves
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] }),
      minDelay
    ]);
    setIsRefreshing(false);
  };

  // 4. Fetch Real-time Status from API (Bulk) to ensure consistency
  // This replaces client-side calculation logic
  const { data: statusData } = useQuery({
    queryKey: ['attendance-status', 'dashboard', today.toISOString()],
    queryFn: async () => {
      const allEmployees = employeesData?.employees || [];
      if (allEmployees.length === 0) return { results: [] };

      const ids = allEmployees.map((e: any) => e.id);
      // Construct URL carefully to handle many IDs
      const params = new URLSearchParams();
      params.append('startDate', today.toISOString());
      params.append('endDate', today.toISOString());
      ids.forEach((id: string) => params.append('employeeIds[]', id));

      const res = await fetch(`/api/attendance/status/bulk?${params.toString()}`);
      return res.json();
    },
    enabled: !!employeesData?.employees?.length,
    placeholderData: keepPreviousData,
    staleTime: 60000, // 1 minute stale time
  });

  const stats = useMemo(() => {
    const allEmployees = employeesData?.employees || [];
    const totalEmployees = allEmployees.length;

    const monthlyPayroll = allEmployees.reduce((sum: number, emp: any) => {
      return sum + (emp.payroll?.netSalary || 0);
    }, 0);

    const calculatedStatuses = statusData?.results || [];

    // Group By Status
    const presentCount = calculatedStatuses.filter((r: any) => r.status === 'PRESENT' || r.status === 'HALF_DAY').length;
    const lateCount = calculatedStatuses.filter((r: any) => r.status === 'LATE').length;
    const onLeaveCount = calculatedStatuses.filter((r: any) => r.status === 'ON_LEAVE').length;
    const absentCount = calculatedStatuses.filter((r: any) => r.status === 'ABSENT').length;

    // Note: lateCount is typically considered "Present" but late. 
    // If you want "Present Today" to include Late people:
    const totalPresent = presentCount + lateCount;

    const allEmployeeIds = new Set(allEmployees.map((e: any) => e.id));
    const allLeaves = leaveData?.leaveRequests || [];
    const pendingLeaves = allLeaves.filter((lr: any) =>
      lr.status === "PENDING" && allEmployeeIds.has(lr.employeeId)
    ).length;

    // Combine with realtime stats for "Present Today" if websocket pushed updates
    const displayPresent = attendanceStats.presentToday > 0 ? attendanceStats.presentToday : totalPresent;

    return {
      totalEmployees,
      presentToday: totalPresent,
      absentToday: absentCount,
      lateToday: lateCount,
      onLeaveToday: onLeaveCount,
      pendingLeaves,
      monthlyPayroll,
    };
  }, [employeesData, statusData, leaveData, attendanceStats]);


  const recentLeaveRequestsList = useMemo(() => {
    console.log("🧮 [ADMIN] Calculating recentLeaveRequestsList...");
    const allLeaves = recentLeaveData?.leaveRequests || leaveData?.leaveRequests || [];
    console.log("📝 [ADMIN] All leaves before filtering:", allLeaves.length, allLeaves);

    // Log employeeId values to debug
    if (allLeaves.length > 0) {
      console.log("🆔 [ADMIN] Leave request employeeIds:", allLeaves.map((lr: any) => lr.employeeId));
    }

    // REMOVED: Employee role filter - All users can submit leave requests regardless of role
    // The previous filter was excluding leave requests from ADMIN/MANAGER users
    // const allEmployees = employeesData?.employees || [];
    // const regularEmployees = allEmployees.filter((emp: any) => emp.user?.role === "EMPLOYEE");
    // const regularEmployeeIds = new Set(regularEmployees.map((e: any) => e.id));

    // Simply sort and limit the results
    const result = allLeaves
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    console.log("✨ [ADMIN] Final recentLeaveRequestsList:", result.length, result);

    return result;
  }, [recentLeaveData, leaveData]); // Removed employeesData dependency since we're not filtering by it

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const attendanceRate = stats.totalEmployees > 0 ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1) : "0.0";

  const statsCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees.toString(),
      change: "Active",
      trend: "neutral",
      icon: Users,
      lightColor: "bg-blue-100 dark:bg-blue-900",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Present Today",
      value: stats.presentToday.toString(),
      change: `${attendanceRate}%`,
      trend: "up",
      icon: UserCheck,
      lightColor: "bg-green-100 dark:bg-green-900",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Absent",
      value: stats.absentToday.toString(),
      change: "Today",
      trend: "down",
      icon: UserCheck, // Or a generic Alert icon
      lightColor: "bg-red-100 dark:bg-red-900",
      textColor: "text-red-600 dark:text-red-400",
    },
    {
      title: "Late Arrivals",
      value: stats.lateToday.toString(),
      change: "> 9:30 AM",
      trend: "down",
      icon: Clock,
      lightColor: "bg-amber-100 dark:bg-amber-900",
      textColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  // Manual chart refresh listener logic - removed to prevent extra effects, rely on handleRefresh

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
      {/* Mobile Dashboard View - Premium Redesign */}
      <div className="md:hidden space-y-6 pb-20">
        {/* Mobile Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Good Morning,</p>
            <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            {mounted && currentTime && (
              <Badge variant="secondary" className="font-mono text-xs bg-muted/50">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </Badge>
            )}
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">AD</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Horizontal Stats Scroll (Snap) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overview</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {statsCards.map((stat, i) => (
              <div key={i} className="snap-center shrink-0 w-[240px] bg-card border rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className={`absolute right-0 top-0 p-3 rounded-bl-2xl ${stat.lightColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
                <p className="text-sm text-muted-foreground font-medium mt-1">{stat.title}</p>
                <div className="mt-3">
                  <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className={stat.trend === "up" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground opacity-70">vs last month</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border-dashed border-2 hover:border-solid hover:border-primary/50 hover:bg-primary/5" asChild>
              <a href="/admin/employees/new">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium">Add Employee</span>
              </a>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border-dashed border-2 hover:border-solid hover:border-primary/50 hover:bg-primary/5" asChild>
              <a href="/admin/leave-requests">
                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-medium">Leaves</span>
              </a>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border-dashed border-2 hover:border-solid hover:border-primary/50 hover:bg-primary/5" asChild>
              <a href="/admin/attendance">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-medium">Attendance</span>
              </a>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border-dashed border-2 hover:border-solid hover:border-primary/50 hover:bg-primary/5" asChild>
              <a href="/admin/payroll">
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-medium">Payroll</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Recent Activity (Leaves) - Ticket Style */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Requests</h2>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary" asChild>
              <a href="/admin/leave-requests">View All</a>
            </Button>
          </div>

          <div className="space-y-3">
            {recentLeaveRequestsList.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-xl">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </div>
            ) : (
              recentLeaveRequestsList.slice(0, 5).map((request: any) => (
                <div key={request.id} className="bg-card rounded-xl border shadow-sm overflow-hidden relative flex">
                  <div className={`w-1.5 ${request.status === 'APPROVED' ? 'bg-green-500' :
                    request.status === 'REJECTED' ? 'bg-red-500' : 'bg-amber-400'
                    }`} />
                  <div className="p-3 flex-1 flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-muted/50 border shrink-0">
                      <span className="text-xs font-bold uppercase text-muted-foreground">{new Date(request.startDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-lg font-bold leading-none">{new Date(request.startDate).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm truncate">{request.employee.fullName}</h4>
                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-none bg-muted">
                          {request.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{request.reason || "No reason provided"}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Page Header - Desktop */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mounted && currentTime && (
            <Badge variant="outline" className="text-sm font-mono px-3 py-1">
              <Clock className="mr-2 h-3 w-3 animate-pulse" />
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </Badge>
          )}
          {mounted && currentTime && (
            <Badge variant="outline" className="text-sm">
              <Calendar className="mr-1 h-3 w-3" />
              {currentTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`${stat.lightColor} p-2 rounded-lg`}>
                <stat.icon className={`h-4 w-4 ${stat.textColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs mt-1">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="hidden md:block space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Monthly attendance and leave patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <MemoizedAttendanceChart />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Today&apos;s Attendance</CardTitle>
                <CardDescription>Real-time attendance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <MemoizedAttendancePieChart data={{
                  present: stats.presentToday,
                  absent: stats.absentToday,
                  late: stats.lateToday,
                  leave: stats.onLeaveToday
                }} />
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section - Moved inside Overview Tab */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {/* Leave Requests */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Leave Requests</CardTitle>
                    <CardDescription>Latest employee leave applications</CardDescription>
                  </div>
                  <Badge variant="secondary">{recentLeaveRequestsList.filter((r: any) => r.status === "PENDING").length} Pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Removed Loading State Here for instant render of cached data or empty state */}
                {recentLeaveRequestsList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No leave requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentLeaveRequestsList.map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">
                              {request.employee.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{request.employee.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {request.type} • {request.days} day{request.days > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <Badge
                            variant={
                              request.status === "APPROVED"
                                ? "default"
                                : request.status === "REJECTED"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="capitalize"
                          >
                            {request.status === "APPROVED" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {request.status.toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/admin/employees">
                      <Users className="h-4 w-4 mr-2" />
                      View All Employees
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/admin/attendance">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Manage Attendance
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/admin/leave-requests">
                      <Calendar className="h-4 w-4 mr-2" />
                      Review Leave Requests
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/admin/payroll">
                      <IndianRupee className="h-4 w-4 mr-2" />
                      Process Payroll
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll & Compensation</CardTitle>
              <CardDescription>Monthly payroll trends with bonuses</CardDescription>
            </CardHeader>
            <CardContent>
              <MemoizedPayrollChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
              <CardDescription>Employee count by department</CardDescription>
            </CardHeader>
            <CardContent>
              <MemoizedDepartmentChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Reports & Aggregation</CardTitle>
              <CardDescription>Manually trigger attendance aggregation jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Monthly Aggregation</h3>
                      <p className="text-sm text-muted-foreground">Calculate monthly attendance stats for all employees</p>
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      const btn = document.getElementById('btn-monthly-agg') as HTMLButtonElement;
                      if (btn) {
                        btn.disabled = true;
                        btn.innerText = "Running...";
                      }
                      try {
                        const res = await fetch("/api/cron/aggregate-attendance?type=monthly");
                        const data = await res.json();
                        if (res.ok) alert(data.message);
                        else alert("Error: " + data.error);
                      } catch (e) {
                        alert("Failed to trigger aggregation");
                      } finally {
                        if (btn) {
                          btn.disabled = false;
                          btn.innerText = "Run Monthly Aggregation";
                        }
                      }
                    }}
                    id="btn-monthly-agg"
                    className="w-full"
                  >
                    Run Monthly Aggregation
                  </Button>
                </div>

                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Yearly Aggregation</h3>
                      <p className="text-sm text-muted-foreground">Calculate yearly attendance summaries for all employees</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const btn = document.getElementById('btn-yearly-agg') as HTMLButtonElement;
                      if (btn) {
                        btn.disabled = true;
                        btn.innerText = "Running...";
                      }
                      try {
                        const res = await fetch("/api/cron/aggregate-attendance?type=yearly");
                        const data = await res.json();
                        if (res.ok) alert(data.message);
                        else alert("Error: " + data.error);
                      } catch (e) {
                        alert("Failed to trigger aggregation");
                      } finally {
                        if (btn) {
                          btn.disabled = false;
                          btn.innerText = "Run Yearly Aggregation";
                        }
                      }
                    }}
                    id="btn-yearly-agg"
                    className="w-full"
                  >
                    Run Yearly Aggregation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
