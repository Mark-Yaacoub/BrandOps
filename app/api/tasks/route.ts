import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/db";
import { verifyJwt } from "@/src/lib/auth";
import { cookies } from "next/headers";
import { sendTaskAssignmentEmail, sendTaskMentionEmail } from "@/src/lib/email";

// GET /api/tasks - Get all tasks
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        product: true,
        batch: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    // Get user from token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyJwt(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const currentUserId = decoded.userId;

    const body = await request.json();
    const { 
      title, 
      description, 
      status, 
      priority, 
      dueDate, 
      productId, 
      batchId,
      assignedToId,
      mentionedUserIds 
    } = body;

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Title is required",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const task = await tx.task.create({
        data: {
          title,
          description: description || null,
          status: status || "pending",
          priority: priority || "medium",
          dueDate: dueDate ? new Date(dueDate) : null,
          productId: productId ? parseInt(productId) : null,
          batchId: batchId ? parseInt(batchId) : null,
          assignedToId: assignedToId ? parseInt(assignedToId) : null,
          createdById: currentUserId, // Use current user from token
        },
        include: {
          product: true,
          batch: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
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
          data: mentionedUserIds.map((userId: number) => ({
            taskId: task.id,
            userId,
          })),
          skipDuplicates: true,
        });
      }

      return task;
    });

    // Send emails after task creation (non-blocking)
    const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks/${result.id}`;
    
    // Send assignment email
    if (result.assignedTo) {
      const assignedByName = result.createdBy?.name || 'System';
      
      sendTaskAssignmentEmail({
        to: result.assignedTo.email,
        userName: result.assignedTo.name,
        taskTitle: result.title,
        taskDescription: result.description || undefined,
        taskUrl,
        assignedBy: assignedByName,
      }).catch(err => console.error('Failed to send assignment email:', err));
    }

    // Send mention emails
    if (mentionedUserIds && mentionedUserIds.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { id: { in: mentionedUserIds } },
        select: { id: true, name: true, email: true },
      });

      const mentionedByName = result.createdBy?.name || 'System';
      
      for (const user of mentionedUsers) {
        sendTaskMentionEmail({
          to: user.email,
          userName: user.name,
          taskTitle: result.title,
          mentionedBy: mentionedByName,
          taskUrl,
          comment: result.description || undefined,
        }).catch(err => console.error('Failed to send mention email:', err));
      }
    }

    // TODO: Send email notifications

    return NextResponse.json(
      { success: true, data: result },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create task" },
      { status: 500 }
    );
  }
}
