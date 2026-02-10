/**
 * Centralized React Query Hooks
 * 
 * All data fetching flows through here for:
 * - Automatic caching & deduplication
 * - Background refetching
 * - Shared cache across pages (instant navigation)
 * - Optimistic updates
 * - Consistent error handling
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { useSession } from "next-auth/react";

// ── Fetch helpers ────────────────────────────────────────
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Fetch failed: ${res.status}`);
  }
  return res.json();
}

// ── IST Date Helpers ─────────────────────────────────────
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getISTToday(): { today: Date; tomorrow: Date; dateKey: string } {
  const now = new Date();

  // Create a date that represents "Now in IST" but as a UTC object 
  // (so getUTCHours() returns IST hours)
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);

  // Extract year, month, day from the IST-shifted date
  const today = new Date(Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate(),
    0, 0, 0, 0
  ));

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);

  const dateKey = today.toISOString();
  return { today, tomorrow, dateKey };
}

function formatTimeIST(isoString: string): string {
  // Add offset to convert UTC ISO string to IST time object
  return new Date(new Date(isoString).getTime() + IST_OFFSET_MS).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC'
  });
}

// ══════════════════════════════════════════════════════════
// EMPLOYEE HOOKS
// ══════════════════════════════════════════════════════════

/** Full employee list (admin/manager views) */
export function useEmployees(options?: { includePayroll?: boolean; enabled?: boolean }) {
  const includePayroll = options?.includePayroll ?? false;
  const url = includePayroll ? "/api/employees?includePayroll=true" : "/api/employees";
  const key = includePayroll ? queryKeys.employees.withPayroll() : queryKeys.employees.list();

  return useQuery({
    queryKey: key,
    queryFn: () => fetchJSON<any>(url),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    enabled: options?.enabled ?? true,
  });
}

/** Single employee by email (profile pages) */
export function useEmployeeByEmail(email: string | undefined | null) {
  return useQuery({
    queryKey: queryKeys.employees.byEmail(email ?? ""),
    queryFn: () => fetchJSON<any>(`/api/employees?email=${encodeURIComponent(email!)}`),
    enabled: !!email,
    staleTime: 5 * 60 * 1000, // 5 min — profile data changes rarely
  });
}

/** Employee overview (BFF endpoint for employee dashboard) */
export function useEmployeeOverview(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.employees.overview(employeeId ?? ""),
    queryFn: () => fetchJSON<any>(`/api/employees/${employeeId}/overview`),
    enabled: !!employeeId,
    staleTime: 60_000, // 1 min — dashboard data should be reasonably fresh
  });
}

// ══════════════════════════════════════════════════════════
// ATTENDANCE HOOKS
// ══════════════════════════════════════════════════════════

/** Today's attendance records (for admin/manager dashboards) */
export function useTodayAttendance() {
  const { today, tomorrow, dateKey } = getISTToday();
  return useQuery({
    queryKey: queryKeys.attendance.dashboard(dateKey),
    queryFn: () => fetchJSON<any>(
      `/api/attendance?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`
    ),
    staleTime: 60_000, // 1 min
  });
}

/** Attendance by date range (manager attendance page) */
export function useAttendanceByDateRange(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.attendance.byDateRange(startDate, endDate),
    queryFn: () => fetchJSON<any>(
      `/api/attendance?startDate=${startDate}&endDate=${endDate}`
    ),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

/** Employee-specific attendance for a date range */
export function useEmployeeAttendance(employeeId: string | null, startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.attendance.byEmployee(employeeId ?? "", startDate, endDate),
    queryFn: () => fetchJSON<any>(
      `/api/attendance?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`
    ),
    enabled: !!employeeId,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

/** Calendar month attendance - for attendance calendars */
export function useCalendarMonth(employeeId: string | null, year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return useQuery({
    queryKey: queryKeys.attendance.calendarMonth(employeeId ?? "", year, month),
    queryFn: async () => {
      const data = await fetchJSON<any>(
        `/api/attendance?employeeId=${employeeId}&startDate=${firstDay.toISOString()}&endDate=${lastDay.toISOString()}`
      );
      return (data.attendanceRecords || []).map((record: any) => ({
        date: record.date,
        status: record.status?.toLowerCase().replace('_', '-') || 'not-marked',
        checkIn: record.checkIn,
        checkOut: record.checkOut,
      }));
    },
    enabled: !!employeeId,
    staleTime: 5 * 60_000, // 5 min — historical data doesn't change often
    placeholderData: keepPreviousData,
  });
}

/** Monthly attendance (manager chart) */
export function useMonthlyAttendance(year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.attendance.monthly(year, month),
    queryFn: () => fetchJSON<any>(
      `/api/attendance/monthly?year=${year}&month=${month}`
    ),
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
  });
}

/** Yearly attendance (manager chart) */
export function useYearlyAttendance(year: number) {
  return useQuery({
    queryKey: queryKeys.attendance.yearly(year),
    queryFn: () => fetchJSON<any>(`/api/attendance/yearly?year=${year}`),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

/** Attendance status for a single employee */
export function useAttendanceStatus(employeeId: string | undefined, date: string) {
  return useQuery({
    queryKey: queryKeys.attendance.status(employeeId ?? "", date),
    queryFn: () => fetchJSON<any>(
      `/api/attendance/status?employeeId=${employeeId}&date=${date}`
    ),
    enabled: !!employeeId,
    staleTime: 60_000,
  });
}

/** Bulk attendance status (admin attendance page) */
export function useAttendanceStatusBulk(employeeIds: string[], date: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.attendance.statusBulk(date, employeeIds),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', date);
      params.append('endDate', date);
      employeeIds.forEach(id => params.append('employeeIds[]', id));
      return fetchJSON<any>(`/api/attendance/status/bulk?${params.toString()}`);
    },
    enabled: enabled && employeeIds.length > 0,
    staleTime: 60_000,
  });
}

/** Check in / Check out mutation */
export function useAttendanceCheckInOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { employeeId: string; type: "checkIn" | "checkOut" }) => {
      return fetchJSON<any>("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_data, variables) => {
      // Invalidate attendance-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    },
  });
}

// ══════════════════════════════════════════════════════════
// LEAVE HOOKS
// ══════════════════════════════════════════════════════════

/** All leave requests (admin view) */
export function useLeaveRequests(options?: { recentDays?: number; status?: string }) {
  const params = new URLSearchParams();
  if (options?.recentDays) params.append('recentDays', String(options.recentDays));
  if (options?.status) params.append('status', options.status);
  const qs = params.toString();
  const url = qs ? `/api/leave?${qs}` : '/api/leave';

  return useQuery({
    queryKey: options?.status === "PENDING"
      ? queryKeys.leave.pending()
      : options?.recentDays
        ? queryKeys.leave.recent(options.recentDays)
        : queryKeys.leave.list(),
    queryFn: () => fetchJSON<any>(url),
    staleTime: options?.recentDays ? 0 : Infinity, // Recent leaves should always refetch
    placeholderData: keepPreviousData,
  });
}

/** Employee-specific leave requests */
export function useEmployeeLeaves(employeeId: string | null) {
  return useQuery({
    queryKey: queryKeys.leave.byEmployee(employeeId ?? ""),
    queryFn: () => fetchJSON<any>(`/api/leave?employeeId=${employeeId}`),
    enabled: !!employeeId,
    staleTime: 30_000, // 30 sec
  });
}

/** Approve/Reject leave mutation */
export function useLeaveAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      status: "APPROVED" | "REJECTED";
      adminComment?: string | null;
    }) => {
      return fetchJSON<any>("/api/leave", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      // Invalidate all leave queries
      queryClient.invalidateQueries({ queryKey: queryKeys.leave.all });
    },
  });
}

/** Submit leave request mutation */
export function useSubmitLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      employeeId: string;
      type: string;
      startDate: string;
      endDate: string;
      reason: string;
    }) => {
      return fetchJSON<any>("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leave.all });
    },
  });
}

// ══════════════════════════════════════════════════════════
// PAYROLL HOOKS
// ══════════════════════════════════════════════════════════

/** Employee payroll data */
export function usePayroll(employeeId: string | null) {
  return useQuery({
    queryKey: queryKeys.payroll.byEmployee(employeeId ?? ""),
    queryFn: () => fetchJSON<any>(`/api/payroll?employeeId=${employeeId}`),
    enabled: !!employeeId,
    staleTime: 10 * 60_000, // 10 min — payroll rarely changes
  });
}

// ══════════════════════════════════════════════════════════
// PROFILE HOOKS
// ══════════════════════════════════════════════════════════

/** Update profile mutation */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; phone?: string; address?: string }) => {
      return fetchJSON<any>("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      // Invalidate all employee/profile queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}

// ══════════════════════════════════════════════════════════
// MANAGER HOOKS
// ══════════════════════════════════════════════════════════

/** List of managers */
export function useManagers() {
  return useQuery({
    queryKey: queryKeys.managers.list(),
    queryFn: () => fetchJSON<any>("/api/managers"),
    staleTime: 10 * 60_000, // 10 min
  });
}

// ══════════════════════════════════════════════════════════
// PENDING LEAVES COUNT (for sidebar badge)
// ══════════════════════════════════════════════════════════

export function usePendingLeavesCount() {
  return useQuery({
    queryKey: queryKeys.leave.pending(),
    queryFn: async () => {
      const data = await fetchJSON<any>("/api/leave?status=PENDING");
      return data.leaveRequests?.length ?? 0;
    },
    staleTime: 30_000, // 30 sec
  });
}

// ══════════════════════════════════════════════════════════
// COMPOSITE HOOKS (combine multiple queries)
// ══════════════════════════════════════════════════════════

/**
 * Admin Attendance Page - combines employees + today's attendance + bulk status
 * Returns fully combined data ready for rendering
 */
export function useAdminAttendanceData() {
  const { today, tomorrow, dateKey } = getISTToday();

  const employeesQuery = useEmployees();
  const attendanceQuery = useTodayAttendance();

  const employees = employeesQuery.data?.employees || [];
  const employeeIds = employees.map((e: any) => e.id);

  const statusQuery = useAttendanceStatusBulk(employeeIds, today.toISOString(), employees.length > 0);

  const isLoading = employeesQuery.isLoading || attendanceQuery.isLoading;
  const isRefreshing = employeesQuery.isFetching || attendanceQuery.isFetching || statusQuery.isFetching;

  const combinedData = (() => {
    if (!employees.length) return [];

    const todayRecords = attendanceQuery.data?.attendanceRecords || [];
    const attendanceMap = new Map<string, any>();
    todayRecords.forEach((record: any) => attendanceMap.set(record.employeeId, record));

    const statusMap = new Map<string, string>();
    if (statusQuery.data?.results) {
      statusQuery.data.results.forEach((s: any) => statusMap.set(s.employeeId, s.status));
    }

    return employees.map((emp: any) => {
      const record = attendanceMap.get(emp.id);
      const calculatedStatus = statusMap.get(emp.id);

      const checkIn = record?.checkIn ? formatTimeIST(record.checkIn) : null;
      const checkOut = record?.checkOut ? formatTimeIST(record.checkOut) : null;

      let workHours = "-";
      if (checkIn && checkOut) {
        const diff = new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime();
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        workHours = `${h}h ${m}m`;
      } else if (checkIn) {
        workHours = "Working...";
      }

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
        role: emp.user?.role || "EMPLOYEE",
      };
    });
  })();

  return {
    data: combinedData,
    isLoading,
    isRefreshing,
  };
}

/**
 * Hook to get employee ID from session email.
 * Returns the employee data and ID, shareable across pages.
 */
export function useCurrentEmployee() {
  const { data: session } = useSession();
  const email = session?.user?.email;

  const query = useEmployeeByEmail(email);

  return {
    employee: query.data?.employee ?? null,
    employeeId: query.data?.employee?.id ?? session?.user?.employeeId ?? null,
    isLoading: query.isLoading,
    email,
  };
}

// Re-export helpers for pages that need them
export { formatTimeIST, getISTToday, IST_OFFSET_MS };
