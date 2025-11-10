import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";

interface JWTPayload {
  userId: number;
  email: string;
}

async function getCurrentUserId(request: NextRequest): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// GET all chat sessions for current user
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1, // Get first message for preview
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST create new chat session
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { title } = await request.json();

    const session = await prisma.chatSession.create({
      data: {
        userId,
        title: title || "New Chat",
      },
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Error creating chat session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create session" },
      { status: 500 }
    );
  }
}
