import { useEffect, useState } from "react";
import { Search, Filter, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";

export default function OrderRequests() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    orderType: "",
    search: "",
  });

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [filters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.orderType) params.append('orderType', filters.orderType);

      const res = await api.get(`/admin/orders/requests?${params.toString()}`);
      setOrders(res.data.data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Failed to load order requests');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/orders/requests');
      const allOrders = res.data.data || [];
      
      setStats({
        pending: allOrders.filter(o => o.status === 'pending').length,
        approved: allOrders.filter(o => o.status === 'approved').length,
        completed: allOrders.filter(o => o.status === 'completed').length,
        rejected: allOrders.filter(o => o.status === 'rejected').length,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Approved' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { bg: 'bg-gray-100', text: 'text-gray-800' },
      medium: { bg: 'bg-blue-100', text: 'text-blue-800' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800' },
      urgent: { bg: 'bg-red-100', text: 'text-red-800' },
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {priority?.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Requests</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by product..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <select
          className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={filters.orderType}
          onChange={(e) => setFilters({ ...filters, orderType: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="purchase">Purchase</option>
          <option value="restocking">Restocking</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Order ID</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Product</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Quantity</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Order Type</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Priority</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Supplier</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Warehouse</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Date</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-gray-500">
                    No order requests found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {order.product?.name || 'N/A'}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {order.quantity} {order.unit}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap capitalize">
                      {order.orderType}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {getPriorityBadge(order.priority)}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {order.supplier || 'N/A'}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {order.warehouse}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => navigate(`/order-requests/${order._id}`)}
                      >
                        <Eye size={14} className="mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}