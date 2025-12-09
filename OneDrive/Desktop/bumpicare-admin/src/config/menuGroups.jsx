// src/config/menuGroups.js

import {
  Package,
  Folder,
  BoxesIcon,
  Warehouse,
  Truck,
  ClipboardList,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  Users,
  UserCog,
  UserCheck,
  UsersRound,
  TrendingUp,
  BarChart3,
  Star,
  LayoutDashboard,
  BadgePercent,
  Bolt,
  TicketPercent,
  Boxes,
  FilePlus,
  PackageSearch,
  Building2,
  FilePlus2,
  Wallet,
  ArrowDownCircle,
  RotateCcw,
} from "lucide-react";

const menuGroups = [
  {
    id: "dashboard",
    title: "",
    icon: null,
    defaultOpen: true,
    items: [
      { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }
    ],
  },
  {
    id: "product",
    title: "PRODUCT MANAGEMENT",
    icon: Package,
    defaultOpen: true,
    items: [
      {
        label: "Manage Products",
        icon: Package,
        children: [
          { path: "/products", label: "All Products" },
          { path: "/products/draft", label: "Draft Products" },
          { path: "/products/stock", label: "Stock Products" },
          // { path: "/products/reviews", label: "Product Review" },
        ],
      },
      {
        label: "Categories & Attributes",
        icon: Folder,
        children: [
          { path: "/categories", label: "Categories" },
          { path: "/tags", label: "Tags" },
        ],
      },
    ],
  },

  {
    id: "inventory",
    title: "INVENTORY & LOGISTICS",
    icon: Boxes,
    defaultOpen: true,

    items: [
      {
        path: "/inventory",
        icon: PackageSearch,
        label: "Inventory Overview"
      },

      {
        path: "/warehouses",
        icon: Warehouse,
        label: "Warehouses"
      },

      {
        path: "/suppliers",
        icon: Truck,
        label: "Suppliers"
      },

      {
        path: "/order-requests",
        icon: ClipboardList,
        label: "Order Requests"
      },

      {
        path: "/order-request/new",
        icon: FilePlus2,
        label: "New Order Request"
      },
    ],
  },
  {
    id: "orders",
    title: "ORDER MANAGEMENT",
    icon: ShoppingCart,
    defaultOpen: true,
    items: [
      { path: "/orders", icon: ShoppingCart, label: "All Orders" },
      // { path: "/abandoned-cart", icon: ShoppingBag, label: "Abandoned Carts" },
      { path: "/admin/transactions", icon: CreditCard, label: "Transactions" },
    ],
  },

  {
    id: "users",
    title: "USER MANAGEMENT",
    icon: Users,
    defaultOpen: true,
    items: [
      { path: "/users", icon: Users, label: "All Users" },
      { path: "/admins", icon: UserCog, label: "Admins" },
      { path: "/sellers", icon: UserCheck, label: "Sellers" },
      // { path: "/customers", icon: UsersRound, label: "Customers" },
    ],
  },
  {
    id: "deals",
    title: "PROMOTIONAL DEALS",
    icon: Package,
    defaultOpen: true,
    items: [
      {
        path: "/coupon",
        icon: TicketPercent,
        label: "Coupon"
      },
      {
        path: "/flash-sales",
        icon: Bolt,
        label: "Flash Sales"
      },
      {
        path: "/featured-deal",
        icon: Star,
        label: "Featured Deal"
      },
      {
        path: "/clearance-deal",
        icon: BadgePercent,
        label: "Clearance Deal"
      },
    ],
  },
  {
  id: "financeManagement",
  title: "FINANCE MANAGEMENT",
  icon: TrendingUp,
  defaultOpen: true,
  items: [
    { path: "/finance-earning", icon: Wallet, label: "Earnings" },
    { path: "/finance-withdrawls", icon: ArrowDownCircle, label: "Withdrawals" },
    { path: "/finance-refunds", icon: RotateCcw, label: "Refunds" },
  ],
},


  {
    id: "reports",
    title: "REPORTS & ANALYTICS",
    icon: TrendingUp,
    defaultOpen: true,
    items: [
      { path: "/sales-reports", icon: BarChart3, label: "Sales Reports" },
    ],
  },

  {
    id: "subscriptions",
    title: "BILLING & SUBSCRIPTIONS",
    icon: CreditCard,
    defaultOpen: true,
    items: [
      { path: "/subscriptions", icon: Package, label: "Plans & Pricing" },
      { path: "/user-subscriptions", icon: Users, label: "User Subscriptions" },
      { path: "/features", icon: Star, label: "Features" },
    ],
  },

  {
    id: "reviews",
    title: "REVIEWS & RATINGS",
    icon: Star,
    defaultOpen: true,
    items: [
      { path: "/reviews", icon: Star, label: "Product Reviews" },
    ],
  },
];

export default menuGroups;
