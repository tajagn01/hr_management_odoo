#!/bin/bash

# Auto-mark attendance setup script
# This script helps you set up the auto-marking attendance functionality

echo "🤖 Setting up auto-mark attendance system..."

# Create a Windows Task Scheduler command (for Windows)
echo ""
echo "📋 For Windows Task Scheduler, use this configuration:"
echo "---------------------------------------------------"
echo "Task Name: Auto Mark Attendance"
echo "Description: Automatically marks attendance for employees at 5 PM"
echo "Schedule: Daily at 5:00 PM, Monday through Saturday"
echo "Action: Start a program"
echo "Program/script: cmd.exe"
echo "Arguments: /c \"cd /d C:\\Users\\TAJAGN\\OneDrive\\Desktop\\Projects\\hr_management_odoo && npx tsx scripts/auto-mark-attendance.ts\""
echo ""

# Create a cron job command (for Linux/Mac)
echo "🐧 For Linux/Mac Cron Job:"
echo "---------------------------"
echo "Add this line to your crontab (crontab -e):"
echo "0 17 * * 1-6 cd /path/to/hr_management_odoo && npx tsx scripts/auto-mark-attendance.ts"
echo ""

# Create a Node.js scheduler (alternative)
echo "🟢 For Node.js based scheduler:"
echo "-------------------------------"
echo "You can also run the included scheduler script:"
echo "npm install node-cron"
echo "node scripts/attendance-scheduler.js"
echo ""

echo "✅ Setup instructions generated!"
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "- Make sure to run 'prisma db push' to apply the schema changes"
echo "- Test the script manually first: npx tsx scripts/auto-mark-attendance.ts"
echo "- The script skips Sundays automatically"
echo "- Only runs from February 2026 onwards"
echo "- Marks employees as PRESENT who haven't checked in by 5 PM"
echo "- Skips employees who are on leave (implement leave checking as needed)"