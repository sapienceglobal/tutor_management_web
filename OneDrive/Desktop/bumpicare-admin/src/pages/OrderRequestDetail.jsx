import { useEffect, useState } from "react";
import { ArrowLeft, Package, User, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import api from "@/services/api";

export default function OrderRequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/orders/requests`);
      const foundOrder = res.data.data.find(o => o._id === id);
      
      if (foundOrder) {
        setOrder(foundOrder);
        setNotes(foundOrder.notes || "");
        setRejectionReason(foundOrder.rejectionReason || "");
      } else {
        setError('Order request not found');
      }
    } catch (err) {
      console.error('Failed to load order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === 'rejected' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${newStatus} this order?`)) return;

    setActionLoading(true);
    try {
      const updateData = { status: newStatus };
      if (notes) updateData.notes = notes;
      if (newStatus === 'rejected') updateData.rejectionReason = rejectionReason;

      await api.put(`/admin/orders/request/${id}`, updateData);
      
      alert(`Order ${newStatus} successfully!`);
      loadOrder();
    } catch (err) {
      console.error('Update error:', err);
      alert(err.response?.data?.message || 'Failed to update order');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text} flex items-center gap-2 w-fit`}>
        <Icon size={16} />
        {status?.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error || 'Order not found'}</p>
          <Button onClick={() => navigate('/order-requests')}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/order-requests')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Request Details</h1>
              <p className="text-gray-600">#{order._id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <div>
            {getStatusBadge(order.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Product Information</h2>
              
              <div className="flex gap-6">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {order.product?.images?.[0] ? (
                    <img
                      src={order.product.images[0]}
                      alt={order.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package size={40} className="text-gray-400" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {order.product?.name || 'N/A'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Category</p>
                      <p className="font-medium text-gray-900">
                        {order.product?.category?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Current Stock</p>
                      <p className="font-medium text-gray-900">{order.currentStock} units</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ordered Quantity</p>
                      <p className="font-medium text-gray-900">
                        {order.quantity} {order.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-medium text-gray-900">
                        ₹{order.product?.price || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Details</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Type</p>
                  <p className="text-base font-semibold text-gray-900 capitalize">
                    {order.orderType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Priority</p>
                  <p className="text-base font-semibold text-gray-900 capitalize">
                    {order.priority}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Supplier</p>
                  <p className="text-base font-semibold text-gray-900">
                    {order.supplier || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Warehouse</p>
                  <p className="text-base font-semibold text-gray-900">{order.warehouse}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Requested By</p>
                  <p className="text-base font-semibold text-gray-900">
                    {order.requestedBy?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Request Date</p>
                  <p className="text-base font-semibold text-gray-900">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {order.status === 'pending' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Notes</h2>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for this order..."
                  rows={4}
                  className="mb-4"
                />

                {order.status === 'pending' && (
                  <div>
                    <Label className="mb-2">Rejection Reason (if rejecting)</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide reason for rejection..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Rejection Reason Display */}
            {order.status === 'rejected' && order.rejectionReason && (
              <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Rejection Reason</h3>
                <p className="text-red-700">{order.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            {order.status === 'pending' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Order
                      </>
                    )}
                  </Button>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Order
                  </Button>
                </div>
              </div>
            )}

            {order.status === 'approved' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Completed
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-teal-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Order Created</p>
                    <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                {order.approvedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Order Approved</p>
                      <p className="text-sm text-gray-600">{formatDate(order.approvedAt)}</p>
                    </div>
                  </div>
                )}
                {order.completedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Order Completed</p>
                      <p className="text-sm text-gray-600">{formatDate(order.completedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}