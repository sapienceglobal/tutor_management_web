// ============================================
// 📁 FinanceManagement.jsx - Complete System
// ============================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  Eye,
  DollarSign,
  CreditCard,
  RefreshCcw,
  Calendar,
  Filter,
  ChevronDown
} from 'lucide-react';

export default function FinanceManagement() {
  const [activeTab, setActiveTab] = useState('transactions'); // transactions, invoices
  const [period, setPeriod] = useState('12months');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Fetch Finance Stats
  const { data: statsData } = useQuery({
    queryKey: ['finance-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/finance/stats');
      return res.data;
    },
  });

  // Fetch Chart Data
  const { data: chartData } = useQuery({
    queryKey: ['finance-chart', period],
    queryFn: async () => {
      const res = await api.get('/admin/finance/chart', {
        params: { period }
      });
      return res.data;
    },
  });

  // Fetch Transactions
  const { data: transactionsData } = useQuery({
    queryKey: ['finance-transactions', searchQuery, paymentMethodFilter, statusFilter, dateFilter],
    queryFn: async () => {
      const res = await api.get('/admin/finance/transactions', {
        params: {
          search: searchQuery,
          paymentMethod: paymentMethodFilter,
          status: statusFilter,
          dateFilter: dateFilter
        }
      });
      return res.data;
    },
  });

  const stats = statsData?.data || {
    totalIncome: 0,
    totalExpenses: 0,
    totalRevenue: 0,
    averageEarning: 0,
    incomeChange: 0,
    expensesChange: 0,
    revenueChange: 0,
    earningChange: 0,
  };

  const chartDataPoints = chartData?.data || [];
  const transactions = transactionsData?.data || [];

  const handleExport = () => {
    window.open('/admin/finance/export', '_blank');
  };

  const handlePayout = (transactionId) => {
    console.log('Process payout for:', transactionId);
    // Implement payout logic
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Earning</h1>
        <button
          onClick={handleExport}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-6 border border-cyan-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-medium">Total Income</p>
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              stats.incomeChange >= 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {stats.incomeChange >= 0 ? '+' : ''}{stats.incomeChange}%
              {stats.incomeChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            ${stats.totalIncome?.toLocaleString()}
          </h2>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-medium">Total Expenses</p>
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              stats.expensesChange >= 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {stats.expensesChange >= 0 ? '+' : ''}{stats.expensesChange}%
              {stats.expensesChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            ${stats.totalExpenses?.toLocaleString()}
          </h2>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              stats.revenueChange >= 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%
              {stats.revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            ${stats.totalRevenue?.toLocaleString()}
          </h2>
        </div>

        {/* Average Earning */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 font-medium">Average Earning</p>
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              stats.earningChange >= 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {stats.earningChange >= 0 ? '+' : ''}{stats.earningChange}%
              {stats.earningChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            ${stats.averageEarning?.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Accommodation Revenue</h2>
            <p className="text-sm text-gray-500 mt-1">(+43%) than last year</p>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            {[
              { label: '12 months', value: '12months' },
              { label: '30 days', value: '30days' },
              { label: '7 days', value: '7days' },
              { label: '24 hours', value: '24hours' }
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-500"></div>
            <span className="text-sm text-gray-600">Earning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-600">Expenses</span>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartDataPoints}>
            <defs>
              <linearGradient id="colorEarning" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${value}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="earning" 
              stroke="#14b8a6" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEarning)"
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stroke="#fbbf24" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpenses)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Invoices
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b space-y-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            {/* Payment Method Filter */}
            <div className="relative">
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-teal-500 outline-none bg-white"
              >
                <option value="">Payment Method</option>
                <option value="wallet">Wallet</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="cod">COD</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-teal-500 outline-none bg-white"
              >
                <option value="">Status</option>
                <option value="received">Received</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-teal-500 outline-none bg-white"
              >
                <option value="">Date</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Transaction</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Payment Method</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Payment Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      #{transaction.transactionId || transaction._id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ${transaction.amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.paymentMethod || 'Wallet'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        transaction.status === 'received' || transaction.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {transaction.status || 'Received'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(transaction.createdAt || Date.now()).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          View
                        </button>
                        <button
                          onClick={() => handlePayout(transaction._id)}
                          className="px-4 py-1.5 text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-colors"
                        >
                          Payout
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
    </div>
  );
}