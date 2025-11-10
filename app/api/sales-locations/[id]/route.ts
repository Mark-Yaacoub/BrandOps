import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";

// GET /api/sales-locations/:id - Get a single sales location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const location = await prisma.salesLocation.findUnique({
      where: { id: parseInt(id) },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: "Sales location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: location });
  } catch (error) {
    console.error("Error fetching sales location:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales location" },
      { status: 500 }
    );
  }
}

// PUT /api/sales-locations/:id - Update a sales location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, address, city, phone, description, isActive } = body;

    const location = await prisma.salesLocation.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(phone !== undefined && { phone }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, data: location });
  } catch (error) {
    console.error("Error updating sales location:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update sales location" },
      { status: 500 }
    );
  }
}

// DELETE /api/sales-locations/:id - Delete a sales location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.salesLocation.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sales location:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete sales location" },
      { status: 500 }
    );
  }
}
