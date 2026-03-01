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
        const totalSpent: Record<string, number> = {};
        members.forEach((member) => {
            balances[member.userId] = 0;
            totalSpent[member.userId] = 0;
        });

        const rawEdges: { from: string; to: string; amount: number }[] = [];

        for (const expense of expenses) {
            if (expense.splits && expense.splits.length > 0) {
                for (const split of expense.splits) {
                    if (balances[split.userId] !== undefined) {
                        balances[split.userId] -= Number(split.amount);
                    }
                    if (totalSpent[split.userId] !== undefined) {
                        totalSpent[split.userId] += Number(split.amount);
                    }
                    // Avoid self-edges
                    if (split.userId !== expense.paidById) {
                        rawEdges.push({
                            from: split.userId,
                            to: expense.paidById,
                            amount: Number(Number(split.amount).toFixed(2))
                        });
                    }
                }
            } else {
                const splitAmount = Number(expense.amount) / members.length;
                for (const member of members) {
                    balances[member.userId] -= splitAmount;
                    totalSpent[member.userId] += splitAmount;

                    // Avoid self-edges
                    if (member.userId !== expense.paidById) {
                        rawEdges.push({
                            from: member.userId,
                            to: expense.paidById,
                            amount: Number(splitAmount.toFixed(2))
                        });
                    }
                }
            }

            if (balances[expense.paidById] !== undefined) {
                balances[expense.paidById] += Number(expense.amount);
            }
        }

        for (const settlement of settlements) {
            if (balances[settlement.fromUserId] !== undefined) {
                balances[settlement.fromUserId] += Number(settlement.amount);
            }
            if (balances[settlement.toUserId] !== undefined) {
                balances[settlement.toUserId] -= Number(settlement.amount);
            }

            // Raw settlements reduce existing raw debt lines.
            // For visual continuity, we map them as direct negative edges (or reverse edges).
            rawEdges.push({
                from: settlement.fromUserId,
                to: settlement.toUserId,
                amount: Number(Number(settlement.amount).toFixed(2))
            });
        }

        const balanceArray = members.map((member) => ({
            userId: member.userId,
            name: member.user.name,
            balance: Number(Number(balances[member.userId]).toFixed(2)),
            totalSpent: Number(Number(totalSpent[member.userId]).toFixed(2)),
        }));

        const settlementPlan = calculateSettlements(balanceArray);

        const nodes = balanceArray.map((b) => ({
            id: b.userId,
            name: b.name,
            balance: b.balance,
            totalSpent: b.totalSpent
        }));

        const optimizedEdges = settlementPlan.map((s) => ({
            from: s.fromId,
            to: s.toId,
            amount: s.amount,
        }));

        return NextResponse.json({ nodes, optimizedEdges, rawEdges });
    } catch (error) {
        console.error("Graph generation error:", error);
        return NextResponse.json({ error: "Failed to generate graph" }, { status: 500 });
    }
}
