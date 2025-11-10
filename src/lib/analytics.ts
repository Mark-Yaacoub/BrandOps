/**
 * Analytics Service
 * Fetches real-time data from PostgreSQL database for analysis
 */

import prisma from "./db";

/**
 * Get sales data for the last N days
 */
export async function getSalesData(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    include: {
      product: {
        select: {
          name: true,
          price: true,
        },
      },
      location: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate summary
  const totalRevenue = sales.reduce((sum: number, sale: any) => sum + sale.totalPrice, 0);
  const totalQuantity = sales.reduce((sum: number, sale: any) => sum + sale.quantity, 0);

  // Group by product
  const productSales = sales.reduce((acc: any, sale: any) => {
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
  }, {} as Record<string, { quantity: number; revenue: number }>);

  return {
    period: `Last ${days} days`,
    totalSales: sales.length,
    totalRevenue,
    totalQuantity,
    sales: sales.slice(0, 10), // Latest 10 transactions
    productBreakdown: productSales,
  };
}

/**
 * Get expense data for the last N days
 */
export async function getExpenseData(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);

  // Group by type
  const expensesByType = expenses.reduce((acc: any, expense: any) => {
    if (!acc[expense.type]) {
      acc[expense.type] = {
        count: 0,
        total: 0,
      };
    }
    acc[expense.type].count += 1;
    acc[expense.type].total += expense.amount;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  return {
    period: `Last ${days} days`,
    totalExpenses,
    expenseCount: expenses.length,
    expenses: expenses.slice(0, 10), // Latest 10 expenses
    breakdown: expensesByType,
  };
}

/**
 * Get task statistics
 */
export async function getTaskData() {
  const tasks = await prisma.task.findMany({
    include: {
      assignedTo: {
        select: {
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  const statusBreakdown = tasks.reduce((acc: any, task: any) => {
    if (!acc[task.status]) {
      acc[task.status] = 0;
    }
    acc[task.status] += 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityBreakdown = tasks.reduce((acc: any, task: any) => {
    if (!acc[task.priority]) {
      acc[task.priority] = 0;
    }
    acc[task.priority] += 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate completion rate
  const completedTasks = tasks.filter((t: any) => t.status === "COMPLETED").length;
  const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return {
    totalTasks: tasks.length,
    completionRate: completionRate.toFixed(1) + "%",
    statusBreakdown,
    priorityBreakdown,
    recentTasks: tasks.slice(0, 10),
  };
}

/**
 * Get product inventory and performance data
 */
export async function getProductData() {
  const products = await prisma.product.findMany({
    include: {
      components: {
        select: {
          name: true,
          cost: true,
          notes: true,
        },
      },
      sales: {
        select: {
          quantity: true,
          totalPrice: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      },
    },
  });

  const productSummary = products.map((product: any) => {
    const totalSalesQuantity = product.sales.reduce((sum: number, sale: any) => sum + sale.quantity, 0);
    const totalSalesRevenue = product.sales.reduce((sum: number, sale: any) => sum + sale.totalPrice, 0);
    
    return {
      name: product.name,
      sellingPrice: product.price,
      cost: product.cost,
      profit: product.price - product.cost,
      profitMargin: product.cost > 0 ? (((product.price - product.cost) / product.cost) * 100).toFixed(1) + "%" : "N/A",
      totalSold: totalSalesQuantity,
      revenue: totalSalesRevenue,
      componentCount: product.components.length,
    };
  });

  return {
    totalProducts: products.length,
    products: productSummary,
  };
}

/**
 * Get comprehensive dashboard data
 */
export async function getDashboardData() {
  const [sales, expenses, tasks, products] = await Promise.all([
    getSalesData(30),
    getExpenseData(30),
    getTaskData(),
    getProductData(),
  ]);

  const netProfit = sales.totalRevenue - expenses.totalExpenses;
  const profitMargin = sales.totalRevenue > 0 ? ((netProfit / sales.totalRevenue) * 100).toFixed(1) : "0";

  return {
    sales,
    expenses,
    tasks,
    products,
    summary: {
      revenue: sales.totalRevenue,
      expenses: expenses.totalExpenses,
      netProfit,
      profitMargin: profitMargin + "%",
    },
  };
}

/**
 * Detect what type of query the user is asking about
 */
export function detectQueryIntent(message: string): {
  type: "sales" | "expenses" | "tasks" | "products" | "dashboard" | "general";
  days?: number;
} {
  const lowerMessage = message.toLowerCase();

  // Extract number of days if mentioned
  const daysMatch = lowerMessage.match(/(\d+)\s*(day|days|يوم|أيام)/i);
  const days = daysMatch ? parseInt(daysMatch[1]) : 30;

  if (
    lowerMessage.includes("sales") ||
    lowerMessage.includes("مبيعات") ||
    lowerMessage.includes("revenue") ||
    lowerMessage.includes("selling")
  ) {
    return { type: "sales", days };
  }

  if (
    lowerMessage.includes("expense") ||
    lowerMessage.includes("مصروفات") ||
    lowerMessage.includes("cost") ||
    lowerMessage.includes("spending")
  ) {
    return { type: "expenses", days };
  }

  if (
    lowerMessage.includes("task") ||
    lowerMessage.includes("مهام") ||
    lowerMessage.includes("productivity") ||
    lowerMessage.includes("project")
  ) {
    return { type: "tasks" };
  }

  if (
    lowerMessage.includes("product") ||
    lowerMessage.includes("منتج") ||
    lowerMessage.includes("inventory") ||
    lowerMessage.includes("stock")
  ) {
    return { type: "products" };
  }

  if (
    lowerMessage.includes("dashboard") ||
    lowerMessage.includes("overview") ||
    lowerMessage.includes("summary") ||
    lowerMessage.includes("ملخص")
  ) {
    return { type: "dashboard" };
  }

  return { type: "general" };
}
