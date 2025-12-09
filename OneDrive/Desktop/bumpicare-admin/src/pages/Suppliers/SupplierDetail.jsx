import { useState, useEffect } from "react";
import { ArrowLeft, Edit, Mail, Phone, MapPin, User, Package, Star, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";
import { useNavigate, useParams } from "react-router-dom";


export default function SupplierDetail() {
  // Get id from URL params - implement based on your routing
  // const id = null; // Replace with useParams or your routing solution
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadSupplier();
    }
  }, [id]);

  const loadSupplier = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/suppliers/${id}`);
      setSupplier(res.data.data);
    } catch (err) {
      console.error('Failed to load supplier:', err);
      setError('Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
     navigate('/suppliers'); 
  };

  const handleEdit = () => {
    // Navigate to edit page
    navigate(`/suppliers/edit/${id}`);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Supplier not found'}</AlertDescription>
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
              <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {supplier.rating > 0 && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Star size={16} fill="currentColor" />
                    <span className="font-medium">{supplier.rating}</span>
                  </span>
                )}
                {supplier.isActive ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium text-green-700 bg-green-100">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium text-red-700 bg-red-100">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={handleEdit}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Edit size={16} className="mr-2" />
            Edit Supplier
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Products Supplied</p>
                <p className="text-2xl font-bold text-gray-900">
                  {supplier.products?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {supplier.rating || 0} / 5
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Delivery Time</p>
                <p className="text-xl font-bold text-gray-900">
                  {supplier.deliveryTime || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone size={20} className="text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{supplier.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{supplier.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={20} className="text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900">Address</h2>
            </div>
            <div className="space-y-3">
              {supplier.address?.street && (
                <div>
                  <p className="text-sm text-gray-500">Street</p>
                  <p className="text-gray-900">{supplier.address.street}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {supplier.address?.city && (
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="text-gray-900">{supplier.address.city}</p>
                  </div>
                )}
                {supplier.address?.state && (
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="text-gray-900">{supplier.address.state}</p>
                  </div>
                )}
                {supplier.address?.country && (
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="text-gray-900">{supplier.address.country}</p>
                  </div>
                )}
                {supplier.address?.zipCode && (
                  <div>
                    <p className="text-sm text-gray-500">Zip Code</p>
                    <p className="text-gray-900">{supplier.address.zipCode}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Person */}
          {supplier.contactPerson && (supplier.contactPerson.name || supplier.contactPerson.email || supplier.contactPerson.phone) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <User size={20} className="text-teal-600" />
                <h2 className="text-lg font-semibold text-gray-900">Contact Person</h2>
              </div>
              <div className="space-y-3">
                {supplier.contactPerson.name && (
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-gray-900">{supplier.contactPerson.name}</p>
                  </div>
                )}
                {supplier.contactPerson.email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{supplier.contactPerson.email}</p>
                  </div>
                )}
                {supplier.contactPerson.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{supplier.contactPerson.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Business Terms */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900">Business Terms</h2>
            </div>
            <div className="space-y-3">
              {supplier.paymentTerms && (
                <div>
                  <p className="text-sm text-gray-500">Payment Terms</p>
                  <p className="text-gray-900">{supplier.paymentTerms}</p>
                </div>
              )}
              {supplier.deliveryTime && (
                <div>
                  <p className="text-sm text-gray-500">Delivery Time</p>
                  <p className="text-gray-900">{supplier.deliveryTime}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        className={star <= supplier.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-gray-900 font-medium">{supplier.rating || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {supplier.notes && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{supplier.notes}</p>
          </div>
        )}

        {/* Products */}
        {supplier.products && supplier.products.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Supplied Products ({supplier.products.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplier.products.map((product) => (
                <div
                  key={product._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {product.images && product.images[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  )}
                  <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                  {product.price && (
                    <p className="text-teal-600 font-semibold">
                      ₹{product.price.toLocaleString()}
                    </p>
                  )}
                  {product.stock !== undefined && (
                    <p className="text-sm text-gray-500 mt-1">
                      Stock: {product.stock}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-gray-900">
                {new Date(supplier.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-gray-900">
                {new Date(supplier.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className={`font-medium ${supplier.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {supplier.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-gray-900 font-medium">{supplier.products?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}