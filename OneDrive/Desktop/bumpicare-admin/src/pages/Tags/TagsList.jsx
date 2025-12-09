import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
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
import { Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TagsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState([]);

  // Fetch tags
  const { data: tagsData, isLoading } = useQuery({
    queryKey: ['tags', searchQuery, categoryFilter, dateFilter, page],
    queryFn: async () => {
      const res = await api.get('/admin/tags', {
        params: {
          search: searchQuery,
          category: categoryFilter,
          date: dateFilter,
          page,
          limit: 10
        },
      });
      return res.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['tags']);
      alert('Tag deleted successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to delete tag');
    }
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

  // Select all tags
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allTagIds = tags.map(tag => tag._id);
      setSelectedTags(allTagIds);
    } else {
      setSelectedTags([]);
    }
  };

  // Select individual tag
  const handleSelectTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" tag?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const tags = tagsData?.data || [];
  const pagination = tagsData?.pagination || {};

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tags List</h1>
        <Button
          onClick={() => navigate('/tags/new')}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          Create Tags
        </Button>
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
            className="pl-10 h-11 bg-white"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 h-11 bg-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem >All</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
            <SelectItem value="Blog">Blog</SelectItem>
            <SelectItem value="General">General</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48 h-11 bg-white">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem >All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 w-4 h-4"
                  checked={selectedTags.length === tags.length && tags.length > 0}
                  onChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-gray-700 font-semibold">ID</TableHead>
              <TableHead className="text-gray-700 font-semibold">Tags</TableHead>
              <TableHead className="text-gray-700 font-semibold">Category</TableHead>
              <TableHead className="text-gray-700 font-semibold">Create by</TableHead>
              <TableHead className="text-gray-700 font-semibold">Date</TableHead>
              <TableHead className="text-gray-700 font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No tags found
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag._id} className="hover:bg-gray-50 border-b">
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 w-4 h-4"
                      checked={selectedTags.includes(tag._id)}
                      onChange={() => handleSelectTag(tag._id)}
                    />
                  </TableCell>
                  <TableCell className="text-gray-700">
                    #{tag._id.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color
                      }}
                    >
                      {tag.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {tag.category || 'General'}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {tag.createdBy?.name || 'Admin'}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {new Date(tag.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/tags/edit/${tag._id}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag._id, tag.name)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
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
                className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
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