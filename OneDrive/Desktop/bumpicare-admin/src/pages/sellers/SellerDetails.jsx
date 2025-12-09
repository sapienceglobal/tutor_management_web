import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import { Button } from '@/components/ui/button';
import AssignProductsModal from '../../components/AssignProductsModal';

export default function SellerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['seller', id],
    queryFn: () => sellerService.getById(id),
  });

  if (isLoading) return <div>Loading...</div>;
  const s = data?.seller;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{s.shopName}</h2>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/sellers/${id}/edit`)}>Edit</Button>
          <Button onClick={() => setAssignOpen(true)}>Assign Products</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow grid grid-cols-3 gap-4">
        <div>
          <img src={s.shopLogo || '/mnt/data/cf9e8182-5a2d-4efd-a7c2-b1a241be91a5.png'} alt="logo" className="w-48 h-48 object-cover rounded" />
        </div>
        <div className="col-span-2">
          <div><strong>Contact:</strong> {s.name} — {s.email} / {s.phone}</div>
          <div className="mt-2"><strong>Address:</strong> {s.address?.street}, {s.address?.city}</div>
          <div className="mt-2"><strong>GST:</strong> {s.gstNumber} <strong className="ml-4">PAN:</strong> {s.panNumber}</div>
          <div className="mt-2"><strong>Status:</strong> {s.status}</div>
        </div>
      </div>

      <AssignProductsModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        seller={s}
        onAssigned={() => {
          setAssignOpen(false);
          queryClient.invalidateQueries(['seller', id]);
        }}
      />
    </div>
  );
}
