'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, MessageSquare, BellRing, Mail, Send, 
    Smartphone, BarChart3, Users, Plus, Target
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminCommunicationPage() {
    const [activeTab, setActiveTab] = useState('announcement');
    const [campaigns, setCampaigns] = useState([]);
    const [kpis, setKpis] = useState({ totalCampaigns: 0, totalSent: 0, avgOpenRate: 0 });
    const [loading, setLoading] = useState(true);
    const [sending, setSaving] = useState(false);

    // Announcement State
    const [announceData, setAnnounceData] = useState({
        targetAudience: 'all',
        title: '',
        message: ''
    });

    // Campaign State
    const [campaignData, setCampaignData] = useState({
        title: '',
        type: 'email',
        subject: '',
        body: '',
        status: 'draft'
    });

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/superadmin/communication');
            if (res.data.success) {
                setCampaigns(res.data.data.campaigns);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load communication data');
        } finally {
            setLoading(false);
        }
    };

    const handleSendAnnouncement = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.post('/superadmin/communication/announcement', announceData);
            if (res.data.success) {
                toast.success(res.data.message);
                setAnnounceData({ targetAudience: 'all', title: '', message: '' });
            }
        } catch (error) {
            toast.error('Failed to send announcement');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.post('/superadmin/communication/campaign', campaignData);
            if (res.data.success) {
                toast.success(res.data.message);
                setCampaignData({ title: '', type: 'email', subject: '', body: '', status: 'draft' });
                fetchData(); // Refresh table
                setActiveTab('campaigns_list');
            }
        } catch (error) {
            toast.error('Failed to create campaign');
        } finally {
            setSaving(false);
        }
    };

    const getCampaignBadge = (type) => {
        if(type === 'email') return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold uppercase"><Mail size={12}/> Email</span>;
        if(type === 'sms') return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-md text-[11px] font-bold uppercase"><Smartphone size={12}/> SMS</span>;
        if(type === 'whatsapp') return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[11px] font-bold uppercase"><MessageSquare size={12}/> WhatsApp</span>;
        return null;
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-[#F4EEFD]"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>;

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <MessageSquare className="w-6 h-6 text-[#6B4DF1]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">Global Communication</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Broadcast in-app announcements and manage marketing campaigns.</p>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center"><Target size={24}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0 mb-1">Total Campaigns</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{kpis.totalCampaigns}</h3></div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#EBF8FF] text-[#3182CE] flex items-center justify-center"><Send size={24}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0 mb-1">Messages Sent</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{kpis.totalSent.toLocaleString()}</h3></div>
                </div>
                <div className="bg-[#27225B] rounded-2xl p-5 border border-[#1e1a48] shadow-lg relative overflow-hidden flex items-center gap-4">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-[#6B4DF1] opacity-20 rounded-bl-full blur-xl"></div>
                    <div className="w-12 h-12 rounded-xl bg-[#6B4DF1]/20 text-white flex items-center justify-center relative z-10"><BarChart3 size={24}/></div>
                    <div className="relative z-10"><p className="text-[11px] font-bold text-[#A0ABC0] uppercase m-0 mb-1">Avg Open Rate</p><h3 className="text-[24px] font-black text-white m-0">{kpis.avgOpenRate}%</h3></div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-white p-1.5 rounded-2xl border border-[#E9DFFC] w-full md:w-max shadow-sm">
                <button onClick={() => setActiveTab('announcement')} className={`flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold rounded-xl transition-all border-none cursor-pointer ${activeTab === 'announcement' ? 'bg-[#F4F0FD] text-[#6B4DF1]' : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'}`}>
                    <BellRing size={16}/> In-App Announcement
                </button>
                <button onClick={() => setActiveTab('campaign')} className={`flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold rounded-xl transition-all border-none cursor-pointer ${activeTab === 'campaign' ? 'bg-[#F4F0FD] text-[#6B4DF1]' : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'}`}>
                    <Plus size={16}/> New Campaign
                </button>
                <button onClick={() => setActiveTab('campaigns_list')} className={`flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold rounded-xl transition-all border-none cursor-pointer ${activeTab === 'campaigns_list' ? 'bg-[#F4F0FD] text-[#6B4DF1]' : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'}`}>
                    <Mail size={16}/> Campaign History
                </button>
            </div>

            {/* Main Workspace */}
            <div className="bg-white rounded-[24px] border border-[#E9DFFC] overflow-hidden" style={{ boxShadow: softShadow }}>
                
                {/* ── 1. In-App Announcement ── */}
                {activeTab === 'announcement' && (
                    <div className="p-8 animate-in fade-in max-w-3xl">
                        <div className="mb-6">
                            <h2 className="text-[18px] font-black text-[#27225B] flex items-center gap-2 m-0"><BellRing className="text-[#6B4DF1]"/> Broadcast Alert</h2>
                            <p className="text-[13px] text-[#7D8DA6] font-medium mt-1 m-0">Send a push notification directly to the user's dashboard bell icon.</p>
                        </div>

                        <form onSubmit={handleSendAnnouncement} className="space-y-5">
                            <div>
                                <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">Target Audience</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {['all', 'students', 'tutors'].map((aud) => (
                                        <label key={aud} className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-[13px] transition-colors ${announceData.targetAudience === aud ? 'bg-[#F4F0FD] border-[#6B4DF1] text-[#6B4DF1]' : 'bg-white border-[#E9DFFC] text-[#7D8DA6] hover:bg-gray-50'}`}>
                                            <input type="radio" name="audience" value={aud} checked={announceData.targetAudience === aud} onChange={(e) => setAnnounceData({...announceData, targetAudience: e.target.value})} className="hidden"/>
                                            <Users size={16}/> {aud.charAt(0).toUpperCase() + aud.slice(1)}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">Alert Title</label>
                                <input type="text" required value={announceData.title} onChange={e => setAnnounceData({...announceData, title: e.target.value})} placeholder="e.g. Scheduled Maintenance Notice" className="w-full px-4 py-3 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1]" />
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">Message Body</label>
                                <textarea required value={announceData.message} onChange={e => setAnnounceData({...announceData, message: e.target.value})} placeholder="Type your announcement here..." className="w-full px-4 py-3 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] min-h-[120px] resize-none" />
                            </div>
                            <button type="submit" disabled={sending} className="flex items-center gap-2 px-8 py-3 bg-[#6B4DF1] hover:bg-[#5839D6] text-white text-[14px] font-bold rounded-xl transition-all shadow-md disabled:opacity-60 border-none cursor-pointer">
                                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Push Notification
                            </button>
                        </form>
                    </div>
                )}

                {/* ── 2. Create Campaign ── */}
                {activeTab === 'campaign' && (
                    <div className="p-8 animate-in fade-in max-w-3xl">
                        <div className="mb-6">
                            <h2 className="text-[18px] font-black text-[#27225B] flex items-center gap-2 m-0"><Mail className="text-[#6B4DF1]"/> Setup External Campaign</h2>
                            <p className="text-[13px] text-[#7D8DA6] font-medium mt-1 m-0">Draft emails or SMS to be sent to leads and registered users.</p>
                        </div>

                        <form onSubmit={handleCreateCampaign} className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">Campaign Title</label>
                                    <input type="text" required value={campaignData.title} onChange={e => setCampaignData({...campaignData, title: e.target.value})} placeholder="e.g. Diwali Mega Sale 50% Off" className="w-full px-4 py-3 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1]" />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">Channel</label>
                                    <select value={campaignData.type} onChange={e => setCampaignData({...campaignData, type: e.target.value})} className="w-full px-4 py-3 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl text-[13px] font-bold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] outline-none">
                                        <option value="email">📧 Email Blast</option>
                                        <option value="sms">📱 SMS Alert</option>
                                        <option value="whatsapp">💬 WhatsApp Message</option>
                                    </select>
                                </div>
                            </div>

                            {campaignData.type === 'email' && (
                                <div>
                                    <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">Email Subject Line</label>
                                    <input type="text" required value={campaignData.subject} onChange={e => setCampaignData({...campaignData, subject: e.target.value})} placeholder="Don't miss out on this offer!" className="w-full px-4 py-3 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1]" />
                                </div>
                            )}

                            <div>
                                <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">Message Body</label>
                                <textarea required value={campaignData.body} onChange={e => setCampaignData({...campaignData, body: e.target.value})} placeholder="Hello {{name}}, we have a special offer for you..." className="w-full px-4 py-3 bg-[#F9F7FC] border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] min-h-[160px] resize-none font-mono" />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button type="submit" disabled={sending} onClick={() => setCampaignData({...campaignData, status: 'scheduled'})} className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white text-[13px] font-bold rounded-xl transition-all shadow-md disabled:opacity-60 border-none cursor-pointer flex items-center gap-2">
                                    {sending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Schedule & Send
                                </button>
                                <button type="submit" disabled={sending} onClick={() => setCampaignData({...campaignData, status: 'draft'})} className="px-6 py-3 bg-white border border-[#E9DFFC] text-[#27225B] hover:bg-[#F9F7FC] text-[13px] font-bold rounded-xl transition-all disabled:opacity-60 cursor-pointer">
                                    Save as Draft
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── 3. Campaign History Table ── */}
                {activeTab === 'campaigns_list' && (
                    <div className="overflow-x-auto animate-in fade-in">
                        {campaigns.length === 0 ? (
                            <div className="p-16 text-center">
                                <Mail className="w-14 h-14 text-[#D1C4F9] mx-auto mb-4" />
                                <h3 className="text-[18px] font-black text-[#27225B] m-0">No campaigns found</h3>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#FDFBFF] border-b border-[#F4F0FD]">
                                    <tr>
                                        <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Campaign Name</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Channel</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Sent Count</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Opened</th>
                                        <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F4F0FD]">
                                    {campaigns.map((camp) => (
                                        <tr key={camp._id} className="hover:bg-[#F9F7FC] transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-[14px] font-bold text-[#27225B] m-0">{camp.title}</p>
                                                <p className="text-[11px] font-medium text-[#7D8DA6] m-0 mt-0.5">By {camp.createdBy?.name || 'Admin'}</p>
                                            </td>
                                            <td className="px-6 py-4">{getCampaignBadge(camp.type)}</td>
                                            <td className="px-6 py-4 text-[14px] font-black text-[#27225B]">{camp.totalSent.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-[14px] font-bold text-[#10B981]">{camp.totalOpened.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${camp.status === 'sent' ? 'bg-[#ECFDF5] text-[#10B981]' : camp.status === 'draft' ? 'bg-[#F8F6FC] text-[#7D8DA6]' : 'bg-[#FFF7ED] text-[#EA580C]'}`}>
                                                    {camp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}