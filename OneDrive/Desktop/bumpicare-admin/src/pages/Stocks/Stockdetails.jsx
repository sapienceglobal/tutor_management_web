import { useEffect, useState } from "react";
import { ArrowLeft, Package, Warehouse, User, Calendar } from "lucide-react";
import { productService } from "@/services/productService";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function StockProductDetails() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
const navigate = useNavigate();
  // Get product ID from URL
  const productId = window.location.pathname.split('/').pop();

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await productService.getById(productId);
      if (res?.data?.data) {
        setProduct(res.data.data);
      } else if (res?.data) {
        setProduct(res.data);
      }
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStockPercentage = (stock) => {
    const maxStock = 100;
    return (stock / maxStock) * 100;
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'bg-red-500' };
    if (stock <= 10) return { text: 'Low Stock', color: 'bg-yellow-400' };
    return { text: 'Available stock', color: 'bg-green-400' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">Product not found</p>
          <Button 
            className="mt-4"
            onClick={() => window.location.href = '/stock-products'}
          >
            Back to Stock Products
          </Button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.stock || 0);
  const stockPercentage = getStockPercentage(product.stock || 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
               onClick={() => navigate("/products/stock")}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Details</h1>
          </div>
          <div className="flex gap-3">
            <Button
            onClick={() => navigate(`/order-request/new?productId=${productId}`)}
            className="bg-teal-600 hover:bg-teal-700 text-white">
              Order Now
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = `/products/edit/${product._id}`}
            >
              Edit
            </Button>
          </div>
        </div>

        {/* Basic Information Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>

          {/* Product Info */}
          <div className="flex items-start gap-6 mb-8">
            {/* Product Image */}
            <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {product.images?.[0] ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="text-center p-4">
                  <Package size={40} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No Image Preview</p>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                <span className="px-4 py-1.5 rounded-full text-xs font-medium text-teal-700 bg-teal-100">
                  Published
                </span>
              </div>
              <p className="text-gray-600 mb-3">#{product._id.slice(-6)}</p>
              <p className="text-3xl font-bold text-teal-600">${product.price}</p>
            </div>
          </div>

          {/* Current Stock Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Stock</h3>
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium text-gray-800 ${stockStatus.color}`}>
                {stockStatus.text}
              </span>
            </div>

            {/* Stock Progress Bar */}
            <div className="relative">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(stockPercentage, 100)}%`,
                    background: `linear-gradient(to right, 
                      ${stockPercentage < 20 ? '#ef4444' : stockPercentage < 50 ? '#eab308' : '#14b8a6'} 0%, 
                      ${stockPercentage < 20 ? '#dc2626' : stockPercentage < 50 ? '#ca8a04' : '#0d9488'} 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>0</span>
                <span>10 pcs</span>
                <span>{product.stock || 0} pcs</span>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-600">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Category</p>
                <p className="text-base font-semibold text-gray-900">{product.category?.name || 'Uncategorized'}</p>
              </div>
            </div>

            {/* Warehouse */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Warehouse size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Warehouse</p>
                <p className="text-base font-semibold text-gray-900">#WR-001</p>
              </div>
            </div>

            {/* Seller */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <User size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Seller</p>
                <p className="text-base font-semibold text-gray-900">{product.seller || 'Eleanor Pena'}</p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Calendar size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatDate(product.updatedAt || product.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        {product.description && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Product Images Gallery */}
        {product.images && product.images.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Product Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={image} 
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specifications */}
        {product.specifications && product.specifications.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.specifications.map((spec, index) => (
                <div key={index} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">{spec.title}</span>
                  <span className="font-medium text-gray-900">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}