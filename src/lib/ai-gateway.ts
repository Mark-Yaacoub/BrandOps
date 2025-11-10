/**
 * AI Gateway Service
 * Connects to the custom AI API at ai.strongbeings.com
 */

interface AIGatewayRequest {
  prompt: string;
}

interface AIGatewayResponse {
  reply: string;
}

const AI_GATEWAY_URL = "https://ai.strongbeings.com/api/chat";

/**
 * Send a prompt to the AI Gateway and get a response
 */
export async function queryAIGateway(prompt: string): Promise<string> {
  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt } as AIGatewayRequest),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway returned status ${response.status}`);
    }

    const data: AIGatewayResponse = await response.json();
    
    if (!data.reply) {
      throw new Error("No reply field in AI Gateway response");
    }

    return data.reply;
  } catch (error) {
    console.error("Error querying AI Gateway:", error);
    throw new Error("Failed to get AI response");
  }
}

/**
 * Analyze sales data using AI
 */
export async function analyzeSalesWithAI(salesData: any): Promise<string> {
  const prompt = `Analyze this sales data and provide insights in English:

Sales Data:
${JSON.stringify(salesData, null, 2)}

Please provide:
1. Key trends and patterns
2. Best performing products
3. Revenue insights
4. Recommendations for improvement`;

  return queryAIGateway(prompt);
}

/**
 * Analyze expenses using AI
 */
export async function analyzeExpensesWithAI(expenseData: any): Promise<string> {
  const prompt = `Analyze these expense records and provide insights in English:

Expense Data:
${JSON.stringify(expenseData, null, 2)}

Please provide:
1. Main expense categories
2. Cost-saving opportunities
3. Budget recommendations
4. Spending patterns`;

  return queryAIGateway(prompt);
}

/**
 * Analyze tasks using AI
 */
export async function analyzeTasksWithAI(taskData: any): Promise<string> {
  const prompt = `Analyze these task records and provide productivity insights in English:

Task Data:
${JSON.stringify(taskData, null, 2)}

Please provide:
1. Completion rates
2. Bottlenecks
3. Team performance insights
4. Productivity recommendations`;

  return queryAIGateway(prompt);
}

/**
 * Get product recommendations using AI
 */
export async function getProductRecommendationsWithAI(productData: any): Promise<string> {
  const prompt = `Based on this product data, provide strategic recommendations in English:

Product Data:
${JSON.stringify(productData, null, 2)}

Please provide:
1. Product performance analysis
2. Pricing strategy suggestions
3. Inventory optimization ideas
4. Market opportunities`;

  return queryAIGateway(prompt);
}
