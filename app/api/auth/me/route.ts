import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";
import { verifyJwt } from "@/src/lib/auth";

// GET /api/auth/me - Get current user info
export async function GET(request: NextRequest) {
  try {
    // Try to get token from Authorization header or cookie
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value; // Changed from auth_token to token
    
    let token: string | null = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "No authentication token provided",
        },
        { status: 401 }
      );
    }

    // Verify JWT
    const payload = verifyJwt(token);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is deactivated",
        },
        { status: 403 }
      );
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        data: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting current user:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get user information",
      },
      { status: 500 }
    );
  }
}
