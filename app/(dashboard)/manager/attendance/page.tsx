"use client";

import { useState, useMemo } from "react";
import { useAttendanceByDateRange } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    CalendarCheck,
    CheckCircle2,
    XCircle,
    MinusCircle,
    Clock,
    Loader2,
    RefreshCw,
    Calendar as CalendarIcon
} from "lucide-react";

interface AttendanceRecord {
    id: string;
    date: string;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
    workingHours: number | null;
    employee: {
        fullName: string;
        employeeCode: string;
    };
}

export default function TeamAttendancePage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const queryClient = useQueryClient();

    // Compute IST date boundaries for selected date
    const { startDate, endDate } = useMemo(() => {
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const selDate = new Date(selectedDate.getTime() + IST_OFFSET_MS);
        const start = new Date(Date.UTC(
            selDate.getUTCFullYear(), selDate.getUTCMonth(), selDate.getUTCDate(), 0, 0, 0, 0
        ) - IST_OFFSET_MS);
        const end = new Date(Date.UTC(
            selDate.getUTCFullYear(), selDate.getUTCMonth(), selDate.getUTCDate(), 23, 59, 59, 999
        ) - IST_OFFSET_MS);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    }, [selectedDate]);

    const { data: attendanceResponse, isLoading: loading, isFetching: isRefreshing } = useAttendanceByDateRange(startDate, endDate);
    const attendanceRecords: AttendanceRecord[] = attendanceResponse?.attendanceRecords || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PRESENT":
                return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Present</Badge>;
            case "ABSENT":
                return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Absent</Badge>;
            case "HALF_DAY":
                return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">Half Day</Badge>;
            case "LEAVE":
                return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Leave</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "PRESENT":
                return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
            case "ABSENT":
                return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
            case "HALF_DAY":
                return <MinusCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
            case "LEAVE":
                return <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
            default:
                return null;
        }
    };

    const stats = {
        present: attendanceRecords.filter(r => r.status === "PRESENT").length,
        absent: attendanceRecords.filter(r => r.status === "ABSENT").length,
        halfDay: attendanceRecords.filter(r => r.status === "HALF_DAY").length,
        leave: attendanceRecords.filter(r => r.status === "LEAVE").length,
    };

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Attendance</h1>
                    <p className="text-muted-foreground">
                        View attendance records for {selectedDate.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all })} disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Calendar */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Select Date</CardTitle>
                        <CardDescription>Choose a date to view attendance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            className="rounded-md border"
                        />
                    </CardContent>
                </Card>

                {/* Stats and Records */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.present}</p>
                                        <p className="text-xs text-muted-foreground">Present</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.absent}</p>
                                        <p className="text-xs text-muted-foreground">Absent</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <MinusCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.halfDay}</p>
                                        <p className="text-xs text-muted-foreground">Half Day</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.leave}</p>
                                        <p className="text-xs text-muted-foreground">Leave</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attendance Records */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Records</CardTitle>
                            <CardDescription>
                                {attendanceRecords.length} record(s) for selected date
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {attendanceRecords.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No attendance records for this date</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {attendanceRecords.map((record) => (
                                        <div
                                            key={record.id}
                                            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(record.status)}
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="text-xs">
                                                        {record.employee.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{record.employee.fullName}</p>
                                                    <p className="text-xs text-muted-foreground">{record.employee.employeeCode}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {record.checkIn && record.checkOut && (
                                                    <div className="text-right hidden md:block">
                                                        <p className="text-xs text-muted-foreground">Working Hours</p>
                                                        <p className="font-semibold flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {record.workingHours?.toFixed(1) || "0.0"} hrs
                                                        </p>
                                                    </div>
                                                )}
                                                {getStatusBadge(record.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
