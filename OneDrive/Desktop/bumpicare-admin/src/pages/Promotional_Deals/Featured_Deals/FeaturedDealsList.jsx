import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, Eye, Star, TrendingUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";

export default function FeaturedDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadDeals();
  }, [filter]);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.append('isActive', filter);

      const res = await api.get(`/admin/featured-deals?${params.toString()}`);
      setDeals(res.data.data || []);
    } catch (err) {
      console.error('Failed to load featured deals:', err);
      setError('Failed to load featured deals');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await api.delete(`/admin/featured-deals/${id}`);
      alert('Featured deal deleted successfully!');
      loadDeals();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete featured deal');
    }
  };

  const handleNavigate = (path) => {
    window.location.href = path;
  };

  const getStatusBadge = (deal) => {
    const now = new Date();
    const start = new Date(deal.startDate);
    const end = new Date(deal.endDate);

    if (!deal.isActive) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-100">Inactive</span>;
    }
    if (now < start) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-700 bg-blue-100">Upcoming</span>;
    }
    if (now > end) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium text-red-700 bg-red-100">Expired</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-medium text-green-700 bg-green-100">Active</span>;
  };

  const getDealTypeIcon = (type) => {
    switch (type) {
      case 'product':
        return <Package size={20} className="text-purple-600" />;
      case 'category':
        return <TrendingUp size={20} className="text-blue-600" />;
      case 'bundle':
        return <Star size={20} className="text-orange-600" />;
      default:
        return <Star size={20} className="text-gray-600" />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="text-purple-500" size={28} />
            Featured Deals
          </h1>
          <p className="text-gray-500 text-sm mt-1">Showcase your best deals and offers</p>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          onClick={() => handleNavigate('/featured-deal/new')}
        >
          <Plus size={18} />
          Create Featured Deal
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter */}
      <div className="flex justify-end mb-6">
        <select
          className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : deals.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Star size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No featured deals found</p>
          </div>
        ) : (
          deals.map((deal) => (
            <div
              key={deal._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden"
            >
              {/* Banner */}
              {deal.banner && (
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                  <img
                    src={deal.banner}
                    alt={deal.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                    }}
                  />
                  <Star size={48} className="absolute inset-0 m-auto text-gray-300" />
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getDealTypeIcon(deal.dealType)}
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                        {deal.title}
                      </h3>
                    </div>
                    {getStatusBadge(deal)}
                  </div>
                </div>

                {deal.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {deal.description}
                  </p>
                )}

                {/* Badge */}
                {deal.badge && (
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {deal.badge}
                    </span>
                  </div>
                )}

                {/* Deal Type Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Deal Type</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {deal.dealType === 'bundle' ? 'Product Bundle' : deal.dealType}
                  </p>
                  {deal.dealType === 'product' && deal.product && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                      {deal.product.name}
                    </p>
                  )}
                  {deal.dealType === 'category' && deal.category && (
                    <p className="text-xs text-gray-600 mt-1">
                      {deal.category.name}
                    </p>
                  )}
                  {deal.dealType === 'bundle' && deal.bundleProducts && (
                    <p className="text-xs text-gray-600 mt-1">
                      {deal.bundleProducts.length} products
                    </p>
                  )}
                </div>

                {/* Pricing */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    {deal.originalPrice && (
                      <div>
                        <span className="text-xs text-gray-600">Was: </span>
                        <span className="text-sm font-semibold text-gray-400 line-through">
                          ₹{deal.originalPrice}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-gray-600">Now: </span>
                      <span className="text-xl font-bold text-purple-600">
                        ₹{deal.dealPrice}
                      </span>
                    </div>
                  </div>
                  {deal.discountPercentage > 0 && (
                    <span className="inline-block px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
                      {deal.discountPercentage}% OFF
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600">Views</p>
                    <p className="text-lg font-bold text-gray-900">{deal.viewCount || 0}</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-xs text-gray-600">Sales</p>
                    <p className="text-lg font-bold text-gray-900">{deal.purchaseCount || 0}</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <p className="text-xs text-gray-600">Order</p>
                    <p className="text-lg font-bold text-gray-900">{deal.displayOrder}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="text-xs text-gray-500 mb-4 space-y-1">
                  <p>
                    <span className="font-medium">Start:</span>{' '}
                    {new Date(deal.startDate).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">End:</span>{' '}
                    {new Date(deal.endDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => handleNavigate(`/featured-deal/${deal._id}`)}
                  >
                    <Eye size={14} className="mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => handleNavigate(`/featured-deal/edit/${deal._id}`)}
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(deal._id, deal.title)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}