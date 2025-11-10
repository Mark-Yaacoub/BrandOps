"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Search, 
  Filter,
  DollarSign,
  Calendar,
  Package,
  Layers,
  SlidersHorizontal,
  ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";

interface Expense {
  id: number;
  type: string;
  amount: number;
  date: string;
  notes: string | null;
  batchId: number | null;
  batch: { id: number; name: string } | null;
  productId: number | null;
  product: { id: number; name: string } | null;
  createdAt: string;
}

interface Filters {
  type: string;
  batchId: string;
  productId: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
}

export default function ExpensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<"date" | "amount" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<Filters>({
    type: "all",
    batchId: "all",
    productId: "all",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
  });
  
  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    date: "",
    notes: "",
    batchId: "",
    productId: "",
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ success: boolean; data: Expense[] }>({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await fetch("/api/expenses");
      return res.json();
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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        type: expense.type,
        amount: expense.amount.toString(),
        date: expense.date.split('T')[0],
        notes: expense.notes || "",
        batchId: expense.batchId?.toString() || "",
        productId: expense.productId?.toString() || "",
      });
    } else {
      setEditingExpense(null);
      setFormData({ type: "", amount: "", date: "", notes: "", batchId: "", productId: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Get unique expense types
  const expenseTypes = useMemo(() => {
    const types = new Set<string>();
    data?.data?.forEach((exp) => types.add(exp.type));
    return Array.from(types).sort();
  }, [data?.data]);

  // Filter and search expenses
  const filteredExpenses = useMemo(() => {
    let result = data?.data || [];

    // Search filter
    if (searchTerm) {
      result = result.filter((exp) =>
        exp.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.batch?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filters.type !== "all") {
      result = result.filter((exp) => exp.type === filters.type);
    }

    // Batch filter
    if (filters.batchId !== "all") {
      result = result.filter((exp) => exp.batchId === parseInt(filters.batchId));
    }

    // Product filter
    if (filters.productId !== "all") {
      result = result.filter((exp) => exp.productId === parseInt(filters.productId));
    }

    // Amount range filter
    if (filters.minAmount) {
      result = result.filter((exp) => exp.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      result = result.filter((exp) => exp.amount <= parseFloat(filters.maxAmount));
    }

    // Date range filter
    if (filters.startDate) {
      result = result.filter((exp) => new Date(exp.date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      result = result.filter((exp) => new Date(exp.date) <= new Date(filters.endDate));
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "type":
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case "date":
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [data?.data, searchTerm, filters, sortField, sortOrder]);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalCount = filteredExpenses.length;

  const toggleSort = (field: "date" | "amount" | "type") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const clearFilters = () => {
    setFilters({
      type: "all",
      batchId: "all",
      productId: "all",
      minAmount: "",
      maxAmount: "",
      startDate: "",
      endDate: "",
    });
    setSearchTerm("");
  };

  const hasActiveFilters = 
    searchTerm || 
    filters.type !== "all" || 
    filters.batchId !== "all" || 
    filters.productId !== "all" || 
    filters.minAmount || 
    filters.maxAmount || 
    filters.startDate || 
    filters.endDate;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 mt-1">Track and manage business expenses</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Expenses</h3>
            <DollarSign className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">{totalCount} transactions</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data?.data?.filter(e => e.productId).length || 0}</p>
              <p className="text-sm text-gray-500">Product Expenses</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Layers className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data?.data?.filter(e => e.batchId).length || 0}</p>
              <p className="text-sm text-gray-500">Batch Expenses</p>
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
              placeholder="Search expenses by type, notes, batch, or product..."
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                >
                  <option value="all">All Types</option>
                  {expenseTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow border border-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg text-gray-500">Loading expenses...</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {/* Results Summary */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredExpenses.length}</span> of{" "}
              <span className="font-semibold text-gray-900">{data?.data?.length || 0}</span> expenses
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="type">Type</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-1 hover:bg-gray-200 rounded"
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                <ArrowUpDown className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-500 mb-4">
                {hasActiveFilters
                  ? "Try adjusting your filters or search term"
                  : "Get started by adding your first expense"}
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {expense.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-red-600">
                          ${expense.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {format(new Date(expense.date), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.product ? (
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-purple-500" />
                            {expense.product.name}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.batch ? (
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-green-500" />
                            {expense.batch.name}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {expense.notes || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(expense)}
                          className="text-blue-600 hover:text-blue-900 mr-4 inline-flex items-center gap-1 transition-colors"
                          title="Edit expense"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this expense?")) {
                              deleteMutation.mutate(expense.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingExpense ? "Edit Expense" : "Add New Expense"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                  placeholder="e.g., Materials, Labor, Shipping, Marketing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Product <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                >
                  <option value="">No product</option>
                  {productsData?.data?.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Batch <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <select
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                >
                  <option value="">No batch</option>
                  {batchesData?.data?.map((batch: any) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                  rows={3}
                  placeholder="Add any additional details..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingExpense
                    ? "Update Expense"
                    : "Add Expense"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
