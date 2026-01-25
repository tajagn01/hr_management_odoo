"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, MinusCircle, Calendar, Clock } from "lucide-react";

interface YearlyAttendanceProps {
    data: {
        year: number;
        totalWorkingDays: number;
        presentDays: number;
        absentDays: number;
        halfDays: number;
        leaveDays: number;
        totalWorkingHours: number;
        avgAttendancePercent: number;
        employee?: {
            fullName: string;
            employeeCode: string;
        };
    };
    showEmployeeInfo?: boolean;
}

export function YearlyAttendanceCard({ data, showEmployeeInfo = false }: YearlyAttendanceProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-semibold">
                            {showEmployeeInfo ? data.employee?.fullName : `Year ${data.year}`}
                        </CardTitle>
                        <CardDescription>
                            {showEmployeeInfo ? `Yearly Summary ${data.year}` : "Annual Attendance Overview"}
                        </CardDescription>
                    </div>
                    <Badge variant={data.avgAttendancePercent >= 90 ? "default" : data.avgAttendancePercent >= 75 ? "secondary" : "destructive"}>
                        {data.avgAttendancePercent}% Avg
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Average Attendance</span>
                            <span className="font-medium">{data.avgAttendancePercent}%</span>
                        </div>
                        <Progress value={data.avgAttendancePercent} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        <div className="flex flex-col items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mb-1" />
                            <span className="text-xl font-bold">{data.presentDays}</span>
                            <span className="text-xs text-muted-foreground">Present</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <XCircle className="h-5 w-5 text-red-500 mb-1" />
                            <span className="text-xl font-bold">{data.absentDays}</span>
                            <span className="text-xs text-muted-foreground">Absent</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <MinusCircle className="h-5 w-5 text-amber-500 mb-1" />
                            <span className="text-xl font-bold">{data.halfDays}</span>
                            <span className="text-xs text-muted-foreground">Half Days</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Calendar className="h-5 w-5 text-blue-500 mb-1" />
                            <span className="text-xl font-bold">{data.leaveDays}</span>
                            <span className="text-xs text-muted-foreground">Leaves</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Total Days: {data.totalWorkingDays}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Total Hours: {data.totalWorkingHours}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
