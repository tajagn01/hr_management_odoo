-- Add indexes for frequently queried fields

-- Employee indexes
CREATE INDEX IF NOT EXISTS idx_employee_department ON "Employee"("department");
CREATE INDEX IF NOT EXISTS idx_employee_designation ON "Employee"("designation");
CREATE INDEX IF NOT EXISTS idx_employee_joining_date ON "Employee"("joiningDate");
CREATE INDEX IF NOT EXISTS idx_employee_manager_id ON "Employee"("managerId");

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON "Attendance"("employeeId", "date");
CREATE INDEX IF NOT EXISTS idx_attendance_date ON "Attendance"("date");
CREATE INDEX IF NOT EXISTS idx_attendance_status ON "Attendance"("status");

-- Leave indexes
CREATE INDEX IF NOT EXISTS idx_leave_employee_id ON "LeaveRequest"("employeeId");
CREATE INDEX IF NOT EXISTS idx_leave_status ON "LeaveRequest"("status");
CREATE INDEX IF NOT EXISTS idx_leave_dates ON "LeaveRequest"("startDate", "endDate");

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON "Payroll"("employeeId");

-- Monthly Attendance indexes
CREATE INDEX IF NOT EXISTS idx_monthly_employee_month ON "MonthlyAttendance"("employeeId", "month", "year");

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"("email");
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"("role");
CREATE INDEX IF NOT EXISTS idx_user_reset_token ON "User"("resetToken") WHERE "resetToken" IS NOT NULL;

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS idx_notification_read ON "Notification"("read");
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON "Notification"("createdAt");
