# 🔄 Data Reset Guide

## Overview
This guide explains how to reset data in your HR Management System.

---

## ✅ What Was Reset

### Deleted Data:
- ✅ **57 Attendance Records** - All check-in/check-out records
- ✅ **20 Leave Requests** - All pending, approved, and rejected leaves
- ✅ **5 Monthly Aggregations** - All monthly attendance summaries
- ✅ **0 Yearly Aggregations** - All yearly attendance summaries
- ✅ **13 Notifications** - All system notifications

### Kept Data:
- ✅ **13 Users** - All user accounts (Admin, Manager, Employee)
- ✅ **12 Employees** - All employee profiles
- ✅ **8 Payroll Records** - Salary information kept intact

---

## 📊 Current State

After reset, your database has:

```
👥 Users & Employees:
   - 1 Admin
   - 2 Managers
   - 10 Regular Employees
   Total: 13 users, 12 employee profiles

📋 Attendance: 0 records (Clean slate)
🌴 Leave Requests: 0 requests (Clean slate)
📊 Aggregations: 0 records (Clean slate)
🔔 Notifications: 0 notifications (Clean slate)
💰 Payroll: 8 records (Kept)
```

---

## 🛠️ Available Reset Scripts

### 1. Complete Reset (What we just ran)
```bash
npx tsx reset-all-data.ts
```
**Deletes:**
- All attendance records
- All leave requests
- All monthly/yearly aggregations
- All notifications

**Keeps:**
- Users and employees
- Payroll records

### 2. Selective Reset
```bash
npx tsx reset-selective.ts
```
**Interactive tool** - Choose what to delete:
- Attendance? (y/n)
- Leaves? (y/n)
- Monthly aggregations? (y/n)
- Yearly aggregations? (y/n)
- Notifications? (y/n)
- Payroll? (y/n)

### 3. View Data Summary
```bash
npx tsx show-data-summary.ts
```
Shows current counts of all data without deleting anything.

---

## 💡 Next Steps

### 1. Start Fresh Attendance
Employees can now mark attendance from today:
```
Employee Dashboard → Mark Attendance → Check In
```

### 2. Create New Leave Requests
Employees can submit new leave requests:
```
Employee Dashboard → Leave → Apply for Leave
```

### 3. Admin Dashboard
Admin dashboard will show:
- Present Today: 0
- Absent Today: 0 (until employees check in)
- Pending Leaves: 0
- Clean attendance trends chart

### 4. Monthly Aggregation
After employees mark attendance, run aggregation:
```
Admin Dashboard → Reports Tab → Run Monthly Aggregation
```

---

## ⚠️ Important Notes

### What Happens After Reset:

1. **Attendance Status:**
   - All employees show as "Not Marked" until they check in
   - No historical attendance data
   - Charts will be empty until new data is created

2. **Leave Management:**
   - No approved leaves blocking attendance
   - Employees can freely mark attendance
   - Leave balance resets to default

3. **Dashboard Stats:**
   - All counters reset to 0
   - Attendance rate: 0%
   - Charts show no data

4. **Payroll:**
   - Salary information is KEPT
   - Only attendance-based calculations reset

### Data That Cannot Be Reset:
- User accounts (email, password, role)
- Employee profiles (name, code, department)
- Company configuration
- Holidays (if any were configured)

---

## 🔐 Safety Features

### Confirmation Prompt:
The reset script shows a warning and waits 3 seconds before executing:
```
⚠️  WARNING: This will delete ALL data except employees and users!
Press Ctrl+C to cancel, or wait 3 seconds to continue...
```

### What's Protected:
- User login credentials
- Employee personal information
- Payroll salary data
- System configuration

---

## 📝 Common Use Cases

### Use Case 1: Testing
Reset data to test attendance marking from scratch:
```bash
npx tsx reset-all-data.ts
```

### Use Case 2: New Month
Keep employees but clear old attendance:
```bash
npx tsx reset-selective.ts
# Choose: Attendance (y), Aggregations (y), Others (n)
```

### Use Case 3: Fix Bad Data
Remove duplicate or incorrect records:
```bash
npx tsx reset-selective.ts
# Choose specific data to delete
```

---

## 🎯 Verification

After reset, verify the clean state:
```bash
npx tsx show-data-summary.ts
```

Expected output:
```
📋 ATTENDANCE: Total Records: 0
🌴 LEAVE REQUESTS: Total Requests: 0
📊 AGGREGATIONS: Monthly Records: 0
👥 USERS & EMPLOYEES: Total Users: 13 ✅
```

---

## 🚀 Ready to Use

Your system is now reset and ready for fresh data:
1. ✅ All employees can mark attendance
2. ✅ No leave conflicts
3. ✅ Clean dashboards
4. ✅ Fresh start for reporting

**The system is ready to use!**
