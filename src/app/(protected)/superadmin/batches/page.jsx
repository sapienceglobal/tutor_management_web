'use client';

import { useState, useEffect } from 'react';
import { 
    MdHourglassEmpty, MdPeople, MdSearch, MdBusiness, MdCalendarMonth, 
    MdMenuBook, MdCheckCircle, MdAccessTime, MdWarning, MdPerson
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

export default function SuperAdminBatchesPage() {
    const [batches, setBatches] = useState([]);
    const [kpis, setKpis] = useState({ totalBatches: 0, activeBatches: 0, completedBatches: 0, avgStudentsPerBatch: 0, totalStudentsInBatches: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchBatches();
    }, [statusFilter]);

    const fetchBatches = async () => {
        setLoading(true);
        try {
            let query = `/superadmin/batches?status=${statusFilter}`;
            if (searchTerm) query += `&search=${searchTerm}`;
            
            const res = await api.get(query);
            if (res.data.success) {
                setBatches(res.data.data.batches);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load global batches');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchBatches();
    };

    const getStatusConfig = (status) => {
        switch(status) {
            case 'active': return { color: C.success, bg: C.successBg, border: `1px solid ${C.successBorder}`, icon: MdCheckCircle, label: 'Active Now' };
            case 'upcoming': return { color: C.warning, bg: C.warningBg, border: `1px solid ${C.warningBorder}`, icon: MdAccessTime, label: 'Upcoming' };
            case 'completed': return { color: C.btnPrimary, bg: C.innerBg, border: `1px solid ${C.cardBorder}`, icon: MdCheckCircle, label: 'Completed' };
            default: return { color: C.textMuted, bg: C.innerBg, border: `1px solid ${C.cardBorder}`, icon: MdWarning, label: status };
        }
    };

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdPeople style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Global Batches Directory
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Read-only oversight of all course batches and student distributions across the platform.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdPeople} 
                    value={kpis.totalBatches} 
                    label="Total Batches" 
                    iconBg="#EEF2FF" 
                    iconColor="#4F46E5" 
                />
                <StatCard 
                    icon={MdCheckCircle} 
                    value={kpis.activeBatches} 
                    label="Active Batches" 
                    iconBg="#ECFDF5" 
                    iconColor="#10B981" 
                />
                <StatCard 
                    icon={MdPerson} 
                    value={kpis.avgStudentsPerBatch} 
                    label="Avg Students / Batch" 
                    iconBg="#FFF7ED" 
                    iconColor="#F59E0B" 
                />
                <StatCard 
                    icon={MdMenuBook} 
                    value={kpis.totalStudentsInBatches.toLocaleString()} 
                    label="Total Batched Students" 
                    iconBg="#EBF8FF" 
                    iconColor="#3182CE" 
                />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4" 
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                <div className="flex p-1.5 w-full xl:w-auto overflow-x-auto" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                    {['all', 'active', 'upcoming', 'completed'].map(status => (
                        <button 
                            key={status} 
                            onClick={() => setStatusFilter(status)} 
                            className="transition-all capitalize whitespace-nowrap border-none cursor-pointer"
                            style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                backgroundColor: statusFilter === status ? C.surfaceWhite : 'transparent',
                                color: statusFilter === status ? C.btnPrimary : C.textFaint,
                                boxShadow: statusFilter === status ? S.active : 'none'
                            }}
                        >
                            {status === 'all' ? 'All Batches' : status}
                        </button>
                    ))}
                </div>
                
                <form onSubmit={handleSearch} className="relative w-full xl:w-[320px]">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                    <input 
                        type="text" 
                        placeholder="Search by batch name..." 
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </form>
            </div>

            {/* ── Batches List ── */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                            Loading batches...
                        </p>
                    </div>
                </div>
            ) : batches.length === 0 ? (
                <div className="p-14 text-center border border-dashed m-8" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdPeople style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No batches found</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>No records match your current filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {batches.map(batch => {
                        const statusData = getStatusConfig(batch.status);
                        const StatusIcon = statusData.icon;
                        const studentCount = batch.students?.length || 0;

                        return (
                            <div key={batch._id} className="flex flex-col transition-transform hover:-translate-y-1 group" 
                                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
                                onMouseEnter={(e) => e.currentTarget.style.boxShadow = S.cardHover}
                                onMouseLeave={(e) => e.currentTarget.style.boxShadow = S.card}
                            >
                                
                                {/* Card Body */}
                                <div className="flex-1 flex flex-col" style={{ padding: '20px' }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="flex items-center gap-1" 
                                            style={{ 
                                                padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.black, 
                                                textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                                backgroundColor: statusData.bg, color: statusData.color, border: statusData.border 
                                            }}>
                                            <StatusIcon style={{ width: 12, height: 12 }}/> {statusData.label}
                                        </span>
                                        <div className="flex items-center gap-1.5" style={{ padding: '4px 8px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                            <MdPeople style={{ width: 14, height: 14, color: C.btnPrimary }}/> {studentCount} Students
                                        </div>
                                    </div>
                                    
                                    <h3 className="line-clamp-2 leading-snug" style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0, marginBottom: '8px' }}>
                                        {batch.name}
                                    </h3>
                                    <p className="line-clamp-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, margin: 0, marginBottom: '16px' }}>
                                        {batch.courseId?.title || 'Unknown Course'}
                                    </p>
                                    
                                    {/* Context Details */}
                                    <div className="space-y-3 mt-auto" style={{ backgroundColor: C.innerBg, padding: '12px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                        <div className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>
                                            <MdBusiness style={{ width: 14, height: 14, color: C.textFaint, flexShrink: 0 }} />
                                            <span className="truncate">{batch.instituteId ? batch.instituteId.name : 'Global Platform'}</span>
                                        </div>
                                        <div className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>
                                            <div className="flex items-center justify-center shrink-0 overflow-hidden" 
                                                style={{ width: 16, height: 16, borderRadius: R.full, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                                {batch.tutorId?.profileImage ? (
                                                    <img src={batch.tutorId.profileImage} className="w-full h-full object-cover"/>
                                                ) : (
                                                    <span style={{ fontSize: '8px', fontWeight: T.weight.bold, color: C.btnPrimary }}>T</span>
                                                )}
                                            </div>
                                            <span className="truncate">{batch.tutorId?.name || 'Unknown Tutor'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Dates */}
                                <div className="flex items-center justify-between gap-3" style={{ padding: '16px 20px', borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg, borderBottomLeftRadius: R['2xl'], borderBottomRightRadius: R['2xl'] }}>
                                    <span className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.textFaint }}>
                                        <MdCalendarMonth style={{ width: 14, height: 14 }}/>
                                        {new Date(batch.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} 
                                        {batch.endDate ? ` - ${new Date(batch.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ' (Ongoing)'}
                                    </span>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}