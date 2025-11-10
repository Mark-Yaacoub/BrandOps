"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, AlertCircle } from "lucide-react";
import Link from "next/link";

interface BatchReport {
  batch: {
    id: number;
    name: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
  };
  costs: {
    productCosts: number;
    expenses: number;
    totalCost: number;
  };
  revenue: {
    totalRevenue: number;
    totalQuantitySold: number;
    salesCount: number;
  };
  profitability: {
    profit: number;
    profitMargin: number;
  };
  breakdown: {
    products: Array<{
      name: string;
      quantity: number;
      cost: number;
      unitCost: number;
    }>;
    expenses: Array<{
      type: string;
      amount: number;
      date: string;
      notes: string | null;
    }>;
    salesByProduct: Record<string, { quantity: number; revenue: number }>;
    salesByLocation: Record<string, { quantity: number; revenue: number }>;
  };
}

export default function BatchReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  const { data, isLoading } = useQuery<{ success: boolean; data: BatchReport }>({
    queryKey: ["batch-report", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/batches/${resolvedParams.id}/report`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading report...</div>
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">Failed to load report</div>
      </div>
    );
  }

  const report = data.data;
  const isProfitable = report.profitability.profit > 0;

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Batch Report</h1>
            <p className="text-gray-500 mt-1">{report.batch.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                report.batch.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : report.batch.status === "in-progress"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {report.batch.status}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
            <DollarSign className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">${report.revenue.totalRevenue.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">{report.revenue.salesCount} sales</p>
        </div>

        {/* Total Cost */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Cost</h3>
            <Package className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">${report.costs.totalCost.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">
            Products: ${report.costs.productCosts.toFixed(2)} | Expenses: $
            {report.costs.expenses.toFixed(2)}
          </p>
        </div>

        {/* Profit */}
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
          <p className="text-3xl font-bold">${report.profitability.profit.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">
            {isProfitable ? "Profitable" : "Loss"}
          </p>
        </div>

        {/* Profit Margin */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Profit Margin</h3>
            <ShoppingCart className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{report.profitability.profitMargin.toFixed(1)}%</p>
          <p className="text-sm opacity-80 mt-1">
            {report.revenue.totalQuantitySold} units sold
          </p>
        </div>
      </div>

      {/* Alert for Loss */}
      {!isProfitable && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900">Attention: Loss Detected</h3>
            <p className="text-sm text-orange-700 mt-1">
              This batch is operating at a loss. Consider reviewing costs and pricing strategy.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Products Breakdown */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Products</h2>
          <div className="space-y-3">
            {report.breakdown.products.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    {product.quantity} units × ${product.unitCost.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">${product.cost.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Expenses</h2>
          {report.breakdown.expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No expenses recorded</p>
          ) : (
            <div className="space-y-3">
              {report.breakdown.expenses.map((expense, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{expense.type}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString()}
                      {expense.notes && ` - ${expense.notes}`}
                    </p>
                  </div>
                  <p className="font-semibold text-red-600">${expense.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Product */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sales by Product</h2>
          {Object.keys(report.breakdown.salesByProduct).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales recorded</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(report.breakdown.salesByProduct).map(([productName, data]) => (
                <div key={productName} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{productName}</p>
                    <p className="text-sm text-gray-500">{data.quantity} units sold</p>
                  </div>
                  <p className="font-semibold text-green-600">${data.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales by Location */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sales by Location</h2>
          {Object.keys(report.breakdown.salesByLocation).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales recorded</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(report.breakdown.salesByLocation)
                .sort(([, a], [, b]) => b.revenue - a.revenue)
                .map(([locationName, data], index) => (
                  <div key={locationName} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{locationName}</p>
                        <p className="text-sm text-gray-500">{data.quantity} units</p>
                      </div>
                    </div>
                    <p className="font-semibold text-blue-600">${data.revenue.toFixed(2)}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
