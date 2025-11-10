import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";
import { hashPassword, generateTempPassword } from "@/src/lib/auth";
import { sendPasswordChangeConfirmation } from "@/src/lib/email";

// POST /api/auth/forgot-password - Reset password and send new one via email
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
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists with this email, a new password has been sent.",
        },
        { status: 200 }
      );
    }

    // Generate new temporary password
    const newPassword = generateTempPassword();
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Send email with new password
    await sendPasswordChangeConfirmation(user.email, user.name, newPassword);

    return NextResponse.json(
      {
        success: true,
        message: "A new password has been sent to your email address.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reset password. Please try again later.",
      },
      { status: 500 }
    );
  }
}
