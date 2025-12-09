import { useEffect, useState } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Warehouse,
  Truck,
  ShoppingCart,
  Activity,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Box,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";

export default function InventoryOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [topValueProducts, setTopValueProducts] = useState([]);
  const [categoryStock, setCategoryStock] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        lowStockRes,
        outOfStockRes,
        topValueRes,
        categoryRes,
        movementsRes
      ] = await Promise.all([
        api.get('/admin/inventory/overview'),
        api.get('/admin/inventory/low-stock?limit=5'),
        api.get('/admin/inventory/out-of-stock?limit=5'),
        api.get('/admin/inventory/top-value?limit=5'),
        api.get('/admin/inventory/category-wise'),
        api.get('/admin/inventory/movements?limit=10')
      ]);

      setOverview(overviewRes.data.data);
      setLowStockProducts(lowStockRes.data.data || []);
      setOutOfStockProducts(outOfStockRes.data.data || []);
      setTopValueProducts(topValueRes.data.data || []);
      setCategoryStock(categoryRes.data.data || []);
      setRecentMovements(movementsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path) => {
    // Implement navigation
    window.location.href = path;
  };

  const getMovementIcon = (type) => {
    switch (type) {
      case 'in':
        return <ArrowUpRight className="text-green-600" size={16} />;
      case 'out':
        return <ArrowDownRight className="text-red-600" size={16} />;
      case 'transfer':
        return <Activity className="text-blue-600" size={16} />;
      case 'adjustment':
        return <BarChart3 className="text-purple-600" size={16} />;
      case 'damage':
        return <AlertTriangle className="text-orange-600" size={16} />;
      default:
        return <Box className="text-gray-600" size={16} />;
    }
  };

  const getMovementColor = (type) => {
    switch (type) {
      case 'in':
        return 'bg-green-100 text-green-700';
      case 'out':
        return 'bg-red-100 text-red-700';
      case 'transfer':
        return 'bg-blue-100 text-blue-700';
      case 'adjustment':
        return 'bg-purple-100 text-purple-700';
      case 'damage':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Failed to load data'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Overview</h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time inventory management and analytics
          </p>
        </div>
        <Button
          onClick={() => handleNavigate('/products/stock')}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Package size={18} className="mr-2" />
          Manage Stock
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package size={24} className="text-blue-600" />
            </div>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <h3 className="text-gray-500 text-sm mt-4">Total Products</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {overview.overview.totalProducts.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {overview.overview.totalStockQuantity.toLocaleString()} units in stock
          </p>
        </div>

        {/* Stock Value */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <h3 className="text-gray-500 text-sm mt-4">Total Stock Value</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            ₹{overview.overview.totalStockValue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">Current inventory worth</p>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle size={24} className="text-orange-600" />
            </div>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
              Alert
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mt-4">Low Stock Products</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {overview.stockStatus.lowStock}
          </p>
          <p className="text-xs text-gray-500 mt-2">Need restock soon</p>
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown size={24} className="text-red-600" />
            </div>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
              Critical
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mt-4">Out of Stock</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {overview.stockStatus.outOfStock}
          </p>
          <p className="text-xs text-gray-500 mt-2">Urgent action required</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Warehouse size={20} className="text-teal-600" />
            <h3 className="text-sm font-medium text-gray-700">Warehouses</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {overview.overview.activeWarehouses}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {overview.warehouseUtilization.utilizationPercentage}% utilized
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Truck size={20} className="text-teal-600" />
            <h3 className="text-sm font-medium text-gray-700">Suppliers</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {overview.overview.activeSuppliers}
          </p>
          <p className="text-xs text-gray-500 mt-1">Active partners</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart size={20} className="text-teal-600" />
            <h3 className="text-sm font-medium text-gray-700">Pending Orders</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {overview.overview.pendingOrders}
          </p>
          <p className="text-xs text-gray-500 mt-1">Need approval</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity size={20} className="text-teal-600" />
            <h3 className="text-sm font-medium text-gray-700">Recent Movements</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {overview.overview.recentMovements}
          </p>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </div>
      </div>

      {/* Stock Status Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Status Distribution</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">In Stock</span>
              <span className="text-sm font-medium text-gray-900">
                {overview.stockStatus.inStock} products
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full"
                style={{
                  width: `${(overview.stockStatus.inStock / overview.stockStatus.total) * 100}%`
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Low Stock</span>
              <span className="text-sm font-medium text-gray-900">
                {overview.stockStatus.lowStock} products
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-orange-500 h-3 rounded-full"
                style={{
                  width: `${(overview.stockStatus.lowStock / overview.stockStatus.total) * 100}%`
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Out of Stock</span>
              <span className="text-sm font-medium text-gray-900">
                {overview.stockStatus.outOfStock} products
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-red-500 h-3 rounded-full"
                style={{
                  width: `${(overview.stockStatus.outOfStock / overview.stockStatus.total) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Low Stock Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleNavigate('/products/stock?filter=low')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No low stock products</p>
            ) : (
              lowStockProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <img
                    src={product.images?.[0] || '/placeholder.png'}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">{product.category?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-orange-600">
                      {product.stock} units
                    </p>
                    <p className="text-xs text-gray-500">₹{product.price}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Out of Stock Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Out of Stock</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleNavigate('/products/stock?filter=out')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {outOfStockProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No out of stock products</p>
            ) : (
              outOfStockProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <img
                    src={product.images?.[0] || '/placeholder.png'}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">{product.category?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      Out
                    </span>
                    <p className="text-xs text-gray-500 mt-1">₹{product.price}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Value Products & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Value Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Products by Stock Value
          </h2>
          <div className="space-y-3">
            {topValueProducts.map((product, index) => (
              <div
                key={product._id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
              >
                <span className="text-lg font-bold text-gray-400 w-6">
                  #{index + 1}
                </span>
                <img
                  src={product.images?.[0] || '/placeholder.png'}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.stock} units × ₹{product.price}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-teal-600">
                    ₹{Math.round(product.stockValue).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Movements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Movements</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleNavigate('/inventory/movements')}
            >
              <Eye size={14} className="mr-1" />
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentMovements.slice(0, 5).map((movement) => (
              <div
                key={movement._id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
              >
                <div className="p-2 bg-gray-100 rounded">
                  {getMovementIcon(movement.movementType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {movement.product?.name}
                  </p>
                  <p className="text-xs text-gray-500">{movement.reason}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getMovementColor(
                      movement.movementType
                    )}`}
                  >
                    {movement.movementType}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {movement.quantity} units
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}