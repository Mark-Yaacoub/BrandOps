import { NextResponse } from "next/server";
import prisma from "@/src/lib/db";

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET() {
  try {
    const [
      productsCount,
      batchesCount,
      expensesSum,
      activeTasksCount,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.batch.count(),
      prisma.expense.aggregate({
        _sum: {
          amount: true,
        },
      }),
      prisma.task.count({
        where: {
          status: {
            not: "completed",
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        productsCount,
        batchesCount,
        totalExpenses: expensesSum._sum.amount || 0,
        activeTasksCount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
