import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/components/[id] - Get a single component
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const componentId = parseInt(id);

    const component = await prisma.productComponent.findUnique({
      where: { id: componentId },
      include: { product: true },
    });

    if (!component) {
      return NextResponse.json(
        { success: false, error: "Component not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: component });
  } catch (error) {
    console.error("Error fetching component:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch component" },
      { status: 500 }
    );
  }
}

// PUT /api/components/[id] - Update a component
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const componentId = parseInt(id);
    const body = await request.json();

    const { name, cost, notes } = body;

    const component = await prisma.productComponent.update({
      where: { id: componentId },
      data: {
        name,
        cost: parseFloat(cost),
        notes: notes || null,
      },
    });

    // Recalculate product total cost from all components
    const allComponents = await prisma.productComponent.findMany({
      where: { productId: component.productId },
    });
    const totalCost = allComponents.reduce((sum: number, comp: any) => sum + comp.cost, 0);
    
    await prisma.product.update({
      where: { id: component.productId },
      data: { cost: totalCost },
    });

    return NextResponse.json({ success: true, data: component });
  } catch (error) {
    console.error("Error updating component:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update component" },
      { status: 500 }
    );
  }
}

// DELETE /api/components/[id] - Delete a component
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const componentId = parseInt(id);

    // Get component before deleting to know productId
    const component = await prisma.productComponent.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      return NextResponse.json(
        { success: false, error: "Component not found" },
        { status: 404 }
      );
    }

    const productId = component.productId;

    await prisma.productComponent.delete({
      where: { id: componentId },
    });

    // Recalculate product total cost from remaining components
    const remainingComponents = await prisma.productComponent.findMany({
      where: { productId },
    });
    const totalCost = remainingComponents.reduce((sum: number, comp: any) => sum + comp.cost, 0);
    
    await prisma.product.update({
      where: { id: productId },
      data: { cost: totalCost },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting component:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete component" },
      { status: 500 }
    );
  }
}
