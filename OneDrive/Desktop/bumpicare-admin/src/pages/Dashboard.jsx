import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingUp, TrendingDown, Search, RefreshCcw, Download, Filter,
  Package, AlertCircle, CheckCircle, XCircle, Clock, FileText,
  AlertTriangle, ShoppingBag
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Orders pagination
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersSearchTerm, setOrdersSearchTerm] = useState('');

  // Low stock pagination
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalPages, setStockTotalPages] = useState(1);
  const [stockPerPage] = useState(5);

  const [dateFilter, setDateFilter] = useState('30');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000); // 5 min
    return () => clearInterval(interval);
  }, [dateFilter]);

  useEffect(() => {
    if (dashboardData) {
      fetchRecentOrders();
    }
  }, [ordersPage]);

  const fetchDashboardData = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);

      const response = await api.get(`/admin/dashboard/stats`);

      if (response.data.success) {
        setDashboardData(response.data.data);

        // Calculate stock pagination
        const lowStockCount = response.data.data.lowStockProducts?.length || 0;
        setStockTotalPages(Math.ceil(lowStockCount / stockPerPage));

        if (showToast) toast.success('Dashboard refreshed successfully');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const res = await api.get(`/admin/orders/recent?page=${ordersPage}`);
      setDashboardData(prev => ({
        ...prev,
        recentOrders: res.data.orders
      }));
      setOrdersTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch recent orders:", error);
      toast.error("Failed to load orders");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      const res = await api.put(`/admin/order/cancel/${orderId}`);

      if (res.status === 200) {
        toast.success("Order cancelled successfully");
        fetchDashboardData();
        fetchRecentOrders();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to cancel order");
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
    fetchRecentOrders();
    setStockPage(1);
    setOrdersPage(1);
  };

  // ✅ REAL CSV EXPORT
  const exportToCSV = () => {
    try {
      setIsExporting(true);

      // Prepare CSV data
      const headers = ['Order #', 'Customer', 'Date', 'Items', 'Amount', 'Status'];
      const rows = dashboardData.recentOrders?.map(order => [
        order.orderNumber,
        order.user?.name || 'N/A',
        new Date(order.createdAt).toLocaleDateString('en-IN'),
        order.orderItems?.length || 0,
        order.totalAmount,
        order.orderStatus
      ]) || [];

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Processing': 'bg-blue-100 text-blue-700',
      'Shipped': 'bg-purple-100 text-purple-700',
      'Delivered': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700',
      'Pending': 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled': return <XCircle className="w-4 h-4" />;
      case 'Processing': return <Clock className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const StatCard = ({ title, value, change, bgColor }) => {
    const isPositive = parseFloat(change) >= 0;

    return (
      <div className={`${bgColor} rounded-2xl p-5 relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
        <div className="relative z-10">
          <p className="text-sm text-gray-600 mb-1 font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span>{isPositive ? '+' : ''}{parseFloat(change).toFixed(1)}%</span>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </div>
        </div>
      </div>
    );
  };

  const COLORS = [
    "#4C6FFF", "#FDB022", "#12B76A", "#F04438", "#D92D20",
    "#F79009", "#7A5AF8", "#6E59A5", "#667085"
  ];

  const orderStatusData = stats.ordersByStatus?.map((item, index) => ({
    name: item.status,
    value: item.count,
    color: COLORS[index % COLORS.length]
  })) || [];

  // Revenue data with filter
  const allRevenueData = stats.revenueByDate?.map(item => {
    const d = new Date(item._id);
    return {
      rawDate: d,
      date: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      revenue: item.revenue / 1000,
    };
  }) || [];

  const filterDays = Number(dateFilter);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - filterDays);
  const revenueData = allRevenueData.filter(item => item.rawDate >= cutoff);

  const COUNTRY_CODES = {
    "India": "IN", "United States": "US", "USA": "US", "Canada": "CA",
    "Germany": "DE", "France": "FR", "China": "CN", "Japan": "JP",
    "Australia": "AU", "United Kingdom": "GB", "UK": "GB", "Russia": "RU",
  };

  const getCountryCode = (country) => {
    if (!country) return null;
    if (COUNTRY_CODES[country]) return COUNTRY_CODES[country];
    return country.slice(0, 2).toUpperCase();
  };

  const getFlag = (country) => {
    const code = getCountryCode(country);
    if (!code) return null;
    return `https://flagsapi.com/${code}/flat/64.png`;
  };

  const countriesData = stats.ordersByCountry?.map(item => ({
    name: item.country || "Unknown",
    value: item.currentOrders,
    prev: item.previousOrders,
    trend: item.trend,
    flag: getFlag(item.country)
  })) || [];

  const fulfillmentData = stats.orderFulfillment || [];
  const totalOrders = stats.totalOrders || 0;

  // ✅ WORKING LOW STOCK PAGINATION
  const lowStockProducts = stats.lowStockProducts || [];
  const startIndex = (stockPage - 1) * stockPerPage;
  const endIndex = startIndex + stockPerPage;
  const paginatedStockProducts = lowStockProducts.slice(startIndex, endIndex);

  // ✅ FILTERED ORDERS
  const filteredOrders = stats.recentOrders?.filter(order =>
    !ordersSearchTerm ||
    order.orderNumber?.toLowerCase().includes(ordersSearchTerm.toLowerCase()) ||
    order.user?.name?.toLowerCase().includes(ordersSearchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Last updated: {new Date().toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short'
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="font-medium">Refresh</span>
          </button>
          <button
            onClick={exportToCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            <span className="font-medium">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue || 0)}
          change={stats.growth?.revenue || 0}
          bgColor="bg-gradient-to-br from-teal-100 to-teal-200"
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(stats.totalOrders || 0)}
          change={stats.growth?.orders || 0}
          bgColor="bg-gradient-to-br from-yellow-100 to-yellow-200"
        />
        <StatCard
          title="Total Customers"
          value={formatNumber(stats.totalUsers || 0)}
          change={stats.growth?.users || 0}
          bgColor="bg-gradient-to-br from-orange-100 to-orange-200"
        />
        <StatCard
          title="Total Products"
          value={formatNumber(stats.totalProducts || 0)}
          change={stats.growth?.products || 0}
          bgColor="bg-gradient-to-br from-purple-100 to-purple-200"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Order Status Distribution</h3>
          {orderStatusData.length > 0 ? (
            <div className="flex items-start">
              <div className="w-1/2 space-y-3">
                {orderStatusData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-700 text-sm font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-gray-900 text-sm font-semibold">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-1/2 flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={115}
                      paddingAngle={0}
                      cornerRadius={0}
                      stroke="none"
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ShoppingBag className="w-16 h-16 mb-4" />
              <p>No order data available</p>
            </div>
          )}
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-bold">Top Countries By Sales</h3>
            <span className="text-sm text-gray-500">
              Total: {formatCurrency(stats.totalRevenue || 0)}
            </span>
          </div>
          <div className="space-y-4">
            {countriesData?.slice(0, 4).map((country, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {country.flag ? (
                      <img src={country.flag} alt={country.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <span className="text-2xl">🏳️</span>
                    )}
                    <span className="font-semibold">{country.name}</span>
                  </div>
                  <span className="font-bold text-sm">{country.value}</span>
                </div>
                <div className="relative w-full h-8 flex items-center">
                  <svg className="w-full" height="30">
                    <polyline
                      points={
                        country.trend === "up"
                          ? "0,20 40,15 80,10 120,8 160,5"
                          : country.trend === "down"
                            ? "0,5 40,8 80,10 120,15 160,20"
                            : "0,15 40,15 80,15 120,15 160,15"
                      }
                      fill="none"
                      stroke={
                        country.trend === "up" ? "#10b981" :
                          country.trend === "down" ? "#ef4444" : "#9ca3af"
                      }
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue and Fulfillment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-bold">Revenue Trend</h3>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => [`₹${(value * 1000).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <FileText className="w-16 h-16 mb-4" />
              <p>No revenue data available for selected period</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-6">Order Fulfillment Status</h3>
          <div className="space-y-4">
            {fulfillmentData.map((item, idx) => {
              const percent = totalOrders ? Math.round((item.count / totalOrders) * 100) : 0;
              return (
                <div key={idx}>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-bold text-gray-900">
                      {item.count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Recent Orders</h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={ordersSearchTerm}
                onChange={(e) => setOrdersSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {filteredOrders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Items</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-teal-600 font-semibold">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {order.user?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {order.orderItems?.length || 0}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(order.orderStatus)}`}>
                          {getStatusIcon(order.orderStatus)}
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {order.orderStatus !== "Cancelled" && order.orderStatus !== "Delivered" && (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Orders Pagination */}
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setOrdersPage(p => Math.max(p - 1, 1))}
                disabled={ordersPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ‹
              </button>

              {[...Array(Math.min(ordersTotalPages, 5))].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setOrdersPage(idx + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${ordersPage === idx + 1
                    ? 'bg-teal-500 text-white'
                    : 'border hover:bg-gray-50'
                    }`}
                >
                  {idx + 1}
                </button>
              ))}

              {ordersTotalPages > 5 && (
                <>
                  <span className="text-gray-400">...</span>
                  <button
                    onClick={() => setOrdersPage(ordersTotalPages)}
                    className="w-8 h-8 flex items-center justify-center rounded border hover:bg-gray-50"
                  >
                    {ordersTotalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setOrdersPage(p => Math.min(p + 1, ordersTotalPages))}
                disabled={ordersPage === ordersTotalPages}
                className="w-8 h-8 flex items-center justify-center rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <ShoppingBag className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No orders found</p>
            <p className="text-sm">{ordersSearchTerm ? 'Try adjusting your search' : 'Orders will appear here'}</p>
          </div>
        )}
      </div>

      {/* Low Stock Alert (Consistent UI Version) */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold">Low Stock Products</h3>
            </div>

            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
              {lowStockProducts.length} Items
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-600 font-semibold">
                  <th className="py-3 px-4 text-left">Product</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Stock</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Vendor</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedStockProducts.map((product, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Product */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: #{product._id?.slice(-5)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {product.category?.name || "-"}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      {product.stock} units
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-red-100 text-red-600 rounded-full font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Low Stock
                      </span>
                    </td>

                    {/* Vendor */}
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {product.seller || "Unknown"}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        className="px-4 py-1.5 bg-teal-600 text-white text-xs rounded-full hover:bg-teal-700 transition-colors font-medium"
                        onClick={() => toast.info("Restock feature coming soon!")}
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (consistent style) */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setStockPage((p) => Math.max(p - 1, 1))}
              disabled={stockPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ‹
            </button>

            {[...Array(Math.min(stockTotalPages, 5))].map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={idx}
                  onClick={() => setStockPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${stockPage === pageNum
                    ? "bg-teal-500 text-white"
                    : "border hover:bg-gray-50"
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {stockTotalPages > 5 && (
              <>
                <span className="text-gray-400">...</span>
                <button
                  onClick={() => setStockPage(stockTotalPages)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${stockPage === stockTotalPages
                    ? "bg-teal-500 text-white"
                    : "border hover:bg-gray-50"
                    }`}
                >
                  {stockTotalPages}
                </button>
              </>
            )}

            <button
              onClick={() => setStockPage((p) => Math.min(p + 1, stockTotalPages))}
              disabled={stockPage === stockTotalPages}
              className="w-8 h-8 flex items-center justify-center rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      )}


    </div>
  );
}