"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Users,
  UserCheck,
  UserX,
  Calendar,
  Search,
  RefreshCw,
  Download,
  AlertCircle,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AttendanceData {
  id: string;
  name: string;
  email: string;
  department: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  workHours: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "present":
    case "half-day":
      return <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>;
    case "absent":
      return <Badge variant="destructive">Absent</Badge>;
    case "late":
      return <Badge className="bg-amber-500 hover:bg-amber-600">Late</Badge>;
    case "leave":
    case "on-leave":
      return <Badge className="bg-blue-500 hover:bg-blue-600">On Leave</Badge>;
    case "holiday":
      return <Badge className="bg-purple-500 hover:bg-purple-600">Holiday</Badge>;
    default:
      return <Badge variant="secondary">-</Badge>;
  }
};

export default function AdminAttendancePage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    fetchAttendanceData();
    return () => clearInterval(timer);
  }, []);

  const fetchAttendanceData = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      // Get all employees first
      const employeesRes = await fetch("/api/employees");
      const employeesData = await employeesRes.json();
      const employees = employeesData.employees || [];

      // Get today's attendance for all employees
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const attendanceRes = await fetch(
        `/api/attendance?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`
      );
      const attendanceData = await attendanceRes.json();
      const todayRecords = attendanceData.attendanceRecords || [];

      // Create a map of employee attendance
      const attendanceMap = new Map();
      todayRecords.forEach((record: any) => {
        attendanceMap.set(record.employeeId, record);
      });

      // NEW: Fetch calculated bulk status to handle absent/leave/holiday correctly
      const employeeIds = employees.map((e: any) => e.id);
      const params = new URLSearchParams();
      params.append('startDate', today.toISOString());
      params.append('endDate', today.toISOString());
      employeeIds.forEach((id: string) => params.append('employeeIds[]', id));

      const statusRes = await fetch(`/api/attendance/status/bulk?${params.toString()}`);
      const statusData = await statusRes.json();
      const statusMap = new Map();
      if (statusData.results) {
        statusData.results.forEach((s: any) => {
          // keyed by employeeId since we only requested one day
          statusMap.set(s.employeeId, s.status);
        });
      }

      // Combine employee data with attendance records + calculated status
      const combinedData = employees.map((emp: any) => {
        const record = attendanceMap.get(emp.id);
        const calculatedStatus = statusMap.get(emp.id);

        const checkIn = record?.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : null;
        const checkOut = record?.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : null;

        let workHours = "-";
        if (checkIn && checkOut) {
          const checkInTime = new Date(record.checkIn);
          const checkOutTime = new Date(record.checkOut);
          const diff = checkOutTime.getTime() - checkInTime.getTime();
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          workHours = `${h}h ${m}m`;
        } else if (checkIn) {
          workHours = "Working...";
        }

        // Priority: Calculated Status > Record Status > Absent
        // This ensures "Available/Holiday" logic is respected even if no record exists
        let status = "absent";

        if (calculatedStatus) {
          status = calculatedStatus.toLowerCase().replace('_', '-');
        } else if (record) {
          status = record.status?.toLowerCase().replace('_', '-') || "absent";
        }

        return {
          id: emp.id,
          name: emp.fullName,
          email: emp.user?.email || "",
          department: emp.department,
          checkIn,
          checkOut,
          status,
          workHours,
        };
      });

      setAttendanceData(combinedData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  // Calculate stats
  const totalEmployees = attendanceData.length;
  const presentCount = attendanceData.filter(e => e.status === "present" || e.status === "late").length;
  const absentCount = attendanceData.filter(e => e.status === "absent").length;
  const leaveCount = attendanceData.filter(e => e.status === "leave").length;
  const lateCount = attendanceData.filter(e => e.status === "late").length;
  const attendanceRate = ((presentCount / totalEmployees) * 100).toFixed(1);

  // Filter data
  const filteredData = attendanceData.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [...new Set(attendanceData.map(e => e.department))];

  const handleRefresh = () => {
    fetchAttendanceData();
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ["Employee Name", "Email", "Department", "Date", "Check In", "Check Out", "Work Hours", "Status"];
    const todayStr = new Date().toLocaleDateString('en-US');

    const rows = filteredData.map(emp => [
      emp.name,
      emp.email,
      emp.department,
      todayStr,
      emp.checkIn || "-",
      emp.checkOut || "-",
      emp.workHours,
      emp.status
    ]);

    // Create CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">Monitor and manage employee attendance in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          {mounted && currentTime && (
            <Badge variant="outline" className="hidden md:flex font-mono text-lg px-4 py-2">
              <Clock className="h-4 w-4 mr-2 animate-pulse" />
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </Badge>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Mobile Actions Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{presentCount}</div>
            <p className="text-xs text-muted-foreground">{attendanceRate}% attendance rate</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{absentCount}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{leaveCount}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Late Arrivals</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{lateCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Attendance</CardTitle>
          <CardDescription suppressHydrationWarning>
            {mounted && currentTime && currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Card View - Premium Redesign */}
          <div className="md:hidden space-y-4">
            {filteredData.map((employee) => (
              <div key={employee.id} className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border/50">
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                          {employee.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{employee.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 h-4 font-normal text-muted-foreground border-border">
                            {employee.department}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(employee.status)}
                  </div>

                  {/* Timeline / Times Grid */}
                  <div className="bg-muted/30 rounded-lg p-3 grid grid-cols-2 gap-4 relative overflow-hidden">
                    {/* Visual Connector Line (Optional decoration) */}
                    <div className="absolute left-1/2 top-3 bottom-3 w-px bg-border/50 hidden"></div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        Check In
                      </div>
                      <div className="font-mono text-lg font-medium tracking-tight">
                        {employee.checkIn || <span className="text-muted-foreground/40">--:--</span>}
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Check Out
                        <div className={`h-1.5 w-1.5 rounded-full ${employee.checkOut ? "bg-red-500" : "bg-gray-300"}`}></div>
                      </div>
                      <div className="font-mono text-lg font-medium tracking-tight">
                        {employee.checkOut || (employee.checkIn ? <span className="text-amber-600 dark:text-amber-500 text-sm font-sans animate-pulse">Working</span> : <span className="text-muted-foreground/40">--:--</span>)}
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed">
                    <div className="text-xs text-muted-foreground">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Hours</span>
                      <Badge variant="secondary" className={`font-mono ${employee.workHours === "Working..." ? "bg-amber-100 text-amber-700 animate-pulse" : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"}`}>
                        {employee.workHours}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredData.length === 0 && (
              <div className="text-center py-10 px-4 border-2 border-dashed rounded-xl bg-muted/20">
                <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">No active records found</p>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="hidden md:block rounded-lg border">
            <div className="overflow-x-auto w-full max-w-[calc(100vw-3rem)] md:max-w-full">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Employee</th>
                    <th className="text-left p-4 font-medium">Department</th>
                    <th className="text-left p-4 font-medium">Check In</th>
                    <th className="text-left p-4 font-medium">Check Out</th>
                    <th className="text-left p-4 font-medium">Work Hours</th>
                    <th className="text-left p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {employee.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{employee.department}</Badge>
                      </td>
                      <td className="p-4">
                        <span className={employee.checkIn ? "text-green-600 font-medium" : "text-muted-foreground"}>
                          {employee.checkIn || "-"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={employee.checkOut ? "text-red-600 font-medium" : "text-muted-foreground"}>
                          {employee.checkOut || (employee.checkIn ? "Working" : "-")}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={employee.workHours === "Working..." ? "text-green-600 font-medium animate-pulse" : ""}>
                          {employee.workHours}
                        </span>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(employee.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No employees found matching your filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
