'use client';

import { useState, useEffect } from 'react';
import { 
    MdMessage, MdNotificationsActive, MdEmail, MdSend, 
    MdSmartphone, MdBarChart, MdPeople, MdAdd, MdTrackChanges, MdHourglassEmpty
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

// ─── Base Input Style ─────────────────────────────────────────────────────────
const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

// ─── Section Header Component ─────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }) {
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div className="flex items-center justify-center rounded-lg shrink-0"
                style={{ width: 40, height: 40, backgroundColor: C.iconBg }}>
                <Icon style={{ width: 16, height: 16, color: C.iconColor }} />
            </div>
            <h2 style={{
                fontFamily: T.fontFamily, fontSize: T.size.xl,
                fontWeight: T.weight.semibold, color: C.heading, margin: 0
            }}>
                {title}
            </h2>
        </div>
    );
}

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
        const baseBadgeStyle = {
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '10px',
            fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold,
            textTransform: 'uppercase', letterSpacing: T.tracking.wider
        };
        
        if(type === 'email') return <span style={{ ...baseBadgeStyle, backgroundColor: C.innerBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}` }}><MdEmail size={12}/> Email</span>;
        if(type === 'sms') return <span style={{ ...baseBadgeStyle, backgroundColor: C.warningBg, color: C.warning, border: `1px solid ${C.warningBorder}` }}><MdSmartphone size={12}/> SMS</span>;
        if(type === 'whatsapp') return <span style={{ ...baseBadgeStyle, backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` }}><MdMessage size={12}/> WhatsApp</span>;
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading communication data...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdMessage style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Global Communication
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Broadcast in-app announcements and manage marketing campaigns.
                        </p>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard icon={MdTrackChanges} value={kpis.totalCampaigns} label="Total Campaigns" iconBg="#EEF2FF" iconColor="#4F46E5" />
                <StatCard icon={MdSend} value={kpis.totalSent.toLocaleString()} label="Messages Sent" iconBg="#EBF8FF" iconColor="#3182CE" />
                <StatCard icon={MdBarChart} value={`${kpis.avgOpenRate}%`} label="Avg Open Rate" iconBg="#F4F0FD" iconColor="#6B4DF1" />
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-1.5 w-full md:w-max overflow-x-auto" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                {[
                    { key: 'announcement', label: 'In-App Announcement', icon: MdNotificationsActive },
                    { key: 'campaign', label: 'New Campaign', icon: MdAdd },
                    { key: 'campaigns_list', label: 'Campaign History', icon: MdEmail }
                ].map(tab => {
                    const isActive = activeTab === tab.key;
                    const Icon = tab.icon;
                    return (
                        <button 
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)} 
                            className="flex items-center gap-2 transition-all whitespace-nowrap border-none cursor-pointer"
                            style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                backgroundColor: isActive ? C.innerBg : 'transparent',
                                color: isActive ? C.btnPrimary : C.textFaint
                            }}
                        >
                            <Icon style={{ width: 16, height: 16 }} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Main Workspace */}
            <div className="overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                {/* ── 1. In-App Announcement ── */}
                {activeTab === 'announcement' && (
                    <div className="p-8 max-w-3xl animate-in fade-in duration-500">
                        <SectionHeader icon={MdNotificationsActive} title="Broadcast Alert" />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginBottom: '24px', marginTop: '-8px', marginLeft: '50px' }}>
                            Send a push notification directly to the user's dashboard bell icon.
                        </p>

                        <form onSubmit={handleSendAnnouncement} className="space-y-6">
                            <div>
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '8px' }}>
                                    Target Audience
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {['all', 'students', 'tutors'].map((aud) => (
                                        <label 
                                            key={aud} 
                                            className="flex items-center justify-center gap-2 transition-colors"
                                            style={{
                                                padding: '12px',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.base,
                                                fontWeight: T.weight.bold,
                                                backgroundColor: announceData.targetAudience === aud ? C.innerBg : C.cardBg,
                                                border: `1px solid ${announceData.targetAudience === aud ? C.btnPrimary : C.cardBorder}`,
                                                color: announceData.targetAudience === aud ? C.btnPrimary : C.textFaint
                                            }}
                                        >
                                            <input type="radio" name="audience" value={aud} checked={announceData.targetAudience === aud} onChange={(e) => setAnnounceData({...announceData, targetAudience: e.target.value})} className="hidden"/>
                                            <MdPeople style={{ width: 18, height: 18 }} /> {aud.charAt(0).toUpperCase() + aud.slice(1)}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '8px' }}>
                                    Alert Title
                                </label>
                                <input type="text" required value={announceData.title} onChange={e => setAnnounceData({...announceData, title: e.target.value})} placeholder="e.g. Scheduled Maintenance Notice" style={baseInputStyle} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '8px' }}>
                                    Message Body
                                </label>
                                <textarea required value={announceData.message} onChange={e => setAnnounceData({...announceData, message: e.target.value})} placeholder="Type your announcement here..." style={{ ...baseInputStyle, minHeight: '120px', resize: 'none' }} />
                            </div>
                            <button 
                                type="submit" 
                                disabled={sending} 
                                className="flex items-center gap-2 transition-opacity"
                                style={{
                                    background: sending ? C.cardBorder : C.gradientBtn,
                                    color: '#ffffff',
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    fontWeight: T.weight.bold,
                                    borderRadius: '10px',
                                    border: 'none',
                                    padding: '12px 32px',
                                    cursor: sending ? 'not-allowed' : 'pointer',
                                    boxShadow: sending ? 'none' : S.btn
                                }}
                            >
                                {sending ? <MdHourglassEmpty style={{ width: 18, height: 18 }} className="animate-spin" /> : <MdSend style={{ width: 18, height: 18 }} />} 
                                Push Notification
                            </button>
                        </form>
                    </div>
                )}

                {/* ── 2. Create Campaign ── */}
                {activeTab === 'campaign' && (
                    <div className="p-8 max-w-3xl animate-in fade-in duration-500">
                        <SectionHeader icon={MdEmail} title="Setup External Campaign" />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginBottom: '24px', marginTop: '-8px', marginLeft: '50px' }}>
                            Draft emails or SMS to be sent to leads and registered users.
                        </p>

                        <form onSubmit={handleCreateCampaign} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '8px' }}>
                                        Campaign Title
                                    </label>
                                    <input type="text" required value={campaignData.title} onChange={e => setCampaignData({...campaignData, title: e.target.value})} placeholder="e.g. Diwali Mega Sale 50% Off" style={baseInputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '8px' }}>
                                        Channel
                                    </label>
                                    <select value={campaignData.type} onChange={e => setCampaignData({...campaignData, type: e.target.value})} style={baseInputStyle}>
                                        <option value="email">📧 Email Blast</option>
                                        <option value="sms">📱 SMS Alert</option>
                                        <option value="whatsapp">💬 WhatsApp Message</option>
                                    </select>
                                </div>
                            </div>

                            {campaignData.type === 'email' && (
                                <div>
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '8px' }}>
                                        Email Subject Line
                                    </label>
                                    <input type="text" required value={campaignData.subject} onChange={e => setCampaignData({...campaignData, subject: e.target.value})} placeholder="Don't miss out on this offer!" style={baseInputStyle} />
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '8px' }}>
                                    Message Body
                                </label>
                                <textarea required value={campaignData.body} onChange={e => setCampaignData({...campaignData, body: e.target.value})} placeholder="Hello {{name}}, we have a special offer for you..." style={{ ...baseInputStyle, minHeight: '160px', resize: 'none', fontFamily: T.fontFamilyMono }} />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <button 
                                    type="submit" 
                                    disabled={sending} 
                                    onClick={() => setCampaignData({...campaignData, status: 'scheduled'})} 
                                    className="flex items-center gap-2 transition-opacity"
                                    style={{
                                        background: sending ? C.cardBorder : C.gradientBtn,
                                        color: '#ffffff',
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.base,
                                        fontWeight: T.weight.bold,
                                        borderRadius: '10px',
                                        border: 'none',
                                        padding: '12px 24px',
                                        cursor: sending ? 'not-allowed' : 'pointer',
                                        boxShadow: sending ? 'none' : S.btn
                                    }}
                                >
                                    {sending ? <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin"/> : <MdSend style={{ width: 16, height: 16 }}/>} 
                                    Schedule & Send
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={sending} 
                                    onClick={() => setCampaignData({...campaignData, status: 'draft'})} 
                                    className="transition-colors"
                                    style={{
                                        backgroundColor: C.btnViewAllBg,
                                        color: C.btnViewAllText,
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.base,
                                        fontWeight: T.weight.bold,
                                        borderRadius: '10px',
                                        border: `1px solid ${C.cardBorder}`,
                                        padding: '12px 24px',
                                        cursor: sending ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Save as Draft
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── 3. Campaign History Table ── */}
                {activeTab === 'campaigns_list' && (
                    <div className="overflow-x-auto animate-in fade-in duration-500 min-h-[400px]">
                        {campaigns.length === 0 ? (
                            <div className="p-14 text-center border border-dashed m-8" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                    <MdEmail style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                </div>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No campaigns found</h3>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>You haven't created any campaigns yet.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead style={{ backgroundColor: C.innerBg }}>
                                    <tr>
                                        {['Campaign Name', 'Channel', 'Sent Count', 'Opened', 'Status'].map((header, idx) => (
                                            <th key={idx} style={{
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.xs,
                                                fontWeight: T.weight.bold,
                                                color: C.statLabel,
                                                textTransform: 'uppercase',
                                                letterSpacing: T.tracking.wider,
                                                padding: '16px 24px',
                                                borderBottom: `1px solid ${C.cardBorder}`
                                            }}>
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((camp) => (
                                        <tr key={camp._id} className="transition-colors"
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                            style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                        >
                                            <td className="px-6 py-4">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{camp.title}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 4 }}>By {camp.createdBy?.name || 'Admin'}</p>
                                            </td>
                                            <td className="px-6 py-4">{getCampaignBadge(camp.type)}</td>
                                            <td className="px-6 py-4" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading }}>
                                                {camp.totalSent.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.success }}>
                                                {camp.totalOpened.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                                    ...(camp.status === 'sent' ? { backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` } :
                                                       camp.status === 'draft' ? { backgroundColor: C.innerBg, color: C.textMuted, border: `1px solid ${C.cardBorder}` } :
                                                       { backgroundColor: C.warningBg, color: C.warning, border: `1px solid ${C.warningBorder}` })
                                                }}>
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