import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Tag, ShoppingCart, User, Calendar,
  Package, Image as ImageIcon, AlertCircle
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-toastify';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/admin/product/${id}`);
      
      if (response.data.success) {
        setProduct(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/products/edit/${id}`);
  };

  const handleBack = () => {
    navigate('/products');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Product not found</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
          </div>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Basic Information</h2>
        
        <div className="flex items-start gap-6">
          {/* Product Image */}
          <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-10 h-10 text-gray-400" />
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>Category Name</span>
                    <span className="font-semibold text-gray-900">
                      {product.category?.name || 'N/A'}
                    </span>
                  </div>
                  {product.productType && (
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span className="font-semibold text-gray-900">
                        {product.productType.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {product.isActive && (
                <span className="px-4 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                  Published
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.description && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Short Description</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Info Cards Row */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {/* Discount */}
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                    <Tag className="w-4 h-4 text-green-700" />
                  </div>
                  <span className="text-xs text-gray-600">Discount Title</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {product.discounts && product.discounts.length > 0 
                    ? product.discounts[0].title 
                    : '-'}
                </p>
              </div>

              {/* Slug */}
              <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-pink-200 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-pink-700" />
                  </div>
                  <span className="text-xs text-gray-600">Slug</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {product.slug || 'Slug Information'}
                </p>
              </div>

              {/* Seller */}
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-yellow-700" />
                  </div>
                  <span className="text-xs text-gray-600">Seller</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {product.seller?.name || 'Seller Name'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Section */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Media</h2>
        
        <div className="grid grid-cols-4 gap-4">
          {product.images && product.images.length > 0 ? (
            product.images.map((image, index) => (
              <div 
                key={index}
                className="aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-teal-500 transition-colors"
              >
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          ) : (
            // Placeholder images
            [...Array(4)].map((_, index) => (
              <div 
                key={index}
                className="aspect-square bg-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300"
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">No Image Preview</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Variants Section */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Variant</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">SKU ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Variant ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Image</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Color</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Size</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Visible</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {product.variants && product.variants.length > 0 ? (
                product.variants.map((variant, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      #{variant.sku || `73423${index}`}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      #{variant.sku || `73423${index}`}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                        {variant.image ? (
                          <img
                            src={variant.image}
                            alt={variant.value}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200"></div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {variant.color && (
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: variant.color }}
                          ></div>
                        )}
                        <span className="text-sm text-gray-900">
                          {variant.color || 'Black'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {variant.value || 'L'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {variant.visible ? '1 x 80ml' : 'Hidden'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        variant.status === 'active' || variant.visible
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {variant.status === 'active' || variant.visible ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                // Default placeholder rows
                [...Array(2)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">#73423</td>
                    <td className="py-3 px-4 text-sm text-gray-900">#73423</td>
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-900 border-2 border-gray-300"></div>
                        <span className="text-sm text-gray-900">Black</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">L</td>
                    <td className="py-3 px-4 text-sm text-gray-900">1 x 80ml</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discount Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Discount</h2>
        
        <div className="grid grid-cols-3 gap-6">
          {/* Discount Title 1 */}
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                <Tag className="w-4 h-4 text-yellow-700" />
              </div>
              <span className="text-xs text-gray-600">Discount Title</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {product.discounts && product.discounts.length > 0 
                ? product.discounts[0].title 
                : '-'}
            </p>
            {product.discounts && product.discounts.length > 0 && product.discounts[0].price && (
              <p className="text-xs text-gray-600 mt-1">
                ₹{product.discounts[0].price}
              </p>
            )}
          </div>

          {/* Discount Title 2 */}
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                <Tag className="w-4 h-4 text-yellow-700" />
              </div>
              <span className="text-xs text-gray-600">Discount Title</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {product.discounts && product.discounts.length > 1 
                ? product.discounts[1].title 
                : '-'}
            </p>
            {product.discounts && product.discounts.length > 1 && product.discounts[1].price && (
              <p className="text-xs text-gray-600 mt-1">
                ₹{product.discounts[1].price}
              </p>
            )}
          </div>

          {/* Discount Duration */}
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-yellow-700" />
              </div>
              <span className="text-xs text-gray-600">Discount Duration</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {product.discounts && product.discounts.length > 0 && product.discounts[0].from && product.discounts[0].to
                ? `${new Date(product.discounts[0].from).toLocaleDateString()} - ${new Date(product.discounts[0].to).toLocaleDateString()}`
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Additional Info Sections (if needed) */}
      {product.specifications && product.specifications.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Specifications</h2>
          <div className="grid grid-cols-2 gap-4">
            {product.specifications.map((spec, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-sm font-semibold text-gray-700 min-w-[150px]">
                  {spec.title}:
                </span>
                <span className="text-sm text-gray-600">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.keyInfo && product.keyInfo.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Key Information</h2>
          <div className="grid grid-cols-2 gap-4">
            {product.keyInfo.map((info, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-sm font-semibold text-gray-700 min-w-[150px]">
                  {info.title}:
                </span>
                <span className="text-sm text-gray-600">{info.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-teal-100 text-teal-700 text-sm rounded-full font-medium"
              >
                {tag.name || tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}