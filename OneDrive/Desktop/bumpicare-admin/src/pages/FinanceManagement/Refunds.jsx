// ============================================
// 📁 Refunds.jsx - Main List View
// ============================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import {
  Download,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Refunds() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRefunds, setSelectedRefunds] = useState(new Set());

  // Fetch Refunds
  const { data: refundsData, isLoading } = useQuery({
    queryKey: ['refunds', searchQuery, paymentMethodFilter, statusFilter, dateFilter, page],
    queryFn: async () => {
      const res = await api.get('/admin/refunds', {
        params: {
          search: searchQuery,
          paymentMethod: paymentMethodFilter,
          status: statusFilter,
          dateFilter: dateFilter,
          page,
          limit: 10
        }
      });
      return res.data;
    },
  });

  const refunds = refundsData?.data || [];
  const pagination = refundsData?.pagination || {};

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRefunds(new Set(refunds.map(r => r._id)));
    } else {
      setSelectedRefunds(new Set());
    }
  };

  const handleSelectRefund = (id) => {
    const next = new Set(selectedRefunds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRefunds(next);
  };

  const handleExport = () => {
    window.open('/admin/refunds/export', '_blank');
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Refund Initiated': 'bg-blue-100 text-blue-700',
      'Refunded': 'bg-green-100 text-green-700',
      'Rejected': 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Refunds</h1>
        <button
          onClick={handleExport}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b space-y-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            {/* Payment Method Filter */}
            <div className="relative">
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-teal-500 outline-none bg-white"
              >
                <option value="">Payment Method</option>
                <option value="Wallet">Wallet</option>
                <option value="COD">COD</option>
                <option value="ONLINE">Online</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-teal-500 outline-none bg-white"
              >
                <option value="">Status</option>
                <option value="Pending">Pending</option>
                <option value="Refund Initiated">Refund Initiated</option>
                <option value="Refunded">Refunded</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-teal-500 outline-none bg-white"
              >
                <option value="">Date</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300"
                    checked={selectedRefunds.size === refunds.length && refunds.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Payment Method</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Resone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
                      <p className="text-gray-500">Loading...</p>
                    </div>
                  </td>
                </tr>
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    No refunds found
                  </td>
                </tr>
              ) : (
                refunds.map((refund) => (
                  <tr key={refund._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={selectedRefunds.has(refund._id)}
                        onChange={() => handleSelectRefund(refund._id)}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      #{refund._id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      #{refund.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {refund.customerName || 'Customer Name'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ${refund.refundAmount?.toFixed(2) || '10'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {refund.paymentMethod}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {refund.refundReason ? (
                        <span className="max-w-[200px] truncate block">
                          {refund.refundReason}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(refund.paymentStatus)}`}>
                        {refund.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(refund.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => navigate(`/refunds/${refund._id}`)}
                        className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 p-6 border-t">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {[1, 2, 3].map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  page === pageNum
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'border hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <span className="px-2 text-gray-500">...</span>
            <span className="px-2 text-gray-500">{pagination.pages || 120}</span>

            <button
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 📁 RefundDetails.jsx - Detail View
// ============================================

export function RefundDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: refundData, isLoading } = useQuery({
    queryKey: ['refund', id],
    queryFn: async () => {
      const res = await api.get(`/admin/refunds/${id}`);
      return res.data;
    },
  });

  const refund = refundData?.data || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/refunds')}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Details</h1>
        </div>
      </div>

      {/* Refunds Information */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Refunds Information</h2>

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">#{refund._id?.slice(-6) || '73423'}</h3>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            refund.paymentStatus === 'Refunded' 
              ? 'bg-green-100 text-green-700'
              : refund.paymentStatus === 'Refund Initiated'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {refund.paymentStatus || 'Pending'}
          </span>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Requested Amount */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 border border-cyan-200">
            <p className="text-sm text-gray-600 mb-2">Requested Amount</p>
            <h3 className="text-2xl font-bold text-gray-900">
              ${refund.refundAmount?.toLocaleString() || '50423'}
            </h3>
          </div>

          {/* Payment Method */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
            <p className="text-sm text-gray-600 mb-2">Payment Method</p>
            <h3 className="text-xl font-bold text-gray-900">{refund.paymentMethod || 'Wallet'}</h3>
          </div>

          {/* Requested Date */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <p className="text-sm text-gray-600 mb-2">Requested Date</p>
            <h3 className="text-lg font-bold text-gray-900">
              {new Date(refund.createdAt || Date.now()).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </h3>
          </div>

          {/* Payout Date */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <p className="text-sm text-gray-600 mb-2">Payout Date</p>
            <h3 className="text-lg font-bold text-gray-900">
              {refund.refundedAt 
                ? new Date(refund.refundedAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : '-'
              }
            </h3>
          </div>
        </div>

        {/* Reason */}
        {refund.refundReason && (
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Resone</h4>
            <p className="text-gray-600 leading-relaxed">
              {refund.refundReason}
            </p>
          </div>
        )}
      </div>

      {/* Customer Information */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Information</h2>

        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">
            {refund.customerName?.charAt(0) || 'J'}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            <h3 className="text-xl font-bold text-gray-900">
              {refund.customerName || 'Jenny Wilson'}
            </h3>
            <div className="flex flex-wrap gap-6 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span>📧</span>
                <span>{refund.customerEmail || 'jackson.graham@example.com'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📞</span>
                <span>{refund.customerPhone || '(405) 555-0128'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{refund.customerAddress || '3517 W. Gray St. Utica, Pennsylvania 57867'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refunds Product */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Refunds Product</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Product Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Payment status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {refund.orderItems?.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    #{item._id?.slice(-6) || '73423'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {item.productName || 'Product Name'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {item.quantity || 20} pcs
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    ${((item.price || 20) * (item.quantity || 20)).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      paid
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(refund.createdAt || Date.now()).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              )) || (
                // Placeholder rows
                Array(4).fill(0).map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">#73423</td>
                    <td className="px-6 py-4 text-sm">Product Name</td>
                    <td className="px-6 py-4 text-sm">20 pcs</td>
                    <td className="px-6 py-4 text-sm font-semibold">$400</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        paid
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">12 Sept, 2027</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 p-6 border-t">
          <button className="p-2 rounded-lg border hover:bg-gray-50">
            <ChevronLeft className="w-5 h-5" />
          </button>

          {[1, 2, 3].map((pageNum) => (
            <button
              key={pageNum}
              className={`px-4 py-2 rounded-lg transition-colors ${
                pageNum === 1
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'border hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <span className="px-2 text-gray-500">...</span>
          <span className="px-2 text-gray-500">120</span>

          <button className="p-2 rounded-lg border hover:bg-gray-50">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}