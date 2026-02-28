import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { calculateSettlements } from "@/lib/settlement";

export async function GET(
    req: Request,
    context: { params: Promise<{ groupId: string }> }
) {
    try {
        const { groupId } = await context.params;

        if (!groupId) {
            return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
        }

        const members = await prisma.groupMember.findMany({
            where: { groupId },
            include: { user: true },
        });

        if (members.length === 0) {
            return NextResponse.json({ nodes: [], edges: [] });
        }

        const expenses = await prisma.expense.findMany({
            where: { groupId },
            include: { splits: true },
        });

        const settlements = await prisma.settlement.findMany({
            where: { groupId },
        });

        const balances: Record<string, number> = {};
        members.forEach((member) => {
            balances[member.userId] = 0;
        });

        for (const expense of expenses) {
            if (expense.splits && expense.splits.length > 0) {
                for (const split of expense.splits) {
                    if (balances[split.userId] !== undefined) {
                        balances[split.userId] -= split.amount;
                    }
                }
            } else {
                const splitAmount = expense.amount / members.length;
                for (const member of members) {
                    balances[member.userId] -= splitAmount;
                }
            }

            if (balances[expense.paidById] !== undefined) {
                balances[expense.paidById] += expense.amount;
            }
        }

        for (const settlement of settlements) {
            if (balances[settlement.fromUserId] !== undefined) {
                balances[settlement.fromUserId] += settlement.amount;
            }
            if (balances[settlement.toUserId] !== undefined) {
                balances[settlement.toUserId] -= settlement.amount;
            }
        }

        const balanceArray = members.map((member) => ({
            userId: member.userId,
            name: member.user.name,
            balance: Number(balances[member.userId].toFixed(2)),
        }));

        const settlementPlan = calculateSettlements(balanceArray);

        const nodes = balanceArray.map((b) => ({
            id: b.userId,
            name: b.name,
            balance: b.balance,
        }));

        const edges = settlementPlan.map((s) => ({
            from: s.fromId,
            to: s.toId,
            amount: s.amount,
        }));

        return NextResponse.json({ nodes, edges });
    } catch (error) {
        console.error("Graph generation error:", error);
        return NextResponse.json({ error: "Failed to generate graph" }, { status: 500 });
    }
}
