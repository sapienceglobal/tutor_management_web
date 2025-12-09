import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Search, 
  Download, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function SalesReport() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedReports, setSelectedReports] = useState([]);

  // Fetch sales stats
  const { data: statsData } = useQuery({
    queryKey: ['salesStats'],
    queryFn: async () => {
      const res = await api.get('/admin/sales/stats');
      return res.data;
    },
  });

  // Fetch accommodation revenue chart
  const { data: revenueChartData } = useQuery({
    queryKey: ['revenueChart'],
    queryFn: async () => {
      const res = await api.get('/admin/sales/revenue-chart');
      return res.data;
    },
  });

  // Fetch top countries
  const { data: topCountriesData } = useQuery({
    queryKey: ['topCountries'],
    queryFn: async () => {
      const res = await api.get('/admin/sales/top-countries');
      return res.data;
    },
  });

  // Fetch sales reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['salesReports', searchQuery, statusFilter, dateFilter, page],
    queryFn: async () => {
      const res = await api.get('/admin/sales/reports', {
        params: {
          search: searchQuery,
          status: statusFilter,
          date: dateFilter,
          page,
          limit: 6
        },
      });
      return res.data;
    },
  });

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Select all reports
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allReportIds = reports.map(report => report._id);
      setSelectedReports(allReportIds);
    } else {
      setSelectedReports([]);
    }
  };

  // Select individual report
  const handleSelectReport = (reportId) => {
    if (selectedReports.includes(reportId)) {
      setSelectedReports(selectedReports.filter(id => id !== reportId));
    } else {
      setSelectedReports([...selectedReports, reportId]);
    }
  };

  // Export function
  const handleExport = async () => {
    try {
      const response = await api.get('/admin/sales/export', {
        responseType: 'blob',
        params: {
          ids: selectedReports.length > 0 ? selectedReports.join(',') : undefined
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{payload[0].payload.month}</p>
          <p className="text-sm text-teal-600">Earning: ${payload[0].value.toLocaleString()}</p>
          <p className="text-sm text-blue-600">Refunds: ${payload[1].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const stats = statsData?.data || {};
  const revenueChart = revenueChartData?.data || [];
  const topCountries = topCountriesData?.data || [];
  const reports = reportsData?.data || [];
  const pagination = reportsData?.pagination || {};

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sales reports</h1>
        <Button 
          onClick={handleExport}
          className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
        >
          <Download size={18} />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="p-5 bg-cyan-50 rounded-2xl border border-cyan-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <Package className="text-cyan-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalSales?.toLocaleString() || '52,000'}
              </p>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <ShoppingCart className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalOrders?.toLocaleString() || '1,285'}
              </p>
            </div>
          </div>
        </div>

        {/* Average Order */}
        <div className="p-5 bg-yellow-50 rounded-2xl border border-yellow-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Order</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.averageOrder?.toFixed(2) || '40.45'}
              </p>
            </div>
          </div>
        </div>

        {/* Refunded */}
        <div className="p-5 bg-pink-50 rounded-2xl border border-pink-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg">
              <RotateCcw className="text-pink-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Refunded</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.refunded || '500'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accommodation Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Accommodation Revenue</h2>
              <p className="text-sm text-gray-500">(+45%) than last year</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-600"></div>
                <span className="text-gray-600">Earning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Refunds</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="earning" 
                stroke="#0d9488" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="refunds" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top Countries By sales</h2>
            <p className="text-sm text-gray-500">Total Sale 300M</p>
          </div>

          <div className="space-y-4">
            {topCountries.map((country, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={country.flag} 
                    alt={country.name}
                    className="w-6 h-6 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">{country.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-8">
                    <svg viewBox="0 0 50 20" className="w-full h-full">
                      <polyline
                        points={country.trend}
                        fill="none"
                        stroke={country.isPositive ? '#10b981' : '#ef4444'}
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                    {country.sales}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="pl-10 h-11"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 h-11">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem >All</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48 h-11">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem >All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 w-4 h-4"
                  checked={selectedReports.length === reports.length && reports.length > 0}
                  onChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Earning</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No sales reports found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report._id} className="hover:bg-gray-50">
                  <TableCell>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 w-4 h-4"
                      checked={selectedReports.includes(report._id)}
                      onChange={() => handleSelectReport(report._id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    #{report.reportId || report._id.slice(-6)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <Package size={16} className="text-gray-400" />
                      </div>
                      <span className="text-sm">{report.productName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">{report.category}</TableCell>
                  <TableCell className="font-semibold">${report.earning}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'Published' 
                        ? 'bg-teal-100 text-teal-700'
                        : report.status === 'Draft'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {report.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(report.date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-gray-100"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>

          {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  page === pageNum
                    ? 'bg-teal-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {pagination.pages > 5 && (
            <>
              <span className="px-2 text-gray-500">...</span>
              <button
                onClick={() => setPage(pagination.pages)}
                className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                {pagination.pages}
              </button>
            </>
          )}

          <button
            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
            disabled={page === pagination.pages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}