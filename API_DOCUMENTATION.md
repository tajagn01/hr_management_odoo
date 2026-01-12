# HRMS API Documentation

## Authentication

### `POST /api/auth/register`
Register a new user.
- **Body**: `{ email, password, name }`
- **Response**: `{ user: { id, email, role } }`

### `POST /api/auth/login`
Handled via NextAuth.js.

---

## Attendance

### `GET /api/attendance`
Fetch attendance records with role-based access control.
- **Query Params**:
  - `employeeId` (optional): Filter by employee.
    - **Admin**: Can view any employee.
    - **Manager**: Can view team members and self.
    - **Employee**: Can view only self.
  - `startDate` (optional): ISO date string.
  - `endDate` (optional): ISO date string.
- **Response**: `{ attendanceRecords: [...] }`

### `POST /api/attendance`
Check-in or Check-out.
- **Body**: `{ employeeId, type: "checkIn" | "checkOut" }`
- **Behavior**:
  - `checkIn`: Creates a new attendance record for today.
  - `checkOut`: Updates today's record with checkout time and calculates `workingHours`. Triggers monthly aggregation.
- **Response**: `{ message, attendance, timestamp }`

### `GET /api/attendance/monthly`
Fetch aggregated monthly attendance data.
- **Query Params**:
  - `year` (required): e.g., "2026"
  - `month` (optional): e.g., "1" for January
  - `employeeId` (optional)
- **Response**: `{ monthlyRecords: [...], count }`

### `GET /api/attendance/yearly`
Fetch aggregated yearly attendance data.
- **Query Params**:
  - `year` (required): e.g., "2026"
  - `employeeId` (optional)
- **Response**: `{ yearlyRecords: [...], chartData: [...], ... }`

### `POST /api/cron/aggregate-attendance`
Trigger manual or scheduled aggregation.
- **Headers**: `Authorization: Bearer <CRON_SECRET>`
- **Body**: `{ year, month, type: "monthly" | "yearly" }`
- **Response**: `{ success: true, message }`

---

## Employees

### `GET /api/employees`
Fetch employee profiles.
- **Query Params**:
  - `managerId` (optional): "self" to get current user's team.
  - `includePayroll` (optional): "true" to include payroll data (Admin only).
- **Response**: `{ employees: [...], totalCount }`

---

## Leave Management

### `GET /api/leave`
Fetch leave requests.
- **Query Params**:
  - `status` (optional): "PENDING", "APPROVED", "REJECTED"
- **Response**: `{ leaveRequests: [...] }`

### `POST /api/leave`
Submit a leave request.
- **Body**: `{ type, startDate, endDate, reason }`
- **Response**: `{ leaveRequest }`

### `PATCH /api/leave/[id]`
Approve or reject a leave request.
- **Body**: `{ status: "APPROVED" | "REJECTED", comment }`
- **Access**: Admin or Manager (for team members).
- **Response**: `{ leaveRequest }`
