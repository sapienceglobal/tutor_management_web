import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Star, Upload, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import api from "@/services/api";
import { useParams } from "react-router-dom";

export default function FeaturedDealForm() {
  const {id} = useParams()
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dealType: "product",
    banner: "",
    product: "",
    category: "",
    bundleProducts: [],
    originalPrice: "",
    dealPrice: "",
    discountPercentage: "",
    badge: "Featured Deal",
    startDate: "",
    endDate: "",
    displayOrder: 0,
    isActive: true
  });

  useEffect(() => {
    loadSelectOptions();
    if (isEdit) {
      loadFeaturedDeal();
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

  const loadFeaturedDeal = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/featured-deals/${id}`);
      const deal = res.data.data;
      
      setFormData({
        title: deal.title,
        description: deal.description || "",
        dealType: deal.dealType,
        banner: deal.banner || "",
        product: deal.product?._id || "",
        category: deal.category?._id || "",
        bundleProducts: deal.bundleProducts?.map(bp => ({
          product: bp.product?._id || bp.product,
          quantity: bp.quantity
        })) || [],
        originalPrice: deal.originalPrice || "",
        dealPrice: deal.dealPrice,
        discountPercentage: deal.discountPercentage || "",
        badge: deal.badge || "Featured Deal",
        startDate: deal.startDate?.split('T')[0] || "",
        endDate: deal.endDate?.split('T')[0] || "",
        displayOrder: deal.displayOrder || 0,
        isActive: deal.isActive
      });
    } catch (err) {
      console.error('Failed to load featured deal:', err);
      setError('Failed to load featured deal data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate based on deal type
      if (formData.dealType === 'product' && !formData.product) {
        setError('Please select a product');
        setLoading(false);
        return;
      }
      if (formData.dealType === 'category' && !formData.category) {
        setError('Please select a category');
        setLoading(false);
        return;
      }
      if (formData.dealType === 'bundle' && formData.bundleProducts.length === 0) {
        setError('Please add at least one product to the bundle');
        setLoading(false);
        return;
      }

      if (isEdit) {
        await api.put(`/admin/featured-deals/${id}`, formData);
        alert('Featured deal updated successfully!');
      } else {
        await api.post('/admin/featured-deals', formData);
        alert('Featured deal created successfully!');
      }
      window.history.back();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to save featured deal');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (original, deal) => {
    if (!original || !deal || original <= 0) return 0;
    return Math.round(((original - deal) / original) * 100);
  };

  const handlePriceChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    
    if (field === 'originalPrice' || field === 'dealPrice') {
      const original = parseFloat(field === 'originalPrice' ? value : formData.originalPrice);
      const deal = parseFloat(field === 'dealPrice' ? value : formData.dealPrice);
      newData.discountPercentage = calculateDiscount(original, deal);
    }
    
    setFormData(newData);
  };

  const addBundleProduct = () => {
    setFormData({
      ...formData,
      bundleProducts: [...formData.bundleProducts, { product: "", quantity: 1 }]
    });
  };

  const removeBundleProduct = (index) => {
    const newBundle = formData.bundleProducts.filter((_, i) => i !== index);
    setFormData({ ...formData, bundleProducts: newBundle });
  };

  const updateBundleProduct = (index, field, value) => {
    const newBundle = [...formData.bundleProducts];
    newBundle[index][field] = value;
    setFormData({ ...formData, bundleProducts: newBundle });
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
          <div className="flex items-center gap-3">
            <Star className="text-purple-500" size={32} />
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Featured Deal' : 'Create Featured Deal'}
            </h1>
          </div>
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
              <div className="md:col-span-2">
                <Label>Deal Title <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Weekend Special - Electronics Bundle"
                  required
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Get amazing discounts on our featured products..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Deal Type <span className="text-red-500">*</span></Label>
                <select
                  value={formData.dealType}
                  onChange={(e) => setFormData({ ...formData, dealType: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="product">Single Product</option>
                  <option value="category">Category Deal</option>
                  <option value="bundle">Product Bundle</option>
                </select>
              </div>

              <div>
                <Label>Badge Text</Label>
                <Input
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="Featured Deal"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Higher shows first</p>
              </div>

              <div>
                <Label>Banner Image URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={formData.banner}
                    onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                  />
                  <Button type="button" variant="outline">
                    <Upload size={18} />
                  </Button>
                </div>
              </div>

              {formData.banner && (
                <div className="md:col-span-2">
                  <img
                    src={formData.banner}
                    alt="Banner preview"
                    className="w-full h-40 object-cover rounded-lg"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Deal Content - Based on Type */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Deal Content</h2>

            {formData.dealType === 'product' && (
              <div>
                <Label>Select Product <span className="text-red-500">*</span></Label>
                <select
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Choose a product...</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} - ₹{product.price}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.dealType === 'category' && (
              <div>
                <Label>Select Category <span className="text-red-500">*</span></Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Choose a category...</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.dealType === 'bundle' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Bundle Products <span className="text-red-500">*</span></Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addBundleProduct}
                    variant="outline"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Product
                  </Button>
                </div>

                {formData.bundleProducts.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-3">No products in bundle</p>
                    <Button type="button" size="sm" onClick={addBundleProduct} variant="outline">
                      Add First Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.bundleProducts.map((item, index) => (
                      <div key={index} className="flex gap-3 items-start border border-gray-200 rounded-lg p-3">
                        <div className="flex-1">
                          <select
                            value={item.product}
                            onChange={(e) => updateBundleProduct(index, 'product', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                            required
                          >
                            <option value="">Choose a product...</option>
                            {products.map(product => (
                              <option key={product._id} value={product._id}>
                                {product.name} - ₹{product.price}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateBundleProduct(index, 'quantity', e.target.value)}
                            placeholder="Quantity"
                            min="1"
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => removeBundleProduct(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Pricing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>Original Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => handlePriceChange('originalPrice', e.target.value)}
                  placeholder="2999"
                  min="0"
                  step="0.01"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Deal Price (₹) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.dealPrice}
                  onChange={(e) => handlePriceChange('dealPrice', e.target.value)}
                  placeholder="1999"
                  required
                  min="0"
                  step="0.01"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Discount %</Label>
                <Input
                  type="number"
                  value={formData.discountPercentage}
                  readOnly
                  className="mt-2 bg-purple-50"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
              </div>
            </div>

            {formData.originalPrice && formData.dealPrice && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">Original: </span>
                    <span className="text-lg font-semibold text-gray-400 line-through">
                      ₹{formData.originalPrice}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Deal: </span>
                    <span className="text-2xl font-bold text-purple-600">
                      ₹{formData.dealPrice}
                    </span>
                  </div>
                  <div>
                    <span className="px-3 py-1 bg-purple-600 text-white rounded-full font-bold">
                      {formData.discountPercentage}% OFF
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Validity */}
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
                  {formData.isActive ? 'Deal is active and visible' : 'Deal is inactive'}
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
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Deal' : 'Create Deal'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}