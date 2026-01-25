/**
 * Real-Time Event Emitter Service
 * Centralized event emission for HRMS real-time updates
 */

// Safe import - socket-server may not be available in all environments
let emitToAdmins: (event: string, data: any) => void = () => { };
let emitToEmployee: (employeeId: string, event: string, data: any) => void = () => { };
let broadcast: (event: string, data: any) => void = () => { };

// Only import socket-server in Node.js environment
if (typeof window === 'undefined') {
  try {
    const socketServer = require("./socket-server");
    emitToAdmins = socketServer.emitToAdmins || emitToAdmins;
    emitToEmployee = socketServer.emitToEmployee || emitToEmployee;
    broadcast = socketServer.broadcast || broadcast;
  } catch (e) {
    // Socket server not available, use no-op functions
    console.log("Socket.IO not available, real-time features disabled");
  }
}

export interface AttendanceCheckInEvent {
  employeeId: string;
  employeeName: string;
  checkInTime: string;
  status: "PRESENT" | "HALF_DAY";
  timestamp: string;
}

export interface AttendanceCheckOutEvent {
  employeeId: string;
  employeeName: string;
  checkOutTime: string;
  workingHours: number;
  timestamp: string;
}

export interface DashboardStatsEvent {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  monthlyPayroll: number;
  timestamp: string;
}

export interface LeaveRequestEvent {
  leaveRequestId: string;
  employeeId: string;
  employeeName: string;
  type: string;
  days: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  timestamp: string;
}

export interface NotificationEvent {
  type: "success" | "info" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
}

/**
 * Emit attendance check-in event
 */
export function emitAttendanceCheckIn(data: AttendanceCheckInEvent) {
  // Notify admins
  emitToAdmins("attendance:checkin", data);

  // Notify the employee
  emitToEmployee(data.employeeId, "attendance:checkin", data);

  // Update dashboard stats
  emitToAdmins("stats:update", {
    type: "attendance",
    presentToday: "+1",
    timestamp: data.timestamp,
  });
}

/**
 * Emit attendance check-out event
 */
export function emitAttendanceCheckOut(data: AttendanceCheckOutEvent) {
  // Notify admins
  emitToAdmins("attendance:checkout", data);

  // Notify the employee
  emitToEmployee(data.employeeId, "attendance:checkout", data);
}

/**
 * Emit dashboard stats update
 */
export function emitDashboardStats(data: DashboardStatsEvent) {
  emitToAdmins("stats:dashboard", data);
}

/**
 * Emit leave request created
 */
export function emitLeaveRequestCreated(data: LeaveRequestEvent) {
  // Notify admins
  emitToAdmins("leave:created", data);

  // Notify the employee
  emitToEmployee(data.employeeId, "leave:created", data);

  // Update dashboard stats
  emitToAdmins("stats:update", {
    type: "leaves",
    pendingLeaves: "+1",
    timestamp: data.timestamp,
  });
}

/**
 * Emit leave request status change
 */
export function emitLeaveRequestStatusChange(data: LeaveRequestEvent) {
  // Notify admins
  emitToAdmins(`leave:${data.status.toLowerCase()}`, data);

  // Notify the employee
  emitToEmployee(data.employeeId, `leave:${data.status.toLowerCase()}`, data);

  // Update dashboard stats
  emitToAdmins("stats:update", {
    type: "leaves",
    pendingLeaves: data.status === "APPROVED" || data.status === "REJECTED" ? "-1" : "+1",
    timestamp: data.timestamp,
  });
}

/**
 * Emit admin notification
 */
export function emitAdminNotification(data: NotificationEvent) {
  emitToAdmins("notification:admin", data);
}

/**
 * Emit employee notification
 */
export function emitEmployeeNotification(employeeId: string, data: NotificationEvent) {
  emitToEmployee(employeeId, "notification:employee", data);
}

/**
 * Emit chart data refresh
 */
export function emitChartRefresh(chartType: "attendance" | "department" | "payroll") {
  emitToAdmins("chart:refresh", {
    chartType,
    timestamp: new Date().toISOString(),
  });
}

