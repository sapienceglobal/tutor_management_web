import { useState, useEffect } from "react";
import { ArrowLeft, Edit, MapPin, Phone, Clock, Package, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";
import { useNavigate, useParams } from "react-router-dom";

export default function WarehouseDetail() {
  // Get id from URL params - implement based on your routing
  // const id = null; // Replace with useParams or your routing solution
  const { id } = useParams(); 
    const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadWarehouse();
    }
  }, [id]);

  const loadWarehouse = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/warehouses/${id}`);
      setWarehouse(res.data.data);
    } catch (err) {
      console.error('Failed to load warehouse:', err);
      setError('Failed to load warehouse details');
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationPercentage = () => {
    if (!warehouse) return 0;
    return warehouse.capacity > 0 
      ? Math.round((warehouse.currentUtilization / warehouse.capacity) * 100) 
      : 0;
  };

  const handleGoBack = () => {
   navigate('/warehouses'); 
  };

  const handleEdit = () => {
    // Navigate to edit page
      navigate(`/warehouses/edit/${id}`);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Warehouse not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
              <p className="text-gray-500 text-sm mt-1">ID: {warehouse.warehouseId}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {warehouse.isActive ? (
              <span className="px-4 py-2 rounded-full text-sm font-medium text-green-700 bg-green-100">
                Active
              </span>
            ) : (
              <span className="px-4 py-2 rounded-full text-sm font-medium text-red-700 bg-red-100">
                Inactive
              </span>
            )}
            <Button
              onClick={handleEdit}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Edit size={16} className="mr-2" />
              Edit Warehouse
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Capacity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {warehouse.capacity.toLocaleString()} sq ft
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <Activity size={24} className="text-teal-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Current Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {warehouse.currentUtilization.toLocaleString()} sq ft
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Utilization</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getUtilizationPercentage()}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Space Utilization</h2>
          <div className="relative w-full bg-gray-200 rounded-full h-8">
            <div
              className="absolute top-0 left-0 h-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ width: `${getUtilizationPercentage()}%` }}
            >
              {getUtilizationPercentage() > 15 && `${getUtilizationPercentage()}%`}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>{warehouse.currentUtilization.toLocaleString()} sq ft used</span>
            <span>{(warehouse.capacity - warehouse.currentUtilization).toLocaleString()} sq ft available</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={20} className="text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900">Location</h2>
            </div>
            <div className="space-y-3">
              {warehouse.location?.address && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-900">{warehouse.location.address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {warehouse.location?.city && (
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="text-gray-900">{warehouse.location.city}</p>
                  </div>
                )}
                {warehouse.location?.state && (
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="text-gray-900">{warehouse.location.state}</p>
                  </div>
                )}
                {warehouse.location?.country && (
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="text-gray-900">{warehouse.location.country}</p>
                  </div>
                )}
                {warehouse.location?.zipCode && (
                  <div>
                    <p className="text-sm text-gray-500">Zip Code</p>
                    <p className="text-gray-900">{warehouse.location.zipCode}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact & Operating Hours */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone size={20} className="text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
            </div>
            <div className="space-y-4">
              {warehouse.contactNumber && (
                <div>
                  <p className="text-sm text-gray-500">Contact Number</p>
                  <p className="text-gray-900">{warehouse.contactNumber}</p>
                </div>
              )}
              {warehouse.manager && (
                <div>
                  <p className="text-sm text-gray-500">Manager</p>
                  <p className="text-gray-900">
                    {warehouse.manager.name || warehouse.manager}
                    {warehouse.manager.email && (
                      <span className="text-gray-500 text-sm block">{warehouse.manager.email}</span>
                    )}
                  </p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={18} className="text-teal-600" />
                  <p className="text-sm font-medium text-gray-900">Operating Hours</p>
                </div>
                {warehouse.operatingHours && (
                  <>
                    <p className="text-gray-900 mb-2">
                      {warehouse.operatingHours.open} - {warehouse.operatingHours.close}
                    </p>
                    {warehouse.operatingHours.daysOpen && (
                      <div className="flex flex-wrap gap-1">
                        {warehouse.operatingHours.daysOpen.map(day => (
                          <span
                            key={day}
                            className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs"
                          >
                            {day.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-gray-900">
                {new Date(warehouse.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-gray-900">
                {new Date(warehouse.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className={`font-medium ${warehouse.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {warehouse.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Warehouse ID</p>
              <p className="text-gray-900 font-mono">{warehouse.warehouseId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}