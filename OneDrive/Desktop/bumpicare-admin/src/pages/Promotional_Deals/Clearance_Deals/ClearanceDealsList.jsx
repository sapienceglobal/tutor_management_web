import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, Tag, AlertCircle, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";

export default function ClearanceDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterReason, setFilterReason] = useState("");

  useEffect(() => {
    loadDeals();
  }, [filterStatus, filterReason]);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('isActive', filterStatus);
      if (filterReason) params.append('reason', filterReason);

      const res = await api.get(`/admin/clearance-deals?${params.toString()}`);
      setDeals(res.data.data || []);
    } catch (err) {
      console.error('Failed to load clearance deals:', err);
      setError('Failed to load clearance deals');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.delete(`/admin/clearance-deals/${id}`);
      alert('Clearance deal deleted successfully!');
      loadDeals();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete clearance deal');
    }
  };

  const handleNavigate = (path) => {
    window.location.href = path;
  };

  const getStatusBadge = (deal) => {
    const now = new Date();
    const end = new Date(deal.endDate);

    if (!deal.isActive) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-100">Inactive</span>;
    }
    if (now > end) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium text-red-700 bg-red-100">Ended</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-medium text-green-700 bg-green-100">Active</span>;
  };

  const getReasonBadge = (reason) => {
    const colors = {
      'season-end': 'bg-blue-100 text-blue-700',
      'overstock': 'bg-orange-100 text-orange-700',
      'discontinued': 'bg-purple-100 text-purple-700',
      'damaged': 'bg-red-100 text-red-700',
      'expiring': 'bg-yellow-100 text-yellow-700'
    };
    
    const labels = {
      'season-end': 'Season End',
      'overstock': 'Overstock',
      'discontinued': 'Discontinued',
      'damaged': 'Damaged',
      'expiring': 'Near Expiry'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[reason] || 'bg-gray-100 text-gray-700'}`}>
        {labels[reason] || reason}
      </span>
    );
  };

  const getTotalProducts = (products) => {
    return products?.length || 0;
  };

  const getTotalSold = (products) => {
    return products?.reduce((sum, item) => sum + (item.soldCount || 0), 0) || 0;
  };

  const getAvgDiscount = (products) => {
    if (!products || products.length === 0) return 0;
    const total = products.reduce((sum, item) => sum + (item.discountPercentage || 0), 0);
    return Math.round(total / products.length);
  };

  const getTotalStock = (products) => {
    return products?.reduce((sum, item) => sum + (item.availableStock || 0), 0) || 0;
  };

  const reasonOptions = [
    { value: '', label: 'All Reasons' },
    { value: 'season-end', label: 'Season End' },
    { value: 'overstock', label: 'Overstock' },
    { value: 'discontinued', label: 'Discontinued' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'expiring', label: 'Near Expiry' }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="text-red-500" size={28} />
            Clearance Deals
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage clearance sales and liquidation offers</p>
        </div>
        <Button
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          onClick={() => handleNavigate('/clearance-deal/new')}
        >
          <Plus size={18} />
          Create Clearance Sale
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <select
          className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          value={filterReason}
          onChange={(e) => setFilterReason(e.target.value)}
        >
          {reasonOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : deals.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Tag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No clearance deals found</p>
          </div>
        ) : (
          deals.map((deal) => (
            <div
              key={deal._id}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="text-red-500" size={24} />
                    <h3 className="font-bold text-gray-900 text-xl">{deal.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(deal)}
                    {getReasonBadge(deal.reason)}
                  </div>
                </div>
              </div>

              {deal.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {deal.description}
                </p>
              )}

              {/* Final Sale Warning */}
              {deal.isFinalSale && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-orange-800">Final Sale</p>
                    <p className="text-xs text-orange-700">No returns or exchanges</p>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Products</p>
                  <p className="text-xl font-bold text-gray-900">
                    {getTotalProducts(deal.products)}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">In Stock</p>
                  <p className="text-xl font-bold text-gray-900">
                    {getTotalStock(deal.products)}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Sold</p>
                  <p className="text-xl font-bold text-gray-900">
                    {getTotalSold(deal.products)}
                  </p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Avg Off</p>
                  <p className="text-xl font-bold text-gray-900">
                    {getAvgDiscount(deal.products)}%
                  </p>
                </div>
              </div>

              {/* Products Preview */}
              {deal.products && deal.products.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Products:</p>
                  <div className="space-y-2">
                    {deal.products.slice(0, 3).map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                      >
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <TrendingDown size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product?.name || 'Product'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 line-through">
                              ₹{item.originalPrice}
                            </span>
                            <span className="text-sm font-bold text-red-600">
                              ₹{item.clearancePrice}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                              {item.discountPercentage}% off
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Stock: {item.availableStock}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.condition === 'new' ? 'bg-green-100 text-green-700' :
                            item.condition === 'like-new' ? 'bg-blue-100 text-blue-700' :
                            item.condition === 'good' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {item.condition}
                          </span>
                        </div>
                      </div>
                    ))}
                    {deal.products.length > 3 && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        +{deal.products.length - 3} more products
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">Start: </span>
                    <span className="font-medium text-gray-900">
                      {new Date(deal.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">End: </span>
                    <span className="font-medium text-gray-900">
                      {new Date(deal.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => handleNavigate(`/clearance-deal/${deal._id}`)}
                >
                  <Eye size={14} className="mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => handleNavigate(`/clearance-deal/edit/${deal._id}`)}
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(deal._id, deal.name)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}