import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";
import { sendTaskMentionEmail } from "@/src/lib/email";
import { cookies } from "next/headers";
import { verifyJwt } from "@/src/lib/auth";

// GET /api/tasks/:id/comments - Get all comments for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const comments = await prisma.taskComment.findMany({
      where: { taskId: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/:id/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, mentionedUserIds } = body;

    // Get current user from JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyJwt(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const currentUserId = decoded.userId;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content is required" },
        { status: 400 }
      );
    }

    // Create comment with mentions in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const comment = await tx.taskComment.create({
        data: {
          content,
          taskId: parseInt(id),
          userId: currentUserId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create mentions if any
      if (mentionedUserIds && mentionedUserIds.length > 0) {
        await tx.taskMention.createMany({
          data: mentionedUserIds.map((mentionedUserId: number) => ({
            taskId: parseInt(id),
            commentId: comment.id,
            userId: mentionedUserId,
          })),
          skipDuplicates: true,
        });
      }

      // Fetch the complete comment with mentions
      const completeComment = await tx.taskComment.findUnique({
        where: { id: comment.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          mentions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return completeComment;
    });

    // Send email notifications to mentioned users (non-blocking)
    if (mentionedUserIds && mentionedUserIds.length > 0) {
      const task = await prisma.task.findUnique({
        where: { id: parseInt(id) },
        select: { id: true, title: true },
      });

      const mentionedUsers = await prisma.user.findMany({
        where: { id: { in: mentionedUserIds } },
        select: { id: true, name: true, email: true },
      });

      const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks/${id}`;

      if (task && result) {
        for (const user of mentionedUsers) {
          sendTaskMentionEmail({
            to: user.email,
            userName: user.name,
            taskTitle: task.title,
            mentionedBy: result.user.name,
            taskUrl,
            comment: result.content,
          }).catch(err => console.error('Failed to send mention email:', err));
        }
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
