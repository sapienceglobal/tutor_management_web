import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, MapPin, Heart, ShoppingBag } from 'lucide-react';

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch user details
  const { data, isLoading } = useQuery({
    queryKey: ['userDetails', id],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${id}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { user, orders } = data;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
          <p className="text-gray-500 mt-1">View user information and activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary-100 text-primary-700 text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <Badge className="mt-2">{user.role}</Badge>
                <p className="text-sm text-gray-500 mt-2">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-6 space-y-3 border-t pt-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{user.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary-600" />
                  <span className="text-sm text-gray-600">Total Orders</span>
                </div>
                <span className="font-bold text-lg">{orders.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-gray-600">Wishlist Items</span>
                </div>
                <span className="font-bold text-lg">{user.wishlist?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">Saved Addresses</span>
                </div>
                <span className="font-bold text-lg">{user.address?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          {user.address && user.address.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Saved Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.address.map((addr, index) => (
                    <div key={addr._id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium text-gray-900">{addr.fullName}</p>
                      <p className="text-gray-600 mt-1">{addr.addressLine}</p>
                      <p className="text-gray-600">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-gray-500 mt-1">📞 {addr.phone}</p>
                      {addr.selected && (
                        <Badge variant="outline" className="mt-2">
                          Default
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
                      onClick={() => navigate(`/orders/${order._id}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-mono text-sm font-medium">
                            #{order._id.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            order.orderStatus === 'Delivered'
                              ? 'bg-green-100 text-green-700'
                              : order.orderStatus === 'Processing'
                              ? 'bg-blue-100 text-blue-700'
                              : order.orderStatus === 'Shipped'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-red-100 text-red-700'
                          }
                        >
                          {order.orderStatus}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        {order.orderItems.slice(0, 3).map((item, idx) => (
                          <img
                            key={idx}
                            src={item.product?.images?.[0]}
                            alt=""
                            className="w-12 h-12 object-cover rounded"
                          />
                        ))}
                        {order.orderItems.length > 3 && (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-600">
                            +{order.orderItems.length - 3}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {order.orderItems.length} item(s)
                        </span>
                        <span className="font-bold text-primary-600">
                          ₹{order.totalAmount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}