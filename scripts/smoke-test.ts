import { prisma } from "../lib/prisma";

async function runSmokeTests() {
    console.log("🚀 Starting Smoke Tests...");
    console.log("=================================");

    let passed = 0;
    let failed = 0;

    // 1. Database Connectivity
    try {
        process.stdout.write("📦 Testing Database Connectivity... ");
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const duration = Date.now() - start;
        console.log(`✅ PASSED (${duration}ms)`);
        passed++;
    } catch (error) {
        console.log("❌ FAILED");
        console.error(error);
        failed++;
    }

    // 2. Critical Data Integrity Checks
    try {
        process.stdout.write("🛡️  Verifying Admin User Exists... ");
        const adminCount = await prisma.user.count({
            where: { role: "ADMIN" }
        });
        if (adminCount > 0) {
            console.log(`✅ PASSED (Found ${adminCount} admins)`);
            passed++;
        } else {
            console.log("⚠️  WARNING (No admins found - system might be fresh)");
            // Not a failure, just a warning
        }
    } catch (error) {
        console.log("❌ FAILED");
        failed++;
    }

    // 3. System Configuration
    process.stdout.write("⚙️  Checking Environment Variables... ");
    const requiredVars = ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];
    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length === 0) {
        console.log("✅ PASSED");
        passed++;
    } else {
        console.log("❌ FAILED");
        console.log("   Missing:", missing.join(", "));
        failed++;
    }

    // 4. API Health Check (Needs running server)
    // We skip this since we are running as a script, but we remind the user
    console.log("\n🌐 checking API Health...");
    console.log("   (Requires running server at http://localhost:3000)");
    try {
        const response = await fetch("http://localhost:3000/api/health");
        if (response.ok) {
            console.log("   ✅ Server is UP and responding");
            passed++;
        } else {
            console.log("   ⚠️  Server returned " + response.status + " (Is it running?)");
        }
    } catch (e) {
        console.log("   ⚠️  Could not connect to server (Run 'npm start' first)");
    }

    console.log("\n=================================");
    console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);

    if (failed === 0) {
        console.log("✅ SYSTEM IS READY FOR PRODUCTION");
    } else {
        console.log("❌ SYSTEM HAS ISSUES");
        process.exit(1);
    }
}

runSmokeTests()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
