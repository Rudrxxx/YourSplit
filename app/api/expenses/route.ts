import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const expense = await prisma.expense.create({
      data: {
        description: body.description,
        amount: body.amount,
        paidById: body.paidById,
        groupId: body.groupId,
      },
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
    },
  });

  return NextResponse.json(expenses);
}