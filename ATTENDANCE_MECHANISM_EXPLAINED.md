# 📋 Attendance Mechanism - How It Works

## Overview
Your HR Management System uses a **manual check-in/check-out** system. There is **NO automatic attendance marking** - employees must actively mark their attendance each day.

---

## 🔄 How Attendance Works

### 1. **Manual Check-In Process**
Employees must manually check in each day:

```
Employee Dashboard → Click "Mark Attendance" → Check In Button
```

**What happens:**
- Creates an attendance record in the database
- Records the check-in time
- Calculates status (PRESENT, LATE, etc.)
- Sends real-time notification to admin dashboard

### 2. **Manual Check-Out Process**
At the end of the day, employees check out:

```
Employee Dashboard → Click "Mark Attendance" → Check Out Button
```

**What happens:**
- Updates the attendance record
- Records check-out time
- Calculates working hours
- Updates status (may change to HALF_DAY if hours < 8)
- Triggers monthly attendance aggregation

---

## 📊 Attendance Status Calculation

The system automatically calculates status based on these rules:

### Status Types:

1. **HOLIDAY** 🏖️
   - Sunday (day 0) or configured non-working days
   - Company holidays in the Holiday table
   - **No check-in required**

2. **LEAVE** 🌴
   - Employee has an approved leave request for that date
   - **No check-in required**

3. **ABSENT** ❌
   - **No check-in record exists**
   - Not a holiday or leave day
   - **This is what happens if nobody marks attendance!**

4. **LATE** ⏰
   - Checked in after grace period
   - Default: Office starts at 9:00 AM, grace period = 15 minutes
   - Late if check-in > 9:15 AM

5. **PRESENT** ✅
   - Checked in on time (within grace period)
   - Working hours >= 8 hours (full day)

6. **HALF_DAY** ⏱️
   - Checked in but worked < 8 hours
   - Must work >= 4 hours minimum

---

## ⚠️ What Happens If No One Marks Attendance?

### Scenario: Employee doesn't check in

**Result:** Status = **ABSENT**

The system logic:
```typescript
// From attendance-service.ts
if (!attendance || !attendance.checkIn) {
    return AttendanceState.ABSENT;
}
```

### Scenario: Employee on approved leave

**Result:** Status = **LEAVE** (Cannot mark attendance)

The system prevents attendance marking:
```typescript
// From attendance API
if (approvedLeave) {
    return error: "You cannot mark attendance. You are on approved leave today."
}
```

**Error Message Shown:**
```
❌ Cannot Mark Attendance

You are on approved SICK leave today.

Please contact HR if this is incorrect.
```

### Impact on Dashboard:
- **Total Employees**: Shows 10 (regular employees)
- **Present Today**: 0 (nobody checked in)
- **Absent Today**: 10 (all employees marked absent)
- **Attendance Rate**: 0%

### Impact on Monthly Reports:
- Absent days count increases
- Attendance percentage decreases
- May affect payroll calculations (if configured)

---

## 🔧 Company Configuration

Attendance rules are configurable in the `CompanyConfig` table:

```typescript
{
  officeStartTime: "09:00",        // Office start time
  gracePeriodMinutes: 15,          // Late grace period
  workingDays: [1,2,3,4,5,6],     // Mon-Sat (0=Sunday)
  minimumHoursForFullDay: 8.0,    // Full day hours
  minimumHoursForHalfDay: 4.0     // Half day minimum
}
```

---

## 🤖 Automated Processes

### What IS Automated:
1. **Status Calculation** - Automatic based on check-in time
2. **Monthly Aggregation** - Runs when employee checks out
3. **Real-time Updates** - Dashboard updates via WebSocket
4. **Birthday Notifications** - Cron job (if configured)
5. **Leave Detection** - Automatically blocks attendance if on approved leave

### What is NOT Automated:
1. ❌ **Daily Attendance Marking** - Must be done manually
2. ❌ **Check-in/Check-out** - Employees must click buttons
3. ❌ **Absent marking** - System infers from missing records

---

## 📝 Manual Scripts Available

### 1. Mark Today's Attendance (Testing)
```bash
npx tsx prisma/mark-today-attendance.ts
```
- **Purpose**: Bulk mark attendance for all employees (for testing)
- **Status**: Randomly assigns PRESENT/ABSENT/LEAVE
- **Use Case**: Development/testing only

### 2. Aggregate Attendance (Admin)
```
Admin Dashboard → Reports Tab → Run Monthly/Yearly Aggregation
```
- **Purpose**: Calculate monthly/yearly statistics
- **Trigger**: Manual button click or automatic on check-out

---

## 🎯 Recommendations

### Option 1: Keep Manual System
**Pros:**
- More control
- Prevents fraud
- Employees are accountable

**Cons:**
- Employees may forget
- Requires daily action

### Option 2: Add Auto-Marking (Future Enhancement)
You could add a cron job to automatically mark attendance:

```typescript
// Pseudo-code for auto-marking
// Run daily at 9:30 AM
async function autoMarkAttendance() {
  const employees = await getActiveEmployees();
  
  for (const emp of employees) {
    const hasCheckedIn = await checkIfCheckedIn(emp.id);
    
    if (!hasCheckedIn) {
      // Auto-mark as ABSENT or send reminder notification
      await markAsAbsent(emp.id);
    }
  }
}
```

### Option 3: Biometric Integration
- Integrate with biometric devices
- Auto-sync attendance from hardware
- Most accurate but requires hardware investment

---

## 🔍 How to Check Current Attendance

### For Employees:
```
Employee Dashboard → Attendance Section
```
- Shows today's status
- Check-in/Check-out buttons
- Monthly calendar view

### For Admins:
```
Admin Dashboard → Attendance Trends Chart
```
- Filter by month/year
- View all employees' attendance
- Export reports

### For Managers:
```
Manager Dashboard → Team Attendance
```
- View team members only
- Approve leave requests
- Monitor team presence

---

## 📌 Summary

**Current System:**
- ✅ Manual check-in/check-out required
- ✅ Automatic status calculation
- ✅ Real-time dashboard updates
- ❌ No automatic attendance marking
- ❌ If nobody checks in → Everyone marked ABSENT

**Key Point:** The system is designed to require active participation. If employees don't mark attendance, they will be marked as ABSENT by default.

---

## 🐛 Common Issue: Why Graph Shows 100% Attendance

### Problem:
The attendance chart was showing **100% attendance** even when most employees didn't check in.

### Root Cause:
The chart was calculating percentage incorrectly:
```typescript
// WRONG: Only counts employees with records
const employeeCount = rawRecords.length; // e.g., 1 employee
const percentage = (1 present / 1 employee) * 100 = 100%

// CORRECT: Should count all employees
const employeeCount = totalEmployees; // e.g., 10 employees
const percentage = (1 present / 10 employees) * 100 = 10%
```

### Solution:
Updated the chart to fetch total employee count and use it for percentage calculation. Now it shows accurate attendance rates.

**Example:**
- Total Employees: 10
- Employees who checked in on Day 3: 1
- **Old Chart**: 100% (wrong!)
- **New Chart**: 10% (correct!)

This fix ensures the attendance trends accurately reflect the actual attendance rate across all employees.
