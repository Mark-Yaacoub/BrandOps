import { NextRequest, NextResponse } from "next/server";
import { queryAIGateway, analyzeSalesWithAI, analyzeExpensesWithAI, analyzeTasksWithAI, getProductRecommendationsWithAI } from "@/src/lib/ai-gateway";
import { getSalesData, getExpenseData, getTaskData, getProductData, getDashboardData, detectQueryIntent } from "@/src/lib/analytics";
import prisma from "@/src/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";

interface JWTPayload {
  userId: number;
  email: string;
}

async function getCurrentUserId(request: NextRequest): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Detect what the user is asking about
    const intent = detectQueryIntent(message);
    let response = "";

    try {
      // Handle based on intent
      switch (intent.type) {
        case "sales": {
          // Fetch real sales data from database
          const salesData = await getSalesData(intent.days || 30);
          
          // Build a summary for the AI
          const summary = `Sales Data (Last ${intent.days || 30} days):
- Total Sales: ${salesData.totalSales} transactions
- Total Revenue: $${salesData.totalRevenue.toLocaleString()} USD
- Total Quantity Sold: ${salesData.totalQuantity} units

Top Products:
${Object.entries(salesData.productBreakdown)
  .sort(([, a]: any, [, b]: any) => b.revenue - a.revenue)
  .slice(0, 5)
  .map(([name, data]: any) => `- ${name}: ${data.quantity} units, $${data.revenue.toLocaleString()} USD`)
  .join('\n')}`;

          // Get AI analysis
          response = await analyzeSalesWithAI(summary);
          break;
        }

        case "expenses": {
          // Fetch real expense data from database
          const expenseData = await getExpenseData(intent.days || 30);
          
          const summary = `Expense Data (Last ${intent.days || 30} days):
- Total Expenses: $${expenseData.totalExpenses.toLocaleString()} USD
- Number of Expenses: ${expenseData.expenseCount}

Breakdown by Type:
${Object.entries(expenseData.breakdown)
  .sort(([, a]: any, [, b]: any) => b.total - a.total)
  .map(([type, data]: any) => `- ${type}: ${data.count} items, $${data.total.toLocaleString()} USD`)
  .join('\n')}`;

          // Get AI analysis
          response = await analyzeExpensesWithAI(summary);
          break;
        }

        case "tasks": {
          // Fetch real task data from database
          const taskData = await getTaskData();
          
          const summary = `Task Statistics:
- Total Tasks: ${taskData.totalTasks}
- Completion Rate: ${taskData.completionRate}

Status Breakdown:
${Object.entries(taskData.statusBreakdown)
  .map(([status, count]) => `- ${status}: ${count}`)
  .join('\n')}

Priority Breakdown:
${Object.entries(taskData.priorityBreakdown)
  .map(([priority, count]) => `- ${priority}: ${count}`)
  .join('\n')}`;

          // Get AI analysis
          response = await analyzeTasksWithAI(summary);
          break;
        }

        case "products": {
          // Fetch real product data from database
          const productData = await getProductData();
          
          const summary = `Product Inventory (${productData.totalProducts} products):

Top Performers:
${productData.products
  .sort((a: any, b: any) => b.revenue - a.revenue)
  .slice(0, 5)
  .map((p: any) => `- ${p.name}: ${p.totalSold} sold, $${p.revenue.toLocaleString()} USD revenue, ${p.profitMargin} margin`)
  .join('\n')}

Profit Analysis:
${productData.products
  .slice(0, 5)
  .map((p: any) => `- ${p.name}: Cost $${p.cost} USD, Price $${p.sellingPrice} USD, Profit $${p.profit} USD`)
  .join('\n')}`;

          // Get AI analysis
          response = await getProductRecommendationsWithAI(summary);
          break;
        }

        case "dashboard": {
          // Fetch comprehensive dashboard data
          const dashboardData = await getDashboardData();
          
          const summary = `Business Overview:

Financial Summary:
- Revenue (30 days): $${dashboardData.summary.revenue.toLocaleString()} USD
- Expenses (30 days): $${dashboardData.summary.expenses.toLocaleString()} USD
- Net Profit: $${dashboardData.summary.netProfit.toLocaleString()} USD
- Profit Margin: ${dashboardData.summary.profitMargin}

Sales: ${dashboardData.sales.totalSales} transactions
Products: ${dashboardData.products.totalProducts} items
Tasks: ${dashboardData.tasks.totalTasks} (${dashboardData.tasks.completionRate} complete)`;

          // Get AI analysis
          response = await queryAIGateway(`Analyze this business data and provide strategic insights:\n\n${summary}`);
          break;
        }

        case "general":
        default: {
          // For general questions, just use the AI without database queries
          response = await queryAIGateway(message);
          break;
        }
      }

      // Save messages to database if sessionId provided
      if (sessionId) {
        // Verify session belongs to user
        const session = await prisma.chatSession.findFirst({
          where: {
            id: parseInt(sessionId),
            userId,
          },
        });

        if (session) {
          // Save user message
          await prisma.chatMessage.create({
            data: {
              sessionId: parseInt(sessionId),
              userId,
              role: "user",
              content: message,
            },
          });

          // Save AI response
          await prisma.chatMessage.create({
            data: {
              sessionId: parseInt(sessionId),
              userId,
              role: "assistant",
              content: response,
            },
          });

          // Update session's updatedAt timestamp
          await prisma.chatSession.update({
            where: { id: parseInt(sessionId) },
            data: { updatedAt: new Date() },
          });
        }
      }

      return NextResponse.json({
        success: true,
        response,
      });

    } catch (aiError) {
      console.error("AI Gateway Error:", aiError);
      
      // Fallback to basic response if AI fails
      return NextResponse.json({
        success: true,
        response: "I'm having trouble connecting to the AI service right now. Please try again in a moment, or contact support if the issue persists.",
      });
    }

  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process message" },
      { status: 500 }
    );
  }
}
