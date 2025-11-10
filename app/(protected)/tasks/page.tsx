"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Link from "next/link";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X,
  Search,
  Calendar,
  Package,
  Layers,
  CheckCircle,
  Clock,
  AlertCircle,
  SlidersHorizontal,
  GripVertical,
  Eye,
  MessageSquare,
  User
} from "lucide-react";
import { format } from "date-fns";
import AlertDialog from "@/app/components/AlertDialog";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  productId: number | null;
  product: { id: number; name: string } | null;
  batchId: number | null;
  batch: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Filters {
  priority: string;
  productId: string;
  batchId: string;
  assignedTo: string; // "all" | "me" | userId
}

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "my">("all");
  const [filters, setFilters] = useState<Filters>({
    priority: "all",
    productId: "all",
    batchId: "all",
    assignedTo: "all",
  });
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "confirm" | "success" | "error" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "confirm",
  });
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
    productId: "",
    batchId: "",
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ success: boolean; data: Task[] }>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks");
      const json = await res.json();
      console.log("Tasks API Response:", json);
      console.log("Tasks data:", json.data);
      console.log("Tasks count:", json.data?.length);
      return json;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return res.json();
    },
  });

  const { data: batchesData } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const res = await fetch("/api/batches");
      return res.json();
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      return res.json();
    },
  });

  const { data: currentUserData } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      console.log("Current User:", json.data);
      return json;
    },
  });

  const currentUserId = currentUserData?.data?.id;
  console.log("Current User ID:", currentUserId);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setAlertDialog({ ...alertDialog, isOpen: false });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    updateTaskStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleDelete = (id: number, taskTitle: string) => {
    setAlertDialog({
      isOpen: true,
      title: "Delete Task",
      message: `Are you sure you want to delete "${taskTitle}"?\n\nThis action cannot be undone.`,
      type: "confirm",
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  const openModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : "",
        productId: task.productId?.toString() || "",
        batchId: task.batchId?.toString() || "",
      });
    } else {
      setEditingTask(null);
      setFormData({ title: "", description: "", status: "pending", priority: "medium", dueDate: "", productId: "", batchId: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let result = data?.data || [];
    console.log("=== FILTER DEBUG ===");
    console.log("All tasks before filtering:", result.length);
    console.log("View mode:", viewMode);
    console.log("Current user ID for filtering:", currentUserId);
    
    // Log first task's assignedToId if exists
    if (result.length > 0) {
      console.log("First task assignedToId:", (result[0] as any).assignedToId);
      console.log("First task createdById:", (result[0] as any).createdById);
    }

    // View Mode filter (My Tasks vs All Tasks)
    if (viewMode === "my" && currentUserId) {
      console.log("Applying 'my tasks' filter...");
      // Show only tasks assigned to me
      const beforeCount = result.length;
      result = result.filter((task) => {
        const isAssigned = (task as any).assignedToId === currentUserId;
        console.log(`Task "${task.title}" - assignedToId: ${(task as any).assignedToId}, currentUserId: ${currentUserId}, match: ${isAssigned}`);
        return isAssigned;
      });
      console.log(`Tasks after 'my' filter: ${result.length} (from ${beforeCount})`);
    } else {
      console.log("NOT applying filter - viewMode:", viewMode, "currentUserId:", currentUserId);
    }

    // Search filter
    if (searchTerm) {
      result = result.filter((task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.batch?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Priority filter (removed status filter for Kanban)
    if (filters.priority !== "all") {
      result = result.filter((task) => task.priority === filters.priority);
    }

    // Product filter
    if (filters.productId !== "all") {
      result = result.filter((task) => task.productId === parseInt(filters.productId));
    }

    // Batch filter
    if (filters.batchId !== "all") {
      result = result.filter((task) => task.batchId === parseInt(filters.batchId));
    }

    // Assigned To filter
    if (filters.assignedTo !== "all" && currentUserId) {
      if (filters.assignedTo === "me") {
        result = result.filter((task) => (task as any).assignedToId === currentUserId);
      } else if (filters.assignedTo === "unassigned") {
        result = result.filter((task) => !(task as any).assignedToId);
      } else {
        result = result.filter((task) => (task as any).assignedToId === parseInt(filters.assignedTo));
      }
    }

    return result;
  }, [data?.data, searchTerm, filters, viewMode, currentUserId]);

  // Group tasks by status for Kanban
  const tasksByStatus = useMemo(() => {
    const pending = filteredTasks.filter(t => t.status === "pending");
    const inProgress = filteredTasks.filter(t => t.status === "in-progress");
    const completed = filteredTasks.filter(t => t.status === "completed");

    return {
      pending,
      "in-progress": inProgress,
      completed
    };
  }, [filteredTasks]);

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t: Task) => t.status === "completed").length;
  const pendingTasks = filteredTasks.filter((t: Task) => t.status === "pending").length;
  const inProgressTasks = filteredTasks.filter((t: Task) => t.status === "in-progress").length;

  const clearFilters = () => {
    setFilters({
      priority: "all",
      productId: "all",
      batchId: "all",
      assignedTo: "all",
    });
    setSearchTerm("");
    setViewMode("all");
  };

  const hasActiveFilters = 
    searchTerm || 
    viewMode === "my" ||
    filters.priority !== "all" || 
    filters.productId !== "all" || 
    filters.batchId !== "all" ||
    filters.assignedTo !== "all";

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage and track tasks</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="bg-white border border-gray-300 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "all"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setViewMode("my")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "my"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              My Tasks
            </button>
          </div>

          <Link
            href="/tasks/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
              <p className="text-sm text-gray-500">
                {viewMode === "my" ? "My Total" : "Total Tasks"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{inProgressTasks}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingTasks}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks by title, description, product, or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                <select
                  value={filters.assignedTo}
                  onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                >
                  <option value="all">All Users</option>
                  <option value="me">Assigned to Me</option>
                  <option value="unassigned">Unassigned</option>
                  {usersData?.data?.map((user: any) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select
                  value={filters.productId}
                  onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                >
                  <option value="all">All Products</option>
                  {productsData?.data?.map((product: any) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
                <select
                  value={filters.batchId}
                  onChange={(e) => setFilters({ ...filters, batchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                >
                  <option value="all">All Batches</option>
                  {batchesData?.data?.map((batch: any) => (
                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-between">
                {viewMode === "my" && (
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm">
                    <User className="w-4 h-4" />
                    Viewing: My Tasks Only
                  </div>
                )}
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-auto"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow border border-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg text-gray-500">Loading tasks...</div>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 px-6 py-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500 mb-4">
            {hasActiveFilters
              ? "Try adjusting your filters or search term"
              : "Get started by adding your first task"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pending Column */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Pending</h3>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tasksByStatus.pending.length}
                  </span>
                </div>
              </div>

              <Droppable droppableId="pending">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[500px] transition-colors ${
                      snapshot.isDraggingOver ? "bg-yellow-50" : ""
                    }`}
                  >
                    {tasksByStatus.pending.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg p-4 shadow border border-gray-200 hover:shadow-md transition-all ${
                              snapshot.isDragging ? "shadow-lg ring-2 ring-blue-500" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-2 flex-1">
                                <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                                  {task.description && (
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(task.dueDate), "MMM dd")}
                                </div>
                              )}
                            </div>

                            {(task.product || task.batch) && (
                              <div className="flex items-center gap-3 mb-3 text-xs text-gray-600">
                                {task.product && (
                                  <div className="flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    {task.product.name}
                                  </div>
                                )}
                                {task.batch && (
                                  <div className="flex items-center gap-1">
                                    <Layers className="w-3 h-3" />
                                    {task.batch.name}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <Link
                                href={`/tasks/${task.id}`}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <Eye className="w-3 h-3 inline mr-1" />
                                View
                              </Link>
                              <div className="flex items-center gap-3">
                                {(task as any)._count?.comments > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <MessageSquare className="w-3 h-3" />
                                    {(task as any)._count.comments}
                                  </div>
                                )}
                                {(task as any).assignedTo && (
                                  <div 
                                    className="flex items-center gap-1 text-xs text-gray-600" 
                                    title={`Assigned to ${(task as any).assignedTo.name}`}
                                  >
                                    <User className="w-3 h-3" />
                                    <span className="max-w-[80px] truncate">{(task as any).assignedTo.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* In Progress Column */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">In Progress</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tasksByStatus["in-progress"].length}
                  </span>
                </div>
              </div>

              <Droppable droppableId="in-progress">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[500px] transition-colors ${
                      snapshot.isDraggingOver ? "bg-blue-50" : ""
                    }`}
                  >
                    {tasksByStatus["in-progress"].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg p-4 shadow border border-gray-200 hover:shadow-md transition-all ${
                              snapshot.isDragging ? "shadow-lg ring-2 ring-blue-500" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-2 flex-1">
                                <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                                  {task.description && (
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(task.dueDate), "MMM dd")}
                                </div>
                              )}
                            </div>

                            {(task.product || task.batch) && (
                              <div className="flex items-center gap-3 mb-3 text-xs text-gray-600">
                                {task.product && (
                                  <div className="flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    {task.product.name}
                                  </div>
                                )}
                                {task.batch && (
                                  <div className="flex items-center gap-1">
                                    <Layers className="w-3 h-3" />
                                    {task.batch.name}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <Link
                                href={`/tasks/${task.id}`}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <Eye className="w-3 h-3 inline mr-1" />
                                View
                              </Link>
                              <div className="flex items-center gap-3">
                                {(task as any)._count?.comments > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <MessageSquare className="w-3 h-3" />
                                    {(task as any)._count.comments}
                                  </div>
                                )}
                                {(task as any).assignedTo && (
                                  <div 
                                    className="flex items-center gap-1 text-xs text-gray-600" 
                                    title={`Assigned to ${(task as any).assignedTo.name}`}
                                  >
                                    <User className="w-3 h-3" />
                                    <span className="max-w-[80px] truncate">{(task as any).assignedTo.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Completed Column */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Completed</h3>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tasksByStatus.completed.length}
                  </span>
                </div>
              </div>

              <Droppable droppableId="completed">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[500px] transition-colors ${
                      snapshot.isDraggingOver ? "bg-green-50" : ""
                    }`}
                  >
                    {tasksByStatus.completed.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg p-4 shadow border border-gray-200 hover:shadow-md transition-all ${
                              snapshot.isDragging ? "shadow-lg ring-2 ring-blue-500" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-2 flex-1">
                                <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                                  {task.description && (
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(task.dueDate), "MMM dd")}
                                </div>
                              )}
                            </div>

                            {(task.product || task.batch) && (
                              <div className="flex items-center gap-3 mb-3 text-xs text-gray-600">
                                {task.product && (
                                  <div className="flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    {task.product.name}
                                  </div>
                                )}
                                {task.batch && (
                                  <div className="flex items-center gap-1">
                                    <Layers className="w-3 h-3" />
                                    {task.batch.name}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <Link
                                href={`/tasks/${task.id}`}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <Eye className="w-3 h-3 inline mr-1" />
                                View
                              </Link>
                              <div className="flex items-center gap-3">
                                {(task as any)._count?.comments > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <MessageSquare className="w-3 h-3" />
                                    {(task as any)._count.comments}
                                  </div>
                                )}
                                {(task as any).assignedTo && (
                                  <div 
                                    className="flex items-center gap-1 text-xs text-gray-600" 
                                    title={`Assigned to ${(task as any).assignedTo.name}`}
                                  >
                                    <User className="w-3 h-3" />
                                    <span className="max-w-[80px] truncate">{(task as any).assignedTo.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </DragDropContext>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editingTask ? "Edit Task" : "Add Task"}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {productsData?.data?.map((product: any) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                <select
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {batchesData?.data?.map((batch: any) => (
                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingTask ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        onConfirm={alertDialog.onConfirm}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
