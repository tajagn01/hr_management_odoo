# Random Auto-Mark Attendance System Setup

## ✅ What's Been Implemented

1. **Smart auto-mark attendance script** (`scripts/auto-mark-attendance.ts`)
   - **ONLY ACTIVATES if NO ONE has marked attendance for the day**
   - Randomly assigns attendance status: ~70% Present, ~20% Absent, ~10% Late
   - Skips Sundays (holidays) automatically
   - Only runs from February 2026 onwards
   - **LOCKS manual attendance after auto-marking**
   - Marks attendance with `autoMarked: true` flag

2. **Database schema updated**
   - Added `autoMarked` field to Attendance model
   - Added `AttendanceConfig` model to track auto-marking and lock manual entry
   - Applied to database successfully

3. **Manual attendance blocking**
   - API modified to prevent check-in/check-out after auto-marking
   - Returns clear error message when manual entry is blocked

4. **Enhanced scheduler and test scripts**
   - Scheduler runs Monday-Saturday at 5:00 PM
   - Test script shows detailed status including lock status
   - Clear script to reset attendance data for testing

## 🎯 Key Features

### 🤖 Smart Activation
- **Only runs if NOBODY has marked attendance that day**
- If anyone marks attendance manually, auto-marking is skipped entirely
- This ensures manual attendance always takes priority

### 🎲 Random Distribution  
- **70% Present**: Normal working employees with realistic check-in/out times
- **20% Absent**: No check-in/out times, marked as absent
- **10% Late**: Late check-in (9:45-10:15 AM) with slightly reduced hours

### 🔒 Attendance Locking
- After auto-marking, employees **CANNOT** manually check-in/check-out
- API blocks manual attendance with clear error message
- Prevents conflicting attendance records

## 🚀 How to Use

### Option 1: Manual Testing
```bash
npm run test-auto-mark      # Check current status and lock state
npm run auto-mark           # Run random auto-mark manually  
npm run clear-attendance    # Clear all attendance (for testing)
```

### Option 2: Node.js Scheduler (Recommended)
```bash
npm run start-scheduler     # Start the background scheduler
```

### Option 3: Windows Task Scheduler
1. Open Windows Task Scheduler
2. Create Basic Task
3. Name: "Random Auto Mark Attendance"
4. Schedule: Daily at 5:00 PM
5. Action: Start a program
6. Program: `cmd.exe`
7. Arguments: `/c "cd /d C:\\Users\\TAJAGN\\OneDrive\\Desktop\\Projects\\hr_management_odoo && npm run auto-mark"`

## 📊 Test Results Example

```
📊 Current attendance status:
   ✅ Sarah Manager: PRESENT (Auto-marked)
   ✅ Michael Scott: PRESENT (Auto-marked)  
   ❌ raj: ABSENT (Auto-marked)
   ⏰ Carol Davis: LATE (Auto-marked)
   
📈 Summary:
   Present: 6, Late: 3, Absent: 3
   Auto-marked: 12

🚫 Manual Check-In/Check-Out Status: BLOCKED
   Reason: Auto-marking has been completed for today
```

## 🛡️ Safety & Logic

1. **Manual Priority**: If anyone marks attendance, auto-marking is completely skipped
2. **No Conflicts**: Once auto-marked, manual entry is blocked to prevent conflicts  
3. **Random but Realistic**: Distribution simulates real workplace attendance patterns
4. **Holiday Handling**: Automatically skips Sundays
5. **Date Validation**: Only runs from February 2026 onwards
6. **Comprehensive Logging**: Detailed logs show what happened and why

## ⚙️ Configuration

### Adjust Random Distribution
Edit `scripts/auto-mark-attendance.ts`:
```typescript
if (randomValue <= 0.70) {          // 70% Present
} else if (randomValue <= 0.90) {   // 20% Absent  
} else {                            // 10% Late
```

### Change Times
- Auto-mark trigger: Modify scheduler from 5:00 PM
- Check-in times: 9:00-9:30 AM (Present), 9:45-10:15 AM (Late)
- Check-out times: 5:00-6:00 PM

## 🔄 Workflow

1. **5:00 PM Daily**: Script runs automatically
2. **Check**: Has anyone marked attendance today?
   - **Yes**: Skip auto-marking, manual takes priority
   - **No**: Proceed with random auto-marking
3. **Auto-mark**: Randomly assign Present/Absent/Late to all employees
4. **Lock**: Block manual attendance for the day
5. **Log**: Record results and create attendance config

## 📋 Commands Reference

```bash
npm run auto-mark           # Run random auto-mark manually
npm run test-auto-mark      # Test and show detailed status  
npm run start-scheduler     # Start Node.js scheduler
npm run clear-attendance    # Clear attendance data (testing)
```

The system now ensures realistic, random attendance while preventing conflicts between manual and auto-marked entries! 🎉