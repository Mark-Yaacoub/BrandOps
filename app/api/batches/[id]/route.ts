import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";

// GET /api/batches/:id - Get a single batch
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = await prisma.batch.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: {
          include: {
            product: true,
          },
        },
        expenses: true,
        tasks: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    console.error("Error fetching batch:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch batch" },
      { status: 500 }
    );
  }
}

// PUT /api/batches/:id - Update a batch
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, products, status, startDate, endDate, targetSegments, targetSalesLocations } = body;

    // Delete existing products and create new ones
    await prisma.batchProduct.deleteMany({
      where: { batchId: parseInt(id) },
    });

    // Get product details to calculate costs if products are being updated
    let productCostMap = new Map();
    if (products && products.length > 0) {
      const productIds = products.map((p: any) => parseInt(p.productId));
      const productsData = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, cost: true },
      });
      productCostMap = new Map(productsData.map((p: any) => [p.id, p.cost]));
    }

    const batch = await prisma.batch.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(targetSegments !== undefined && { targetSegments }),
        ...(targetSalesLocations !== undefined && { targetSalesLocations }),
        ...(products && {
          products: {
            create: products.map((p: any) => {
              const productId = parseInt(p.productId);
              const quantity = parseInt(p.quantity);
              const productCost = Number(productCostMap.get(productId) || 0);
              
              // Use provided cost if available, otherwise calculate from product cost
              const cost = p.cost !== undefined && p.cost !== null 
                ? parseFloat(p.cost) 
                : productCost * quantity;

              return {
                productId,
                quantity,
                cost,
              };
            }),
          },
        }),
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    console.error("Error updating batch:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update batch" },
      { status: 500 }
    );
  }
}

// DELETE /api/batches/:id - Delete a batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.batch.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting batch:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete batch" },
      { status: 500 }
    );
  }
}
