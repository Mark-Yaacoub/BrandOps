import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";
import { hashPassword } from "@/src/lib/auth";
import { sendPasswordChangeConfirmation } from "@/src/lib/email";

// POST /api/auth/reset-password - Reset password with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // Validation
    if (!token || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Token and new password are required",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long",
        },
        { status: 400 }
      );
    }

    // Find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset token",
        },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Reset token has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Delete used token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    // Send confirmation email
    await sendPasswordChangeConfirmation(resetToken.user.email, resetToken.user.name);

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successful. You can now log in with your new password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reset password",
      },
      { status: 500 }
    );
  }
}
