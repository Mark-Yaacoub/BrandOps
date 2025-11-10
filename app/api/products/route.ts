import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";

// GET /api/products - Retrieve all products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, formula, cost, price } = body;

    // Basic validation
    if (!name || cost === undefined || price === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, cost, and price are required fields",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        formula: formula || null,
        cost: parseFloat(cost),
        price: parseFloat(price),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create product",
      },
      { status: 500 }
    );
  }
}
