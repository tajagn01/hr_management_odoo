"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AttendanceRecord = {
    date: string;
    status: string;
};

interface AttendanceCalendarProps {
    attendanceData: AttendanceRecord[];
}

export function AttendanceCalendar({ attendanceData }: AttendanceCalendarProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

    // Simple date matching - just compare date strings
    const getDayStatus = (day: Date): string | undefined => {
        const dayStr = day.toISOString().split('T')[0]; // "2026-01-23"
        const record = attendanceData.find(a => a.date.startsWith(dayStr));
        return record?.status;
    };

    return (
        <Card className="h-full backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-white/20">
            <CardHeader>
                <CardTitle className="text-center">Monthly Attendance</CardTitle>
                <p className="text-xs text-muted-foreground text-center">Data: {attendanceData.length} records</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{
                        present: (day) => getDayStatus(day) === "PRESENT",
                        absent: (day) => getDayStatus(day) === "ABSENT" || getDayStatus(day) === "LEAVE",
                        halfDay: (day) => getDayStatus(day) === "HALF_DAY"
                    }}
                    modifiersClassNames={{
                        present: "!bg-green-500/30 !text-green-700 dark:!text-green-300 font-bold backdrop-blur-sm border border-green-500/50",
                        absent: "!bg-red-500/30 !text-red-700 dark:!text-red-300 font-bold backdrop-blur-sm border border-red-500/50",
                        halfDay: "!bg-yellow-500/30 !text-yellow-700 dark:!text-yellow-300 font-bold backdrop-blur-sm border border-yellow-500/50"
                    }}
                    className="rounded-md border mx-auto"
                />
                <div className="mt-4 flex gap-4 justify-center text-sm">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-green-500/60 border border-green-500" />
                        <span>Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-red-500/60 border border-red-500" />
                        <span>Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-yellow-500/60 border border-yellow-500" />
                        <span>Half Day</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
