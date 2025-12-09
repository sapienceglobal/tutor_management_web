import { useEffect, useState } from "react";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";

export default function WithdrawalDetail() {
  // Get ID from URL - implement based on your routing
  const id = null; // Replace with useParams
  
  const [withdrawal, setWithdrawal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadWithdrawal();
    }
  }, [id]);

  const loadWithdrawal = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/withdrawals/${id}`);
      setWithdrawal(res.data.data);
    } catch (err) {
      console.error('Failed to load withdrawal:', err);
      setError('Failed to load withdrawal details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async () => {
    const transactionId = prompt('Enter transaction ID for payout:');
    if (!transactionId) return;

    try {
      await api.patch(`/admin/withdrawals/${id}/payout`, { transactionId });
      alert('Payout processed successfully!');
      loadWithdrawal();
    } catch (err) {
      console.error('Payout error:', err);
      alert(err.response?.data?.message || 'Failed to process payout');
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Approved': 'bg-green-100 text-green-700',
      'Completed': 'bg-blue-100 text-blue-700',
      'Rejected': 'bg-red-100 text-red-700',
      'Processing': 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !withdrawal) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Withdrawal not found'}</AlertDescription>
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
            <h1 className="text-2xl font-bold text-gray-900">Details</h1>
          </div>
          <Button
            onClick={handlePayout}
            className="bg-teal-600 hover:bg-teal-700 text-white"
            disabled={withdrawal.paymentStatus === 'Completed' || withdrawal.paymentStatus === 'Rejected'}
          >
            Payout
          </Button>
        </div>

        {/* Withdrawal Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Withdraws Information</h2>
            {getStatusBadge(withdrawal.paymentStatus)}
          </div>

          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900">
              #{withdrawal.withdrawalId || withdrawal._id.slice(-6).toUpperCase()}
            </h3>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 bg-cyan-50 rounded-2xl">
              <p className="text-sm text-gray-600 mb-2">Requested Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ${withdrawal.requestedAmount.toLocaleString()}
              </p>
            </div>

            <div className="p-6 bg-yellow-50 rounded-2xl">
              <p className="text-sm text-gray-600 mb-2">Payment Method</p>
              <p className="text-xl font-bold text-gray-900">
                {withdrawal.paymentMethod}
              </p>
            </div>

            <div className="p-6 bg-orange-50 rounded-2xl">
              <p className="text-sm text-gray-600 mb-2">Requested Date</p>
              <p className="text-xl font-bold text-gray-900">
                {formatDate(withdrawal.requestedDate)}
              </p>
            </div>

            <div className="p-6 bg-green-50 rounded-2xl">
              <p className="text-sm text-gray-600 mb-2">Payout Date</p>
              <p className="text-xl font-bold text-gray-900">
                {withdrawal.payoutDate ? formatDate(withdrawal.payoutDate) : '—'}
              </p>
            </div>
          </div>

          {/* Note */}
          {withdrawal.note && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Note</p>
              <p className="text-sm text-gray-600">
                {withdrawal.note}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {withdrawal.rejectionReason && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-700 mb-2">Rejection Reason</p>
              <p className="text-sm text-red-600">
                {withdrawal.rejectionReason}
              </p>
            </div>
          )}

          {/* Transaction Details */}
          {withdrawal.transactionId && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Transaction ID</p>
              <p className="text-sm font-mono text-gray-900">
                {withdrawal.transactionId}
              </p>
            </div>
          )}
        </div>

        {/* Seller Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Withdraws By</h2>

          {withdrawal.seller ? (
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-500">
                    {withdrawal.seller.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-3">
                <h3 className="text-xl font-bold text-gray-900">
                  {withdrawal.seller.name}
                </h3>

                <div className="flex flex-wrap gap-6">
                  {withdrawal.seller.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {withdrawal.seller.email}
                      </span>
                    </div>
                  )}

                  {withdrawal.seller.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {withdrawal.seller.phone}
                      </span>
                    </div>
                  )}

                  {withdrawal.seller.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {typeof withdrawal.seller.address === 'string' 
                          ? withdrawal.seller.address 
                          : `${withdrawal.seller.address.city || ''}, ${withdrawal.seller.address.state || ''}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Seller information not available</p>
          )}
        </div>

        {/* Bank Details (if Bank Transfer) */}
        {withdrawal.paymentMethod === 'Bank Transfer' && withdrawal.bankDetails && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Bank Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Account Name</p>
                <p className="text-base font-medium text-gray-900">
                  {withdrawal.bankDetails.accountName || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Account Number</p>
                <p className="text-base font-medium text-gray-900">
                  {withdrawal.bankDetails.accountNumber || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Bank Name</p>
                <p className="text-base font-medium text-gray-900">
                  {withdrawal.bankDetails.bankName || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">IFSC Code</p>
                <p className="text-base font-medium text-gray-900">
                  {withdrawal.bankDetails.ifscCode || '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* UPI Details */}
        {withdrawal.paymentMethod === 'UPI' && withdrawal.upiId && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">UPI Details</h2>
            <div>
              <p className="text-sm text-gray-600 mb-1">UPI ID</p>
              <p className="text-base font-medium text-gray-900">
                {withdrawal.upiId}
              </p>
            </div>
          </div>
        )}

        {/* PayPal Details */}
        {withdrawal.paymentMethod === 'PayPal' && withdrawal.paypalEmail && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">PayPal Details</h2>
            <div>
              <p className="text-sm text-gray-600 mb-1">PayPal Email</p>
              <p className="text-base font-medium text-gray-900">
                {withdrawal.paypalEmail}
              </p>
            </div>
          </div>
        )}

        {/* Status History */}
        {withdrawal.statusHistory && withdrawal.statusHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Status History</h2>
            <div className="space-y-4">
              {withdrawal.statusHistory.map((history, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {getStatusBadge(history.status)}
                      <span className="text-sm text-gray-500">
                        {formatDate(history.timestamp)}
                      </span>
                    </div>
                    {history.note && (
                      <p className="text-sm text-gray-600 mt-2">{history.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}