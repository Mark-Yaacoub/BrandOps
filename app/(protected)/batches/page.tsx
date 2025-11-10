"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import AlertDialog from "@/app/components/AlertDialog";

interface BatchProduct {
  id: number;
  productId: number;
  quantity: number;
  cost: number;
  product: { id: number; name: string };
}

interface Batch {
  id: number;
  name: string;
  products: BatchProduct[];
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export default function BatchesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: "all",
    minQuantity: "",
    maxQuantity: "",
    minCost: "",
    maxCost: "",
    sortBy: "createdAt",
    sortOrder: "desc" as "asc" | "desc",
  });
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    type: "confirm" | "success" | "error";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "confirm",
    title: "",
    message: "",
  });

  const { data, isLoading } = useQuery<{ success: boolean; data: Batch[] }>({
    queryKey: ["batches"],
    queryFn: async () => {
      const res = await fetch("/api/batches");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/batches/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete batch");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setAlertDialog({
        isOpen: true,
        type: "success",
        title: "Success!",
        message: "Batch deleted successfully!",
      });
    },
    onError: () => {
      setAlertDialog({
        isOpen: true,
        type: "error",
        title: "Error!",
        message: "Failed to delete batch. Please try again.",
      });
    },
  });

  const handleDelete = (id: number, batchNumber: string) => {
    setAlertDialog({
      isOpen: true,
      type: "confirm",
      title: "Delete Batch",
      message: `Are you sure you want to delete batch "${batchNumber}"?\n\nThis action cannot be undone.`,
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  // Filter and search batches
  const filteredBatches = useMemo(() => {
    if (!data?.data) return [];

    let filtered = [...data.data];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (batch) =>
          batch.name.toLowerCase().includes(search) ||
          batch.products.some(bp => bp.product.name.toLowerCase().includes(search)) ||
          batch.status.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((b) => b.status === filters.status);
    }

    // Quantity filters (sum of all products in batch)
    if (filters.minQuantity) {
      filtered = filtered.filter((b) => {
        const totalQty = b.products.reduce((sum, p) => sum + p.quantity, 0);
        return totalQty >= parseInt(filters.minQuantity);
      });
    }
    if (filters.maxQuantity) {
      filtered = filtered.filter((b) => {
        const totalQty = b.products.reduce((sum, p) => sum + p.quantity, 0);
        return totalQty <= parseInt(filters.maxQuantity);
      });
    }

    // Cost filters (sum of all products in batch)
    if (filters.minCost) {
      filtered = filtered.filter((b) => {
        const totalCost = b.products.reduce((sum, p) => sum + p.cost, 0);
        return totalCost >= parseFloat(filters.minCost);
      });
    }
    if (filters.maxCost) {
      filtered = filtered.filter((b) => {
        const totalCost = b.products.reduce((sum, p) => sum + p.cost, 0);
        return totalCost <= parseFloat(filters.maxCost);
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case "batchNumber":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "quantity":
          aValue = a.products.reduce((sum, p) => sum + p.quantity, 0);
          bValue = b.products.reduce((sum, p) => sum + p.quantity, 0);
          break;
        case "cost":
          aValue = a.products.reduce((sum, p) => sum + p.cost, 0);
          bValue = b.products.reduce((sum, p) => sum + p.cost, 0);
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [data, searchTerm, filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBatches = filteredBatches.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const clearFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
    setFilters({
      status: "all",
      minQuantity: "",
      maxQuantity: "",
      minCost: "",
      maxCost: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      "in-progress": "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batches</h1>
          <p className="text-gray-500 mt-1">
            Manage production batches ({filteredBatches.length} {filteredBatches.length === 1 ? "batch" : "batches"})
          </p>
        </div>
        <Link
          href="/batches/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Batch
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search batches by number, product, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
          {(searchTerm || filters.status !== "all" || filters.minQuantity || filters.maxQuantity || filters.minCost || filters.maxCost) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Quantity Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minQuantity}
                    onChange={(e) => setFilters({ ...filters, minQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxQuantity}
                    onChange={(e) => setFilters({ ...filters, maxQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* Cost Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Min"
                    value={filters.minCost}
                    onChange={(e) => setFilters({ ...filters, minCost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={filters.maxCost}
                    onChange={(e) => setFilters({ ...filters, maxCost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="batchNumber">Batch Number</option>
                  <option value="quantity">Quantity</option>
                  <option value="cost">Cost</option>
                  <option value="status">Status</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      sortOrder: e.target.value as "asc" | "desc",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading batches...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Batch Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedBatches.map((batch) => {
                const totalQuantity = batch.products.reduce((sum, p) => sum + p.quantity, 0);
                const totalCost = batch.products.reduce((sum, p) => sum + p.cost, 0);
                const productNames = batch.products.map(p => p.product.name).join(", ");

                return (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-[10rem] truncate" title={batch.name}>
                      {batch.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-[12rem] truncate" title={productNames}>
                      {batch.products.length === 1 
                        ? batch.products[0].product.name 
                        : `${batch.products.length} products`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {totalQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${totalCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(batch.status)}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.startDate ? format(new Date(batch.startDate), "MMM dd, yyyy") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <Link
                          href={`/batches/${batch.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(batch.id, batch.name)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBatches.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || filters.status !== "all" || filters.minQuantity || filters.maxQuantity || filters.minCost || filters.maxCost
                      ? "No batches match your filters. Try adjusting your search criteria."
                      : "No batches found. Click \"Add Batch\" to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {filteredBatches.length > 0 && (
            <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(endIndex, filteredBatches.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredBatches.length}</span>{" "}
                  batches
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Items per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 border rounded-lg flex items-center gap-1 ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 border rounded-lg ${
                              currentPage === page
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 py-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 border rounded-lg flex items-center gap-1 ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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