import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, Eye, Zap, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";

export default function FlashSales() {
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadFlashSales();
  }, [filter]);

  const loadFlashSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.append('isActive', filter);

      const res = await api.get(`/admin/flash-sales?${params.toString()}`);
      setFlashSales(res.data.data || []);
    } catch (err) {
      console.error('Failed to load flash sales:', err);
      setError('Failed to load flash sales');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete flash sale "${name}"?`)) return;

    try {
      await api.delete(`/admin/flash-sales/${id}`);
      alert('Flash sale deleted successfully!');
      loadFlashSales();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete flash sale');
    }
  };

  const handleNavigate = (path) => {
    window.location.href = path;
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const isActive = (sale) => {
    const now = new Date();
    const start = new Date(sale.startDate);
    const end = new Date(sale.endDate);
    return sale.isActive && now >= start && now <= end;
  };

  const isUpcoming = (sale) => {
    return new Date(sale.startDate) > new Date();
  };

  const getStatusBadge = (sale) => {
    if (!sale.isActive) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-100">Inactive</span>;
    }
    if (isActive(sale)) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium text-green-700 bg-green-100 animate-pulse">Live Now</span>;
    }
    if (isUpcoming(sale)) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-700 bg-blue-100">Upcoming</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-medium text-red-700 bg-red-100">Ended</span>;
  };

  const getTotalSold = (products) => {
    return products.reduce((sum, item) => sum + (item.soldCount || 0), 0);
  };

  const getAvgDiscount = (products) => {
    if (!products.length) return 0;
    const total = products.reduce((sum, item) => sum + item.discountPercentage, 0);
    return Math.round(total / products.length);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="text-orange-500" size={28} />
            Flash Sales
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create time-limited deals with huge discounts</p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
          onClick={() => handleNavigate('/flash-sales/new')}
        >
          <Plus size={18} />
          Create Flash Sale
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
          className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Flash Sales Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : flashSales.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Zap size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No flash sales found</p>
          </div>
        ) : (
          flashSales.map((sale) => (
            <div
              key={sale._id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-md transition-all ${
                isActive(sale) ? 'border-orange-500' : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="text-orange-500" size={24} />
                    <h3 className="font-bold text-gray-900 text-xl">{sale.name}</h3>
                  </div>
                  {getStatusBadge(sale)}
                  {sale.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{sale.description}</p>
                  )}
                </div>
              </div>

              {/* Banner Preview */}
              {sale.banner && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={sale.banner}
                    alt={sale.name}
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Products</p>
                  <p className="text-xl font-bold text-gray-900">{sale.products?.length || 0}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Sold</p>
                  <p className="text-xl font-bold text-gray-900">{getTotalSold(sale.products)}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Avg Discount</p>
                  <p className="text-xl font-bold text-gray-900">{getAvgDiscount(sale.products)}%</p>
                </div>
              </div>

              {/* Time Info */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} className="text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {isActive(sale) ? 'Ending In' : isUpcoming(sale) ? 'Starts In' : 'Duration'}
                  </span>
                </div>
                {isActive(sale) ? (
                  <p className="text-lg font-bold text-orange-600">
                    {getTimeRemaining(sale.endDate)}
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Start:</span>{' '}
                      {new Date(sale.startDate).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">End:</span>{' '}
                      {new Date(sale.endDate).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Products Preview */}
              {sale.products && sale.products.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Featured Products:</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {sale.products.slice(0, 4).map((item) => (
                      <div
                        key={item._id}
                        className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                      >
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <TrendingUp size={24} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {sale.products.length > 4 && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          +{sale.products.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => handleNavigate(`/flash-sales/${sale._id}`)}
                >
                  <Eye size={14} className="mr-1" />
                  View Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => handleNavigate(`/flash-sales/edit/${sale._id}`)}
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(sale._id, sale.name)}
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