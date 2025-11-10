"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Expense {
  id: number;
  type: string;
  amount: number;
  date: string;
  notes: string | null;
  batchId: number | null;
  productId: number | null;
}

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const expenseId = params.id as string;
  
  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    date: "",
    notes: "",
    batchId: "",
    productId: "",
  });

  const { data: expenseData, isLoading } = useQuery<{ success: boolean; data: Expense }>({
    queryKey: ["expense", expenseId],
    queryFn: async () => {
      const res = await fetch(`/api/expenses/${expenseId}`);
      if (!res.ok) throw new Error("Failed to fetch expense");
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

  useEffect(() => {
    if (expenseData?.data) {
      const expense = expenseData.data;
      setFormData({
        type: expense.type,
        amount: expense.amount.toString(),
        date: expense.date.split('T')[0],
        notes: expense.notes || "",
        batchId: expense.batchId?.toString() || "",
        productId: expense.productId?.toString() || "",
      });
    }
  }, [expenseData]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense", expenseId] });
      router.push("/expenses");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-500">Loading expense...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/expenses"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Expenses
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Expense</h1>
        <p className="text-gray-500 mt-1">Update expense information</p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                placeholder="e.g., Materials, Labor, Shipping"
              />
              <p className="text-xs text-gray-500 mt-1">Category or type of expense</p>
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
              <p className="text-xs text-gray-500 mt-1">Total expense amount</p>
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
            <p className="text-xs text-gray-500 mt-1">When did this expense occur?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <p className="text-xs text-gray-500 mt-1">Link to a specific product</p>
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
              <p className="text-xs text-gray-500 mt-1">Link to a production batch</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
              rows={4}
              placeholder="Add any additional details about this expense..."
            />
            <p className="text-xs text-gray-500 mt-1">Additional information or context</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {updateMutation.isPending ? "Updating..." : "Update Expense"}
            </button>
            <Link
              href="/expenses"
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
