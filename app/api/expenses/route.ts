import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";

// GET /api/expenses - Get all expenses
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        batch: true,
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount, date, notes, batchId, productId } = body;

    if (!type || amount === undefined || !date) {
      return NextResponse.json(
        {
          success: false,
          error: "Type, amount, and date are required",
        },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        type,
        amount: parseFloat(amount),
        date: new Date(date),
        notes: notes || null,
        batchId: batchId ? parseInt(batchId) : null,
        productId: productId ? parseInt(productId) : null,
      },
      include: {
        batch: true,
        product: true,
      },
    });

    return NextResponse.json(
      { success: true, data: expense },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
