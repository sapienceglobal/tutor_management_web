'use client';

import { useState, useEffect } from 'react';
import { 
    MdHourglassEmpty, MdPhone, MdEmail, MdPerson, MdSearch, 
    MdFilterList, MdBusinessCenter, MdChevronRight, MdCalendarMonth, MdMoreHoriz 
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import LeadCaptureModal from '@/components/LeadCaptureModal';
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

// ─── Advanced Stage Definitions ───────────────────────────────────────────────
const PIPELINE_STAGES = [
    { id: 'new', label: 'New Lead', color: C.btnPrimary, bg: C.innerBg, border: C.cardBorder },
    { id: 'contacted', label: 'Contacted', color: C.chartLine, bg: C.innerBg, border: C.cardBorder },
    { id: 'qualified', label: 'Qualified', color: C.warning, bg: C.warningBg, border: C.warningBorder },
    { id: 'converted', label: 'Converted', color: C.success, bg: C.successBg, border: C.successBorder },
    { id: 'lost', label: 'Lost', color: C.danger, bg: C.dangerBg, border: C.dangerBorder }
];

export default function CRMDashboard() {
    const [leads, setLeads] = useState([]);
    const [counselors, setCounselors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCounselor, setFilterCounselor] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [leadsRes, counselorsRes] = await Promise.all([
                api.get('/crm/leads'),
                api.get('/crm/counselors')
            ]);

            if (leadsRes.data.success) setLeads(leadsRes.data.data);
            if (counselorsRes.data.success) setCounselors(counselorsRes.data.data);
        } catch (error) {
            console.error('Failed to load CRM data', error);
            toast.error('Failed to load CRM data');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (leadId, newStatus) => {
        try {
            const res = await api.put(`/crm/leads/${leadId}`, { status: newStatus });
            if (res.data.success) {
                setLeads(leads.map(l => l._id === leadId ? res.data.data : l));
                toast.success('Lead moved successfully');
            }
        } catch (error) {
            toast.error('Failed to update lead status');
        }
    };

    const handleCounselorAssign = async (leadId, counselorId) => {
        try {
            const res = await api.put(`/crm/leads/${leadId}`, { assignedCounselor: counselorId === 'unassigned' ? null : counselorId });
            if (res.data.success) {
                setLeads(leads.map(l => l._id === leadId ? res.data.data : l));
                toast.success('Counselor assigned');
            }
        } catch (error) {
            toast.error('Failed to assign counselor');
        }
    };

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCounselor = filterCounselor === 'all' ||
            (filterCounselor === 'unassigned' && !lead.assignedCounselor) ||
            (lead.assignedCounselor?._id === filterCounselor);
        return matchesSearch && matchesCounselor;
    });

    // Group leads by stage for Kanban
    const groupedLeads = PIPELINE_STAGES.map(stage => ({
        ...stage,
        leads: filteredLeads.filter(l => l.status === stage.id)
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading CRM data...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                        CRM Pipeline
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                        Track institute inquiries and convert prospects to active subscriptions.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <LeadCaptureModal triggerText="+ New Lead" />
                </div>
            </div>

            {/* ── KPI Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdBusinessCenter} 
                    value={filteredLeads.length} 
                    label="Total Leads" 
                    iconBg="#ECFDF5" 
                    iconColor="#10B981" 
                />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4" 
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                <div className="relative w-full xl:w-[400px]">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                    <input
                        type="text"
                        placeholder="Search by name, email or institute..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                    />
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                        <MdFilterList style={{ width: 16, height: 16 }} /> Filter by Representative:
                    </div>
                    <select 
                        value={filterCounselor} 
                        onChange={(e) => setFilterCounselor(e.target.value)}
                        style={{ ...baseInputStyle, width: '200px', cursor: 'pointer' }}
                    >
                        <option value="all">All Counselors</option>
                        <option value="unassigned">Unassigned Leads</option>
                        {counselors.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Premium Kanban Board ── */}
            <div className="flex gap-5 overflow-x-auto pb-8 snap-x min-h-[70vh]" style={{ scrollbarWidth: 'thin' }}>
                {groupedLeads.map((stage) => (
                    <div key={stage.id} className="w-[340px] min-w-[340px] shrink-0 snap-center flex flex-col">
                        
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 p-4" 
                            style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading, display: 'flex', alignItems: 'center', gap: '10px', margin: 0, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                <span style={{ width: 12, height: 12, borderRadius: R.full, backgroundColor: stage.color }}></span>
                                {stage.label}
                            </h3>
                            <span style={{ padding: '4px 10px', backgroundColor: C.innerBg, color: C.btnPrimary, fontSize: T.size.xs, fontWeight: T.weight.black, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                {stage.leads.length}
                            </span>
                        </div>

                        {/* Column Cards Container */}
                        <div className="flex-1 space-y-4 overflow-y-auto pr-1 pb-4">
                            {stage.leads.length === 0 ? (
                                <div className="p-6 text-center border border-dashed flex flex-col items-center justify-center h-[150px]" 
                                    style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                    <div className="flex items-center justify-center mb-2" style={{ width: 40, height: 40, backgroundColor: C.cardBg, borderRadius: R.full, boxShadow: S.card }}>
                                        <div style={{ width: 12, height: 12, borderRadius: R.full, backgroundColor: stage.color }}></div>
                                    </div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                                        No leads in {stage.label}
                                    </p>
                                </div>
                            ) : (
                                stage.leads.map(lead => (
                                    <div key={lead._id} className="group transition-transform hover:-translate-y-1 overflow-hidden" 
                                        style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                        
                                        {/* Top Color Bar Indicator */}
                                        <div style={{ height: '6px', width: '100%', backgroundColor: stage.color }} />
                                        
                                        <div className="p-5">
                                            {/* Card Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="pr-2">
                                                    <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0, marginBottom: '4px' }}>
                                                        {lead.name}
                                                    </h4>
                                                    {lead.courseOfInterest ? (
                                                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: C.innerBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}` }}>
                                                            {lead.courseOfInterest.title || lead.courseOfInterest}
                                                        </span>
                                                    ) : (
                                                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: C.surfaceWhite, color: C.textMuted, border: `1px solid ${C.cardBorder}` }}>
                                                            General Inquiry
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <button className="flex items-center justify-center shrink-0 transition-colors border-none bg-transparent cursor-pointer"
                                                    style={{ width: 32, height: 32, borderRadius: '10px', color: C.textFaint }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textFaint; }}>
                                                    <MdMoreHoriz style={{ width: 16, height: 16 }} />
                                                </button>
                                            </div>

                                            {/* Contact Details */}
                                            <div className="space-y-2 mb-5">
                                                <div className="flex items-center gap-2.5" style={{ padding: '6px 12px', backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                                    <MdEmail style={{ width: 14, height: 14, color: C.btnPrimary, flexShrink: 0 }} />
                                                    <a href={`mailto:${lead.email}`} className="truncate text-decoration-none transition-colors hover:opacity-80" 
                                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>
                                                        {lead.email}
                                                    </a>
                                                </div>
                                                {lead.phone && (
                                                    <div className="flex items-center gap-2.5" style={{ padding: '6px 12px', backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                                        <MdPhone style={{ width: 14, height: 14, color: C.btnPrimary, flexShrink: 0 }} />
                                                        <a href={`tel:${lead.phone}`} className="text-decoration-none transition-colors hover:opacity-80" 
                                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>
                                                            {lead.phone}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions Grid */}
                                            <div className="pt-4 grid grid-cols-2 gap-3" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                                
                                                {/* Assign Counselor */}
                                                <div className="flex flex-col">
                                                    <label className="flex items-center gap-1" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', marginBottom: '4px' }}>
                                                        <MdPerson style={{ width: 12, height: 12 }}/> Owner
                                                    </label>
                                                    <select 
                                                        value={lead.assignedCounselor?._id || 'unassigned'} 
                                                        onChange={(e) => handleCounselorAssign(lead._id, e.target.value)}
                                                        style={{ ...baseInputStyle, padding: '6px 8px', fontSize: T.size.xs, cursor: 'pointer' }}
                                                    >
                                                        <option value="unassigned">Unassigned</option>
                                                        {counselors.map(c => (
                                                            <option key={c._id} value={c._id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Move Stage */}
                                                <div className="flex flex-col">
                                                    <label className="flex items-center gap-1" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', marginBottom: '4px' }}>
                                                        <MdChevronRight style={{ width: 12, height: 12 }}/> Stage
                                                    </label>
                                                    <select 
                                                        value={lead.status} 
                                                        onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                                                        style={{ 
                                                            ...baseInputStyle, padding: '6px 8px', fontSize: T.size.xs, cursor: 'pointer',
                                                            backgroundColor: stage.bg, color: stage.color, border: `1px solid ${stage.border}`
                                                        }}
                                                    >
                                                        {PIPELINE_STAGES.map(s => (
                                                            <option key={s.id} value={s.id}>{s.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end mt-4 pt-3" style={{ borderTop: `1px dashed ${C.cardBorder}` }}>
                                                <span className="flex items-center gap-1" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textFaint }}>
                                                    <MdCalendarMonth style={{ width: 12, height: 12 }}/> {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}