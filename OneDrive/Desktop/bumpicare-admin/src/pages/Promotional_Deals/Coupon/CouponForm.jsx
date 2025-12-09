import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import api from "@/services/api";
import { useParams } from "react-router-dom";

export default function CouponForm() {
 
  const {id} = useParams() 
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderValue: 0,
    maxDiscountAmount: "",
    usageLimit: "",
    userUsageLimit: 1,
    applicableFor: "all",
    applicableProducts: [],
    applicableCategories: [],
    startDate: "",
    endDate: "",
    isActive: true
  });

  useEffect(() => {
    loadSelectOptions();
    if (isEdit) {
      loadCoupon();
    }
  }, [id]);

  const loadSelectOptions = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/categories')
      ]);
      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (err) {
      console.error('Failed to load options:', err);
    }
  };

  const loadCoupon = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/coupons/${id}`);
      const coupon = res.data.data;
      
      setFormData({
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscountAmount: coupon.maxDiscountAmount || "",
        usageLimit: coupon.usageLimit || "",
        userUsageLimit: coupon.userUsageLimit,
        applicableFor: coupon.applicableFor,
        applicableProducts: coupon.applicableProducts?.map(p => p._id) || [],
        applicableCategories: coupon.applicableCategories?.map(c => c._id) || [],
        startDate: coupon.startDate?.split('T')[0] || "",
        endDate: coupon.endDate?.split('T')[0] || "",
        isActive: coupon.isActive
      });
    } catch (err) {
      console.error('Failed to load coupon:', err);
      setError('Failed to load coupon data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        maxDiscountAmount: formData.maxDiscountAmount || null,
        usageLimit: formData.usageLimit || null
      };

      if (isEdit) {
        await api.put(`/admin/coupons/${id}`, payload);
        alert('Coupon updated successfully!');
      } else {
        await api.post('/admin/coupons', payload);
        alert('Coupon created successfully!');
      }
      window.history.back();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Coupon' : 'Create New Coupon'}
          </h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Coupon Code <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  required
                  disabled={isEdit}
                  className="mt-2 uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Use uppercase letters and numbers</p>
              </div>

              <div>
                <Label>Discount Type <span className="text-red-500">*</span></Label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <Label>Discount Value <span className="text-red-500">*</span></Label>
                <div className="relative mt-2">
                  <Input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === 'percentage' ? '20' : '500'}
                    required
                    min="0"
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {formData.discountType === 'percentage' ? (
                      <Percent size={18} />
                    ) : (
                      <DollarSign size={18} />
                    )}
                  </div>
                </div>
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <Label>Max Discount Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    placeholder="1000"
                    min="0"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional cap on discount</p>
                </div>
              )}

              <div>
                <Label>Minimum Order Value (₹) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                  placeholder="0"
                  required
                  min="0"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Total Usage Limit</Label>
                <Input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  min="1"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Per User Usage Limit <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.userUsageLimit}
                  onChange={(e) => setFormData({ ...formData, userUsageLimit: e.target.value })}
                  placeholder="1"
                  required
                  min="1"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="mt-6">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Get 20% off on all products..."
                rows={3}
                required
                className="mt-2"
              />
            </div>
          </div>

          {/* Validity Period */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Validity Period</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Start Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label>End Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="mt-2"
                  min={formData.startDate}
                />
              </div>
            </div>
          </div>

          {/* Applicability */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Applicability</h2>
            
            <div className="mb-6">
              <Label>Applicable For <span className="text-red-500">*</span></Label>
              <select
                value={formData.applicableFor}
                onChange={(e) => setFormData({ ...formData, applicableFor: e.target.value })}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="all">All Products</option>
                <option value="specific-products">Specific Products</option>
                <option value="specific-categories">Specific Categories</option>
              </select>
            </div>

            {formData.applicableFor === 'specific-products' && (
              <div>
                <Label>Select Products</Label>
                <select
                  multiple
                  value={formData.applicableProducts}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, applicableProducts: selected });
                  }}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 h-48"
                >
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} - ₹{product.price}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
            )}

            {formData.applicableFor === 'specific-categories' && (
              <div>
                <Label>Select Categories</Label>
                <select
                  multiple
                  value={formData.applicableCategories}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, applicableCategories: selected });
                  }}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 h-48"
                >
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <div>
                <Label>Active Status</Label>
                <p className="text-sm text-gray-500">
                  {formData.isActive ? 'Coupon is active and can be used' : 'Coupon is inactive'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoBack}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Coupon' : 'Create Coupon'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}