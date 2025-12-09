import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Search, 
  Eye, 
  Download, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

export default function OrderList() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [receivedStatusFilter, setReceivedStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('12months');
  const [chartPeriod, setChartPeriod] = useState('12months');
  const [page, setPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const navigate = useNavigate();

  // Fetch orders with stats
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', searchQuery, paymentStatusFilter, receivedStatusFilter, page],
    queryFn: async () => {
      const res = await api.get('/admin/orders', {
        params: { 
          search: searchQuery, 
          paymentStatus: paymentStatusFilter,
          orderStatus: receivedStatusFilter,
          page, 
          limit: 10 
        },
      });
      return res.data;
    },
  });

  // Fetch order stats
  const { data: statsData } = useQuery({
    queryKey: ['orderStats'],
    queryFn: async () => {
      const res = await api.get('/admin/orders/stats');
      return res.data;
    },
  });

  // Fetch chart data based on period
  const { data: chartData } = useQuery({
    queryKey: ['orderChart', chartPeriod],
    queryFn: async () => {
      const res = await api.get('/admin/orders/chart', {
        params: { period: chartPeriod }
      });
      return res.data;
    },
  });

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Select all orders
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allOrderIds = orders.map(order => order._id);
      setSelectedOrders(allOrderIds);
    } else {
      setSelectedOrders([]);
    }
  };

  // Select individual order
  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const getPaymentBadge = (status) => {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        {status || 'paid'}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Processing: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
      Shipped: { bg: 'bg-orange-100', text: 'text-orange-700' },
      Delivered: { bg: 'bg-green-100', text: 'text-green-700' },
      Cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
      Returned: { bg: 'bg-purple-100', text: 'text-purple-700' },
      Failed: { bg: 'bg-gray-100', text: 'text-gray-700' },
    };

    const config = statusConfig[status] || statusConfig.Processing;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
    );
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{payload[0].payload.name}</p>
          <p className="text-sm text-teal-600">Earnings: ${payload[0].value.toLocaleString()}</p>
          <p className="text-sm text-orange-600">Profits: ${payload[1].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination || {};
  const stats = statsData?.data || {
    total: 0,
    pendingPayment: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
    failed: 0,
  };

  const profitData = chartData?.data || [];

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Total Orders</h1>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2">
          <Download size={18} />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Order */}
        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Order</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        {/* Pending Payment */}
        <div className="p-5 bg-yellow-50 rounded-2xl border border-yellow-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Payment</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingPayment}</p>
            </div>
          </div>
        </div>

        {/* Processing */}
        <div className="p-5 bg-cyan-50 rounded-2xl border border-cyan-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <Package className="text-cyan-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-3xl font-bold text-gray-900">{stats.processing}</p>
            </div>
          </div>
        </div>

        {/* Shipped */}
        <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <Package className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Shipped</p>
              <p className="text-3xl font-bold text-gray-900">{stats.shipped}</p>
            </div>
          </div>
        </div>

        {/* Delivered */}
        <div className="p-5 bg-pink-50 rounded-2xl border border-pink-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <CheckCircle className="text-pink-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-3xl font-bold text-gray-900">{stats.delivered}</p>
            </div>
          </div>
        </div>

        {/* Cancel */}
        <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <XCircle className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cancel</p>
              <p className="text-3xl font-bold text-gray-900">{stats.cancelled}</p>
            </div>
          </div>
        </div>

        {/* Returned */}
        <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <RotateCcw className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Returned</p>
              <p className="text-3xl font-bold text-gray-900">{stats.returned}</p>
            </div>
          </div>
        </div>

        {/* Failed */}
        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <AlertCircle className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Margin Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Profit margin</h2>
        
        {/* Time filter tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {[
              { label: '12 months', value: '12months' },
              { label: '30 days', value: '30days' },
              { label: '7 days', value: '7days' },
              { label: '24 hours', value: '24hours' }
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setChartPeriod(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chartPeriod === period.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-600"></div>
              <span className="text-gray-600">Earnings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              <span className="text-gray-600">Total Profits</span>
            </div>
          </div>
        </div>

        {/* Recharts Line Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={profitData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="earnings" 
              stroke="#0d9488" 
              strokeWidth={3}
              dot={{ fill: '#0d9488', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="profits" 
              stroke="#fb923c" 
              strokeWidth={3}
              dot={{ fill: '#fb923c', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="pl-10 h-11"
          />
        </div>

        <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
          <SelectTrigger className="w-48 h-11">
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem >All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={receivedStatusFilter} onValueChange={setReceivedStatusFilter}>
          <SelectTrigger className="w-48 h-11">
            <SelectValue placeholder="Received status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem >All</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Returned">Returned</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48 h-11">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 w-4 h-4"
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment status</TableHead>
              <TableHead>Received status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id} className="hover:bg-gray-50">
                  <TableCell>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 w-4 h-4"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleSelectOrder(order._id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    #{order.orderNumber || order._id.slice(-6)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{order.user?.name || 'N/A'}</p>
                    </div>
                  </TableCell>
                  <TableCell>{order.orderItems?.length || 0} pcs</TableCell>
                  <TableCell className="font-semibold">${order.totalAmount}</TableCell>
                  <TableCell>
                    {getPaymentBadge(order.paymentStatus)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.orderStatus)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/orders/${order._id}`)}
                      className="hover:bg-gray-100"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>

          {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  page === pageNum
                    ? 'bg-teal-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {pagination.pages > 5 && (
            <>
              <span className="px-2 text-gray-500">...</span>
              <button
                onClick={() => setPage(pagination.pages)}
                className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                {pagination.pages}
              </button>
            </>
          )}

          <button
            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
            disabled={page === pagination.pages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}