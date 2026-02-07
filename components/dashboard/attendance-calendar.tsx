"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type AttendanceRecord = {
    date: string;
    status: string;
};

interface AttendanceCalendarProps {
    attendanceData: AttendanceRecord[];
    onMonthChange?: (year: number, month: number) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Build a lookup map: "YYYY-MM-DD" → status (lowercase)
function buildStatusMap(data: AttendanceRecord[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const record of data) {
        const dateStr = record.date.split("T")[0]; // "2026-02-01"
        map.set(dateStr, record.status.toLowerCase().replace("_", "-"));
    }
    return map;
}

// Get all calendar days for a given month (including padding from prev/next months)
function getCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        days.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
        days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month padding to fill 6 rows (42 cells)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
}

// Format date as "YYYY-MM-DD"
function formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    present: {
        bg: "bg-green-100 dark:bg-green-900/40",
        text: "text-green-800 dark:text-green-200",
        border: "ring-1 ring-green-400/50",
        dot: "bg-green-500",
        label: "Present",
    },
    late: {
        bg: "bg-orange-100 dark:bg-orange-900/40",
        text: "text-orange-800 dark:text-orange-200",
        border: "ring-1 ring-orange-400/50",
        dot: "bg-orange-500",
        label: "Late",
    },
    absent: {
        bg: "bg-red-100 dark:bg-red-900/40",
        text: "text-red-800 dark:text-red-200",
        border: "ring-1 ring-red-400/50",
        dot: "bg-red-500",
        label: "Absent",
    },
    leave: {
        bg: "bg-blue-100 dark:bg-blue-900/40",
        text: "text-blue-800 dark:text-blue-200",
        border: "ring-1 ring-blue-400/50",
        dot: "bg-blue-500",
        label: "Leave",
    },
    "half-day": {
        bg: "bg-yellow-100 dark:bg-yellow-900/40",
        text: "text-yellow-800 dark:text-yellow-200",
        border: "ring-1 ring-yellow-400/50",
        dot: "bg-yellow-500",
        label: "Half Day",
    },
};

export function AttendanceCalendar({ attendanceData, onMonthChange }: AttendanceCalendarProps) {
    const today = new Date();
    const [viewYear, setViewYear] = React.useState(today.getFullYear());
    const [viewMonth, setViewMonth] = React.useState(today.getMonth());

    // Build lookup map from attendance data
    const statusMap = React.useMemo(() => buildStatusMap(attendanceData), [attendanceData]);

    // Single debug log
    React.useEffect(() => {
        console.log("📅 Calendar:", { records: attendanceData.length, mapped: statusMap.size, sample: [...statusMap.entries()].slice(0, 5) });
    }, [attendanceData, statusMap]);

    const calendarDays = React.useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

    const prevMonth = () => {
        const newMonth = viewMonth === 0 ? 11 : viewMonth - 1;
        const newYear = viewMonth === 0 ? viewYear - 1 : viewYear;
        setViewMonth(newMonth);
        setViewYear(newYear);
        onMonthChange?.(newYear, newMonth + 1); // +1 for 1-based month
    };
    const nextMonth = () => {
        const newMonth = viewMonth === 11 ? 0 : viewMonth + 1;
        const newYear = viewMonth === 11 ? viewYear + 1 : viewYear;
        setViewMonth(newMonth);
        setViewYear(newYear);
        onMonthChange?.(newYear, newMonth + 1); // +1 for 1-based month
    };

    const todayKey = formatDateKey(today);

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-base font-semibold">
                        {MONTH_NAMES[viewMonth]} {viewYear}
                    </CardTitle>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-1">
                    {WEEKDAYS.map((wd) => (
                        <div key={wd} className="text-center text-xs font-medium text-muted-foreground py-1.5">
                            {wd}
                        </div>
                    ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((dayObj, idx) => {
                        const key = formatDateKey(dayObj.date);
                        const status = statusMap.get(key);
                        const style = status ? STATUS_STYLES[status] : null;
                        const isToday = key === todayKey;
                        const isWeekend = dayObj.date.getDay() === 0 || dayObj.date.getDay() === 6;

                        return (
                            <div
                                key={idx}
                                title={status ? `${status.charAt(0).toUpperCase() + status.slice(1)}` : undefined}
                                className={cn(
                                    "relative flex flex-col items-center justify-center rounded-md aspect-square text-sm transition-colors cursor-default",
                                    // Faded if not current month
                                    !dayObj.isCurrentMonth && "opacity-25",
                                    // Default state
                                    dayObj.isCurrentMonth && !style && !isToday && "hover:bg-muted/60",
                                    // Weekend dimmed
                                    dayObj.isCurrentMonth && isWeekend && !style && "text-muted-foreground/70",
                                    // Today highlight
                                    isToday && !style && "bg-accent ring-1 ring-accent-foreground/20 font-bold",
                                    isToday && style && "font-bold ring-2",
                                    // Attendance status colors
                                    style?.bg,
                                    style?.text,
                                    style?.border,
                                )}
                            >
                                <span className="leading-none">{dayObj.date.getDate()}</span>
                                {/* Small dot under the number */}
                                {style && dayObj.isCurrentMonth && (
                                    <span className={cn("absolute bottom-0.5 h-1.5 w-1.5 rounded-full", style.dot)} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-4 pt-3 border-t flex flex-wrap gap-x-4 gap-y-1.5 justify-center text-xs">
                    {Object.entries(STATUS_STYLES).map(([name, s]) => (
                        <div key={name} className="flex items-center gap-1.5">
                            <span className={cn("h-2.5 w-2.5 rounded-sm", s.bg, s.border)} />
                            <span className="text-muted-foreground">{s.label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
