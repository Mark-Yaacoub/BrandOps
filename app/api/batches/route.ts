import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";

// GET /api/batches - Get all batches
export async function GET() {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: batches });
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

// POST /api/batches - Create a new batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, products, status, startDate, endDate, targetSegments, targetSalesLocations } = body;

    if (!name || !products || products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and at least one product are required",
        },
        { status: 400 }
      );
    }

    // Get product details to calculate costs
    const productIds = products.map((p: any) => parseInt(p.productId));
    const productsData = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, cost: true },
    });

    const productCostMap = new Map(productsData.map((p: any) => [p.id, p.cost]));

    const batch = await prisma.batch.create({
      data: {
        name,
        status: status || "pending",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        targetSegments: targetSegments || null,
        targetSalesLocations: targetSalesLocations || null,
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
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: batch },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating batch:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create batch" },
      { status: 500 }
    );
  }
}
