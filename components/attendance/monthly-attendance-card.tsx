"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, MinusCircle, Calendar } from "lucide-react";

interface MonthlyAttendanceProps {
    data: {
        year: number;
        month: number;
        presentDays: number;
        absentDays: number;
        halfDays: number;
        leaveDays: number;
        totalWorkingDays: number;
        totalWorkingHours: number;
        attendancePercent: number;
        employee?: {
            fullName: string;
            employeeCode: string;
        };
    };
    showEmployeeInfo?: boolean;
}

export function MonthlyAttendanceCard({ data, showEmployeeInfo = false }: MonthlyAttendanceProps) {
    const monthName = new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long' });

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-semibold">
                            {showEmployeeInfo ? data.employee?.fullName : `${monthName} ${data.year}`}
                        </CardTitle>
                        <CardDescription>
                            {showEmployeeInfo ? `${monthName} ${data.year}` : "Monthly Attendance Summary"}
                        </CardDescription>
                    </div>
                    <Badge variant={data.attendancePercent >= 90 ? "default" : data.attendancePercent >= 75 ? "secondary" : "destructive"}>
                        {data.attendancePercent}%
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Attendance Rate</span>
                            <span className="font-medium">{data.attendancePercent}%</span>
                        </div>
                        <Progress value={data.attendancePercent} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Present</span>
                                <span className="font-bold">{data.presentDays}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Absent</span>
                                <span className="font-bold">{data.absentDays}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <MinusCircle className="h-4 w-4 text-amber-500" />
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Half Day</span>
                                <span className="font-bold">{data.halfDays}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Leave</span>
                                <span className="font-bold">{data.leaveDays}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
                        <span>Total Working Days: {data.totalWorkingDays}</span>
                        <span>Total Hours: {data.totalWorkingHours}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
