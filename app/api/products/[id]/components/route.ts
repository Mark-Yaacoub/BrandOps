import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/products/[id]/components - Get all components for a product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const productId = parseInt(id);

    const components = await prisma.productComponent.findMany({
      where: { productId },
      orderBy: { createdAt: "asc" },
    });

    // Calculate total cost
    const totalCost = components.reduce((sum: number, comp: any) => sum + comp.cost, 0);

    return NextResponse.json({
      success: true,
      data: components,
      totalCost,
    });
  } catch (error) {
    console.error("Error fetching product components:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch components" },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/components - Create a new component for a product
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const productId = parseInt(id);
    const body = await request.json();

    const { name, cost, notes } = body;

    if (!name || cost === undefined) {
      return NextResponse.json(
        { success: false, error: "Name and cost are required" },
        { status: 400 }
      );
    }

    const component = await prisma.productComponent.create({
      data: {
        productId,
        name,
        cost: parseFloat(cost),
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: component });
  } catch (error) {
    console.error("Error creating product component:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create component" },
      { status: 500 }
    );
  }
}
