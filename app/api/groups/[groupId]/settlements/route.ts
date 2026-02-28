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
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true },
    });

    if (members.length === 0) {
      return NextResponse.json({
        groupId,
        settlements: [],
      });
    }

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: { splits: true },
    });

    const settlementsRecords = await prisma.settlement.findMany({
      where: { groupId },
    });

    const balances: Record<string, number> = {};

    members.forEach((m) => {
      balances[m.userId] = 0;
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
        members.forEach((m) => {
          balances[m.userId] -= splitAmount;
        });
      }

      if (balances[expense.paidById] !== undefined) {
        balances[expense.paidById] += expense.amount;
      }
    }

    // Process recorded settlements (reduces debt)
    for (const sr of settlementsRecords) {
      if (balances[sr.fromUserId] !== undefined) {
        balances[sr.fromUserId] += sr.amount;
      }
      if (balances[sr.toUserId] !== undefined) {
        balances[sr.toUserId] -= sr.amount;
      }
    }

    // Convert to array
    const balanceArray = members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      balance: Number(balances[m.userId].toFixed(2)),
    }));

    // Calculate optimal settlements using generic utility
    const settlements = calculateSettlements(balanceArray);

    return NextResponse.json({
      groupId,
      settlements,
    });
  } catch (error) {
    console.error("Settlement error:", error);
    return NextResponse.json(
      { error: "Failed to generate settlements" },
      { status: 500 }
    );
  }
}