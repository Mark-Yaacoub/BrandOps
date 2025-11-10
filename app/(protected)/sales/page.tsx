"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, TrendingUp, DollarSign, Package, MapPin } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import AlertDialog from "@/app/components/AlertDialog";

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
  batch: { id: number; name: string };
  product: { id: number; name: string };
  location: { id: number; name: string };
  createdAt: string;
}

export default function SalesPage() {
  const queryClient = useQueryClient();
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

  const { data, isLoading } = useQuery<{ success: boolean; data: Sale[] }>({
    queryKey: ["sales"],
    queryFn: async () => {
      const res = await fetch("/api/sales");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/sales/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete sale");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setAlertDialog({
        isOpen: true,
        type: "success",
        title: "تم الحذف بنجاح",
        message: "تم حذف عملية البيع بنجاح",
      });
    },
    onError: () => {
      setAlertDialog({
        isOpen: true,
        type: "error",
        title: "خطأ",
        message: "فشل حذف عملية البيع",
      });
    },
  });

  const handleDelete = (id: number, productName: string) => {
    setAlertDialog({
      isOpen: true,
      type: "confirm",
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من حذف عملية بيع "${productName}"؟`,
      onConfirm: () => {
        deleteMutation.mutate(id);
        setAlertDialog({ ...alertDialog, isOpen: false });
      },
    });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data?.data) return { totalSales: 0, totalRevenue: 0, totalQuantity: 0, topLocations: [] };

    const totalSales = data.data.length;
    const totalRevenue = data.data.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalQuantity = data.data.reduce((sum, sale) => sum + sale.quantity, 0);

    // Top locations by revenue
    const locationRevenue = data.data.reduce((acc: any, sale) => {
      const locName = sale.location.name;
      if (!acc[locName]) {
        acc[locName] = { name: locName, revenue: 0, sales: 0 };
      }
      acc[locName].revenue += sale.totalPrice;
      acc[locName].sales += 1;
      return acc;
    }, {});

    const topLocations = Object.values(locationRevenue)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    return { totalSales, totalRevenue, totalQuantity, topLocations };
  }, [data]);

  return (
    <div>
      <AlertDialog
        isOpen={alertDialog.isOpen}
        type={alertDialog.type}
        title={alertDialog.title}
        message={alertDialog.message}
        onConfirm={alertDialog.onConfirm}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        <p className="text-gray-500 mt-1">Track and analyze your sales performance</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Units Sold</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuantity}</p>
            </div>
            <Package className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Sale Price</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : "0.00"}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Top Locations */}
      {stats.topLocations.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Top Performing Locations
          </h2>
          <div className="space-y-3">
            {stats.topLocations.map((loc: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{loc.name}</p>
                    <p className="text-sm text-gray-500">{loc.sales} sales</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-900">${loc.revenue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales Table */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Sales History</h2>
        <Link
          href="/sales/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Record Sale
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading sales...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data?.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(sale.saleDate), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {sale.batch.name}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {sale.product.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {sale.location.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${sale.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${sale.totalPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <Link
                        href={`/sales/${sale.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(sale.id, sale.product.name)}
                        className="text-red-600 hover:text-red-900"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data?.data?.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No sales recorded yet. Click "Record Sale" to add your first sale.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
