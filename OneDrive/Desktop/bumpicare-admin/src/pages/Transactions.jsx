// 📄 TransactionList.jsx - Frontend Component
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
  Search, 
  Download, 
  CreditCard,
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

export default function TransactionList() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [receivedStatusFilter, setReceivedStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTransactions, setSelectedTransactions] = useState([]);

  // Fetch transactions
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', searchQuery, paymentStatusFilter, receivedStatusFilter, dateFilter, page],
    queryFn: async () => {
      const res = await api.get('/admin/transactions', {
        params: { 
          search: searchQuery, 
          paymentStatus: paymentStatusFilter,
          receivedStatus: receivedStatusFilter,
          dateFilter: dateFilter,
          page, 
          limit: 10 
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

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/transactions/export', {
        params: {
          search: searchQuery,
          paymentStatus: paymentStatusFilter,
          receivedStatus: receivedStatusFilter,
          dateFilter: dateFilter
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = transactions.map(t => t._id);
      setSelectedTransactions(allIds);
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (id) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter(tid => tid !== id));
    } else {
      setSelectedTransactions([...selectedTransactions, id]);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Delivered': 'bg-emerald-100 text-emerald-700',
      'Processing': 'bg-cyan-100 text-cyan-700',
      'Shipped': 'bg-orange-100 text-orange-700',
      'Cancelled': 'bg-red-100 text-red-700',
      'Pending': 'bg-yellow-100 text-yellow-700'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const transactions = transactionsData?.data || [];
  const pagination = transactionsData?.pagination || {};

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders Transactions</h1>
        <Button 
          onClick={handleExport}
          className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
        >
          <Download size={18} />
          Export
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search by tracking number, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="pl-10 h-11"
          />
        </div>

        <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
          <SelectTrigger className="w-48 h-11">
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem >All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={receivedStatusFilter} onValueChange={setReceivedStatusFilter}>
          <SelectTrigger className="w-48 h-11">
            <SelectValue placeholder="Received status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem >All</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
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

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                  checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                  onChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="font-semibold">Tracking Number</TableHead>
              <TableHead className="font-semibold">Product Price</TableHead>
              <TableHead className="font-semibold">Delivery Fee</TableHead>
              <TableHead className="font-semibold">Method</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className="w-12 h-12 text-gray-300" />
                    <p className="font-medium">No transactions found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction._id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                      checked={selectedTransactions.includes(transaction._id)}
                      onChange={() => handleSelectTransaction(transaction._id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    #{transaction.trackingNumber}
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900">
                    ${transaction.productPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    ${transaction.deliveryFee.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm text-gray-700">{transaction.paymentMethod}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {transaction.email}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transaction.status)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`min-w-[36px] px-3 py-1 rounded-lg transition-colors ${
                  page === pageNum
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
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
                className="min-w-[36px] px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                {pagination.pages}
              </button>
            </>
          )}

          <button
            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
            disabled={page === pagination.pages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}