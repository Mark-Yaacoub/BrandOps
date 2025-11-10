"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Layers,
  ShoppingCart,
  MapPin,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface DashboardAnalytics {
  overview: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
    totalSales: number;
    totalProducts: number;
    totalBatches: number;
    activeBatches: number;
    totalLocations: number;
    activeTasks: number;
  };
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
    productId: number;
  }>;
  topLocations: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentSales: Array<{
    id: number;
    date: string;
    product: string;
    batch: string;
    location: string;
    quantity: number;
    total: number;
  }>;
  batchPerformance: Array<{
    id: number;
    name: string;
    status: string;
    revenue: number;
    cost: number;
    profit: number;
    profitMargin: number;
  }>;
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<{ success: boolean; data: DashboardAnalytics }>({
    queryKey: ["dashboard-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/analytics");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">Failed to load dashboard data</div>
      </div>
    );
  }

  const analytics = data.data;
  const isProfitable = analytics.overview.totalProfit > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Complete overview of your business performance</p>
      </div>

      {/* Alert for Loss */}
      {!isProfitable && analytics.overview.totalRevenue > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900">Attention Required</h3>
            <p className="text-sm text-orange-700 mt-1">
              Your business is currently operating at a loss. Review your costs and pricing strategy.
            </p>
          </div>
        </div>
      )}

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
            <DollarSign className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">${analytics.overview.totalRevenue.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">{analytics.overview.totalSales} sales</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Cost</h3>
            <Package className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">${analytics.overview.totalCost.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">Products + Expenses</p>
        </div>

        <div
          className={`bg-gradient-to-br ${
            isProfitable ? "from-blue-500 to-blue-600" : "from-orange-500 to-orange-600"
          } rounded-lg shadow-lg p-6 text-white`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Net Profit</h3>
            {isProfitable ? (
              <TrendingUp className="w-5 h-5 opacity-80" />
            ) : (
              <TrendingDown className="w-5 h-5 opacity-80" />
            )}
          </div>
          <p className="text-3xl font-bold">${analytics.overview.totalProfit.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">{isProfitable ? "Profitable" : "Loss"}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Profit Margin</h3>
            <BarChart3 className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{analytics.overview.profitMargin.toFixed(1)}%</p>
          <p className="text-sm opacity-80 mt-1">Overall margin</p>
        </div>
      </div>

      {/* Business Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          href="/products"
          className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalProducts}</p>
              <p className="text-sm text-gray-500">Products</p>
            </div>
          </div>
        </Link>

        <Link
          href="/batches"
          className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Layers className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.activeBatches}</p>
              <p className="text-sm text-gray-500">Active Batches</p>
            </div>
          </div>
        </Link>

        <Link
          href="/sales-locations"
          className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalLocations}</p>
              <p className="text-sm text-gray-500">Locations</p>
            </div>
          </div>
        </Link>

        <Link
          href="/sales"
          className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalSales}</p>
              <p className="text-sm text-gray-500">Total Sales</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Selling Products</h2>
          {analytics.topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.quantity} units sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">${product.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Performing Locations */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performing Locations</h2>
          {analytics.topLocations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.topLocations.map((location, index) => (
                <div key={location.name} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{location.name}</p>
                      <p className="text-sm text-gray-500">{location.sales} sales</p>
                    </div>
                  </div>
                  <p className="font-semibold text-blue-600">${location.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Batch Performance */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Batch Performance</h2>
          <Link href="/batches" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All →
          </Link>
        </div>
        {analytics.batchPerformance.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No batch data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.batchPerformance.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{batch.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          batch.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : batch.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">${batch.revenue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">${batch.cost.toFixed(2)}</td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-semibold ${
                        batch.profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ${batch.profit.toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-semibold ${
                        batch.profitMargin >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {batch.profitMargin.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Link
                        href={`/batches/${batch.id}/report`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Sales</h2>
          <Link href="/sales" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All →
          </Link>
        </div>
        {analytics.recentSales.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sales yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {format(new Date(sale.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sale.product}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{sale.batch}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{sale.location}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{sale.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                      ${sale.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
