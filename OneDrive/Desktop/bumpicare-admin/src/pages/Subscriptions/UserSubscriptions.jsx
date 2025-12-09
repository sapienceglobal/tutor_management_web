// ============================================
// 📁 pages/Subscriptions/UserSubscriptions.jsx
// ============================================

import { useState, useEffect } from 'react';
import { Search, UserCheck, Ban, Edit2, Calendar, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-toastify';

export default function UserSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
  }, [page, statusFilter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/subscription/user-subscriptions', {
        params: { page, status: statusFilter }
      });
      
      if (res.data.success) {
        setSubscriptions(res.data.data.subscriptions);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (error) {
      toast.error('Failed to load subscriptions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get('/admin/subscription/plans');
      if (res.data.success) {
        setPlans(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load plans');
    }
  };

  const handleCancelSubscription = async (userId, userName) => {
    if (!window.confirm(`Cancel subscription for ${userName}?`)) return;

    try {
      const res = await api.patch(`/admin/subscription/cancel-subscription/${userId}`);
      if (res.data.success) {
        toast.success('Subscription cancelled');
        fetchSubscriptions();
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const handleAssignSubscription = async (userId, planId, duration) => {
    try {
      const res = await api.post('/admin/subscription/assign-subscription', {
        userId,
        planId,
        duration
      });

      if (res.data.success) {
        toast.success('Subscription assigned successfully');
        setShowAssignModal(false);
        setSelectedUser(null);
        fetchSubscriptions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign subscription');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
      trial: 'bg-blue-100 text-blue-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    !searchTerm ||
    sub.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Subscriptions</h1>
          <p className="text-gray-500 mt-1">Manage user subscription plans</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="trial">Trial</option>
          </select>

          <button
            onClick={() => fetchSubscriptions()}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Plan</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Start Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">End Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Days Left</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub, idx) => {
                const daysLeft = getDaysRemaining(sub.endDate);
                const isExpiring = daysLeft <= 7 && daysLeft > 0;

                return (
                  <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{sub.user?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{sub.user?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: sub.currentPlan?.color || '#14b8a6' }}
                        />
                        <span className="font-medium text-gray-900">
                          {sub.currentPlan?.displayName || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(sub.startDate)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(sub.endDate)}
                    </td>
                    <td className="py-3 px-4">
                      {sub.status === 'active' && (
                        <div className="flex items-center gap-2">
                          {isExpiring && (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                          <span className={`text-sm font-semibold ${isExpiring ? 'text-amber-600' : 'text-gray-900'}`}>
                            {daysLeft} days
                          </span>
                        </div>
                      )}
                      {sub.status === 'expired' && (
                        <span className="text-sm text-red-600 font-semibold">Expired</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser({
                              userId: sub.user._id,
                              userName: sub.user.name,
                              currentPlan: sub.currentPlan
                            });
                            setShowAssignModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Change Plan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {sub.status === 'active' && (
                          <button
                            onClick={() => handleCancelSubscription(sub.user._id, sub.user.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel Subscription"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No subscriptions found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Assign/Change Plan Modal */}
      {showAssignModal && selectedUser && (
        <AssignPlanModal
          user={selectedUser}
          plans={plans}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedUser(null);
          }}
          onAssign={handleAssignSubscription}
        />
      )}
    </div>
  );
}

// Assign Plan Modal Component
function AssignPlanModal({ user, plans, onClose, onAssign }) {
  const [selectedPlan, setSelectedPlan] = useState('');
  const [customDuration, setCustomDuration] = useState(30);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }
    onAssign(user.userId, selectedPlan, customDuration);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">Assign Plan to {user.userName}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Plan
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            >
              <option value="">Choose a plan...</option>
              {plans.filter(p => p.isActive).map(plan => (
                <option key={plan._id} value={plan._id}>
                  {plan.displayName} - ₹{plan.price}/{plan.billingCycle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (days)
            </label>
            <input
              type="number"
              min="1"
              value={customDuration}
              onChange={(e) => setCustomDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
            >
              Assign Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}