"use client";

import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEmployees, useTodayAttendance, useLeaveRequests, useMonthlyAttendance, useYearlyAttendance } from "@/lib/hooks";
import { queryKeys } from "@/lib/hooks/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealtime } from "@/contexts/realtime-context";
import { NotificationToast } from "@/components/notifications/toast";
import {
    Users,
    UserCheck,
    Clock,
    Calendar,
    TrendingUp,
    Loader2,
    RefreshCw,
    BarChart3,
    CalendarDays
} from "lucide-react";
import { MonthlyAttendanceCard } from "@/components/attendance/monthly-attendance-card";
import { YearlyAttendanceCard } from "@/components/attendance/yearly-attendance-card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TeamMember {
    id: string;
    fullName: string;
    employeeCode: string;
    department: string;
    designation: string;
}

interface MonthlyAttendance {
    id: string;
    year: number;
    month: number;
    presentDays: number;
    absentDays: number;
    halfDays: number;
    leaveDays: number;
    totalWorkingDays: number;
    totalWorkingHours: number;
    attendancePercent: number;
    employee: {
        fullName: string;
        employeeCode: string;
    };
}

export default function ManagerPage() {
    const { isConnected, connectionFailed } = useRealtime();
    const [mounted, setMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const queryClient = useQueryClient();

    // React Query hooks — cached & shared
    const { data: employeesData, isLoading: teamLoading, isFetching: teamFetching } = useEmployees();
    const { data: attendanceData, isFetching: attendanceFetching } = useTodayAttendance();
    const { data: leaveData } = useLeaveRequests();
    const { data: monthlyData } = useMonthlyAttendance(selectedYear, selectedMonth);
    const { data: yearlyRaw } = useYearlyAttendance(selectedYear);

    const teamMembers: TeamMember[] = employeesData?.employees || [];
    const monthlyAttendance: MonthlyAttendance[] = monthlyData?.monthlyRecords || [];
    const yearlyData = yearlyRaw ?? null;
    const loading = teamLoading;
    const isRefreshing = teamFetching || attendanceFetching;

    useEffect(() => {
        setMounted(true);
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const stats = useMemo(() => {
        const team = teamMembers;
        if (team.length === 0) return { totalTeamMembers: 0, presentToday: 0, absentToday: 0, lateToday: 0, pendingLeaves: 0 };

        const records = attendanceData?.attendanceRecords || [];
        const LATE_THRESHOLD_HOUR = 9;
        const LATE_THRESHOLD_MINUTE = 30;
        let presentCount = 0;
        let lateCount = 0;

        records.forEach((a: any) => {
            const status = a.status?.toUpperCase();
            const isPresent = status === "PRESENT" || status === "HALF_DAY" || (a.checkIn && status !== "ABSENT" && status !== "ON_LEAVE");
            if (isPresent) {
                presentCount++;
                if (a.checkIn) {
                    const checkInTime = new Date(a.checkIn);
                    const thresholdTime = new Date(checkInTime);
                    thresholdTime.setHours(LATE_THRESHOLD_HOUR, LATE_THRESHOLD_MINUTE, 0, 0);
                    if (checkInTime > thresholdTime) lateCount++;
                }
            }
        });

        const leaveRequests = leaveData?.leaveRequests || [];
        const onLeaveToday = leaveRequests.filter((lr: any) => {
            if (lr.status !== "APPROVED") return false;
            const isTeam = team.some((m: TeamMember) => m.id === lr.employeeId);
            if (!isTeam) return false;
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return now >= new Date(start.setHours(0, 0, 0, 0)) && now <= new Date(end.setHours(23, 59, 59, 999));
        }).length;

        const pendingLeaves = leaveRequests.filter((lr: any) => {
            if (lr.status !== "PENDING") return false;
            return team.some((m: TeamMember) => m.id === lr.employeeId);
        }).length;

        const calculatedAbsent = team.length - presentCount - onLeaveToday;

        return {
            totalTeamMembers: team.length,
            presentToday: presentCount,
            absentToday: Math.max(0, calculatedAbsent),
            lateToday: lateCount,
            pendingLeaves,
        };
    }, [teamMembers, attendanceData, leaveData]);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.leave.all });
    };

    const attendanceRate = stats.totalTeamMembers > 0
        ? ((stats.presentToday / stats.totalTeamMembers) * 100).toFixed(1)
        : "0.0";

    const statsCards = [
        {
            title: "Team Members",
            value: stats.totalTeamMembers.toString(),
            icon: Users,
            lightColor: "bg-blue-100 dark:bg-blue-900",
            textColor: "text-blue-600 dark:text-blue-400",
        },
        {
            title: "Present Today",
            value: stats.presentToday.toString(),
            subtitle: `${attendanceRate}% attendance`,
            icon: UserCheck,
            lightColor: "bg-green-100 dark:bg-green-900",
            textColor: "text-green-600 dark:text-green-400",
        },
        {
            title: "Absent",
            value: stats.absentToday.toString(),
            icon: UserCheck,
            lightColor: "bg-red-100 dark:bg-red-900",
            textColor: "text-red-600 dark:text-red-400",
        },
        {
            title: "Late Arrivals",
            value: stats.lateToday.toString(),
            icon: Clock,
            lightColor: "bg-amber-100 dark:bg-amber-900",
            textColor: "text-amber-600 dark:text-amber-400",
        },
    ];

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (loading) {
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

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage your team's attendance and performance
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
            <div className="grid gap-4 md:grid-cols-3">
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
                            {stat.subtitle && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stat.subtitle}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs for different views */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">
                        <Users className="h-4 w-4 mr-2" />
                        Team Overview
                    </TabsTrigger>
                    <TabsTrigger value="monthly">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Monthly Attendance
                    </TabsTrigger>
                    <TabsTrigger value="yearly">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Yearly Summary
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>Overview of your team ({teamMembers.length} members)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {teamMembers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No team members found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {teamMembers.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="text-xs">
                                                        {member.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.fullName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {member.designation} • {member.department}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline">
                                                {member.employeeCode}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Monthly Attendance Tab */}
                <TabsContent value="monthly" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Monthly Attendance Report</CardTitle>
                                    <CardDescription>Detailed attendance breakdown for {months[selectedMonth - 1]} {selectedYear}</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Select
                                        value={selectedMonth.toString()}
                                        onValueChange={(value) => setSelectedMonth(parseInt(value))}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Select Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map((month, index) => (
                                                <SelectItem key={index} value={(index + 1).toString()}>
                                                    {month}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={selectedYear.toString()}
                                        onValueChange={(value) => setSelectedYear(parseInt(value))}
                                    >
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder="Select Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[2024, 2025, 2026].map(year => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {monthlyAttendance.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No attendance data for this period</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {monthlyAttendance.map((record) => (
                                        <MonthlyAttendanceCard
                                            key={record.id}
                                            data={record}
                                            showEmployeeInfo={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Yearly Summary Tab */}
                <TabsContent value="yearly" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Yearly Attendance Summary</CardTitle>
                                    <CardDescription>Annual performance overview for {selectedYear}</CardDescription>
                                </div>
                                <Select
                                    value={selectedYear.toString()}
                                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                                >
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026].map(year => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!yearlyData || yearlyData.yearlyRecords?.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No yearly data available for {selectedYear}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {yearlyData.yearlyRecords?.map((record: any) => (
                                        <YearlyAttendanceCard
                                            key={record.id}
                                            data={record}
                                            showEmployeeInfo={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
