import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
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

        // Fetch Group
        const group = await prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        // Fetch Members
        const members = await prisma.groupMember.findMany({
            where: { groupId },
            include: { user: true },
        });

        // Fetch Expenses
        const expenses = await prisma.expense.findMany({
            where: { groupId },
            include: { paidBy: true, splits: true },
            orderBy: { createdAt: "asc" },
        });

        // Fetch Settlements
        const settlementsRecords = await prisma.settlement.findMany({
            where: { groupId },
            include: { fromUser: true, toUser: true },
            orderBy: { createdAt: "asc" },
        });

        // Calculate Balances
        const balances: Record<string, number> = {};
        members.forEach((m) => {
            balances[m.userId] = 0;
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
                members.forEach((m) => {
                    balances[m.userId] -= splitAmount;
                });
            }

            if (balances[expense.paidById] !== undefined) {
                balances[expense.paidById] += expense.amount;
            }
        }

        for (const sr of settlementsRecords) {
            if (balances[sr.fromUserId] !== undefined) {
                balances[sr.fromUserId] += sr.amount;
            }
            if (balances[sr.toUserId] !== undefined) {
                balances[sr.toUserId] -= sr.amount;
            }
        }

        const balanceArray = members.map((m) => ({
            userId: m.userId,
            name: m.user.name,
            balance: Number(balances[m.userId].toFixed(2)),
        }));

        const settlementPlan = calculateSettlements(balanceArray);

        // Generation
        const doc = new jsPDF();
        let y = 20;

        const checkPageBreak = (spaceRequired: number) => {
            if (y + spaceRequired > 280) {
                doc.addPage();
                y = 20;
            }
        };

        // Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(`${group.name} - Financial Summary`, 105, y, { align: "center" });
        y += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, y, { align: "center" });
        y += 15;

        // Members
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Members", 20, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        members.forEach((m, idx) => {
            checkPageBreak(10);
            doc.text(`${idx + 1}. ${m.user.name} (${m.user.email})`, 25, y);
            y += 6;
        });
        y += 10;

        // Totals
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Total Expenses: INR ${totalExpenses.toFixed(2)}`, 20, y);
        y += 8;
        if (members.length > 0) {
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.text(`Per Person (Equal Split): INR ${(totalExpenses / members.length).toFixed(2)}`, 20, y);
            y += 8;
        }
        y += 10;

        // Final Balances
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Final Balances", 20, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        balanceArray.forEach((b) => {
            checkPageBreak(10);
            const status = b.balance > 0 ? "Gets Back" : b.balance < 0 ? "Owes" : "Settled Up";
            const amount = Math.abs(b.balance).toFixed(2);
            doc.text(`${b.name}: ${status} INR ${amount}`, 25, y);
            y += 6;
        });
        y += 10;

        // Settlement Plan
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Actionable Settlement Plan", 20, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        if (settlementPlan.length === 0) {
            doc.text("Everyone is settled up. No transactions required.", 25, y);
            y += 6;
        } else {
            settlementPlan.forEach((sp) => {
                checkPageBreak(10);
                doc.text(`• ${sp.from} needs to pay INR ${sp.amount.toFixed(2)} to ${sp.to}`, 25, y);
                y += 6;
            });
        }
        y += 10;

        // Expense History
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Expense History", 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        if (expenses.length === 0) {
            doc.text("No expenses recorded yet.", 25, y);
            y += 6;
        } else {
            expenses.forEach((e) => {
                checkPageBreak(10);
                const date = new Date(e.createdAt).toLocaleDateString();
                doc.text(`[${date}] ${e.description} - INR ${e.amount.toFixed(2)} (Paid by ${e.paidBy?.name || "Unknown"})`, 25, y);
                y += 6;
            });
        }
        y += 10;

        // Payments History
        if (settlementsRecords.length > 0) {
            checkPageBreak(30);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Payments Recorded", 20, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            settlementsRecords.forEach((sr) => {
                checkPageBreak(10);
                const date = new Date(sr.createdAt).toLocaleDateString();
                doc.text(`[${date}] ${sr.fromUser?.name} paid ${sr.toUser?.name} INR ${sr.amount.toFixed(2)}`, 25, y);
                y += 6;
            });
        }

        // Output to buffer array
        const pdfArrayBuffer = doc.output('arraybuffer');
        const pdfBuffer = Buffer.from(pdfArrayBuffer);

        return new NextResponse(pdfBuffer as unknown as BodyInit, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${group.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.pdf"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to generate export" }, { status: 500 });
    }
}
