'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Phone, Mail, User, Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LeadCaptureModal from '@/components/LeadCaptureModal';

const PIPELINE_STAGES = [
    { id: 'new', label: 'New Lead', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { id: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700 border-red-200' }
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
                toast.success('Lead status updated');
            }
        } catch (error) {
            toast.error('Failed to update lead');
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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">CRM & Leads Pipeline</h1>
                    <p className="text-slate-500 mt-1">Manage prospective students and track sales progress.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-64 bg-white border-slate-200"
                        />
                    </div>

                    <Select value={filterCounselor} onValueChange={setFilterCounselor}>
                        <SelectTrigger className="w-[180px] bg-white border-slate-200">
                            <Filter className="w-4 h-4 mr-2 text-slate-500" />
                            <SelectValue placeholder="Filter by Counselor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Counselors</SelectItem>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {counselors.map(c => (
                                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <LeadCaptureModal triggerText="+ Add Lead Manually" />
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
                {groupedLeads.map((stage) => (
                    <div key={stage.id} className="w-[320px] min-w-[320px] shrink-0 snap-center">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${stage.color.split(' ')[0]}`}></span>
                                {stage.label}
                            </h3>
                            <Badge variant="secondary" className="bg-white text-slate-500 shadow-sm">
                                {stage.leads.length}
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            {stage.leads.map(lead => (
                                <Card key={lead._id} className="group hover:shadow-lg transition-all border-slate-200 bg-white">
                                    <div className={`h-1 w-full rounded-t-xl ${stage.color.split(' ')[0]}`} />
                                    <CardContent className="p-5">

                                        {/* Lead Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-lg leading-tight">{lead.name}</h4>
                                                {lead.courseOfInterest && (
                                                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                                        {lead.courseOfInterest.title}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                {new Date(lead.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center text-sm text-slate-600 gap-2">
                                                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                                <a href={`mailto:${lead.email}`} className="hover:text-indigo-600 truncate">{lead.email}</a>
                                            </div>
                                            {lead.phone && (
                                                <div className="flex items-center text-sm text-slate-600 gap-2">
                                                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <a href={`tel:${lead.phone}`} className="hover:text-indigo-600">{lead.phone}</a>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions & Assignments */}
                                        <div className="border-t border-slate-100 pt-3 mt-3 space-y-3">

                                            {/* Counselor Assignment */}
                                            <div className="flex items-center justify-between">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <Select
                                                    value={lead.assignedCounselor?._id || 'unassigned'}
                                                    onValueChange={(val) => handleCounselorAssign(lead._id, val)}
                                                >
                                                    <SelectTrigger className="h-8 text-xs w-[160px] border-slate-200 bg-slate-50">
                                                        <SelectValue placeholder="Assign To..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned" className="text-slate-400 italic">Unassigned</SelectItem>
                                                        {counselors.map(c => (
                                                            <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Stage Movement */}
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={lead.status}
                                                    onValueChange={(val) => handleStatusChange(lead._id, val)}
                                                >
                                                    <SelectTrigger className={`h-8 text-xs font-medium border ${stage.color}`}>
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
                                    </CardContent>
                                </Card>
                            ))}

                            {stage.leads.length === 0 && (
                                <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                                    <p className="text-sm font-medium text-slate-400">No leads here</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
