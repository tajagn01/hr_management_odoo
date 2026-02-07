import { NextResponse } from "next/server";
import { checkDailyEvents } from "@/lib/daily-event-checker";

// This API route can be called by a cron job daily
export async function GET(request: Request) {
    try {
        // Optional: Add authorization header check for security
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const result = await checkDailyEvents();

        if (!result.success) {
            throw result.error;
        }

        return NextResponse.json({
            success: true,
            message: `Checked daily events. Found ${result.birthdayCount} birthday(s) and ${result.anniversaryCount} anniversary(s).`,
            counts: {
                birthdays: result.birthdayCount,
                anniversaries: result.anniversaryCount
            }
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
        const result = await checkDailyEvents();

        if (!result.success) {
            throw result.error;
        }

        return NextResponse.json({
            success: true,
            message: `Manual daily event check completed. Found ${result.birthdayCount} birthday(s) and ${result.anniversaryCount} anniversary(s).`,
            counts: {
                birthdays: result.birthdayCount,
                anniversaries: result.anniversaryCount
            }
        });
    } catch (error) {
        console.error("Error in manual birthday check:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
