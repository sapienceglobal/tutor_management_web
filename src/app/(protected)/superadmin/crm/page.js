'use client';

import { useState, useEffect } from 'react';
import { Loader2, Phone, Mail, User, Search, Filter, Briefcase, ChevronRight, CalendarDays, MoreHorizontal } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import LeadCaptureModal from '@/components/LeadCaptureModal';

// Advanced Stage Definitions matching the Superadmin Theme
const PIPELINE_STAGES = [
    { id: 'new', label: 'New Lead', color: 'bg-[#F4F0FD] text-[#6B4DF1] border-[#E9DFFC]', line: 'bg-[#6B4DF1]', dot: 'bg-[#6B4DF1]' },
    { id: 'contacted', label: 'Contacted', color: 'bg-[#EBF8FF] text-[#3182CE] border-[#BEE3F8]', line: 'bg-[#3182CE]', dot: 'bg-[#3182CE]' },
    { id: 'qualified', label: 'Qualified', color: 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]', line: 'bg-[#EA580C]', dot: 'bg-[#EA580C]' },
    { id: 'converted', label: 'Converted', color: 'bg-[#ECFDF5] text-[#10B981] border-[#D1FAE5]', line: 'bg-[#10B981]', dot: 'bg-[#10B981]' },
    { id: 'lost', label: 'Lost', color: 'bg-[#FEE2E2] text-[#E53E3E] border-[#FECACA]', line: 'bg-[#E53E3E]', dot: 'bg-[#E53E3E]' }
];

export default function CRMDashboard() {
    const [leads, setLeads] = useState([]);
    const [counselors, setCounselors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCounselor, setFilterCounselor] = useState('all');

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

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
            <div className="flex items-center justify-center min-h-screen bg-[#F4EEFD]">
                <Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header & KPI ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-[24px] font-black text-[#27225B] m-0">CRM Pipeline</h1>
                    <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Track institute inquiries and convert prospects to active subscriptions.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-xl border border-[#E9DFFC] flex items-center gap-3" style={{ boxShadow: softShadow }}>
                        <div className="w-8 h-8 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center"><Briefcase size={16}/></div>
                        <div>
                            <p className="text-[10px] font-bold text-[#A0ABC0] uppercase m-0">Total Leads</p>
                            <p className="text-[16px] font-black text-[#27225B] m-0 leading-none">{filteredLeads.length}</p>
                        </div>
                    </div>
                    {/* Make sure LeadCaptureModal accepts a trigger that can be styled, or replace it with your own button if needed */}
                    <div className="h-[46px] flex items-center">
                         <LeadCaptureModal triggerText="+ New Lead" /> 
                    </div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                <div className="relative w-full xl:w-[400px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                    <Input
                        placeholder="Search by name, email or institute..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-3 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0] h-auto"
                    />
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-[#7D8DA6]">
                        <Filter size={16} /> Filter by Representative:
                    </div>
                    <Select value={filterCounselor} onValueChange={setFilterCounselor}>
                        <SelectTrigger className="w-[200px] h-[42px] bg-[#F9F7FC] border border-[#E9DFFC] text-[#27225B] font-bold text-[13px] rounded-xl focus:ring-[#6B4DF1]">
                            <SelectValue placeholder="All Counselors" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Counselors</SelectItem>
                            <SelectItem value="unassigned">Unassigned Leads</SelectItem>
                            {counselors.map(c => (
                                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ── Premium Kanban Board ── */}
            <div className="flex gap-5 overflow-x-auto pb-8 snap-x custom-scrollbar min-h-[70vh]">
                {groupedLeads.map((stage) => (
                    <div key={stage.id} className="w-[340px] min-w-[340px] shrink-0 snap-center flex flex-col">
                        
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-2xl border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                            <h3 className="font-black text-[14px] text-[#27225B] flex items-center gap-2.5 m-0 uppercase tracking-wide">
                                <span className={`w-3 h-3 rounded-full ${stage.dot}`}></span>
                                {stage.label}
                            </h3>
                            <span className="px-2.5 py-1 bg-[#F4F0FD] text-[#6B4DF1] text-[12px] font-black rounded-lg border border-[#E9DFFC]">
                                {stage.leads.length}
                            </span>
                        </div>

                        {/* Column Cards Container */}
                        <div className="flex-1 space-y-4 overflow-y-auto pr-1 pb-4">
                            {stage.leads.map(lead => (
                                <div key={lead._id} className="group hover:-translate-y-1 transition-transform bg-white rounded-2xl border border-[#E9DFFC] overflow-hidden" style={{ boxShadow: softShadow }}>
                                    
                                    {/* Top Color Bar Indicator */}
                                    <div className={`h-1.5 w-full ${stage.line}`} />
                                    
                                    <div className="p-5">
                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="pr-2">
                                                <h4 className="font-black text-[#27225B] text-[15px] m-0 mb-1">{lead.name}</h4>
                                                {lead.courseOfInterest ? (
                                                    <span className="text-[10px] font-bold text-[#6B4DF1] bg-[#F4F0FD] px-2 py-0.5 rounded-md border border-[#E9DFFC]">
                                                        {lead.courseOfInterest.title || lead.courseOfInterest}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-[#A0ABC0] bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                                                        General Inquiry
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A0ABC0] hover:text-[#27225B] hover:bg-[#F4F0FD] transition-colors border-none bg-transparent cursor-pointer shrink-0">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>

                                        {/* Contact Details */}
                                        <div className="space-y-2 mb-5">
                                            <div className="flex items-center gap-2.5 text-[12px] font-semibold text-[#4A5568] bg-[#F9F7FC] px-3 py-1.5 rounded-lg border border-[#E9DFFC]/50">
                                                <Mail className="w-3.5 h-3.5 text-[#6B4DF1] shrink-0" />
                                                <a href={`mailto:${lead.email}`} className="hover:text-[#6B4DF1] truncate transition-colors decoration-transparent text-[#4A5568]">{lead.email}</a>
                                            </div>
                                            {lead.phone && (
                                                <div className="flex items-center gap-2.5 text-[12px] font-semibold text-[#4A5568] bg-[#F9F7FC] px-3 py-1.5 rounded-lg border border-[#E9DFFC]/50">
                                                    <Phone className="w-3.5 h-3.5 text-[#6B4DF1] shrink-0" />
                                                    <a href={`tel:${lead.phone}`} className="hover:text-[#6B4DF1] transition-colors decoration-transparent text-[#4A5568]">{lead.phone}</a>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions Grid */}
                                        <div className="pt-4 border-t border-[#F4F0FD] grid grid-cols-2 gap-3">
                                            
                                            {/* Assign Counselor */}
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-bold text-[#A0ABC0] uppercase mb-1 flex items-center gap-1"><User size={10}/> Owner</label>
                                                <Select
                                                    value={lead.assignedCounselor?._id || 'unassigned'}
                                                    onValueChange={(val) => handleCounselorAssign(lead._id, val)}
                                                >
                                                    <SelectTrigger className="h-8 text-[11px] font-bold bg-[#F9F7FC] border-[#E9DFFC] text-[#27225B] focus:ring-[#6B4DF1] rounded-lg">
                                                        <SelectValue placeholder="Assign To..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned" className="text-gray-400 italic">Unassigned</SelectItem>
                                                        {counselors.map(c => (
                                                            <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Move Stage */}
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-bold text-[#A0ABC0] uppercase mb-1 flex items-center gap-1"><ChevronRight size={10}/> Stage</label>
                                                <Select
                                                    value={lead.status}
                                                    onValueChange={(val) => handleStatusChange(lead._id, val)}
                                                >
                                                    <SelectTrigger className={`h-8 text-[11px] font-bold border rounded-lg shadow-sm ${stage.color}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PIPELINE_STAGES.map(s => (
                                                            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                        </div>

                                        <div className="flex items-center justify-end mt-4 pt-3 border-t border-[#F4F0FD]/50">
                                            <span className="text-[10px] font-bold text-[#A0ABC0] flex items-center gap-1">
                                                <CalendarDays size={12}/> {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>

                                    </div>
                                </div>
                            ))}

                            {/* Empty State for Column */}
                            {stage.leads.length === 0 && (
                                <div className="p-6 border-2 border-dashed border-[#D5C2F6] bg-white/40 rounded-2xl flex flex-col items-center justify-center text-center h-[150px]">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                                        <div className={`w-3 h-3 rounded-full ${stage.dot}`}></div>
                                    </div>
                                    <p className="text-[12px] font-bold text-[#A0ABC0] m-0">No leads in {stage.label}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}