import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const member = await prisma.groupMember.create({
      data: {
        groupId: body.groupId,
        userId: body.userId,
      },
      include: { user: true },
    });

    await prisma.activityLog.create({
      data: {
        groupId: body.groupId,
        type: "MEMBER_JOINED",
        message: `${member.user.name} joined the group`,
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to add member to group" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const members = await prisma.groupMember.findMany({
    include: {
      user: true,
      group: true,
    },
  });

  return NextResponse.json(members);
}