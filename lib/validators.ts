import { z } from "zod";

/**
 * Zod Validation Schemas for API Requests
 * Provides type-safe input validation for all API endpoints
 */

// ============================================
// LEAVE REQUEST SCHEMAS
// ============================================

export const leaveRequestCreateSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID format"),
  type: z.enum(["PAID", "SICK", "UNPAID"]),
  startDate: z.string().datetime("Invalid start date format"),
  endDate: z.string().datetime("Invalid end date format"),
  reason: z.string().max(500, "Reason must be less than 500 characters").optional(),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: "End date must be on or after start date", path: ["endDate"] }
);

export const leaveRequestUpdateSchema = z.object({
  id: z.string().uuid("Invalid leave request ID"),
  status: z.enum(["APPROVED", "REJECTED"]),
  adminComment: z.string().max(500).optional(),
});

// ============================================
// ATTENDANCE SCHEMAS
// ============================================

export const attendanceActionSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID format"),
  type: z.enum(["checkIn", "checkOut"]),
});

// ============================================
// PAYROLL SCHEMAS
// ============================================

export const payrollCreateSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID format"),
  basicSalary: z.number().positive("Basic salary must be positive"),
  hra: z.number().nonnegative("HRA cannot be negative").optional().default(0),
  allowances: z.number().nonnegative("Allowances cannot be negative").optional().default(0),
  deductions: z.number().nonnegative("Deductions cannot be negative").optional().default(0),
});

export const payrollUpdateSchema = z.object({
  id: z.string().uuid("Invalid payroll ID"),
  basicSalary: z.number().min(0, "Basic salary must be positive").optional(),
  hra: z.number().min(0, "HRA must be positive").optional(),
  allowances: z.number().min(0, "Allowances must be positive").optional(),
  deductions: z.number().min(0, "Deductions must be positive").optional(),
});

// Employee validation schemas
export const employeeCreateSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional(),
  address: z.string().max(500).optional(),
  designation: z.string().min(2, "Designation is required"),
  department: z.string().min(2, "Department is required"),
  joiningDate: z.string().datetime("Invalid joining date format"),
  dateOfBirth: z.string().datetime("Invalid date of birth format").optional(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).default("EMPLOYEE"),
  managerId: z.string().uuid("Invalid manager ID").optional(),
});

export const employeeUpdateSchema = z.object({
  id: z.string().uuid("Invalid employee ID"),
  fullName: z.string().min(2).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  address: z.string().max(500).optional(),
  designation: z.string().min(2).optional(),
  department: z.string().min(2).optional(),
  dateOfBirth: z.string().datetime().optional(),
  managerId: z.string().uuid().optional().nullable(),
  profileCompleted: z.boolean().optional(),
});

// ============================================
// NOTIFICATION SCHEMAS
// ============================================

export const notificationUpdateSchema = z.object({
  id: z.string().uuid("Invalid notification ID"),
  read: z.boolean(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates request body against a Zod schema
 * Returns parsed data or throws validation error
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validates request body
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Formats Zod errors for API responses
 */
export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((err) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });
}

// ============================================
// AUTH SCHEMAS
// ============================================

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
