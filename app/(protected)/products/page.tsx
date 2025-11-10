"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import AlertDialog from "@/app/components/AlertDialog";

interface Product {
  id: number;
  name: string;
  description: string | null;
  formula: string | null;
  cost: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    minCost: "",
    maxCost: "",
    minPrice: "",
    maxPrice: "",
    minProfit: "",
    maxProfit: "",
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

  const { data, isLoading } = useQuery<{ success: boolean; data: Product[] }>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setAlertDialog({
        isOpen: true,
        type: "success",
        title: "Success!",
        message: "Product deleted successfully!",
      });
    },
    onError: () => {
      setAlertDialog({
        isOpen: true,
        type: "error",
        title: "Error!",
        message: "Failed to delete product. Please try again.",
      });
    },
  });

  const handleDelete = (id: number, name: string) => {
    setAlertDialog({
      isOpen: true,
      type: "confirm",
      title: "Delete Product",
      message: `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`,
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  // Filter and search products
  const filteredProducts = useMemo(() => {
    if (!data?.data) return [];

    let filtered = [...data.data];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(search) ||
          product.description?.toLowerCase().includes(search) ||
          product.formula?.toLowerCase().includes(search)
      );
    }

    // Cost filters
    if (filters.minCost) {
      filtered = filtered.filter((p) => p.cost >= parseFloat(filters.minCost));
    }
    if (filters.maxCost) {
      filtered = filtered.filter((p) => p.cost <= parseFloat(filters.maxCost));
    }

    // Price filters
    if (filters.minPrice) {
      filtered = filtered.filter((p) => p.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((p) => p.price <= parseFloat(filters.maxPrice));
    }

    // Profit filters
    if (filters.minProfit) {
      filtered = filtered.filter(
        (p) => p.price - p.cost >= parseFloat(filters.minProfit)
      );
    }
    if (filters.maxProfit) {
      filtered = filtered.filter(
        (p) => p.price - p.cost <= parseFloat(filters.maxProfit)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "cost":
          aValue = a.cost;
          bValue = b.cost;
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "profit":
          aValue = a.price - a.cost;
          bValue = b.price - b.cost;
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
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const clearFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
    setFilters({
      minCost: "",
      maxCost: "",
      minPrice: "",
      maxPrice: "",
      minProfit: "",
      maxProfit: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">
            Manage your product catalog ({filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"})
          </p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Product
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
              placeholder="Search products by name, description, or formula..."
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
          {(searchTerm || filters.minCost || filters.maxCost || filters.minPrice || filters.maxPrice || filters.minProfit || filters.maxProfit) && (
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
                    onChange={(e) =>
                      setFilters({ ...filters, minCost: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={filters.maxCost}
                    onChange={(e) =>
                      setFilters({ ...filters, maxCost: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, minPrice: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, maxPrice: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* Profit Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profit Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Min"
                    value={filters.minProfit}
                    onChange={(e) =>
                      setFilters({ ...filters, minProfit: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={filters.maxProfit}
                    onChange={(e) =>
                      setFilters({ ...filters, maxProfit: e.target.value })
                    }
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
                  onChange={(e) =>
                    setFilters({ ...filters, sortBy: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="name">Name</option>
                  <option value="cost">Cost</option>
                  <option value="price">Price</option>
                  <option value="profit">Profit</option>
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
          <div className="text-lg text-gray-500">Loading products...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                  Formula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-[12rem] truncate" title={product.name}>
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[16rem] truncate" title={product.description || "-"}>
                    {product.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[16rem] truncate" title={product.formula || "-"}>
                    {product.formula || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${(product.price - product.cost).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-red-600 hover:text-red-900"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || filters.minCost || filters.maxCost || filters.minPrice || filters.maxPrice || filters.minProfit || filters.maxProfit
                      ? "No products match your filters. Try adjusting your search criteria."
                      : "No products found. Click \"Add Product\" to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(endIndex, filteredProducts.length)}
                </span>{" "}
                of <span className="font-medium">{filteredProducts.length}</span>{" "}
                products
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
                    // Show first page, last page, current page and pages around current
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