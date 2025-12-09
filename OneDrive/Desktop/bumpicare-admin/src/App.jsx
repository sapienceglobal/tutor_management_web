import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/authStore';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/Products/ProductList';
import ProductForm from './pages/Products/ProductForm';
import OrderList from './pages/Orders/OrderList';
import OrderDetails from './pages/Orders/OrderDetails';
import UserList from './pages/Users/UserList';
import UserDetails from './pages/Users/UserDetails';
import CategoryManagement from './pages/Categories/CategoryManagement';
import ReviewList from './pages/Reviews/ReviewList';
import Layout from './components/layout/Layout';
import UserSubscriptions from './pages/Subscriptions/UserSubscriptions';
import SubscriptionPlans from './pages/Subscriptions/SubscriptionPlans';

import FeaturesManagement from './pages/Subscriptions/FeaturesManagement';
import SellerList from './pages/sellers/SellerList';
import SellerDetails from './pages/sellers/SellerDetails';
import SellerForm from './pages/sellers/SellerForm';
import ProductDetails from './pages/Products/ProductDetails';
import StockProducts from './pages/Stocks/StockProducts';
import StockProductDetails from './pages/Stocks/Stockdetails';
import NewOrderRequest from './pages/Stocks/StockOrder';
import Suppliers from './pages/Suppliers/Suppliers';
import SupplierForm from './pages/Suppliers/SupplierForm';
import SupplierDetail from './pages/Suppliers/SupplierDetail';
import Warehouses from './pages/Warehouses/Warehouses';
import WarehouseForm from './pages/Warehouses/WarehouseForm';
import WarehouseDetail from './pages/Warehouses/WarehouseDetails';
import InventoryOverview from './pages/InventoryOverview';
import OrderRequests from './pages/OrderRequests';
import OrderRequestDetail from './pages/OrderRequestDetail';
import SalesReport from './pages/SalesReport';
import TagsList from './pages/Tags/TagsList';
import TagForm from './pages/Tags/TagForm';
import Coupons from './pages/Promotional_Deals/Coupon/CouponList';
import CouponForm from './pages/Promotional_Deals/Coupon/CouponForm';
import FlashSales from './pages/Promotional_Deals/FlashSales/FlashSalesList';
import FlashSaleForm from './pages/Promotional_Deals/FlashSales/FlashSalesForm';
import FeaturedDeals from './pages/Promotional_Deals/Featured_Deals/FeaturedDealsList';
import ClearanceDeals from './pages/Promotional_Deals/Clearance_Deals/ClearanceDealsList';
import FeaturedDealForm from './pages/Promotional_Deals/Featured_Deals/FeaturedDealsForm';
import ClearanceDealForm from './pages/Promotional_Deals/Clearance_Deals/ClearanceDealsForm';
import TransactionList from './pages/Transactions';
import DraftProducts from './pages/Products/DraftProducts';
import AdminList from './pages/AdminList';
import FinanceManagement from './pages/FinanceManagement/FinanceManagement';
import Withdrawals from './pages/FinanceManagement/Withdrawals';
import WithdrawalDetail from './pages/FinanceManagement/WithdrawlDetails';
import Refunds, { RefundDetails } from './pages/FinanceManagement/Refunds';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Products */}
            <Route path="products" element={<ProductList />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="products/add" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="products/draft" element={<DraftProducts />} />

            {/* Orders */}
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/:id" element={<OrderDetails />} />

            {/* Users */}
            <Route path="users" element={<UserList />} />
            <Route path="users/:id" element={<UserDetails />} />

            {/* Admins */}
            <Route path="admins" element={<AdminList />} />

            {/* Categories */}
            <Route path="categories" element={<CategoryManagement />} />
            {/*Subscription */}
            <Route path="subscriptions" element={<SubscriptionPlans />} />
            <Route path="user-subscriptions" element={<UserSubscriptions />} />
            <Route path="features" element={<FeaturesManagement />} />

            {/* Reviews */}
            <Route path="reviews" element={<ReviewList />} />

            {/* Sellers */}
            <Route path="sellers" element={<SellerList />} />
            <Route path="sellers/new" element={<SellerForm />} />
            {/* <Route path="sellers/add" element={<AddSeller />} />
            <Route path="sellers/edit/:id" element={<EditSeller />} /> */}
            <Route path="sellers/:id" element={<SellerDetails />} />

            {/* Stock Management Routes */}
            <Route path="products/stock" element={<StockProducts />} />
            <Route path="stock-products/:id" element={<StockProductDetails />} />


            {/* Supplier Management Routes */}
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="suppliers/new" element={<SupplierForm />} />
            <Route path="suppliers/:id" element={<SupplierDetail />} />
            <Route path="suppliers/edit/:id" element={<SupplierForm />} />

            {/* Warehouse Management Routes */}
            <Route path="warehouses" element={<Warehouses />} />
            <Route path="warehouses/new" element={<WarehouseForm />} />
            <Route path="warehouses/:id" element={<WarehouseDetail />} />
            <Route path="warehouses/edit/:id" element={<WarehouseForm />} />

            {/* Order Requests */}
            <Route path="order-request/new" element={<NewOrderRequest />} />
            <Route path="/order-requests" element={<OrderRequests />} />
            <Route path="/order-requests/:id" element={<OrderRequestDetail />} />


            {/* inventory Management Routes */}
            <Route path="/inventory" element={<InventoryOverview />} />

            {/* Sales Report */}
            <Route path="/sales-reports" element={<SalesReport />} />

            <Route path="/tags" element={<TagsList />} />
            <Route path="/tags/new" element={<TagForm />} />
            <Route path="/tags/edit/:id" element={<TagForm />} />


            {/* // Coupons */}
            <Route path="/coupon" element={<Coupons />} />
            <Route path="/coupon/new" element={<CouponForm />} />
            <Route path="/coupon/edit/:id" element={<CouponForm />} />
            {/* <Route path="/coupon/:id" element={<CouponDetail />} /> */}

            {/* // Flash Sales */}
            <Route path="/flash-sales" element={<FlashSales />} />
            <Route path="/flash-sales/new" element={<FlashSaleForm />} />
            <Route path="/flash-sales/edit/:id" element={<FlashSaleForm />} />
            {/* <Route path="/flash-sales/:id" element={<FlashSaleDetail />} /> */}

            {/* // Featured Deals */}
            <Route path="/featured-deal" element={<FeaturedDeals />} />
            <Route path="/featured-deal/new" element={<FeaturedDealForm />} />
            <Route path="/featured-deal/edit/:id" element={<FeaturedDealForm />} />
            {/* <Route path="/featured-deal/:id" element={<FeaturedDealDetail />} /> */}

            {/* // Clearance Deals */}
            <Route path="/clearance-deal" element={<ClearanceDeals />} />
            <Route path="/clearance-deal/new" element={<ClearanceDealForm />} />
            <Route path="/clearance-deal/edit/:id" element={<ClearanceDealForm />} />
            {/* <Route path="/clearance-deal/:id" element={<ClearanceDealDetail />} /> */}

            {/* Transactions */}
            <Route path="/admin/transactions" element={<TransactionList />} />


            {/* Finance Management */}
            <Route path="/finance-earning" element={<FinanceManagement />} />

            <Route path="/finance-withdrawls" element={<Withdrawals />} />
            <Route path="/withdrawals/:id" element={<WithdrawalDetail />} />

            {/* Refunds */}
            <Route path="/finance-refunds" element={<Refunds />} />
            <Route path="/refunds/:id" element={<RefundDetails />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;