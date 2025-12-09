import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Plus, Trash2, Zap, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import api from "@/services/api";
import { useParams } from "react-router-dom";

export default function FlashSaleForm() {
  const {id} = useParams()
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    banner: "",
    products: [],
    startDate: "",
    endDate: "",
    priority: 0,
    isActive: true
  });

  useEffect(() => {
    loadProducts();
    if (isEdit) {
      loadFlashSale();
    }
  }, [id]);

  const loadProducts = async () => {
    try {
      const res = await api.get('/admin/products');
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const loadFlashSale = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/flash-sales/${id}`);
      const sale = res.data.data;
      
      setFormData({
        name: sale.name,
        description: sale.description || "",
        banner: sale.banner || "",
        products: sale.products.map(p => ({
          product: p.product?._id || p.product,
          originalPrice: p.originalPrice,
          salePrice: p.salePrice,
          discountPercentage: p.discountPercentage,
          stockLimit: p.stockLimit || "",
          soldCount: p.soldCount || 0
        })),
        startDate: sale.startDate?.split('T')[0] || "",
        endDate: sale.endDate?.split('T')[0] || "",
        priority: sale.priority || 0,
        isActive: sale.isActive
      });
    } catch (err) {
      console.error('Failed to load flash sale:', err);
      setError('Failed to load flash sale data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.products.length === 0) {
      setError('Please add at least one product');
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (isEdit) {
        await api.put(`/admin/flash-sales/${id}`, formData);
        alert('Flash sale updated successfully!');
      } else {
        await api.post('/admin/flash-sales', formData);
        alert('Flash sale created successfully!');
      }
      window.history.back();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to save flash sale');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = () => {
    setFormData({
      ...formData,
      products: [
        ...formData.products,
        {
          product: "",
          originalPrice: "",
          salePrice: "",
          discountPercentage: "",
          stockLimit: "",
          soldCount: 0
        }
      ]
    });
  };

  const removeProduct = (index) => {
    const newProducts = formData.products.filter((_, i) => i !== index);
    setFormData({ ...formData, products: newProducts });
  };

  const updateProduct = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index][field] = value;

    // Auto-calculate discount percentage
    if (field === 'originalPrice' || field === 'salePrice') {
      const original = parseFloat(field === 'originalPrice' ? value : newProducts[index].originalPrice);
      const sale = parseFloat(field === 'salePrice' ? value : newProducts[index].salePrice);
      
      if (original > 0 && sale > 0 && sale < original) {
        const discount = ((original - sale) / original) * 100;
        newProducts[index].discountPercentage = Math.round(discount);
      }
    }

    setFormData({ ...formData, products: newProducts });
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-3">
            <Zap className="text-orange-500" size={32} />
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Flash Sale' : 'Create Flash Sale'}
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
                <Label>Sale Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mega Flash Sale - Electronics"
                  required
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Lightning deals with huge discounts..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-2">
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
                {formData.banner && (
                  <img
                    src={formData.banner}
                    alt="Banner preview"
                    className="mt-3 w-full h-32 object-cover rounded-lg"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
              </div>

              <div>
                <Label>Priority <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Higher priority shows first</p>
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Sale Duration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Start Date & Time <span className="text-red-500">*</span></Label>
                <Input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label>End Date & Time <span className="text-red-500">*</span></Label>
                <Input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="mt-2"
                  min={formData.startDate}
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Flash Sale Products</h2>
              <Button
                type="button"
                onClick={addProduct}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus size={18} className="mr-2" />
                Add Product
              </Button>
            </div>

            {formData.products.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <Zap size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No products added yet</p>
                <Button type="button" onClick={addProduct} variant="outline">
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.products.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Product #{index + 1}</h3>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => removeProduct(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3">
                        <Label>Select Product <span className="text-red-500">*</span></Label>
                        <select
                          value={item.product}
                          onChange={(e) => updateProduct(index, 'product', e.target.value)}
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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

                      <div>
                        <Label>Original Price (₹) <span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          value={item.originalPrice}
                          onChange={(e) => updateProduct(index, 'originalPrice', e.target.value)}
                          placeholder="999"
                          required
                          min="0"
                          step="0.01"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Flash Sale Price (₹) <span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          value={item.salePrice}
                          onChange={(e) => updateProduct(index, 'salePrice', e.target.value)}
                          placeholder="699"
                          required
                          min="0"
                          step="0.01"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Discount % <span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          value={item.discountPercentage}
                          onChange={(e) => updateProduct(index, 'discountPercentage', e.target.value)}
                          placeholder="30"
                          required
                          min="0"
                          max="100"
                          className="mt-2 bg-orange-50"
                          readOnly
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                      </div>

                      <div>
                        <Label>Stock Limit</Label>
                        <Input
                          type="number"
                          value={item.stockLimit}
                          onChange={(e) => updateProduct(index, 'stockLimit', e.target.value)}
                          placeholder="Leave empty for unlimited"
                          min="1"
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">Limited quantity</p>
                      </div>

                      {isEdit && (
                        <div>
                          <Label>Sold Count</Label>
                          <Input
                            type="number"
                            value={item.soldCount}
                            readOnly
                            className="mt-2 bg-gray-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Read-only</p>
                        </div>
                      )}
                    </div>

                    {/* Price Preview */}
                    {item.originalPrice && item.salePrice && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-600">Original: </span>
                            <span className="text-lg font-semibold text-gray-400 line-through">
                              ₹{item.originalPrice}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Sale: </span>
                            <span className="text-2xl font-bold text-orange-600">
                              ₹{item.salePrice}
                            </span>
                          </div>
                          <div>
                            <span className="px-3 py-1 bg-orange-600 text-white rounded-full font-bold">
                              {item.discountPercentage}% OFF
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
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
                  {formData.isActive ? 'Flash sale is active' : 'Flash sale is inactive'}
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
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Flash Sale' : 'Create Flash Sale'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}