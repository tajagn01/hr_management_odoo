const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

console.log('🤖 Starting Auto-Mark Attendance Scheduler...');

// Schedule to run Monday through Saturday at 5:00 PM IST (Indian Standard Time)
// Cron format: minute hour day-of-month month day-of-week
// 0 17 * * 1-6 = At 5:00 PM, Monday through Saturday
// IST = UTC+5:30
cron.schedule('0 17 * * 1-6', () => {
    const now = new Date();
    console.log(`⏰ Triggered auto-mark attendance at ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
    
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
    timezone: "Asia/Kolkata" // Indian Standard Time (IST = UTC+5:30)
});

// Auto-checkout: Mon-Sat at 5:15 PM IST - checkout employees who forgot
cron.schedule('15 17 * * 1-6', () => {
    const now = new Date();
    console.log(`⏰ Triggered auto-checkout at ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);

    const scriptPath = path.join(__dirname, '..', 'app', 'api', 'cron', 'auto-checkout', 'route.ts');
    // For local dev, call the API endpoint directly
    const fetch = require('node-fetch');
    const cronSecret = process.env.CRON_SECRET || '';
    fetch('http://localhost:3000/api/cron/auto-checkout', {
        headers: { 'Authorization': `Bearer ${cronSecret}` }
    })
    .then(res => res.json())
    .then(data => console.log('Auto-checkout result:', data))
    .catch(err => console.error('Auto-checkout error:', err));
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

// Daily events (birthday/anniversary): Every day at 12:00 AM IST (midnight)
cron.schedule('0 0 * * *', () => {
    const now = new Date();
    console.log(`⏰ Triggered daily events check at ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);

    const fetch = require('node-fetch');
    const cronSecret = process.env.CRON_SECRET || '';
    fetch('http://localhost:3000/api/cron/birthday', {
        headers: { 'Authorization': `Bearer ${cronSecret}` }
    })
    .then(res => res.json())
    .then(data => console.log('Daily events result:', data))
    .catch(err => console.error('Daily events error:', err));
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
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

console.log('✅ Scheduler started! Auto-marking will run Mon-Sat at 5:00 PM IST (Indian Standard Time)');
console.log('   Auto-checkout will run Mon-Sat at 5:15 PM IST');
console.log('   Daily events (birthday/anniversary) will run daily at 12:00 AM IST');
console.log('   Press Ctrl+C to stop the scheduler');
console.log('   Auto-mark will only run if NO employee has marked attendance for the day');

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