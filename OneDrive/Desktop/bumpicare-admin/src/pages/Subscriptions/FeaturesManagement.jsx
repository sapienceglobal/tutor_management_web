// ============================================
// 📁 pages/Subscriptions/FeaturesManagement.jsx
// ============================================

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-toastify';

const CATEGORIES = [
  { value: 'cart', label: 'Cart & Wishlist' },
  { value: 'orders', label: 'Orders' },
  { value: 'products', label: 'Products' },
  { value: 'search', label: 'Search & Filters' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'support', label: 'Support' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'api', label: 'API & Integrations' },
];

export default function FeaturesManagement() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/subscription/features');
      if (res.data.success) {
        setFeatures(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load features');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feature?')) return;

    try {
      const res = await api.delete(`/admin/subscription//features/${id}`);
      if (res.data.success) {
        toast.success('Feature deleted successfully');
        fetchFeatures();
      }
    } catch (error) {
      toast.error('Failed to delete feature');
    }
  };

  const filteredFeatures = filterCategory
    ? features.filter(f => f.category === filterCategory)
    : features;

  const groupedFeatures = filteredFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {});

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
          <h1 className="text-3xl font-bold text-gray-900">Features Management</h1>
          <p className="text-gray-500 mt-1">Manage available features across all plans</p>
        </div>
        <button
          onClick={() => {
            setEditingFeature(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Feature
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Features by Category */}
      <div className="space-y-6">
        {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
          <div key={category} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold text-gray-900 capitalize">
                {CATEGORIES.find(c => c.value === category)?.label || category}
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryFeatures.map(feature => (
                  <div
                    key={feature._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${feature.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <h4 className="font-semibold text-gray-900">{feature.displayName}</h4>
                      </div>
                      {feature.isGlobal && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Global
                        </span>
                      )}
                    </div>

                    {feature.description && (
                      <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingFeature(feature);
                          setShowModal(true);
                        }}
                        className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-3 h-3 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(feature._id)}
                        className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {features.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No features found</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
          >
            <Plus className="w-4 h-4" />
            Add Your First Feature
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <FeatureFormModal
          feature={editingFeature}
          onClose={() => {
            setShowModal(false);
            setEditingFeature(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingFeature(null);
            fetchFeatures();
          }}
        />
      )}
    </div>
  );
}

// Feature Form Modal
function FeatureFormModal({ feature, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    category: 'cart',
    icon: 'CheckCircle',
    isGlobal: false,
    isActive: true,
  });

  useEffect(() => {
    if (feature) {
      setFormData({
        name: feature.name || '',
        displayName: feature.displayName || '',
        description: feature.description || '',
        category: feature.category || 'cart',
        icon: feature.icon || 'CheckCircle',
        isGlobal: feature.isGlobal || false,
        isActive: feature.isActive !== undefined ? feature.isActive : true,
      });
    }
  }, [feature]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = feature
        ? `/admin/subscription/features/${feature._id}`
        : '/admin/subscription/features';
      
      const method = feature ? 'put' : 'post';

      const res = await api[method](endpoint, formData);

      if (res.data.success) {
        toast.success(`Feature ${feature ? 'updated' : 'created'} successfully`);
        onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save feature');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            {feature ? 'Edit Feature' : 'Add New Feature'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="hasAdvancedSearch"
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
              placeholder="Advanced Search"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Search with advanced filters and saved queries"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isGlobal}
                onChange={(e) => setFormData({...formData, isGlobal: e.target.checked})}
                className="w-4 h-4 text-teal-500 rounded"
              />
              <span className="text-sm text-gray-700">Available to all users (Global)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="w-4 h-4 text-teal-500 rounded"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : feature ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}