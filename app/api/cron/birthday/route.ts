import { NextResponse } from "next/server";
import { checkBirthdays } from "@/lib/birthday-checker";

// This API route can be called by a cron job daily
export async function GET(request: Request) {
    try {
        // Optional: Add authorization header check for security
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET || "your-secret-key-here";

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const result = await checkBirthdays();

        return NextResponse.json({
            success: result.success,
            message: `Checked birthdays. Found ${result.count || 0} birthday(s) today.`,
            count: result.count
        });
    } catch (error) {
        console.error("Error in birthday cron:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Allow manual trigger for testing (remove in production)
export async function POST() {
    try {
        const result = await checkBirthdays();

        return NextResponse.json({
            success: result.success,
            message: `Manual birthday check completed. Found ${result.count || 0} birthday(s).`,
            count: result.count
        });
    } catch (error) {
        console.error("Error in manual birthday check:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
