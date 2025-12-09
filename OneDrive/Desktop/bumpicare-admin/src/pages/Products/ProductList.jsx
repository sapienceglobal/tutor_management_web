// ============================================
// 📁 ProductList.jsx - Enhanced Version
// ============================================

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { sellerService } from '../../services/sellerService';
import api from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search as SearchIcon,
  Edit,
  Trash2,
  Power,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Filter,
  RefreshCcw
} from 'lucide-react';

export default function ProductList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // UI state
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch Sellers
  const { data: sellersData } = useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const res = await sellerService.list();
   
      return res;
    },
    staleTime: 1000 * 60 * 5,
  });

  const categories = categoriesData?.data || [];
  const sellers = sellersData?.sellers || [];

  // Fetch Products
  const {
    data: productsResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['products', searchQuery, page, limit, categoryFilter, sellerFilter, statusFilter],
    queryFn: async () => {
      const params = {
        search: searchQuery,
        page,
        limit,
      };

      if (categoryFilter) params.category = categoryFilter;
      if (sellerFilter) params.seller = sellerFilter;
      if (statusFilter) params.isActive = statusFilter;

      const res = await productService.getAll(params);
      return res;
    },
    keepPreviousData: true,
  });

  const products = productsResponse?.data || [];
  const pagination = productsResponse?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: (id) => productService.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setSelectedIds(new Set());
    },
  });

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === products.length && products.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p._id)));
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Clear selections when page/filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, searchQuery, categoryFilter, sellerFilter, statusFilter]);

  // Search handlers
  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const handleClearFilters = () => {
    setCategoryFilter('');
    setSellerFilter('');
    setStatusFilter('');
    setPage(1);
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} product(s)?`)) return;

    for (const id of Array.from(selectedIds)) {
      try {
        await productService.delete(id);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }

    queryClient.invalidateQueries(['products']);
    setSelectedIds(new Set());
  };

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Activate ${selectedIds.size} product(s)?`)) return;

    for (const id of Array.from(selectedIds)) {
      try {
        const product = products.find(p => p._id === id);
        if (product && !product.isActive) {
          await productService.toggleStatus(id);
        }
      } catch (error) {
        console.error('Activate error:', error);
      }
    }

    queryClient.invalidateQueries(['products']);
    setSelectedIds(new Set());
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Deactivate ${selectedIds.size} product(s)?`)) return;

    for (const id of Array.from(selectedIds)) {
      try {
        const product = products.find(p => p._id === id);
        if (product && product.isActive) {
          await productService.toggleStatus(id);
        }
      } catch (error) {
        console.error('Deactivate error:', error);
      }
    }

    queryClient.invalidateQueries(['products']);
    setSelectedIds(new Set());
  };

  // Row actions
  const handleToggleStatus = async (product) => {
    if (!window.confirm(`${product.isActive ? 'Deactivate' : 'Activate'} "${product.name}"?`)) return;
    toggleMutation.mutate(product._id);
  };

  const handleDelete = (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    deleteMutation.mutate(product._id);
  };

  // Pagination handlers
  const goToFirstPage = () => setPage(1);
  const goToLastPage = () => setPage(pagination.totalPages);
  const goToPreviousPage = () => setPage(Math.max(1, page - 1));
  const goToNextPage = () => setPage(Math.min(pagination.totalPages, page + 1));

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    const totalPages = pagination.totalPages;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const hasActiveFilters = categoryFilter || sellerFilter || statusFilter || searchQuery;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product List</h1>
          <p className="text-gray-500 mt-1">
            {pagination.total} {pagination.total === 1 ? 'product' : 'products'} total
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-lg border border-teal-200">
              <span className="text-sm font-medium text-teal-700">
                {selectedIds.size} selected
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkActivate}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Power className="w-4 h-4 mr-1" />
                Activate
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkDeactivate}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <Power className="w-4 h-4 mr-1" />
                Deactivate
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <Button
            onClick={() => navigate('/products/add')}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search products by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="pl-10"
            />
          </div>

          <Button onClick={handleSearch} className="bg-teal-600 hover:bg-teal-700 text-white">
            <SearchIcon className="w-4 h-4 mr-2" />
            Search
          </Button>

          {searchQuery && (
            <Button onClick={handleClearSearch} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Clear Search
            </Button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Seller Filter */}
          <select
            value={sellerFilter}
            onChange={(e) => {
              setSellerFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="">All Sellers</option>
            {sellers.map((seller) => (
              <option key={seller._id} value={seller._id}>
                {seller.shopName || seller.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Items per page */}
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button onClick={handleClearFilters} variant="outline" size="sm">
              <X className="w-4 h-4 mr-1" />
              Clear All Filters
            </Button>
          )}

          {/* Refresh */}
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchQuery}"
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600"
                  onClick={handleClearSearch}
                />
              </Badge>
            )}
            {categoryFilter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {categories.find(c => c._id === categoryFilter)?.name}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600"
                  onClick={() => setCategoryFilter('')}
                />
              </Badge>
            )}
            {sellerFilter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Seller: {sellers.find(s => s._id === sellerFilter)?.shopName || sellers.find(s => s._id === sellerFilter)?.name}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600"
                  onClick={() => setSellerFilter('')}
                />
              </Badge>
            )}
            {statusFilter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {statusFilter === 'true' ? 'Active' : 'Inactive'}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600"
                  onClick={() => setStatusFilter('')}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.size === products.length && products.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
                    <p className="text-gray-500">Loading products...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <SearchIcon className="w-12 h-12 text-gray-300" />
                    <p className="font-medium">No products found</p>
                    {hasActiveFilters && (
                      <Button onClick={handleClearFilters} variant="outline" size="sm">
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id} className="hover:bg-gray-50">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product._id)}
                      onChange={() => toggleSelect(product._id)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>

                  <TableCell>
                    <img
                      src={product.images?.[0] || '/placeholder.png'}
                      alt={product.name}
                      className="w-14 h-14 object-cover rounded-lg border"
                    />
                  </TableCell>

                  <TableCell className="font-medium max-w-xs truncate">
                    {product.name}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {product.category?.name || 'N/A'}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">₹{product.price}</span>
                      {product.discountPrice && (
                        <span className="text-xs text-gray-500 line-through">
                          ₹{product.discountPrice}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        product.stock === 0
                          ? 'destructive'
                          : product.stock < 10
                          ? 'secondary'
                          : 'default'
                      }
                    >
                      {product.stock}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge variant={product.isActive ? 'default' : 'secondary'}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/products/${product._id}`)}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/products/edit/${product._id}`)}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(product)}
                        title={product.isActive ? 'Deactivate' : 'Activate'}
                        className={product.isActive ? 'text-orange-600' : 'text-green-600'}
                      >
                        <Power className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
          {/* Info */}
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(page * limit, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span> products
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            {/* First Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToFirstPage}
              disabled={page === 1}
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>

            {/* Previous Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={!pagination.hasPreviousPage}
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNum, index) => {
                if (pageNum === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[36px] px-3 py-1 rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-teal-600 text-white font-semibold'
                        : 'border hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={!pagination.hasNextPage}
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Last Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastPage}
              disabled={page === pagination.totalPages}
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}