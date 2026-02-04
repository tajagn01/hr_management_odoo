const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

console.log('🤖 Starting Auto-Mark Attendance Scheduler...');

// Schedule to run Monday through Saturday at 5:00 PM
// Cron format: minute hour day-of-month month day-of-week
// 0 17 * * 1-6 = At 5:00 PM, Monday through Saturday
cron.schedule('0 17 * * 1-6', () => {
    const now = new Date();
    console.log(`⏰ Triggered auto-mark attendance at ${now.toLocaleString()}`);
    
    // Path to the TypeScript script
    const scriptPath = path.join(__dirname, 'auto-mark-attendance.ts');
    
    // Execute the auto-mark attendance script
    exec(`npx tsx "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error executing auto-mark script: ${error}`);
            return;
        }
        
        if (stderr) {
            console.warn(`⚠️  Script warnings: ${stderr}`);
        }
        
        console.log(`📋 Script output:\n${stdout}`);
    });
}, {
    scheduled: true,
    timezone: "America/New_York" // Change this to your timezone
});

// Schedule a test run every minute for debugging (comment out in production)
/*
cron.schedule('* * * * *', () => {
    console.log('🧪 Test run - Auto-mark attendance would run now if it were 5 PM on a weekday');
}, {
    scheduled: true,
    timezone: "America/New_York"
});
*/

console.log('✅ Scheduler started! Auto-marking will run Mon-Sat at 5:00 PM');
console.log('   Press Ctrl+C to stop the scheduler');

// Keep the process running
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down attendance scheduler...');
    process.exit(0);
});

// Optional: Add a health check endpoint if you want to monitor the scheduler
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught exception in scheduler:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});