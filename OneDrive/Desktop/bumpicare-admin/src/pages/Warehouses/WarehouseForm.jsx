import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import api from "@/services/api";
import { useNavigate, useParams } from "react-router-dom";

export default function WarehouseForm() {
  // Get id from URL params - implement based on your routing
  // const id = null; // Replace with useParams or your routing solution
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    warehouseId: "",
    name: "",
    location: {
      address: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
    capacity: "",
    currentUtilization: 0,
    manager: "",
    contactNumber: "",
    operatingHours: {
      open: "09:00",
      close: "18:00",
      daysOpen: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    isActive: true,
  });

  useEffect(() => {
    if (isEdit) {
      loadWarehouse();
    }
  }, [id]);

  const loadWarehouse = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/warehouses/${id}`);
      setFormData(res.data.data);
    } catch (err) {
      console.error('Failed to load warehouse:', err);
      setError('Failed to load warehouse data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isEdit) {
        await api.put(`/admin/warehouses/${id}`, formData);
        alert('Warehouse updated successfully!');
      } else {
        await api.post('/admin/warehouses', formData);
        alert('Warehouse created successfully!');
      }
      navigate('/warehouses');
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to save warehouse');
    } finally {
      setLoading(false);
    }
  };

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDay = (day) => {
    const days = formData.operatingHours.daysOpen || [];
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day];
    
    setFormData({
      ...formData,
      operatingHours: { ...formData.operatingHours, daysOpen: newDays }
    });
  };

  const handleGoBack = () => {
    // Implement navigation back
    navigate(-1); 
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Warehouse' : 'Add New Warehouse'}
          </h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Warehouse ID <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value.toUpperCase() })}
                  placeholder="WH-001"
                  required
                  disabled={isEdit}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Warehouse Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter warehouse name"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Capacity (sq ft) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="50000"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Current Utilization (sq ft)</Label>
                <Input
                  type="number"
                  value={formData.currentUtilization}
                  onChange={(e) => setFormData({ ...formData, currentUtilization: e.target.value })}
                  placeholder="25000"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Manager ID</Label>
                <Input
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="Manager ObjectId (optional)"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Contact Number</Label>
                <Input
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="+91-9876543210"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Active Status</Label>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input
                  value={formData.location.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value }
                  })}
                  placeholder="Street address"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>City</Label>
                <Input
                  value={formData.location.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, city: e.target.value }
                  })}
                  placeholder="City"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>State</Label>
                <Input
                  value={formData.location.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, state: e.target.value }
                  })}
                  placeholder="State"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Country</Label>
                <Input
                  value={formData.location.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, country: e.target.value }
                  })}
                  placeholder="Country"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Zip Code</Label>
                <Input
                  value={formData.location.zipCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, zipCode: e.target.value }
                  })}
                  placeholder="Zip Code"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Operating Hours</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label>Opening Time</Label>
                <Input
                  type="time"
                  value={formData.operatingHours.open}
                  onChange={(e) => setFormData({
                    ...formData,
                    operatingHours: { ...formData.operatingHours, open: e.target.value }
                  })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Closing Time</Label>
                <Input
                  type="time"
                  value={formData.operatingHours.close}
                  onChange={(e) => setFormData({
                    ...formData,
                    operatingHours: { ...formData.operatingHours, close: e.target.value }
                  })}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Operating Days</Label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      formData.operatingHours.daysOpen?.includes(day)
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-teal-500'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoBack}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Warehouse' : 'Add Warehouse'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}