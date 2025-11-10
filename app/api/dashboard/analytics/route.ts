import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all data with relations
    const [
      products,
      batches,
      sales,
      expenses,
      tasks,
      salesLocations,
    ] = await Promise.all([
      prisma.product.findMany({ include: { components: true } }),
      prisma.batch.findMany({ include: { products: true, sales: true, expenses: true } }),
      prisma.sale.findMany({ include: { product: true, batch: true, location: true } }),
      prisma.expense.findMany(),
      prisma.task.findMany(),
      prisma.salesLocation.findMany(),
    ]);

    // Calculate total revenue
    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + sale.totalPrice, 0);

    // Calculate total costs (product costs + expenses)
    const totalProductCosts = batches.reduce(
      (sum: number, batch: any) => sum + batch.products.reduce((s: number, p: any) => s + p.cost, 0),
      0
    );
    const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
    const totalCost = totalProductCosts + totalExpenses;

    // Calculate profit
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Top selling products
    const productSales: Record<string, { quantity: number; revenue: number; productId: number }> = {};
    sales.forEach((sale: any) => {
      const name = sale.product.name;
      if (!productSales[name]) {
        productSales[name] = { quantity: 0, revenue: 0, productId: sale.productId };
      }
      productSales[name].quantity += sale.quantity;
      productSales[name].revenue += sale.totalPrice;
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top locations
    const locationSales: Record<string, { sales: number; revenue: number }> = {};
    sales.forEach((sale: any) => {
      const name = sale.location.name;
      if (!locationSales[name]) {
        locationSales[name] = { sales: 0, revenue: 0 };
      }
      locationSales[name].sales += 1;
      locationSales[name].revenue += sale.totalPrice;
    });

    const topLocations = Object.entries(locationSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent sales
    const recentSales = sales
      .sort((a: any, b: any) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
      .slice(0, 10)
      .map((sale: any) => ({
        id: sale.id,
        date: sale.saleDate,
        product: sale.product.name,
        batch: sale.batch.name,
        location: sale.location.name,
        quantity: sale.quantity,
        total: sale.totalPrice,
      }));

    // Batch performance
    const batchPerformance = batches.map((batch: any) => {
      const batchRevenue = batch.sales.reduce((sum: number, sale: any) => sum + sale.totalPrice, 0);
      const batchCost =
        batch.products.reduce((sum: number, p: any) => sum + p.cost, 0) +
        batch.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const batchProfit = batchRevenue - batchCost;

      return {
        id: batch.id,
        name: batch.name,
        status: batch.status,
        revenue: batchRevenue,
        cost: batchCost,
        profit: batchProfit,
        profitMargin: batchRevenue > 0 ? (batchProfit / batchRevenue) * 100 : 0,
      };
    }).sort((a: any, b: any) => b.profit - a.profit);

    // Active tasks by priority
    const activeTasks = tasks.filter((t: any) => t.status !== "completed");
    const tasksByPriority = {
      high: activeTasks.filter((t: any) => t.priority === "high").length,
      medium: activeTasks.filter((t: any) => t.priority === "medium").length,
      low: activeTasks.filter((t: any) => t.priority === "low").length,
    };

    const dashboardData = {
      overview: {
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin,
        totalSales: sales.length,
        totalProducts: products.length,
        totalBatches: batches.length,
        activeBatches: batches.filter((b: any) => b.status !== "completed").length,
        totalLocations: salesLocations.length,
        activeTasks: activeTasks.length,
      },
      topProducts,
      topLocations,
      recentSales,
      batchPerformance: batchPerformance.slice(0, 5),
      tasksByPriority,
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
