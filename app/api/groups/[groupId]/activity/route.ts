import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    context: { params: Promise<{ groupId: string }> }
) {
    try {
        const { groupId } = await context.params;

        if (!groupId) {
            return NextResponse.json(
                { error: "Group ID is required" },
                { status: 400 }
            );
        }

        const activities = await prisma.activityLog.findMany({
            where: { groupId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(activities);
    } catch (error) {
        console.error("Activity fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch activities" },
            { status: 500 }
        );
    }
}
