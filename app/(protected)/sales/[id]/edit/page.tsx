"use client";

import { useState, useEffect, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Batch {
  id: number;
  name: string;
  products: Array<{
    productId: number;
    product: { id: number; name: string };
  }>;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface SalesLocation {
  id: number;
  name: string;
  isActive: boolean;
}

interface Sale {
  id: number;
  batchId: number;
  productId: number;
  locationId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleDate: string;
  notes: string | null;
}

export default function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    batchId: "",
    productId: "",
    locationId: "",
    quantity: "",
    unitPrice: "",
    saleDate: "",
    notes: "",
  });

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const { data: saleData, isLoading: loadingSale } = useQuery<{ success: boolean; data: Sale }>({
    queryKey: ["sale", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/sales/${resolvedParams.id}`);
      if (!res.ok) throw new Error("Failed to fetch sale");
      return res.json();
    },
  });

  const { data: batchesData } = useQuery<{ success: boolean; data: Batch[] }>({
    queryKey: ["batches"],
    queryFn: async () => {
      const res = await fetch("/api/batches");
      return res.json();
    },
  });

  const { data: productsData } = useQuery<{ success: boolean; data: Product[] }>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return res.json();
    },
  });

  const { data: locationsData } = useQuery<{ success: boolean; data: SalesLocation[] }>({
    queryKey: ["sales-locations"],
    queryFn: async () => {
      const res = await fetch("/api/sales-locations");
      return res.json();
    },
  });

  // Initialize form with existing sale data
  useEffect(() => {
    if (saleData?.data) {
      const sale = saleData.data;
      setFormData({
        batchId: sale.batchId.toString(),
        productId: sale.productId.toString(),
        locationId: sale.locationId.toString(),
        quantity: sale.quantity.toString(),
        unitPrice: sale.unitPrice.toString(),
        saleDate: new Date(sale.saleDate).toISOString().split("T")[0],
        notes: sale.notes || "",
      });
    }
  }, [saleData]);

  // Update available products when batch is selected
  useEffect(() => {
    if (formData.batchId && batchesData?.data) {
      const selectedBatch = batchesData.data.find((b) => b.id.toString() === formData.batchId);
      if (selectedBatch) {
        const batchProductIds = selectedBatch.products.map((bp) => bp.productId);
        const batchProducts = productsData?.data?.filter((p) => batchProductIds.includes(p.id)) || [];
        setAvailableProducts(batchProducts);
      }
    } else {
      setAvailableProducts([]);
    }
  }, [formData.batchId, batchesData, productsData]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/sales/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update sale");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sale", resolvedParams.id] });
      router.push("/sales");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const totalPrice = formData.quantity && formData.unitPrice
    ? (parseFloat(formData.quantity) * parseFloat(formData.unitPrice)).toFixed(2)
    : "0.00";

  const activeLocations = locationsData?.data?.filter((loc) => loc.isActive) || [];

  if (loadingSale) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading sale data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/sales"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sales
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Sale</h1>
        <p className="text-gray-500 mt-1">Update sale transaction details</p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              <option value="">Select a batch</option>
              {batchesData?.data?.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} ({batch.products.length} products)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              disabled={!formData.batchId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a product</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            {!formData.batchId && (
              <p className="text-xs text-gray-500 mt-1">Please select a batch first</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sales Location <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              <option value="">Select a location</option>
              {activeLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-900">Total Price:</span>
              <span className="text-2xl font-bold text-blue-900">${totalPrice}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.saleDate}
              onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-gray-900"
              placeholder="Enter any additional notes"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {updateMutation.isPending ? "Updating..." : "Update Sale"}
            </button>
            <Link
              href="/sales"
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
