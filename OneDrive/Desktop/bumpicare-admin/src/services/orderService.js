
import api from "./api";

export const fetchOrder = async (id) => {
  const res = await api.get(`/admin/orders/${id}`);
  // backend response: { success: true, order } or { success: true, data }
  // handle both shapes:
  return res.data.order || res.data.data || res.data;
};

export const updateOrderStatus = async (id, body) => {
  const res = await api.put(`/admin/orders/${id}/status`, body);
  return res.data;
};

export const cancelOrder = async (id) => {
  const res = await api.put(`/admin/order/${orderId}/cancel`);
  return res.data;
};

export const cancelOrderItem = async (orderId, itemId) => {
  // We earlier suggested PATCH /admin/orders/:id/cancel-item — backend may differ.
  // If backend route is different, change accordingly.
  const res = await api.patch(`/admin/orders/${orderId}/cancel-item`, { itemId });
  return res.data;
};
