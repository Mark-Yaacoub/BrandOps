"use client";

import { useQuery } from "@tanstack/react-query";
import { Package, Layers, DollarSign, CheckSquare } from "lucide-react";

interface DashboardStats {
  productsCount: number;
  batchesCount: number;
  totalExpenses: number;
  activeTasksCount: number;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<{ success: boolean; data: DashboardStats }>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      return res.json();
    },
  });

  const stats = data?.data;

  const cards = [
    {
      title: "Total Products",
      value: stats?.productsCount ?? 0,
      icon: Package,
      color: "bg-blue-500",
    },
    {
      title: "Total Batches",
      value: stats?.batchesCount ?? 0,
      icon: Layers,
      color: "bg-green-500",
    },
    {
      title: "Total Expenses",
      value: `$${stats?.totalExpenses?.toFixed(2) ?? "0.00"}`,
      icon: DollarSign,
      color: "bg-red-500",
    },
    {
      title: "Active Tasks",
      value: stats?.activeTasksCount ?? 0,
      icon: CheckSquare,
      color: "bg-purple-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to BrandOps Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/products"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">Manage Products</h3>
              <p className="text-sm text-gray-500">View and manage product inventory</p>
            </a>
            <a
              href="/batches"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">Manage Batches</h3>
              <p className="text-sm text-gray-500">Track production batches</p>
            </a>
            <a
              href="/tasks"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">View Tasks</h3>
              <p className="text-sm text-gray-500">Check active tasks and assignments</p>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Products</span>
                <span className="font-medium text-gray-900">{stats?.productsCount ?? 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min((stats?.productsCount ?? 0) * 10, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Batches</span>
                <span className="font-medium text-gray-900">{stats?.batchesCount ?? 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min((stats?.batchesCount ?? 0) * 10, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Active Tasks</span>
                <span className="font-medium text-gray-900">{stats?.activeTasksCount ?? 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${Math.min((stats?.activeTasksCount ?? 0) * 10, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
