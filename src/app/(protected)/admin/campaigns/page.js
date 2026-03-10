'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import {
    Mail, MessageSquare, Send, Plus, Loader2, Users, BarChart3,
    CheckCircle2, XCircle, Clock, Eye
} from 'lucide-react';

export default function AdminCampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [sending, setSending] = useState(null); // campaignId being sent

    const [form, setForm] = useState({
        title: '', type: 'email', subject: '', body: '',
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => { fetchCampaigns(); }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/crm/campaigns');
            if (res.data.success) setCampaigns(res.data.data);
        } catch (err) {
            console.error('Fetch campaigns error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title || !form.body) { toast.error('Title and body are required'); return; }
        setCreating(true);
        try {
            const res = await api.post('/crm/campaigns', form);
            if (res.data.success) {
                setCampaigns(prev => [res.data.data, ...prev]);
                setShowCreate(false);
                setForm({ title: '', type: 'email', subject: '', body: '' });
                toast.success('Campaign created!');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create campaign');
        } finally {
            setCreating(false);
        }
    };

    const handleSend = async (campaignId) => {
        setSending(campaignId);
        try {
            const res = await api.post(`/crm/campaigns/${campaignId}/send`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchCampaigns();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send campaign');
        } finally {
            setSending(null);
        }
    };

    const statusBadge = (status) => {
        const styles = {
            draft: 'bg-slate-100 text-slate-700',
            scheduled: 'bg-blue-100 text-blue-700',
            sent: 'bg-green-100 text-green-700',
            failed: 'bg-red-100 text-red-700',
        };
        const icons = {
            draft: <Clock className="h-3 w-3 mr-1" />,
            sent: <CheckCircle2 className="h-3 w-3 mr-1" />,
            failed: <XCircle className="h-3 w-3 mr-1" />,
        };
        return (
            <Badge className={`${styles[status] || styles.draft} text-xs font-semibold flex items-center gap-0`}>
                {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const typeIcon = (type) => {
        if (type === 'sms') return <MessageSquare className="h-4 w-4 text-green-500" />;
        if (type === 'whatsapp') return <MessageSquare className="h-4 w-4 text-emerald-500" />;
        return <Mail className="h-4 w-4 text-indigo-500" />;
    };

    return (
        <div className="max-w-[1400px] mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Campaigns</h1>
                    <p className="text-slate-500 mt-1">Manage email, SMS and WhatsApp marketing campaigns</p>
                </div>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
                    onClick={() => setShowCreate(!showCreate)}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                </Button>
            </div>

            {/* Create Campaign Form */}
            {showCreate && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 mb-8 animate-in fade-in slide-in-from-top-2">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Create Campaign</h2>
                    <form onSubmit={handleCreate} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label>Campaign Title</Label>
                                <Input placeholder="e.g. New Course Launch" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <select
                                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                >
                                    <option value="email">📧 Email</option>
                                    <option value="sms">💬 SMS</option>
                                    <option value="whatsapp">📱 WhatsApp</option>
                                </select>
                            </div>
                        </div>
                        {form.type === 'email' && (
                            <div className="space-y-2">
                                <Label>Subject Line</Label>
                                <Input placeholder="Email subject..." value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Message Body</Label>
                            <textarea
                                className="w-full min-h-[120px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="Write your campaign message... Use {{name}} for personalization"
                                value={form.body}
                                onChange={(e) => setForm({ ...form, body: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={creating}>
                                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                Create Campaign
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Campaign List */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
            ) : campaigns.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-slate-100">
                    <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">No campaigns yet</h3>
                    <p className="text-slate-400">Create your first marketing campaign to reach your leads.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {campaigns.map((c) => (
                        <div key={c._id} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        {typeIcon(c.type)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{c.body?.substring(0, 100)}...</p>
                                        <div className="flex items-center gap-4 mt-3">
                                            {statusBadge(c.status)}
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Users className="h-3 w-3" /> {c.recipients?.length || 0} recipients
                                            </span>
                                            {c.status === 'sent' && (
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <BarChart3 className="h-3 w-3" /> {c.totalSent} sent, {c.totalFailed} failed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {c.status === 'draft' && (
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                                            onClick={() => handleSend(c._id)}
                                            disabled={sending === c._id}
                                        >
                                            {sending === c._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                                            Send
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
