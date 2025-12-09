import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";

export default function Warehouses() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
 
  useEffect(() => {
    loadWarehouses();
  }, [search]);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await api.get(`/admin/warehouses?${params.toString()}`);
      setWarehouses(res.data.data || []);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
      setError('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.delete(`/admin/warehouses/${id}`);
      alert('Warehouse deleted successfully!');
      loadWarehouses();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete warehouse');
    }
  };

  const getUtilizationPercentage = (current, total) => {
    return total > 0 ? Math.round((current / total) * 100) : 0;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        <Button
          className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
          onClick={() => navigate('/warehouses/new')}
        >
          <Plus size={18} />
          Add Warehouse
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative w-full lg:w-80 mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search warehouses..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Warehouse ID</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Name</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Location</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Capacity</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Utilization</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Contact</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                  </td>
                </tr>
              ) : warehouses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    No warehouses found
                  </td>
                </tr>
              ) : (
                warehouses.map((warehouse) => (
                  <tr key={warehouse._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {warehouse.warehouseId}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">{warehouse.name}</td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {warehouse.location?.city}, {warehouse.location?.state}
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {warehouse.capacity.toLocaleString()} sq ft
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-teal-600 h-2 rounded-full"
                            style={{
                              width: `${getUtilizationPercentage(
                                warehouse.currentUtilization,
                                warehouse.capacity
                              )}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {getUtilizationPercentage(
                            warehouse.currentUtilization,
                            warehouse.capacity
                          )}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700 whitespace-nowrap">
                      {warehouse.contactNumber || 'N/A'}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {warehouse.isActive ? (
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
                          onClick={() => navigate(`/warehouses/${warehouse._id}`)}
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => navigate(`/warehouses/edit/${warehouse._id}`)}
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(warehouse._id, warehouse.name)}
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