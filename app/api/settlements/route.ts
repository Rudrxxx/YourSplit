import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { groupId, fromUserId, toUserId, amount } = body;

        if (!groupId || !fromUserId || !toUserId || !amount) {
            return NextResponse.json(
                { error: "groupId, fromUserId, toUserId, and amount are required." },
                { status: 400 }
            );
        }

        // Wrap in a transaction to ensure atomicity
        const settlement = await prisma.$transaction(async (tx) => {
            const newSettlement = await tx.settlement.create({
                data: {
                    groupId,
                    fromUserId,
                    toUserId,
                    amount: Number(amount),
                },
                include: {
                    fromUser: true,
                    toUser: true,
                },
            });

            await tx.activityLog.create({
                data: {
                    groupId,
                    type: "SETTLEMENT_CREATED",
                    message: `${newSettlement.fromUser.name} paid ₹${newSettlement.amount} to ${newSettlement.toUser.name}`,
                },
            });

            return newSettlement;
        });

        return NextResponse.json(settlement);
    } catch (error) {
        console.error("Settlement error:", error);
        return NextResponse.json(
            { error: "Failed to record payment" },
            { status: 500 }
        );
    }
}
