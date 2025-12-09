import { useEffect, useState } from "react";
import { Search, Edit, Trash2, Eye, CheckCircle, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/services/api";

export default function DraftProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    loadCategories();
    loadSellers();
  }, []);

  useEffect(() => {
    loadDraftProducts();
  }, [search, categoryFilter, sellerFilter]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadSellers = async () => {
    try {
      const res = await api.get('/admin/sellers');
      setSellers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load sellers:', err);
    }
  };

  const loadDraftProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (sellerFilter) params.append('seller', sellerFilter);

      const res = await api.get(`/admin/products/drafts?${params.toString()}`);
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load draft products:', err);
      setError('Failed to load draft products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.delete(`/admin/products/${id}`);
      alert('Draft product deleted successfully!');
      loadDraftProducts();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handlePublish = async (id, name) => {
    if (!window.confirm(`Publish "${name}" and make it visible to customers?`)) return;

    try {
      await api.patch(`/admin/products/${id}/publish`);
      alert('Product published successfully!');
      loadDraftProducts();
    } catch (err) {
      console.error('Publish error:', err);
      alert(err.response?.data?.message || 'Failed to publish product. Make sure all required fields are filled.');
    }
  };

  const handleBulkPublish = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to publish');
      return;
    }

    if (!window.confirm(`Publish ${selectedProducts.length} selected products?`)) return;

    try {
      await Promise.all(
        selectedProducts.map(id => api.patch(`/admin/products/${id}/publish`))
      );
      alert(`${selectedProducts.length} products published successfully!`);
      setSelectedProducts([]);
      loadDraftProducts();
    } catch (err) {
      console.error('Bulk publish error:', err);
      alert('Some products could not be published. Check if all required fields are filled.');
      loadDraftProducts();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to delete');
      return;
    }

    if (!window.confirm(`Delete ${selectedProducts.length} selected products? This action cannot be undone.`)) return;

    try {
      await Promise.all(
        selectedProducts.map(id => api.delete(`/admin/products/${id}`))
      );
      alert(`${selectedProducts.length} products deleted successfully!`);
      setSelectedProducts([]);
      loadDraftProducts();
    } catch (err) {
      console.error('Bulk delete error:', err);
      alert('Failed to delete some products');
      loadDraftProducts();
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  const handleNavigate = (path) => {
    window.location.href = path;
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getCompletionIcon = (percentage) => {
    if (percentage >= 80) return <CheckCircle size={16} className="text-green-600" />;
    return <AlertTriangle size={16} className="text-yellow-600" />;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Draft Products</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your unpublished products and complete them before publishing
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search drafts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              className="border border-gray-300 px-4 py-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>

            <select
              className="border border-gray-300 px-4 py-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
            >
              <option value="">All Sellers</option>
              {sellers.map(seller => (
                <option key={seller._id} value={seller._id}>{seller.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedProducts.length} product(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                onClick={handleBulkPublish}
                className="bg-teal-600 hover:bg-teal-700 text-white"
                size="sm"
              >
                <CheckCircle size={16} className="mr-2" />
                Publish Selected
              </Button>
              <Button
                onClick={handleBulkDelete}
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                size="sm"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left">
                  <Checkbox
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Product</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Price</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Seller</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No draft products found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Draft products will appear here when you save them without publishing
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <Checkbox
                        checked={selectedProducts.includes(product._id)}
                        onCheckedChange={() => toggleSelectProduct(product._id)}
                      />
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-mono text-gray-600">
                        #{product._id?.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.coverPhoto || product.images?.[0] ? (
                          <img
                            src={product.coverPhoto || product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package size={24} className="text-gray-400" />
                          </div>
                        )}
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created {new Date(product.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {product.category ? (
                        <span className="text-sm text-gray-700">{product.category.name}</span>
                      ) : (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          Not Set
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {product.price > 0 ? (
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{product.price.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          Not Set
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {product.seller?.name || (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getCompletionIcon(product.completionPercentage)}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCompletionColor(product.completionPercentage)}`}>
                            {product.completionPercentage}% Complete
                          </span>
                        </div>
                        {product.missingFields?.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Missing: {product.missingFields.join(', ')}
                          </div>
                        )}
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium text-yellow-700 bg-yellow-100">
                          Draft
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleNavigate(`/products/${product._id}`)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={18} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleNavigate(`/products/edit/${product._id}`)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => handlePublish(product._id, product.name)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                          title="Publish"
                          disabled={product.completionPercentage < 80}
                        >
                          <CheckCircle 
                            size={18} 
                            className={product.completionPercentage >= 80 ? 'text-green-600' : 'text-gray-300'} 
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {!loading && products.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                {products.length} draft product(s) waiting to be published
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Complete missing fields and publish products to make them visible to customers
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}