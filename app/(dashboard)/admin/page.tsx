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
  Loader2
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

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
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

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Combine isFetching from all queries
  const isGlobalFetching = useQueryClient().isFetching() > 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Add a minimum delay of 800ms for better UX
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));

    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['employees', 'with-payroll'] }),
      // Refetch all attendance queries (dashboard stats, yearly chart, etc.)
      queryClient.refetchQueries({ queryKey: ['attendance'] }),
      queryClient.refetchQueries({ queryKey: ['leave-requests', 'all'] }),
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] }),
      minDelay
    ]);
    setIsRefreshing(false);
  };

  // Memoize all derived calculations
  const stats = useMemo(() => {
    const allEmployees = employeesData?.employees || [];
    const regularEmployees = allEmployees.filter((emp: any) => emp.user?.role === "EMPLOYEE");
    const totalEmployees = regularEmployees.length;

    const monthlyPayroll = regularEmployees.reduce((sum: number, emp: any) => {
      return sum + (emp.payroll?.netSalary || 0);
    }, 0);

    const regularEmployeeIds = new Set(regularEmployees.map((e: any) => e.id));

    const presentTodayCalc = attendanceData?.attendanceRecords?.filter((a: any) => {
      if (!regularEmployeeIds.has(a.employeeId)) return false;
      const status = a.status?.toUpperCase();
      return status === "PRESENT" ||
        status === "HALF_DAY" ||
        (a.checkIn && status !== "ABSENT" && status !== "ON_LEAVE" && status !== "LEAVE");
    }).length || 0;

    const allLeaves = leaveData?.leaveRequests || [];
    const pendingLeaves = allLeaves.filter((lr: any) =>
      lr.status === "PENDING" && regularEmployeeIds.has(lr.employeeId)
    ).length;

    // Combine with realtime stats if available
    const displayPresentToday = attendanceStats.presentToday > 0 ? attendanceStats.presentToday : presentTodayCalc;

    return {
      totalEmployees,
      presentToday: displayPresentToday,
      pendingLeaves,
      monthlyPayroll,
    };
  }, [employeesData, attendanceData, leaveData, attendanceStats]);


  const recentLeaveRequestsList = useMemo(() => {
    const allLeaves = leaveData?.leaveRequests || [];
    const allEmployees = employeesData?.employees || [];
    const regularEmployees = allEmployees.filter((emp: any) => emp.user?.role === "EMPLOYEE");
    const regularEmployeeIds = new Set(regularEmployees.map((e: any) => e.id));

    return allLeaves
      .filter((lr: any) => regularEmployeeIds.has(lr.employeeId))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [leaveData, employeesData]);

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
      change: "+12%",
      trend: "up",
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
      title: "Pending Leaves",
      value: stats.pendingLeaves.toString(),
      change: "-3",
      trend: "down",
      icon: Clock,
      lightColor: "bg-amber-100 dark:bg-amber-900",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Monthly Payroll",
      value: formatCurrency(stats.monthlyPayroll),
      change: "+5.2%",
      trend: "up",
      icon: IndianRupee,
      lightColor: "bg-purple-100 dark:bg-purple-900",
      textColor: "text-purple-600 dark:text-purple-400",
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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      <Tabs defaultValue="overview" className="space-y-4">
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
                <MemoizedAttendancePieChart />
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
                  <Badge variant="secondary">{recentLeaveRequestsList.filter((r: any) => r.status === "pending").length} Pending</Badge>
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
