export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // Only run automated checks in development mode
        if (process.env.NODE_ENV === "development") {
            console.log("⏰ initializing Development Automation Hooks...");

            // Use dynamic import to avoid bundling issues
            const { checkDailyEvents } = await import("@/lib/daily-event-checker");
            const { generateRandomAttendance } = await import("@/lib/attendance-generator");

            // Run check after a short delay (5s) to allow server to fully start
            setTimeout(async () => {
                try {
                    console.log("🚀 [Auto-Dev] Running automated daily tasks...");

                    // 1. Check Birthdays/Anniversaries
                    const result = await checkDailyEvents();
                    console.log(`✅ [Auto-Dev] Daily Events: ${result.birthdayCount} birthdays, ${result.anniversaryCount} anniversaries`);

                    // 2. Schedule Random Attendance (Simulation) for 5:00 PM IST (11:30 UTC)
                    // This ensures we don't mark people present prematurely if they haven't checked in yet.
                    const now = new Date();
                    const targetTime = new Date();
                    targetTime.setUTCHours(11, 30, 0, 0); // 17:00 IST

                    if (now > targetTime) {
                        // Past 5:00 PM IST, run immediately
                        console.log("⏰ [Auto-Dev] It's past 5:00 PM The automation will run now...");
                        const attResult = await generateRandomAttendance();
                        console.log(`✅ [Auto-Dev] Attendance Simulation: Marked ${attResult.markedCount} records`);
                    } else {
                        // Schedule for later today
                        const delay = targetTime.getTime() - now.getTime();
                        const hours = Math.floor(delay / (1000 * 60 * 60));
                        const mins = Math.floor((delay % (1000 * 60 * 60)) / (1000 * 60));

                        console.log(`⏰ [Auto-Dev] Attendance Simulation scheduled for 5:00 PM IST (in ${hours}h ${mins}m)`);

                        setTimeout(async () => {
                            console.log("🚀 [Auto-Dev] Running scheduled 5:00 PM attendance simulation...");
                            const attResult = await generateRandomAttendance();
                            console.log(`✅ [Auto-Dev] Attendance Simulation: Marked ${attResult.markedCount} records`);
                        }, delay);
                    }

                } catch (error) {
                    console.error("❌ [Auto-Dev] Failed to run automated tasks:", error);
                }
            }, 5000);
        }
    }
}
