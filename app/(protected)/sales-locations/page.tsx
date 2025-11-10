"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import Link from "next/link";
import AlertDialog from "@/app/components/AlertDialog";

interface SalesLocation {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function SalesLocationsPage() {
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

  const { data, isLoading } = useQuery<{ success: boolean; data: SalesLocation[] }>({
    queryKey: ["sales-locations"],
    queryFn: async () => {
      const res = await fetch("/api/sales-locations");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/sales-locations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete location");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-locations"] });
      setAlertDialog({
        isOpen: true,
        type: "success",
        title: "تم الحذف بنجاح",
        message: "تم حذف مكان البيع بنجاح",
      });
    },
    onError: () => {
      setAlertDialog({
        isOpen: true,
        type: "error",
        title: "خطأ",
        message: "فشل حذف مكان البيع. قد يكون مرتبط بمبيعات.",
      });
    },
  });

  const handleDelete = (id: number, name: string) => {
    setAlertDialog({
      isOpen: true,
      type: "confirm",
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من حذف مكان البيع "${name}"؟`,
      onConfirm: () => {
        deleteMutation.mutate(id);
        setAlertDialog({ ...alertDialog, isOpen: false });
      },
    });
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Sales Locations</h1>
        <p className="text-gray-500 mt-1">Manage your sales locations</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>{data?.data?.length || 0} locations</span>
        </div>
        <Link
          href="/sales-locations/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Location
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading locations...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data?.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {location.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {location.city || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={location.address || ""}>
                    {location.address || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {location.phone || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      location.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {location.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <Link
                        href={`/sales-locations/${location.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(location.id, location.name)}
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
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No sales locations found. Click "Add Location" to create one.
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
