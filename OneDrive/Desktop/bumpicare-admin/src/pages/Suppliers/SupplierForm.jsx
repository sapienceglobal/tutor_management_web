import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import api from "@/services/api";

export default function SupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
    contactPerson: {
      name: "",
      email: "",
      phone: "",
    },
    rating: 0,
    paymentTerms: "",
    deliveryTime: "",
    notes: "",
    isActive: true,
  });

  useEffect(() => {
    if (isEdit) {
      loadSupplier();
    }
  }, [id]);

  const loadSupplier = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/suppliers/${id}`);
      setFormData(res.data.data);
    } catch (err) {
      console.error('Failed to load supplier:', err);
      setError('Failed to load supplier data');
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
        await api.put(`/admin/suppliers/${id}`, formData);
        alert('Supplier updated successfully!');
      } else {
        await api.post('/admin/suppliers', formData);
        alert('Supplier created successfully!');
      }
      navigate('/suppliers');
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
          </h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Supplier Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter supplier name"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Phone <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91-9876543210"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Rating</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  placeholder="0.0"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Payment Terms</Label>
                <Input
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  placeholder="e.g., 30 days net"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Delivery Time</Label>
                <Input
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  placeholder="e.g., 3-5 days"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="mt-6">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Active Status</Label>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Address</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label>Street</Label>
                <Input
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value }
                  })}
                  placeholder="Street address"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>City</Label>
                <Input
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
                  })}
                  placeholder="City"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>State</Label>
                <Input
                  value={formData.address.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value }
                  })}
                  placeholder="State"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Country</Label>
                <Input
                  value={formData.address.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, country: e.target.value }
                  })}
                  placeholder="Country"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Zip Code</Label>
                <Input
                  value={formData.address.zipCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, zipCode: e.target.value }
                  })}
                  placeholder="Zip Code"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Person</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.contactPerson.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    contactPerson: { ...formData.contactPerson, name: e.target.value }
                  })}
                  placeholder="Contact person name"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.contactPerson.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    contactPerson: { ...formData.contactPerson, email: e.target.value }
                  })}
                  placeholder="email@example.com"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.contactPerson.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    contactPerson: { ...formData.contactPerson, phone: e.target.value }
                  })}
                  placeholder="+91-9876543210"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Supplier' : 'Add Supplier'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}