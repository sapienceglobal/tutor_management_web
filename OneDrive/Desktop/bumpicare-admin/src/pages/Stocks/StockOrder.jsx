import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";

export default function NewOrderRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  
  const [formData, setFormData] = useState({
    product: "",
    category: "",
    brand: "",
    variant: "",
    currentStockLevel: "",
    seller: "",
    quantity: "",
    unit: "pcs",
    orderType: "",
    priority: "",
    supplier: "",
    location: "",
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (productId && products.length > 0) {
      handleProductSelect(productId);
    }
  }, [productId, products]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      // Fetch all data in parallel
      const [productsRes, categoriesRes, suppliersRes, warehousesRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/categories'),
        api.get('/admin/suppliers'),
        api.get('/admin/warehouses')
      ]);
      
      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
      setWarehouses(warehousesRes.data.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load form data. Please refresh the page.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setSelectedProduct(product);
      setFormData(prev => ({
        ...prev,
        product: productId,
        category: product.category?._id || "",
        brand: product.brand || "N/A",
        currentStockLevel: product.stock || 0,
        seller: product.seller || "Samim store",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.product || !formData.quantity || !formData.unit || 
          !formData.orderType || !formData.priority || !formData.supplier || !formData.location) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const orderData = {
        product: formData.product,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        orderType: formData.orderType,
        priority: formData.priority,
        supplier: formData.supplier,
        warehouse: formData.location,
        currentStock: Number(formData.currentStockLevel),
      };

      const response = await api.post('/admin/orders/request', orderData);
      
      if (response.data.success) {
        alert('Order request submitted successfully!');
        navigate('/stock-products');
      }
    } catch (err) {
      console.error('Failed to submit order:', err);
      setError(err.response?.data?.message || 'Failed to submit order request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={loading}
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">New Order Request</h1>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Product</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">
                  Product <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.product}
                  onValueChange={handleProductSelect}
                  required
                  disabled={loading}
                >
                  <SelectTrigger className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl">
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.length > 0 ? (
                      products.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-products" disabled>
                        No products available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">Category</Label>
                <Select value={formData.category} disabled>
                  <SelectTrigger className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">Brand</Label>
                <Input
                  type="text"
                  value={formData.brand}
                  className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl text-gray-500"
                  disabled
                />
              </div>

              {/* Variant */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">Variant</Label>
                <Select
                  value={formData.variant}
                  onValueChange={(value) => setFormData({ ...formData, variant: value })}
                  disabled={loading || !selectedProduct?.sizes?.length}
                >
                  <SelectTrigger className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl">
                    <SelectValue placeholder="Select Variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProduct?.sizes?.length > 0 ? (
                      selectedProduct.sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="default">Default</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Stock Level */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">Current Stock Level</Label>
                <Input
                  type="number"
                  value={formData.currentStockLevel}
                  className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl text-gray-500"
                  disabled
                />
              </div>

              {/* Seller */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">Seller</Label>
                <Input
                  type="text"
                  value={formData.seller}
                  className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl text-gray-500"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Add Stock Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add Stock</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quantity */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl"
                  required
                  disabled={loading}
                />
              </div>

              {/* Unit */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">
                  Unit <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="e.g., pcs, kg, liter"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl"
                  required
                  disabled={loading}
                />
              </div>

              {/* Order Type */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">
                  Order Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.orderType}
                  onValueChange={(value) => setFormData({ ...formData, orderType: value })}
                  required
                  disabled={loading}
                >
                  <SelectTrigger className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl">
                    <SelectValue placeholder="Select Order Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase Order</SelectItem>
                    <SelectItem value="restocking">Restocking</SelectItem>
                    <SelectItem value="emergency">Emergency Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">
                  Priority <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  required
                  disabled={loading}
                >
                  <SelectTrigger className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">
                  Supplier <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.supplier}
                  onValueChange={(value) => setFormData({ ...formData, supplier: value })}
                  required
                  disabled={loading}
                >
                  <SelectTrigger className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl">
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.length > 0 ? (
                      suppliers.map((supplier) => (
                        <SelectItem key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-supplier" disabled>
                        No suppliers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Location/Warehouse */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">
                  Location/Warehouse <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                  required
                  disabled={loading}
                >
                  <SelectTrigger className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl">
                    <SelectValue placeholder="Select Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.length > 0 ? (
                      warehouses.map((warehouse) => (
                        <SelectItem key={warehouse._id} value={warehouse.warehouseId}>
                          {warehouse.name} - {warehouse.location?.city || 'N/A'}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-warehouse" disabled>
                        No warehouses available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="px-8 py-3 h-auto text-base"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-8 py-3 h-auto text-base bg-teal-600 hover:bg-teal-700 text-white"
              disabled={loading || !formData.product}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}