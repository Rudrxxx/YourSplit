import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params; // 🔥 IMPORTANT

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
        totalExpenses: 0,
        perPersonShare: 0,
        balances: [],
      });
    }

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: { splits: true },
    });

    const balances: Record<string, number> = {};
    members.forEach((member) => {
      balances[member.userId] = 0;
    });

    let totalExpenses = 0;

    for (const expense of expenses) {
      totalExpenses += expense.amount;

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

    return NextResponse.json({
      groupId,
      totalExpenses,
      perPersonShare: totalExpenses / members.length,
      balances: members.map((member) => ({
        userId: member.userId,
        name: member.user.name,
        balance: Number(balances[member.userId].toFixed(2)),
      })),
    });
  } catch (error) {
    console.error("Balance calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate balances" },
      { status: 500 }
    );
  }
}