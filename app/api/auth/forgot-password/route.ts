import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";
import { generateResetToken } from "@/src/lib/auth";
import { sendPasswordResetEmail } from "@/src/lib/email";

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists with this email, a password reset link has been sent",
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    return NextResponse.json(
      {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process password reset request",
      },
      { status: 500 }
    );
  }
}
