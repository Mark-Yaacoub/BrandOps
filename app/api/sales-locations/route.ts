import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";

// GET /api/sales-locations - Get all sales locations
export async function GET() {
  try {
    const locations = await prisma.salesLocation.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error("Error fetching sales locations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales locations" },
      { status: 500 }
    );
  }
}

// POST /api/sales-locations - Create a new sales location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, city, phone, description } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Name is required",
        },
        { status: 400 }
      );
    }

    const location = await prisma.salesLocation.create({
      data: {
        name,
        address: address || null,
        city: city || null,
        phone: phone || null,
        description: description || null,
      },
    });

    return NextResponse.json(
      { success: true, data: location },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating sales location:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create sales location" },
      { status: 500 }
    );
  }
}
