import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Tag, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import api from "@/services/api";
import { useParams } from "react-router-dom";

export default function ClearanceDealForm() {
  const {id} = useParams()
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    reason: "overstock",
    products: [],
    startDate: "",
    endDate: "",
    isFinalSale: true,
    isActive: true
  });

  useEffect(() => {
    loadProducts();
    if (isEdit) {
      loadClearanceDeal();
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

  const loadClearanceDeal = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/clearance-deals/${id}`);
      const deal = res.data.data;
      
      setFormData({
        name: deal.name,
        description: deal.description || "",
        reason: deal.reason,
        products: deal.products.map(p => ({
          product: p.product?._id || p.product,
          originalPrice: p.originalPrice,
          clearancePrice: p.clearancePrice,
          discountPercentage: p.discountPercentage,
          availableStock: p.availableStock,
          soldCount: p.soldCount || 0,
          condition: p.condition || 'new'
        })),
        startDate: deal.startDate?.split('T')[0] || "",
        endDate: deal.endDate?.split('T')[0] || "",
        isFinalSale: deal.isFinalSale,
        isActive: deal.isActive
      });
    } catch (err) {
      console.error('Failed to load clearance deal:', err);
      setError('Failed to load clearance deal data');
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
        await api.put(`/admin/clearance-deals/${id}`, formData);
        alert('Clearance deal updated successfully!');
      } else {
        await api.post('/admin/clearance-deals', formData);
        alert('Clearance deal created successfully!');
      }
      window.history.back();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to save clearance deal');
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
          clearancePrice: "",
          discountPercentage: "",
          availableStock: "",
          soldCount: 0,
          condition: "new"
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
    if (field === 'originalPrice' || field === 'clearancePrice') {
      const original = parseFloat(field === 'originalPrice' ? value : newProducts[index].originalPrice);
      const clearance = parseFloat(field === 'clearancePrice' ? value : newProducts[index].clearancePrice);
      
      if (original > 0 && clearance > 0 && clearance < original) {
        const discount = ((original - clearance) / original) * 100;
        newProducts[index].discountPercentage = Math.round(discount);
      }
    }

    setFormData({ ...formData, products: newProducts });
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const reasonOptions = [
    { value: 'season-end', label: 'Season End Clearance' },
    { value: 'overstock', label: 'Overstock Clearance' },
    { value: 'discontinued', label: 'Discontinued Product' },
    { value: 'damaged', label: 'Damaged/Box Opened' },
    { value: 'expiring', label: 'Near Expiry' }
  ];

  const conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];

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
            <Tag className="text-red-500" size={32} />
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Clearance Deal' : 'Create Clearance Deal'}
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
                <Label>Clearance Sale Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Summer Season End Clearance"
                  required
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Clear out remaining summer inventory at massive discounts..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Clearance Reason <span className="text-red-500">*</span></Label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  {reasonOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-8">
                <Switch
                  checked={formData.isFinalSale}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFinalSale: checked })}
                />
                <div>
                  <Label>Final Sale (No Returns)</Label>
                  <p className="text-xs text-gray-500">Cannot be returned or exchanged</p>
                </div>
              </div>
            </div>

            {formData.isFinalSale && (
              <Alert className="mt-4 border-orange-300 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  This is marked as a final sale. Customers won't be able to return or exchange these items.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Validity Period */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Sale Duration</h2>
            
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

          {/* Products */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Clearance Products</h2>
              <Button
                type="button"
                onClick={addProduct}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus size={18} className="mr-2" />
                Add Product
              </Button>
            </div>

            {formData.products.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <Tag size={48} className="mx-auto text-gray-400 mb-4" />
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
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        >
                          <option value="">Choose a product...</option>
                          {products.map(product => (
                            <option key={product._id} value={product._id}>
                              {product.name} - ₹{product.price} (Stock: {product.stock})
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
                          placeholder="1999"
                          required
                          min="0"
                          step="0.01"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Clearance Price (₹) <span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          value={item.clearancePrice}
                          onChange={(e) => updateProduct(index, 'clearancePrice', e.target.value)}
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
                          readOnly
                          className="mt-2 bg-red-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                      </div>

                      <div>
                        <Label>Available Stock <span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          value={item.availableStock}
                          onChange={(e) => updateProduct(index, 'availableStock', e.target.value)}
                          placeholder="50"
                          required
                          min="1"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Product Condition <span className="text-red-500">*</span></Label>
                        <select
                          value={item.condition}
                          onChange={(e) => updateProduct(index, 'condition', e.target.value)}
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        >
                          {conditionOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
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
                    {item.originalPrice && item.clearancePrice && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="text-sm text-gray-600">Original: </span>
                            <span className="text-lg font-semibold text-gray-400 line-through">
                              ₹{item.originalPrice}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Clearance: </span>
                            <span className="text-2xl font-bold text-red-600">
                              ₹{item.clearancePrice}
                            </span>
                          </div>
                          <div>
                            <span className="px-3 py-1 bg-red-600 text-white rounded-full font-bold">
                              {item.discountPercentage}% OFF
                            </span>
                          </div>
                          <div>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              {item.condition}
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
                  {formData.isActive ? 'Clearance sale is active' : 'Clearance sale is inactive'}
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
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Clearance Sale' : 'Create Clearance Sale'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}