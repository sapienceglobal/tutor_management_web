// src/pages/OrderDetails.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOrder, updateOrderStatus, cancelOrderItem } from "../../services/orderService";
import Loader from "../../components/Loader";
import { ArrowLeft, CheckCircle, Clock, Package } from "lucide-react";

function InfoCard({ title, value, className = "" }) {
  return (
    <div className={`rounded-xl p-5 ${className}`}>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="font-bold text-lg mt-2">{value}</p>
    </div>
  );
}

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: orderData, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder(id),
    staleTime: 1000 * 60,
  });

  const order = orderData?.order || orderData;

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }) => updateOrderStatus(id, { orderStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["order", id]);
      queryClient.invalidateQueries(["orders"]);
    },
  });

  const cancelItemMutation = useMutation({
    mutationFn: ({ itemId }) => cancelOrderItem(id, itemId),
    onSuccess: () => queryClient.invalidateQueries(["order", id]),
  });

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
      </div>
    );
  }

  // helper formatting
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");
  const formatDateTime = (d) => (d ? new Date(d).toLocaleString() : "-");

  const subtotal = order.totalAmount ?? order.orderTotal ?? 0;
  const tax = Math.round(subtotal * 0.1); // sample tax calc or read from order
  const discount = order.discountAmount || 0;
  const total = subtotal + tax - discount;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-md hover:bg-gray-100"
            onClick={() => navigate("/orders")}
            aria-label="back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-sm text-gray-500 mt-1">#{order.orderNumber || order._id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm">Export</button>
          <button className="px-4 py-2 border rounded-full text-sm">Edit</button>
        </div>
      </div>

      {/* White card wrapper */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-lg mb-4">Order Information</h2>

        {/* top cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <InfoCard
            title="Order Date"
            value={formatDate(order.createdAt)}
            className="bg-teal-100"
          />
          <InfoCard
            title="Total Items"
            value={`${order.orderItems?.reduce((s, it) => s + (it.quantity || 0), 0)} pcs`}
            className="bg-pink-100"
          />
          <InfoCard
            title="Delivery Date"
            value={formatDate(order.expectedDelivery || order.deliveredAt || order.createdAt)}
            className="bg-green-100"
          />
        </div>

        {/* main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: items table (span 2) */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg border">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {order.orderItems?.map((it) => (
                    <tr key={it._id || it.product?._id}>
                      <td className="px-6 py-4 whitespace-nowrap flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                          <img
                            src={it.product?.images?.[0] || "/placeholder.png"}
                            alt={it.product?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{it.product?.name || it.product?.title}</div>
                          <div className="text-xs text-gray-400">ID: {it.product?._id?.slice(-6) || it._id?.slice(-6)}</div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Cloth</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {it.quantity}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ₹{(it.price || 0).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => cancelItemMutation.mutate({ itemId: it._id || it.product?._id })}
                          className="px-3 py-1 border rounded-full text-sm text-red-500 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: summary card */}
          <aside>
            <div className="rounded-lg p-6 bg-yellow-50 border">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Sub-Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (10%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>- ₹{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipment</span>
                  <span>₹{(order.shippingFee || 0).toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t mt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{(total + (order.shippingFee || 0)).toFixed(2)}</span>
                </div>

                <button className="mt-4 w-full bg-white rounded-md py-2 flex items-center justify-between px-4 shadow">
                  <span>Pay with PayPal</span>
                  <img src="/paypal.png" alt="paypal" className="h-6" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Customer Information</h3>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
            <img src={order.user?.avatar || "/avatar-placeholder.png"} alt="avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-medium text-lg">{order.user?.name}</div>
            <div className="text-sm text-gray-500 mt-1">{order.user?.email}</div>
            <div className="text-sm text-gray-500 mt-1">{order.shippingAddress?.phone}</div>
            <div className="text-sm text-gray-500 mt-1">
              {order.shippingAddress?.addressLine}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </div>
          </div>
        </div>
      </div>

      {/* Tracking / Timeline */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Order Tracking</h3>

        <div className="space-y-6">
          {order.statusHistory?.length ? (
            <ol className="relative border-l border-gray-200 pl-6">
              {order.statusHistory.map((s, idx) => (
                <li key={idx} className="mb-6 ml-4">
                  <div className="absolute -left-3 mt-1.5 bg-white rounded-full border p-0.5">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-sm font-semibold">{s.status}</div>
                  <div className="text-xs text-gray-500">{formatDateTime(s.timestamp)}</div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-sm text-gray-500">No updates yet</div>
          )}
        </div>
      </div>

      {/* Bottom actions: change status */}
      <div className="flex items-center gap-4">
        <select
          defaultValue={order.orderStatus}
          onChange={(e) => updateStatusMutation.mutate({ status: e.target.value })}
          className="px-4 py-2 border rounded"
        >
          <option>Processing</option>
          <option>Packed</option>
          <option>Shipped</option>
          <option>Out For Delivery</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>

        {updateStatusMutation.isLoading ? (
          <button className="px-4 py-2 bg-gray-200 rounded">Updating...</button>
        ) : (
          <button onClick={() => queryClient.invalidateQueries(["order", id])} className="px-4 py-2 bg-blue-600 text-white rounded">
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}
