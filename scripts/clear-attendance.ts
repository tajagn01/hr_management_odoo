import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearAttendanceData() {
    console.log("🧹 Clearing existing attendance data...");
    
    try {
        // Clear attendance records
        const deletedAttendance = await prisma.attendance.deleteMany({});
        console.log(`   ✅ Deleted ${deletedAttendance.count} attendance records`);
        
        // Clear attendance configs
        const deletedConfigs = await prisma.attendanceConfig.deleteMany({});
        console.log(`   ✅ Deleted ${deletedConfigs.count} attendance configs`);
        
        console.log("🎉 All attendance data cleared successfully!");
        
    } catch (error) {
        console.error("❌ Error clearing data:", error);
    } finally {
        await prisma.$disconnect();
    }
}

clearAttendanceData();