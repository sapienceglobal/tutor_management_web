// ============================================
// 📁 pages/Subscriptions/PlanFormModal.jsx
// ============================================

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-toastify';

const defaultFeatures = {
  maxCartItems: 5,
  maxWishlistItems: 10,
  maxOrdersPerMonth: 10,
  canBulkOrder: false,
  maxBulkOrderItems: 0,
  canViewAllProducts: true,
  maxProductViews: -1,
  hasAdvancedSearch: false,
  hasAdvancedFilters: false,
  canSaveSearches: false,
  shippingType: "standard",
  freeShippingAbove: 999,
  hasPrioritySupport: false,
  hasDedicatedManager: false,
  supportResponseTime: "24-48hrs",
  hasApiAccess: false,
  canExportData: false,
  hasAnalyticsDashboard: false,
  canScheduleOrders: false,
  hasWhiteLabel: false,
  maxDiscountPercent: 10,
  canStackCoupons: false,
  returnWindow: 7,
  hasEasyReturns: false,
};

export default function PlanFormModal({ plan, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    tagline: '',
    price: 0,
    duration: 30,
    billingCycle: 'monthly',
    color: '#14b8a6',
    icon: 'Package',
    badge: '',
    displayOrder: 0,
    features: defaultFeatures
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        displayName: plan.displayName || '',
        description: plan.description || '',
        tagline: plan.tagline || '',
        price: plan.price || 0,
        duration: plan.duration || 30,
        billingCycle: plan.billingCycle || 'monthly',
        color: plan.color || '#14b8a6',
        icon: plan.icon || 'Package',
        badge: plan.badge || '',
        displayOrder: plan.displayOrder || 0,
        features: { ...defaultFeatures, ...plan.features }
      });
    }
  }, [plan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = plan
        ? `/admin/subscription/plans/${plan._id}`
        : '/admin/subscription/plans';
      
      const method = plan ? 'put' : 'post';

      const res = await api[method](endpoint, formData);

      if (res.data.success) {
        toast.success(`Plan ${plan ? 'updated' : 'created'} successfully`);
        onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {plan ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="basic_plan"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  placeholder="Basic Plan"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Perfect for individuals just getting started"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                placeholder="Best for beginners"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (days) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Cycle *
                </label>
                <select
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Display Settings</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-full h-10 px-1 py-1 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Badge
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({...formData, badge: e.target.value})}
                  placeholder="Popular"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({...formData, displayOrder: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Features & Limits</h3>
            
            {/* Cart & Wishlist */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900">Cart & Wishlist</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Max Cart Items (-1 = unlimited)
                  </label>
                  <input
                    type="number"
                    value={formData.features.maxCartItems}
                    onChange={(e) => handleFeatureChange('maxCartItems', Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Max Wishlist Items (-1 = unlimited)
                  </label>
                  <input
                    type="number"
                    value={formData.features.maxWishlistItems}
                    onChange={(e) => handleFeatureChange('maxWishlistItems', Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Orders */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900">Orders</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Max Orders Per Month (-1 = unlimited)
                  </label>
                  <input
                    type="number"
                    value={formData.features.maxOrdersPerMonth}
                    onChange={(e) => handleFeatureChange('maxOrdersPerMonth', Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.features.canBulkOrder}
                      onChange={(e) => handleFeatureChange('canBulkOrder', e.target.checked)}
                      className="w-4 h-4 text-teal-500 rounded"
                    />
                    <span className="text-sm text-gray-700">Enable Bulk Orders</span>
                  </label>
                  {formData.features.canBulkOrder && (
                    <input
                      type="number"
                      placeholder="Max bulk items"
                      value={formData.features.maxBulkOrderItems}
                      onChange={(e) => handleFeatureChange('maxBulkOrderItems', Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg mt-2"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">Search & Filters</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.hasAdvancedSearch}
                    onChange={(e) => handleFeatureChange('hasAdvancedSearch', e.target.checked)}
                    className="w-4 h-4 text-teal-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Advanced Search</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.hasAdvancedFilters}
                    onChange={(e) => handleFeatureChange('hasAdvancedFilters', e.target.checked)}
                    className="w-4 h-4 text-teal-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Advanced Filters</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.canSaveSearches}
                    onChange={(e) => handleFeatureChange('canSaveSearches', e.target.checked)}
                    className="w-4 h-4 text-teal-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Save Searches</span>
                </label>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900">Shipping</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Shipping Type
                  </label>
                  <select
                    value={formData.features.shippingType}
                    onChange={(e) => handleFeatureChange('shippingType', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                    <option value="same-day">Same Day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Free Shipping Above (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.features.freeShippingAbove}
                    onChange={(e) => handleFeatureChange('freeShippingAbove', Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">Support</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.hasPrioritySupport}
                    onChange={(e) => handleFeatureChange('hasPrioritySupport', e.target.checked)}
                    className="w-4 h-4 text-teal-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Priority Support</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.hasDedicatedManager}
                    onChange={(e) => handleFeatureChange('hasDedicatedManager', e.target.checked)}
                    className="w-4 h-4 text-teal-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Dedicated Account Manager</span>
                </label>
              </div>
            </div>

            {/* Advanced Features */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">Advanced Features</h4>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.hasApiAccess}
                    onChange={(e) => handleFeatureChange('hasApiAccess', e.target.checked)}
                    className="w-4 h-4 text-teal-500 rounded"
                  />
                  <span className="text-sm text-gray-700">API Access</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.canExportData}
                    onChange={(e) => handleFeatureChange('canExportData', e.target.checked)}
                    className="w-4 h-4 text-teal-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Data Export</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.hasAnalyticsDashboard}
                    onChange={(e) => handleFeatureChange('hasAnalyticsDashboard', e.target.checked)}
                    className="w-4 h-4 text-teal-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Analytics Dashboard</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.hasWhiteLabel}
                    onChange={(e) => handleFeatureChange('hasWhiteLabel', e.target.checked)}
                    className="w-4 h-4 text-teal-500 rounded"
                  />
                  <span className="text-sm text-gray-700">White Label</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}