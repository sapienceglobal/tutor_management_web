import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerService } from '../../services/sellerService';
import { productService } from '../../services/productService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AssignProductsModal from '../../components/AssignProductsModal';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit, Plus } from 'lucide-react';

export default function SellerList() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['sellers', q, page],
    queryFn: async () => {
      const params = {};
      if (q) params.q = q;
      params.page = page;
      const res = await sellerService.list(params);
      return res;
    },
    keepPreviousData: true,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => sellerService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries(['sellers']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => sellerService.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['sellers']),
  });

  const openAssign = (seller) => {
    setSelectedSeller(seller);
    setAssignOpen(true);
  };

  const toggleStatus = (seller) => {
    const next = seller.status === 'approved' ? 'suspended' : 'approved';
    statusMutation.mutate({ id: seller._id, status: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sellers</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Search sellers..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Button onClick={() => navigate('/sellers/new')}><Plus className="w-4 h-4 mr-2" /> Add Seller</Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Shop</th>
              <th className="p-3 text-left">Contact</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Products</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" className="p-6 text-center">Loading...</td></tr>
            ) : (data?.sellers || []).length === 0 ? (
              <tr><td colSpan="5" className="p-6 text-center">No sellers found</td></tr>
            ) : (
              (data.sellers || []).map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="p-3 flex items-center gap-3">
                    <img src={s.shopLogo || '/mnt/data/cf9e8182-5a2d-4efd-a7c2-b1a241be91a5.png'} alt="logo" className="w-12 h-12 rounded" />
                    <div>
                      <div className="font-medium">{s.shopName}</div>
                      <div className="text-xs text-gray-500">{s.name}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">{s.email}</div>
                    <div className="text-xs text-gray-500">{s.phone}</div>
                  </td>
                  <td className="p-3">
                    <Badge variant={s.status === 'approved' ? 'success' : s.status === 'pending' ? 'secondary' : 'destructive'}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="p-3">{s.reviewsCount ?? 0} reviews</td>
                  <td className="p-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/sellers/${s._id}/edit`)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openAssign(s)}>Assign Products</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(s._id)} disabled={deleteMutation.isLoading}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toggleStatus(s)} disabled={statusMutation.isLoading}>
                      {s.status === 'approved' ? 'Suspend' : 'Approve'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AssignProductsModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        seller={selectedSeller}
        onAssigned={() => {
          setAssignOpen(false);
          queryClient.invalidateQueries(['sellers']);
        }}
      />
    </div>
  );
}
