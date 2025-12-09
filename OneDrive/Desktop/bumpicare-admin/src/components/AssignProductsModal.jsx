import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { sellerService } from '../services/sellerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AssignProductsModal({ open, onClose, seller, onAssigned }) {
  const [selected, setSelected] = useState(new Set());
  const [q, setQ] = useState('');

  const { data, refetch } = useQuery({
    queryKey: ['products-search', q],
    queryFn: async () => {
      const res = await productService.getAll({ q, limit: 50 });
      return res;
    },
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      refetch();
    }
  }, [open]);

  const assignMut = useMutation({
    mutationFn: (productIds) => sellerService.assignProducts(seller._id, productIds),
    onSuccess: () => {
      onAssigned?.();
    },
  });

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded shadow-lg overflow-auto max-h-[80vh] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Assign Products to {seller?.shopName}</h3>
          <div className="flex gap-2">
            <Input placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} />
            <Button variant="ghost" onClick={() => refetch()}>Search</Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {(data?.data || []).map((p) => (
            <div key={p._id} className="flex items-center justify-between border-b p-2">
              <div className="flex items-center gap-3">
                <img src={p.coverPhoto || p.images?.[0] || '/mnt/data/cf9e8182-5a2d-4efd-a7c2-b1a241be91a5.png'} alt={p.name} className="w-12 h-12 rounded object-cover" />
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">₹{p.price}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggle(p._id)} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => assignMut.mutate(Array.from(selected))} disabled={selected.size === 0}>Assign {selected.size} Products</Button>
        </div>
      </div>
    </div>
  );
}
