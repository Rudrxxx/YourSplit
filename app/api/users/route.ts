import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const user = await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: String(error) },
            { status: 500 }
        );
    }
}

export async function GET() {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
}