import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";

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
    const { content, userId, mentionedUserIds } = body;

    if (!content || !userId) {
      return NextResponse.json(
        { success: false, error: "Content and userId are required" },
        { status: 400 }
      );
    }

    // Create comment with mentions in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const comment = await tx.taskComment.create({
        data: {
          content,
          taskId: parseInt(id),
          userId: parseInt(userId),
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

    // TODO: Send email notifications to mentioned users
    // This will be implemented in the email notification step

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
