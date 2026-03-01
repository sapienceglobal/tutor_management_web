'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, CheckCircle2, XCircle, FileText, Paperclip } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';

export default function UserLeavesPage() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        reason: '',
        documentUrl: '',
    });

    useEffect(() => {
        fetchMyLeaves();
    }, []);

    const fetchMyLeaves = async () => {
        setLoading(true);
        try {
            const response = await api.get('/leaves/my');
            if (response.data.success) {
                setLeaves(response.data.leaves);
            }
        } catch (error) {
            console.error('Fetch leaves error:', error);
            toast.error('Failed to load leave history');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            toast.error('End date cannot be before start date');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: formData.reason,
                documents: formData.documentUrl ? [{ name: 'Supporting Document', url: formData.documentUrl, type: 'url' }] : [],
            };
            const response = await api.post('/leaves', payload);
            if (response.data.success) {
                toast.success('Leave application submitted!');
                setShowForm(false);
                setFormData({ startDate: '', endDate: '', reason: '', documentUrl: '' });
                fetchMyLeaves();
            }
        } catch (error) {
            console.error('Submit leave error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit leave');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
            case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
            default: return <Clock className="w-5 h-5 text-amber-600" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-amber-100 text-amber-800 border-amber-200';
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Leave Requests</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your absences and track approval status</p>
                </div>

                <Button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {showForm ? 'Cancel' : (
                        <><Plus className="w-4 h-4 mr-2" /> Apply for Leave</>
                    )}
                </Button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">New Leave Application</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">End Date</label>
                                <input
                                    type="date"
                                    required
                                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Reason for Leave</label>
                            <textarea
                                required
                                rows={4}
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Please provide specific details..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <Paperclip className="w-4 h-4 text-slate-400" />
                                Supporting Document URL (Optional)
                            </label>
                            <input
                                type="url"
                                value={formData.documentUrl}
                                onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                                placeholder="https://drive.google.com/... (medical cert, etc.)"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                            />
                            <p className="text-xs text-slate-400">Upload to Google Drive/Cloudinary and paste the link here</p>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : leaves.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No History</h3>
                    <p className="text-slate-500 mt-1">You haven't requested any leaves yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leaves.map((leave) => (
                        <div key={leave._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Applied on {new Date(leave.createdAt).toLocaleDateString()}</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusText(leave.status)}`}>
                                        {getStatusIcon(leave.status)}
                                        <span className="capitalize">{leave.status}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="text-sm font-medium">
                                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 text-slate-600">
                                    <div className="p-2 bg-slate-50 text-slate-400 rounded-lg shrink-0 mt-0.5">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm leading-relaxed line-clamp-3" title={leave.reason}>
                                        {leave.reason}
                                    </p>
                                </div>
                            </div>

                            {leave.adminComment && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Admin Response</p>
                                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        {leave.adminComment}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
