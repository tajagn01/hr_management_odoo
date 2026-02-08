import { NextResponse } from "next/server";
import { aggregateAllEmployeesMonthly, aggregateAllEmployeesYearly } from "@/lib/attendance-aggregator";

export const dynamic = 'force-dynamic'; // Defaults to auto, but we want to ensure it's not cached

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // 'monthly' or 'yearly'

        // Default to current date
        const now = new Date();
        const year = parseInt(searchParams.get("year") || now.getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString());

        // Simple security check (optional: add CRON_SECRET env var check here)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (type === "monthly") {
            await aggregateAllEmployeesMonthly(year, month);
            return NextResponse.json({
                success: true,
                message: `Monthly aggregation completed for ${year}-${month}`
            });
        } else if (type === "yearly") {
            await aggregateAllEmployeesYearly(year);
            return NextResponse.json({
                success: true,
                message: `Yearly aggregation completed for ${year}`
            });
        } else {
            return NextResponse.json({
                error: "Invalid type. Use 'monthly' or 'yearly'"
            }, { status: 400 });
        }
    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
