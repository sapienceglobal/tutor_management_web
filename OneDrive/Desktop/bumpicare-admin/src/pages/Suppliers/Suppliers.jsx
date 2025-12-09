import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";

export default function Suppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadSuppliers();
  }, [search, filter]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filter) params.append('isActive', filter);

      const res = await api.get(`/admin/suppliers?${params.toString()}`);
      setSuppliers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.delete(`/admin/suppliers/${id}`);
      alert('Supplier deleted successfully!');
      loadSuppliers();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete supplier');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <Button
          className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
          onClick={() => navigate('/suppliers/new')}
        >
          <Plus size={18} />
          Add Supplier
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search suppliers..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border border-gray-300 px-4 py-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Name</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Email</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Phone</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">City</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Payment Terms</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Delivery Time</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Rating</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-500">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {supplier.name}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">{supplier.email}</td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">{supplier.phone}</td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {supplier.address?.city || 'N/A'}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {supplier.paymentTerms || 'N/A'}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {supplier.deliveryTime || 'N/A'}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        ⭐ {supplier.rating || 0}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {supplier.isActive ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium text-green-700 bg-green-100">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium text-red-700 bg-red-100">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => navigate(`/suppliers/${supplier._id}`)}
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => navigate(`/suppliers/edit/${supplier._id}`)}
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(supplier._id, supplier.name)}
                        >
                          <Trash2 size={14} />
                        </Button>
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