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
    });

    const balances: Record<string, number> = {};

    members.forEach((m) => {
      balances[m.userId] = 0;
    });

    for (const expense of expenses) {
      const splitAmount = expense.amount / members.length;

      members.forEach((m) => {
        balances[m.userId] -= splitAmount;
      });

      balances[expense.paidById] += expense.amount;
    }

    // Convert to array
    const balanceArray = members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      balance: Number(balances[m.userId].toFixed(2)),
    }));

    // Separate creditors and debtors
    const creditors = balanceArray
      .filter((u) => u.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    const debtors = balanceArray
      .filter((u) => u.balance < 0)
      .sort((a, b) => a.balance - b.balance);

    const settlements = [];

    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      const amount = Math.min(
        creditor.balance,
        Math.abs(debtor.balance)
      );

      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Number(amount.toFixed(2)),
      });

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance === 0) i++;
      if (debtor.balance === 0) j++;
    }

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