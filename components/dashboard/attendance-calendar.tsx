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

    // Debug: Log the attendance data to understand the structure
    console.log('📅 AttendanceCalendar received data:', attendanceData);

    // Simple date matching - just compare date strings
    const getDayStatus = (day: Date): string | undefined => {
        const dayStr = day.toISOString().split('T')[0]; // "2026-01-23"
        const record = attendanceData.find(a => {
            // More flexible date matching
            const recordDateStr = new Date(a.date).toISOString().split('T')[0];
            return recordDateStr === dayStr;
        });
        console.log(`Day ${dayStr}: Found record:`, record);
        return record?.status;
    };

    return (
        <Card className="h-full backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-white/20">
            <CardHeader>
                <CardTitle className="text-center">Monthly Attendance</CardTitle>
                <p className="text-xs text-muted-foreground text-center">
                    Data: {attendanceData.length} records
                    {attendanceData.length > 0 && (
                        <span className="block mt-1">
                            Sample: {attendanceData[0]?.date} → {attendanceData[0]?.status}
                        </span>
                    )}
                </p>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{
                        present: (day) => {
                            const status = getDayStatus(day);
                            return status === "PRESENT" || status === "present";
                        },
                        absent: (day) => {
                            const status = getDayStatus(day);
                            return status === "ABSENT" || status === "absent" || status === "LEAVE" || status === "leave";
                        },
                        late: (day) => {
                            const status = getDayStatus(day);
                            return status === "LATE" || status === "late";
                        },
                        halfDay: (day) => {
                            const status = getDayStatus(day);
                            return status === "HALF_DAY" || status === "half-day";
                        }
                    }}
                    modifiersClassNames={{
                        present: "!bg-green-500/30 !text-green-700 dark:!text-green-300 font-bold backdrop-blur-sm border border-green-500/50",
                        absent: "!bg-red-500/30 !text-red-700 dark:!text-red-300 font-bold backdrop-blur-sm border border-red-500/50",
                        late: "!bg-orange-500/30 !text-orange-700 dark:!text-orange-300 font-bold backdrop-blur-sm border border-orange-500/50",
                        halfDay: "!bg-yellow-500/30 !text-yellow-700 dark:!text-yellow-300 font-bold backdrop-blur-sm border border-yellow-500/50"
                    }}
                    className="rounded-md border mx-auto"
                />
                <div className="mt-4 flex gap-2 justify-center text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-green-500/60 border border-green-500" />
                        <span>Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded bg-orange-500/60 border border-orange-500" />
                        <span>Late</span>
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
