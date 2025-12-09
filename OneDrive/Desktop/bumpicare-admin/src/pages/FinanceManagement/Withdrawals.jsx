import { useEffect, useState } from "react";
import { Search, TrendingUp, TrendingDown, FileText, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/services/api";

export default function Withdrawals() {
  const [summary, setSummary] = useState({
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    invoiceCount: 0,
    rejectedAmount: 0,
    changePercentage: 0,
  });

  const [withdrawals, setWithdrawals] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWithdrawals, setSelectedWithdrawals] = useState([]);

  const [filters, setFilters] = useState({
    seller: "",
    status: "",
    paymentMethod: "",
    requestedDate: "",
    payoutDate: "",
    search: "",
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Load sellers for filter
  const loadSellers = async () => {
    try {
      const res = await api.get('/admin/sellers');
      setSellers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load sellers:', err);
    }
  };

  // Load summary
  const loadSummary = async () => {
    try {
      const res = await api.get('/admin/withdrawals/summary');
      if (res?.data?.data) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  // Load withdrawals
  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.seller) params.append('seller', filters.seller);
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get(`/admin/withdrawals?${params.toString()}`);
      
      if (res?.data?.data && Array.isArray(res.data.data)) {
        setWithdrawals(res.data.data);
        setPagination(prev => ({
          ...prev,
          totalItems: res.data.data.length,
          totalPages: Math.ceil(res.data.data.length / prev.itemsPerPage),
        }));
      }
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
    loadSummary();
    loadWithdrawals();
  }, []);

  useEffect(() => {
    loadWithdrawals();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [filters]);

  const getPaginatedWithdrawals = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return withdrawals.slice(startIndex, endIndex);
  };

  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedWithdrawals(getPaginatedWithdrawals().map(w => w._id));
    } else {
      setSelectedWithdrawals([]);
    }
  };

  const handleSelectWithdrawal = (id) => {
    setSelectedWithdrawals(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const handlePayout = async (id) => {
    const transactionId = prompt('Enter transaction ID for payout:');
    if (!transactionId) return;

    try {
      await api.patch(`/admin/withdrawals/${id}/payout`, { transactionId });
      alert('Payout processed successfully!');
      loadWithdrawals();
      loadSummary();
    } catch (err) {
      console.error('Payout error:', err);
      alert(err.response?.data?.message || 'Failed to process payout');
    }
  };

  const handleView = (id) => {
    window.location.href = `/withdrawals/${id}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Approved': 'bg-green-100 text-green-700',
      'Completed': 'bg-blue-100 text-blue-700',
      'Rejected': 'bg-red-100 text-red-700',
      'Processing': 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const paginatedWithdrawals = getPaginatedWithdrawals();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Withdraws</h1>
        <div className="flex gap-3">
          <Button variant="outline" className="text-teal-600 border-teal-600">
            Invoice
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 bg-cyan-50 border border-cyan-100 rounded-2xl">
          <p className="text-gray-600 text-sm font-medium">Total Withdraws</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">
            ${summary.totalWithdrawals.toLocaleString()}
          </h2>
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-xs font-medium ${summary.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.changePercentage >= 0 ? '+' : ''}{summary.changePercentage}%
            </span>
            {summary.changePercentage >= 0 ? (
              <TrendingUp size={14} className="text-green-600" />
            ) : (
              <TrendingDown size={14} className="text-red-600" />
            )}
          </div>
        </div>

        <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
          <p className="text-gray-600 text-sm font-medium">Pending Withdrawals</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">
            ${summary.pendingWithdrawals.toLocaleString()}
          </h2>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs font-medium text-blue-600">+0.1%</span>
            <TrendingUp size={14} className="text-blue-600" />
          </div>
        </div>

        <div className="p-5 bg-green-50 border border-green-100 rounded-2xl">
          <p className="text-gray-600 text-sm font-medium">Invoice</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">
            {summary.invoiceCount}
          </h2>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs font-medium text-green-600">+0.1%</span>
            <TrendingUp size={14} className="text-green-600" />
          </div>
        </div>

        <div className="p-5 bg-red-50 border border-red-100 rounded-2xl">
          <p className="text-gray-600 text-sm font-medium">Rejected</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">
            ${summary.rejectedAmount.toLocaleString()}
          </h2>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs font-medium text-red-600">-0.1%</span>
            <TrendingDown size={14} className="text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              value={filters.seller}
              onChange={(e) => setFilters({ ...filters, seller: e.target.value })}
            >
              <option value="">Seller</option>
              {sellers.map(seller => (
                <option key={seller._id} value={seller._id}>{seller.name}</option>
              ))}
            </select>

            <select
              className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              value={filters.paymentMethod}
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
            >
              <option value="">Payment Method</option>
              <option value="Wallet">Wallet</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="PayPal">PayPal</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left w-12">
                  <Checkbox
                    checked={selectedWithdrawals.length === paginatedWithdrawals.length && paginatedWithdrawals.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Seller</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Requested Amount</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Requested Date</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Payment Method</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Payment Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Payout Date</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Note</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-12 text-center">
                    <p className="text-gray-500">No withdrawals found</p>
                  </td>
                </tr>
              ) : (
                paginatedWithdrawals.map((w) => (
                  <tr key={w._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <Checkbox
                        checked={selectedWithdrawals.includes(w._id)}
                        onCheckedChange={() => handleSelectWithdrawal(w._id)}
                      />
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-900">
                      #{w.withdrawalId || w._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {w.seller?.name || 'Seller Name'}
                    </td>
                    <td className="p-4 text-sm font-semibold text-gray-900">
                      ${w.requestedAmount.toLocaleString()}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {formatDate(w.requestedDate)}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {w.paymentMethod}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(w.paymentStatus)}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {w.payoutDate ? formatDate(w.payoutDate) : '12 Sept, 2027'}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {w.note || '–'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs"
                          onClick={() => handlePayout(w._id)}
                          disabled={w.paymentStatus === 'Completed' || w.paymentStatus === 'Rejected'}
                        >
                          Payout
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleView(w._id)}
                        >
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && withdrawals.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                disabled={pagination.currentPage === 1}
                onClick={() => goToPage(pagination.currentPage - 1)}
              >
                <ChevronLeft size={18} />
              </button>

              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded-lg ${
                      pagination.currentPage === pageNum
                        ? 'bg-teal-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {pagination.totalPages > 5 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <button className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50">
                    {pagination.totalPages}
                  </button>
                </>
              )}

              <button
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => goToPage(pagination.currentPage + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}