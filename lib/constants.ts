/**
 * Constants for HR Management System
 * Centralized configuration values to avoid magic numbers
 */

// Leave Request Limits
export const MAX_LEAVE_DAYS = 30;
export const MIN_LEAVE_DAYS = 1;

// Working Hours Limits
export const MIN_WORKING_HOURS = 0;
export const MAX_WORKING_HOURS = 24;

// IST Timezone
export const IST_OFFSET_HOURS = 5.5;
export const IST_OFFSET_MS = IST_OFFSET_HOURS * 60 * 60 * 1000;

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// Session
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// Attendance Status
export const ATTENDANCE_STATUS = {
    PRESENT: "PRESENT",
    ABSENT: "ABSENT",
    HALF_DAY: "HALF_DAY",
    LEAVE: "LEAVE",
} as const;

// Leave Types
export const LEAVE_TYPES = {
    PAID: "PAID",
    SICK: "SICK",
    UNPAID: "UNPAID",
} as const;

// Leave Status
export const LEAVE_STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
} as const;

// User Roles
export const USER_ROLES = {
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    EMPLOYEE: "EMPLOYEE",
} as const;
