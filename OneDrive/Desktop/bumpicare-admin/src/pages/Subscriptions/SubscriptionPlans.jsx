// ============================================
// 📁 pages/Subscriptions/SubscriptionPlans.jsx
// ============================================

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, Check } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-toastify';
import PlanFormModal from './PlanFormModal';

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/subscription/plans');
      if (res.data.success) {
        setPlans(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load plans');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/admin/subscription/${id}/toggle`);
      if (res.data.success) {
        toast.success(`Plan ${currentStatus ? 'deactivated' : 'activated'}`);
        fetchPlans();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await api.patch(`/admin/subscription/plans/${id}/set-default`);
      if (res.data.success) {
        toast.success('Default plan updated');
        fetchPlans();
      }
    } catch (error) {
      toast.error('Failed to set default plan');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? Users on this plan cannot be deleted.')) return;

    try {
      const res = await api.delete(`/admin/subscription/plans/${id}`);
      if (res.data.success) {
        toast.success('Plan deleted successfully');
        fetchPlans();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setShowModal(true);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-500 mt-1">Manage your subscription tiers</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`relative bg-white rounded-2xl shadow-sm border-2 ${
              plan.isDefault ? 'border-teal-500' : 'border-gray-200'
            } hover:shadow-lg transition-all overflow-hidden`}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                {plan.badge}
              </div>
            )}

            {/* Status Indicator */}
            <div className="absolute top-4 left-4">
              {plan.isActive ? (
                <Eye className="w-5 h-5 text-green-500" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
            </div>

            <div className="p-6 pt-12">
              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{plan.displayName}</h3>
                {plan.tagline && (
                  <p className="text-sm text-gray-500 mt-1">{plan.tagline}</p>
                )}
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold" style={{ color: plan.color }}>
                    ₹{plan.price}
                  </span>
                  <span className="text-gray-500">/{plan.billingCycle}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{plan.duration} days validity</p>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 text-center mb-6 min-h-[40px]">
                {plan.description}
              </p>

              {/* Key Features */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>
                    {plan.features.maxCartItems === -1 ? 'Unlimited' : plan.features.maxCartItems} cart items
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>
                    {plan.features.maxOrdersPerMonth === -1 ? 'Unlimited' : plan.features.maxOrdersPerMonth} orders/month
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="capitalize">{plan.features.shippingType} shipping</span>
                </div>
                {plan.features.hasAdvancedSearch && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Advanced search & filters</span>
                  </div>
                )}
                {plan.features.hasPrioritySupport && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Priority support</span>
                  </div>
                )}
              </div>

              {/* Default Badge */}
              {plan.isDefault && (
                <div className="mb-4 flex items-center justify-center gap-2 text-teal-600 bg-teal-50 px-3 py-2 rounded-lg">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-semibold">Default Plan</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(plan._id, plan.isActive)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {plan.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {plan.isActive ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="flex gap-2 mt-2">
                {!plan.isDefault && (
                  <button
                    onClick={() => handleSetDefault(plan._id)}
                    className="flex-1 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(plan._id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {plans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No subscription plans found</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
          >
            <Plus className="w-4 h-4" />
            Create Your First Plan
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PlanFormModal
          plan={editingPlan}
          onClose={() => {
            setShowModal(false);
            setEditingPlan(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingPlan(null);
            fetchPlans();
          }}
        />
      )}
    </div>
  );
}