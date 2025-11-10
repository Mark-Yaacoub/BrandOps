import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";

// DELETE /api/tasks/:taskId/comments/:commentId - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;

    await prisma.taskComment.delete({
      where: { id: parseInt(commentId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/:taskId/comments/:commentId - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const body = await request.json();
    const { content, mentionedUserIds } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content is required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Update the comment
      const comment = await tx.taskComment.update({
        where: { id: parseInt(commentId) },
        data: { content },
      });

      // Delete old mentions for this comment
      await tx.taskMention.deleteMany({
        where: { commentId: parseInt(commentId) },
      });

      // Create new mentions if any
      if (mentionedUserIds && mentionedUserIds.length > 0) {
        await tx.taskMention.createMany({
          data: mentionedUserIds.map((userId: number) => ({
            taskId: comment.taskId,
            commentId: comment.id,
            userId,
          })),
          skipDuplicates: true,
        });
      }

      // Fetch the complete comment with mentions
      return await tx.taskComment.findUnique({
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
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update comment" },
      { status: 500 }
    );
  }
}
