import { useEffect, useState } from "react";
import { Search, Package, Download, Plus, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";

export default function StockProducts() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [filters, setFilters] = useState({
    category: "",
    stock: "",
    status: "",
    search: "",
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Fetch Categories
  const loadCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Fetch Summary Stats
  const loadSummary = async () => {
    try {
      const res = await api.get('/admin/products/stocks/stock-summary');
      if (res?.data?.data) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  // Fetch Products List
  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Add filters
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.stock) params.append('stock', filters.stock);
      if (filters.status) params.append('status', filters.status);

      const res = await api.get(`/admin/products/stocks/stock-products?${params.toString()}`);

      if (res?.data?.data && Array.isArray(res.data.data)) {
        setProducts(res.data.data);
        setPagination(prev => ({
          ...prev,
          totalItems: res.data.data.length,
          totalPages: Math.ceil(res.data.data.length / prev.itemsPerPage),
        }));
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadSummary();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1 on filter change
  }, [filters]);

  // Pagination helpers
  const getPaginatedProducts = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return products.slice(startIndex, endIndex);
  };

  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(getPaginatedProducts().map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  // Handle individual select
  const handleSelectProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // Export to CSV
  const handleExport = () => {
    const csvData = products.map(p => ({
      ID: p._id,
      Name: p.name,
      Category: p.category?.name || '-',
      Price: p.price,
      Stock: p.stock || 0,
      Status: p.stock === 0 ? 'Out of Stock' : p.stock <= 10 ? 'Low Stock' : 'In Stock',
      Warehouse: p.warehouse || 'WR-001',
      LastUpdated: new Date(p.updatedAt || p.createdAt).toLocaleDateString(),
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Get stock status badge
  const getStockBadge = (stock) => {
    if (stock === 0) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium text-white bg-red-500 whitespace-nowrap">
          Out of Stock
        </span>
      );
    } else if (stock <= 10) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-800 bg-yellow-400 whitespace-nowrap">
          Low Stock
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-800 bg-green-400 whitespace-nowrap">
          In Stock
        </span>
      );
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      category: "",
      stock: "",
      status: "",
      search: "",
    });
  };

  const paginatedProducts = getPaginatedProducts();
  const hasActiveFilters = filters.category || filters.stock || filters.status || filters.search;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Products</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor and manage your product inventory</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExport}
            disabled={products.length === 0}
          >
            <Download size={18} />
            Export CSV
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
            onClick={() => navigate('/order-request/new')}
          >
            <Plus size={18} />
            New Order Request
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Package className="text-cyan-600" size={28} />
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Products</p>
            <h2 className="text-3xl font-bold text-gray-900">{summary.total}</h2>
          </div>
        </div>

        <div className="p-5 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Package className="text-green-600" size={28} />
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">In Stock</p>
            <h2 className="text-3xl font-bold text-gray-900">{summary.inStock}</h2>
          </div>
        </div>

        <div className="p-5 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Package className="text-yellow-600" size={28} />
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Low Stock</p>
            <h2 className="text-3xl font-bold text-gray-900">{summary.lowStock}</h2>
          </div>
        </div>

        <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Package className="text-red-600" size={28} />
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Out of Stock</p>
            <h2 className="text-3xl font-bold text-gray-900">{summary.outOfStock}</h2>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or brand..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap gap-3">
            <select
              className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm min-w-[150px]"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>

            <select
              className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm min-w-[150px]"
              value={filters.stock}
              onChange={(e) => setFilters({ ...filters, stock: e.target.value })}
            >
              <option value="">Stock Status</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <select
              className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm min-w-[150px]"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="text-red-600 hover:bg-red-50"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Selected items actions */}
        {selectedProducts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedProducts.length} product(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProducts([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300"
                    checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">ID</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Product</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Category</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Price</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Stock Qty</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Warehouse</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Last Updated</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-12 text-center">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No products found</p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => (
                  <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300"
                        checked={selectedProducts.includes(p._id)}
                        onChange={() => handleSelectProduct(p._id)}
                      />
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap font-mono">
                      #{p._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {p.coverPhoto || p.images?.[0] ? (
                            <img src={p.coverPhoto || p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={20} className="text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          {p.brand && (
                            <p className="text-xs text-gray-500">{p.brand}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {p.category?.name || '-'}
                    </td>
                    <td className="p-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      ₹{p.price.toLocaleString()}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {p.stock || 0} pcs
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {getStockBadge(p.stock || 0)}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {p.warehouse || 'WR-001'}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(p.updatedAt || p.createdAt)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs whitespace-nowrap"
                          onClick={() => navigate(`/order-request/new?productId=${p._id}`)}
                        >
                          Order
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs whitespace-nowrap"
                          onClick={() => navigate(`/stock-products/${p._id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && products.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 gap-4">
            <div className="text-sm text-gray-600">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} entries
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={pagination.currentPage === 1}
                onClick={() => goToPage(pagination.currentPage - 1)}
              >
                <ChevronLeft size={18} />
              </button>

              {[...Array(pagination.totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show first page, last page, current page, and 2 pages around current
                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
                ) {
                  return (
                    <button
                      key={i}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 rounded-lg transition-colors ${pagination.currentPage === pageNum
                          ? 'bg-teal-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === pagination.currentPage - 2 ||
                  pageNum === pagination.currentPage + 2
                ) {
                  return <span key={i} className="px-2 text-gray-500">...</span>;
                }
                return null;
              })}

              <button
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => goToPage(pagination.currentPage + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}