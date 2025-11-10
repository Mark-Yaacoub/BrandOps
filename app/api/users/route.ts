import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";
import { hashPassword, generateTempPassword } from "@/src/lib/auth";
import { sendWelcomeEmail } from "@/src/lib/email";

// GET /api/users - Get all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        // Exclude password from response
      },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role = "user" } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and email are required",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email already exists",
        },
        { status: 400 }
      );
    }

    // If no password provided, generate a temporary one
    let userPassword = password;
    let tempPassword: string | undefined;

    if (!userPassword) {
      tempPassword = generateTempPassword();
      userPassword = tempPassword;
    }

    // Hash password
    const hashedPassword = await hashPassword(userPassword);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
      },
    });

    // Send welcome email with temp password if generated
    await sendWelcomeEmail(email, name, tempPassword);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: tempPassword
          ? "User created successfully. Temporary password sent via email."
          : "User created successfully.",
        data: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create user",
      },
      { status: 500 }
    );
  }
}
