import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";

// GET /api/sales - Get all sales
export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        batch: true,
        product: true,
        location: true,
      },
      orderBy: {
        saleDate: "desc",
      },
    });

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create a new sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batchId, productId, locationId, quantity, unitPrice, saleDate, notes } = body;

    if (!batchId || !productId || !locationId || !quantity || !unitPrice || !saleDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Batch, product, location, quantity, unit price, and sale date are required",
        },
        { status: 400 }
      );
    }

    const totalPrice = parseFloat(unitPrice) * parseInt(quantity);

    const sale = await prisma.sale.create({
      data: {
        batchId: parseInt(batchId),
        productId: parseInt(productId),
        locationId: parseInt(locationId),
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        totalPrice,
        saleDate: new Date(saleDate),
        notes: notes || null,
      },
      include: {
        batch: true,
        product: true,
        location: true,
      },
    });

    return NextResponse.json(
      { success: true, data: sale },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create sale" },
      { status: 500 }
    );
  }
}
