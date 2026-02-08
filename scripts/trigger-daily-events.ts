import { checkDailyEvents } from "../lib/daily-event-checker";
import { prisma } from "../lib/prisma";

async function main() {
    console.log("🚀 Manually triggering daily event check...");

    try {
        const result = await checkDailyEvents();

        console.log("-----------------------------------");
        console.log("✅ Daily Events Check Completed");
        console.log(`🎂 Birthdays Found: ${result.birthdayCount}`);
        console.log(`🎉 Anniversaries Found: ${result.anniversaryCount}`);

        if (result.error) {
            console.error("⚠️ Errors occurred:", result.error);
        }

    } catch (error) {
        console.error("❌ Failed to run daily events:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
