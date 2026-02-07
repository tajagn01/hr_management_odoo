import { z } from "zod";

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "employee"]).optional(),
});

// Employee validation schemas
export const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  salary: z.number().positive("Salary must be positive"),
  hireDate: z.string().or(z.date()),
});

// Attendance validation schemas
export const attendanceSchema = z.object({
  employeeId: z.string().or(z.number()),
  date: z.string().or(z.date()),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.enum(["Present", "Absent", "Half Day", "Leave"]),
});

// Leave request validation schemas
export const leaveRequestSchema = z.object({
  employeeId: z.string().or(z.number()),
  type: z.enum(["Sick Leave", "Vacation", "Personal", "Emergency"]),
  from: z.string().or(z.date()),
  to: z.string().or(z.date()),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  status: z.enum(["Pending", "Approved", "Rejected"]).optional(),
});

// Payroll validation schemas
export const payrollSchema = z.object({
  employeeId: z.string().or(z.number()),
  month: z.string(),
  basicSalary: z.number().positive(),
  allowances: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
  netSalary: z.number().positive(),
  status: z.enum(["Pending", "Paid", "Failed"]).optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type PayrollInput = z.infer<typeof payrollSchema>;
