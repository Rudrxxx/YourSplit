import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { description, amount, paidById, groupId, splitType = "EQUAL", splits = [] } = body;

    let computedSplits: { userId: string; amount: number }[] = [];

    if (splitType === "EQUAL") {
      const members = await prisma.groupMember.findMany({ where: { groupId } });
      if (members.length === 0) {
        return NextResponse.json({ error: "Cannot add expense to an empty group" }, { status: 400 });
      }
      const splitAmount = amount / members.length;
      computedSplits = members.map((m) => ({ userId: m.userId, amount: splitAmount }));
    } else if (splitType === "EXACT") {
      computedSplits = splits.map((s: { userId: string; amount: string | number }) => ({ userId: s.userId, amount: Number(s.amount) }));
    } else if (splitType === "PERCENT") {
      computedSplits = splits.map((s: { userId: string; percent: string | number }) => ({ userId: s.userId, amount: (Number(s.percent) / 100) * amount }));
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        amount,
        paidById,
        groupId,
        splitType,
        splits: {
          create: computedSplits,
        },
      },
      include: { splits: true, paidBy: true },
    });

    await prisma.activityLog.create({
      data: {
        groupId,
        type: "EXPENSE_ADDED",
        message: `${expense.paidBy.name} added expense ₹${amount} for ${description}`,
      }
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const expenses = await prisma.expense.findMany({
    include: {
      paidBy: true,
      group: true,
      splits: true,
    },
  });

  return NextResponse.json(expenses);
}