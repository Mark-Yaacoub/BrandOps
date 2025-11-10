"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Package,
  Layers,
  User,
  Clock,
  MessageSquare,
  Send,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { id: number; name: string };
  batch?: { id: number; name: string };
  assignedTo?: { id: number; name: string; email: string };
  createdBy?: { id: number; name: string; email: string };
  comments: Comment[];
  mentions: Mention[];
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: { id: number; name: string; email: string };
  mentions: Mention[];
}

interface Mention {
  id: number;
  user: { id: number; name: string; email: string };
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const taskId = params.id as string;

  const [comment, setComment] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentions, setSelectedMentions] = useState<number[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Fetch task details
  const { data: taskData, isLoading } = useQuery<{ success: boolean; data: Task }>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`);
      return res.json();
    },
  });

  // Fetch users for mentions
  const { data: usersData } = useQuery<{ success: boolean; data: User[] }>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      return res.json();
    },
  });

  const task = taskData?.data;
  const users = usersData?.data || [];

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; userId: number; mentionedUserIds: number[] }) => {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setComment("");
      setSelectedMentions([]);
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setComment(value);
    setCursorPosition(cursorPos);

    // Check if user is typing @ for mentions
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ")) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const selectMention = (user: User) => {
    const textBeforeCursor = comment.substring(0, cursorPosition);
    const textAfterCursor = comment.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    const newComment =
      textBeforeCursor.substring(0, lastAtIndex) +
      `@${user.name} ` +
      textAfterCursor;
    
    setComment(newComment);
    setShowMentions(false);
    setMentionQuery("");
    
    if (!selectedMentions.includes(user.id)) {
      setSelectedMentions([...selectedMentions, user.id]);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    
    // TODO: Get current user ID from session/auth
    const currentUserId = 1; // Placeholder
    
    addCommentMutation.mutate({
      content: comment,
      userId: currentUserId,
      mentionedUserIds: selectedMentions,
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      "in-progress": "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-orange-100 text-orange-800",
      high: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-500">Loading task...</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Task Not Found</h2>
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800">
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                {task.priority} priority
              </span>
            </div>
          </div>

          <Link
            href={`/tasks/${taskId}/edit`}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Task
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            {task.description ? (
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            ) : (
              <p className="text-gray-500 italic">No description provided</p>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Comments ({task.comments.length})
              </h2>
            </div>

            {/* Comment List */}
            <div className="space-y-4 mb-6">
              {task.comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
              ) : (
                task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-medium text-gray-900">{comment.user.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {format(new Date(comment.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete comment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      {comment.mentions.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">Mentioned:</span>
                          {comment.mentions.map((mention) => (
                            <span
                              key={mention.id}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                            >
                              @{mention.user.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="relative">
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={handleCommentChange}
                  placeholder="Write a comment... Type @ to mention someone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
                
                {/* Mention Dropdown */}
                {showMentions && filteredUsers.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => selectMention(user)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedMentions.length > 0 && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">Mentioning:</span>
                  {selectedMentions.map((userId) => {
                    const user = users.find((u) => u.id === userId);
                    return user ? (
                      <span
                        key={userId}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                      >
                        @{user.name}
                        <button
                          onClick={() => setSelectedMentions(selectedMentions.filter((id) => id !== userId))}
                          className="hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSubmitComment}
                  disabled={!comment.trim() || addCommentMutation.isPending}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {addCommentMutation.isPending ? "Sending..." : "Send Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Details */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Task Details</h3>
            
            <div className="space-y-4">
              {/* Assigned To */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <User className="w-4 h-4" />
                  <span>Assigned To</span>
                </div>
                {task.assignedTo ? (
                  <div className="ml-6">
                    <div className="font-medium text-gray-900">{task.assignedTo.name}</div>
                    <div className="text-sm text-gray-500">{task.assignedTo.email}</div>
                  </div>
                ) : (
                  <div className="ml-6 text-sm text-gray-500 italic">Unassigned</div>
                )}
              </div>

              {/* Created By */}
              {task.createdBy && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <User className="w-4 h-4" />
                    <span>Created By</span>
                  </div>
                  <div className="ml-6">
                    <div className="font-medium text-gray-900">{task.createdBy.name}</div>
                    <div className="text-sm text-gray-500">{task.createdBy.email}</div>
                  </div>
                </div>
              )}

              {/* Due Date */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due Date</span>
                </div>
                <div className="ml-6 font-medium text-gray-900">
                  {task.dueDate ? format(new Date(task.dueDate), "MMMM dd, yyyy") : "No due date"}
                </div>
              </div>

              {/* Product */}
              {task.product && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Package className="w-4 h-4" />
                    <span>Product</span>
                  </div>
                  <div className="ml-6 font-medium text-gray-900">{task.product.name}</div>
                </div>
              )}

              {/* Batch */}
              {task.batch && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Layers className="w-4 h-4" />
                    <span>Batch</span>
                  </div>
                  <div className="ml-6 font-medium text-gray-900">{task.batch.name}</div>
                </div>
              )}

              {/* Created At */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Created</span>
                </div>
                <div className="ml-6 text-sm text-gray-900">
                  {format(new Date(task.createdAt), "MMMM dd, yyyy 'at' HH:mm")}
                </div>
              </div>

              {/* Updated At */}
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Last Updated</span>
                </div>
                <div className="ml-6 text-sm text-gray-900">
                  {format(new Date(task.updatedAt), "MMMM dd, yyyy 'at' HH:mm")}
                </div>
              </div>
            </div>
          </div>

          {/* Mentions */}
          {task.mentions.length > 0 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Mentioned Users</h3>
              <div className="space-y-2">
                {task.mentions.map((mention) => (
                  <div key={mention.id} className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{mention.user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
