import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/batches/[id]/report - Get detailed profitability report for a batch
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const batchId = parseInt(id);

    // Get batch with all related data
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        products: {
          include: {
            product: true,
          },
        },
        sales: {
          include: {
            product: true,
            location: true,
          },
        },
        expenses: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    // Calculate total product costs
    const productCosts = batch.products.reduce(
      (sum: number, bp: any) => sum + bp.cost,
      0
    );

    // Calculate total expenses
    const totalExpenses = batch.expenses.reduce(
      (sum: number, expense: any) => sum + expense.amount,
      0
    );

    // Calculate total revenue from sales
    const totalRevenue = batch.sales.reduce(
      (sum: number, sale: any) => sum + sale.totalPrice,
      0
    );

    // Calculate total quantity sold
    const totalQuantitySold = batch.sales.reduce(
      (sum: number, sale: any) => sum + sale.quantity,
      0
    );

    // Calculate total cost
    const totalCost = productCosts + totalExpenses;

    // Calculate profit
    const profit = totalRevenue - totalCost;

    // Calculate profit margin
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // Sales by product
    const salesByProduct = batch.sales.reduce((acc: any, sale: any) => {
      const productName = sale.product.name;
      if (!acc[productName]) {
        acc[productName] = {
          quantity: 0,
          revenue: 0,
        };
      }
      acc[productName].quantity += sale.quantity;
      acc[productName].revenue += sale.totalPrice;
      return acc;
    }, {});

    // Sales by location
    const salesByLocation = batch.sales.reduce((acc: any, sale: any) => {
      const locationName = sale.location.name;
      if (!acc[locationName]) {
        acc[locationName] = {
          quantity: 0,
          revenue: 0,
        };
      }
      acc[locationName].quantity += sale.quantity;
      acc[locationName].revenue += sale.totalPrice;
      return acc;
    }, {});

    const report = {
      batch: {
        id: batch.id,
        name: batch.name,
        status: batch.status,
        startDate: batch.startDate,
        endDate: batch.endDate,
      },
      costs: {
        productCosts,
        expenses: totalExpenses,
        totalCost,
      },
      revenue: {
        totalRevenue,
        totalQuantitySold,
        salesCount: batch.sales.length,
      },
      profitability: {
        profit,
        profitMargin,
      },
      breakdown: {
        products: batch.products.map((bp: any) => ({
          name: bp.product.name,
          quantity: bp.quantity,
          cost: bp.cost,
          unitCost: bp.cost / bp.quantity,
        })),
        expenses: batch.expenses.map((expense: any) => ({
          type: expense.type,
          amount: expense.amount,
          date: expense.date,
          notes: expense.notes,
        })),
        salesByProduct,
        salesByLocation,
      },
    };

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("Error generating batch report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
