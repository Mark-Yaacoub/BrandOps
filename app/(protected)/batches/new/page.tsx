"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, Plus } from "lucide-react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  cost: number;
}

interface BatchProduct {
  productId: string;
  quantity: string;
  cost: string;
}

export default function NewBatchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [batchNumber, setBatchNumber] = useState("");
  const [status, setStatus] = useState("pending");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetSegments, setTargetSegments] = useState("");
  const [targetSalesLocations, setTargetSalesLocations] = useState("");
  const [products, setProducts] = useState<BatchProduct[]>([
    { productId: "", quantity: "", cost: "" },
  ]);

  const { data: productsData } = useQuery<{ success: boolean; data: Product[] }>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return res.json();
    },
  });

  const addProduct = () => {
    setProducts([...products, { productId: "", quantity: "", cost: "" }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: keyof BatchProduct, value: string) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    
    // Auto-calculate cost when product or quantity changes
    if (field === "productId" || field === "quantity") {
      const productId = field === "productId" ? value : newProducts[index].productId;
      const quantity = field === "quantity" ? value : newProducts[index].quantity;
      
      if (productId && quantity) {
        const selectedProduct = productsData?.data?.find(p => p.id === parseInt(productId));
        if (selectedProduct) {
          const calculatedCost = selectedProduct.cost * parseFloat(quantity);
          newProducts[index].cost = calculatedCost.toFixed(2);
        }
      }
    }
    
    setProducts(newProducts);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one product is selected
    const validProducts = products.filter((p) => p.productId && p.quantity);
    if (validProducts.length === 0) {
      alert("Please add at least one product with quantity");
      return;
    }

    // Ensure all products have cost calculated
    const productsWithCost = validProducts.map(p => ({
      ...p,
      cost: p.cost || "0"
    }));

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: batchNumber,
          products: productsWithCost,
          status,
          startDate,
          endDate,
          targetSegments,
          targetSalesLocations,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create batch");
      }

      // Invalidate queries and redirect
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      router.push("/batches");
    } catch (error) {
      console.error("Error creating batch:", error);
      alert("Failed to create batch. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/batches"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Batches
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add New Batch</h1>
        <p className="text-gray-500 mt-1">Create a new production batch</p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
              placeholder="Enter batch number"
            />
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Products <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك إضافة منتجات متعددة في نفس الباتش • Add multiple products to the same batch
                </p>
              </div>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            <div className="space-y-3">
              {products.map((product, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Product
                        </label>
                        <select
                          required
                          value={product.productId}
                          onChange={(e) => updateProduct(index, "productId", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900 text-sm"
                        >
                          <option value="">Select product</option>
                          {productsData?.data?.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          required
                          value={product.quantity}
                          onChange={(e) => updateProduct(index, "quantity", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900 text-sm"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Cost (Total) <span className="text-blue-600 text-[10px]">Auto-calculated</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={product.cost}
                            onChange={(e) => updateProduct(index, "cost", e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">يحسب تلقائيًا • يمكن التعديل للخصومات</p>
                      </div>
                    </div>

                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="mt-6 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove product"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Segments
            </label>
            <textarea
              value={targetSegments}
              onChange={(e) => setTargetSegments(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
              placeholder="Enter target customer segments (e.g., Youth, Families, Corporate)"
            />
            <p className="text-xs text-gray-500 mt-1">الشرائح المستهدفة من العملاء</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Sales Locations
            </label>
            <textarea
              value={targetSalesLocations}
              onChange={(e) => setTargetSalesLocations(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
              placeholder="Enter target sales locations (e.g., Cairo, Alexandria, Online)"
            />
            <p className="text-xs text-gray-500 mt-1">أماكن البيع المستهدفة</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? "Creating..." : "Create Batch"}
            </button>
            <Link
              href="/batches"
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
