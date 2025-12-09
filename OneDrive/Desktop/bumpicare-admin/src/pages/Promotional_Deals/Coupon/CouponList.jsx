import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, Eye, Copy, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadCoupons();
  }, [search, filter]);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filter) params.append('isActive', filter);

      const res = await api.get(`/admin/coupons?${params.toString()}`);
      setCoupons(res.data.data || []);
    } catch (err) {
      console.error('Failed to load coupons:', err);
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;

    try {
      await api.delete(`/admin/coupons/${id}`);
      alert('Coupon deleted successfully!');
      loadCoupons();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Coupon code "${code}" copied to clipboard!`);
  };

  const handleNavigate = (path) => {
    window.location.href = path;
  };

  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  const isUpcoming = (startDate) => {
    return new Date(startDate) > new Date();
  };

  const getStatusBadge = (coupon) => {
    if (!coupon.isActive) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-100">Inactive</span>;
    }
    if (isExpired(coupon.endDate)) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium text-red-700 bg-red-100">Expired</span>;
    }
    if (isUpcoming(coupon.startDate)) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-700 bg-blue-100">Upcoming</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-medium text-green-700 bg-green-100">Active</span>;
  };

  const getUsagePercent = (coupon) => {
    if (!coupon.usageLimit) return 0;
    return Math.round((coupon.usedCount / coupon.usageLimit) * 100);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-500 text-sm mt-1">Manage discount coupons and promotional codes</p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
          onClick={() => handleNavigate('/coupon/new')}
        >
          <Plus size={18} />
          Create Coupon
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search coupons..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No coupons found</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div
              key={coupon._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      {coupon.discountType === 'percentage' ? (
                        <Percent size={20} className="text-teal-600" />
                      ) : (
                        <DollarSign size={20} className="text-teal-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{coupon.code}</h3>
                      {getStatusBadge(coupon)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{coupon.description}</p>
                </div>
              </div>

              {/* Discount Value */}
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-600 mb-1">Discount Value</p>
                <p className="text-2xl font-bold text-teal-600">
                  {coupon.discountType === 'percentage' 
                    ? `${coupon.discountValue}% OFF` 
                    : `₹${coupon.discountValue} OFF`}
                </p>
                {coupon.maxDiscountAmount && (
                  <p className="text-xs text-gray-500 mt-1">
                    Max: ₹{coupon.maxDiscountAmount}
                  </p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Min Order:</span>
                  <span className="font-medium text-gray-900">₹{coupon.minOrderValue}</span>
                </div>
                
                {coupon.usageLimit && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Usage:</span>
                      <span className="font-medium text-gray-900">
                        {coupon.usedCount} / {coupon.usageLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full transition-all"
                        style={{ width: `${getUsagePercent(coupon)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Valid Until:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(coupon.endDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Applicable:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {coupon.applicableFor.replace('-', ' ')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => handleCopyCode(coupon.code)}
                >
                  <Copy size={14} className="mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => handleNavigate(`/coupon/${coupon._id}`)}
                >
                  <Eye size={14} className="mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => handleNavigate(`/coupon/edit/${coupon._id}`)}
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(coupon._id, coupon.code)}
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