import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";

// GET /api/sales/:id - Get a single sale
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: {
        batch: true,
        product: true,
        location: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Sale not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}

// PUT /api/sales/:id - Update a sale
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { batchId, productId, locationId, quantity, unitPrice, saleDate, notes } = body;

    const totalPrice = unitPrice && quantity 
      ? parseFloat(unitPrice) * parseInt(quantity)
      : undefined;

    const sale = await prisma.sale.update({
      where: { id: parseInt(id) },
      data: {
        ...(batchId !== undefined && { batchId: parseInt(batchId) }),
        ...(productId !== undefined && { productId: parseInt(productId) }),
        ...(locationId !== undefined && { locationId: parseInt(locationId) }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
        ...(totalPrice !== undefined && { totalPrice }),
        ...(saleDate !== undefined && { saleDate: new Date(saleDate) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        batch: true,
        product: true,
        location: true,
      },
    });

    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update sale" },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/:id - Delete a sale
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.sale.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}
