/**
 * Centralized Query Key Factory
 * 
 * All React Query cache keys in one place for:
 * - Type safety
 * - Easy invalidation
 * - Consistent naming
 * - Preventing key collisions
 */

export const queryKeys = {
  // ── Employees ──────────────────────────────────────────
  employees: {
    all: ['employees'] as const,
    list: () => [...queryKeys.employees.all, 'list'] as const,
    withPayroll: () => [...queryKeys.employees.all, 'with-payroll'] as const,
    byEmail: (email: string) => [...queryKeys.employees.all, 'by-email', email] as const,
    byId: (id: string) => [...queryKeys.employees.all, 'by-id', id] as const,
    overview: (id: string) => [...queryKeys.employees.all, 'overview', id] as const,
  },

  // ── Attendance ─────────────────────────────────────────
  attendance: {
    all: ['attendance'] as const,
    today: () => {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      return [...queryKeys.attendance.all, 'today', dateKey] as const;
    },
    dashboard: (dateISO: string) => [...queryKeys.attendance.all, 'dashboard', dateISO] as const,
    byEmployee: (employeeId: string, startDate: string, endDate: string) =>
      [...queryKeys.attendance.all, 'employee', employeeId, startDate, endDate] as const,
    calendarMonth: (employeeId: string, year: number, month: number) =>
      [...queryKeys.attendance.all, 'calendar', employeeId, year, month] as const,
    monthly: (year: number, month: number) =>
      [...queryKeys.attendance.all, 'monthly', year, month] as const,
    yearly: (year: number) =>
      [...queryKeys.attendance.all, 'yearly', year] as const,
    statusBulk: (date: string, employeeIds: string[]) =>
      [...queryKeys.attendance.all, 'status-bulk', date, ...employeeIds.slice(0, 5)] as const,
    status: (employeeId: string, date: string) =>
      [...queryKeys.attendance.all, 'status', employeeId, date] as const,
    byDateRange: (startDate: string, endDate: string) =>
      [...queryKeys.attendance.all, 'range', startDate, endDate] as const,
  },

  // ── Leave ──────────────────────────────────────────────
  leave: {
    all: ['leave-requests'] as const,
    list: () => [...queryKeys.leave.all, 'all'] as const,
    recent: (days?: number) => [...queryKeys.leave.all, 'recent', days ?? 2] as const,
    byEmployee: (employeeId: string) => [...queryKeys.leave.all, 'employee', employeeId] as const,
    pending: () => [...queryKeys.leave.all, 'pending'] as const,
  },

  // ── Payroll ────────────────────────────────────────────
  payroll: {
    all: ['payroll'] as const,
    byEmployee: (employeeId: string) => [...queryKeys.payroll.all, 'employee', employeeId] as const,
  },

  // ── Profile ────────────────────────────────────────────
  profile: {
    all: ['profile'] as const,
    byEmail: (email: string) => [...queryKeys.profile.all, 'email', email] as const,
  },

  // ── Notifications ──────────────────────────────────────
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
  },

  // ── Managers ───────────────────────────────────────────
  managers: {
    all: ['managers'] as const,
    list: () => [...queryKeys.managers.all, 'list'] as const,
  },

  // ── Users ──────────────────────────────────────────────
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
  },
} as const;
