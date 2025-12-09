import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sellerService } from '../../services/sellerService';

export default function SellerForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    shopName: '',
    shopLogo: '',
    shopBanner: '',
    address: { street: '', city: '', state: '', country: '', pincode: '' },
    gstNumber: '',
    panNumber: '',
    commissionRate: 10,
    status: 'approved',
    isActive: true,
  });

  const { data } = useQuery({
    queryKey: ['seller', id],
    queryFn: () => sellerService.getById(id),
    enabled: isEdit,
    onSuccess: (res) => {
      setForm(res.seller);
    },
  });

  const addMut = useMutation({
    mutationFn: (payload) => sellerService.add(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['sellers']);
      navigate('/sellers');
    },
  });

  const updateMut = useMutation({
    mutationFn: (payload) => sellerService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['sellers']);
      navigate('/sellers');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEdit) updateMut.mutate(form);
    else addMut.mutate(form);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{isEdit ? 'Edit Seller' : 'Add Seller'}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <Label>Contact Person</Label>
          <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Shop Name</Label>
            <Input value={form.shopName || ''} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
        </div>

        <div>
          <Label>Phone</Label>
          <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div>
          <Label>Shop Logo URL</Label>
          <Input value={form.shopLogo || ''} onChange={(e) => setForm({ ...form, shopLogo: e.target.value })} placeholder="/mnt/data/cf9e8182-..." />
        </div>

        <div>
          <Label>Shop Banner URL</Label>
          <Input value={form.shopBanner || ''} onChange={(e) => setForm({ ...form, shopBanner: e.target.value })} placeholder="/mnt/data/16e3d29c-..." />
        </div>

        <div>
          <Label>Address</Label>
          <Textarea value={form.address?.street || ''} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} placeholder="Street" />
          <div className="grid grid-cols-4 gap-2 mt-2">
            <Input placeholder="City" value={form.address?.city || ''} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
            <Input placeholder="State" value={form.address?.state || ''} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
            <Input placeholder="Country" value={form.address?.country || ''} onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })} />
            <Input placeholder="Pincode" value={form.address?.pincode || ''} onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>GST Number</Label>
            <Input value={form.gstNumber || ''} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
          </div>
          <div>
            <Label>PAN Number</Label>
            <Input value={form.panNumber || ''} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => navigate('/sellers')}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Update Seller' : 'Create Seller'}</Button>
        </div>
      </form>
    </div>
  );
}
