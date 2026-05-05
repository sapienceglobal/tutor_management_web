'use client';

import { useState, useEffect } from 'react';
import {
    MdHourglassEmpty, MdArticle, MdSearch, MdWarning, MdSchool,
    MdBusiness, MdCheckCircle, MdBlock, MdTrackChanges, MdMenuBook,
    MdAccessTime
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

export default function SuperAdminExamsPage() {
    const [exams, setExams] = useState([]);
    const [kpis, setKpis] = useState({ totalExams: 0, activeExams: 0, totalGlobalAttempts: 0, globalCheatingAlerts: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchExams();
    }, [statusFilter]);

    const fetchExams = async () => {
        setLoading(true);
        try {
            let query = `/superadmin/exams?status=${statusFilter}`;
            if (searchTerm) query += `&search=${searchTerm}`;
            
            const res = await api.get(query);
            if (res.data.success) {
                setExams(res.data.data.exams);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load global exams');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchExams();
    };

    const handleStatusChange = async (id, currentStatus, title) => {
        const newStatus = currentStatus === 'suspended' ? 'published' : 'suspended';
        const actionText = newStatus === 'suspended' ? 'SUSPEND' : 'RESTORE';

        if (!confirm(`🚨 Are you sure you want to ${actionText} the course: "${title}"?`)) return;

        try {
            const res = await api.patch(`/superadmin/courses/${id}/status`, { status: newStatus });
            if (res.data.success) {
                setExams(exams.map(c => c._id === id ? { ...c, status: newStatus } : c));
                toast.success(`Course successfully ${newStatus}`);
            }
        } catch (error) {
            toast.error('Failed to update course status');
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'published': return { color: C.success, bg: C.successBg, border: `1px solid ${C.successBorder}`, icon: MdCheckCircle, label: 'Published' };
            case 'suspended': return { color: C.danger, bg: C.dangerBg, border: `1px solid ${C.dangerBorder}`, icon: MdWarning, label: 'Suspended' };
            case 'pending': return { color: C.warning, bg: C.warningBg, border: `1px solid ${C.warningBorder}`, icon: MdAccessTime, label: 'Pending Review' };
            default: return { color: C.textMuted, bg: C.innerBg, border: `1px solid ${C.cardBorder}`, icon: MdMenuBook, label: status };
        }
    };

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdArticle style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Global Exams & Proctoring
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Monitor all assessments and AI-detected cheating alerts across the platform.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdArticle} 
                    value={kpis.totalExams} 
                    label="Total Exams" 
                    iconBg="#EEF2FF" 
                    iconColor="#4F46E5" 
                />
                <StatCard 
                    icon={MdCheckCircle} 
                    value={kpis.activeExams} 
                    label="Active / Live" 
                    iconBg="#ECFDF5" 
                    iconColor="#10B981" 
                />
                <StatCard 
                    icon={MdTrackChanges} 
                    value={kpis.totalGlobalAttempts.toLocaleString()} 
                    label="Total Attempts" 
                    iconBg="#EBF8FF" 
                    iconColor="#3182CE" 
                />
                <StatCard 
                    icon={MdWarning} 
                    value={kpis.globalCheatingAlerts.toLocaleString()} 
                    label="AI Proctor Flags" 
                    iconBg={kpis.globalCheatingAlerts > 0 ? C.dangerBg : C.innerBg} 
                    iconColor={kpis.globalCheatingAlerts > 0 ? C.danger : C.textFaint} 
                />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4" 
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                <div className="flex p-1.5 w-full xl:w-auto overflow-x-auto" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                    {['all', 'published', 'draft'].map(status => (
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
                            {status === 'all' ? 'All Exams' : status}
                        </button>
                    ))}
                </div>
                
                <form onSubmit={handleSearch} className="relative w-full xl:w-[320px]">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                    <input 
                        type="text" 
                        placeholder="Search exam title..." 
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </form>
            </div>

            {/* ── Exams List ── */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                            Loading exams...
                        </p>
                    </div>
                </div>
            ) : exams.length === 0 ? (
                <div className="p-14 text-center border border-dashed m-8" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdArticle style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No exams found</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>No records match your search or filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {exams.map((exam, idx) => {
                        const isPublished = exam.status === 'published';
                        const totalAttempts = exam.stats?.totalAttempts || 0;
                        const alerts = exam.stats?.suspiciousAttempts || 0;
                        const statusData = getStatusConfig(exam.status);
                        const StatusIcon = statusData.icon;

                        return (
                            <div key={exam._id || idx} className="flex flex-col transition-transform hover:-translate-y-1 overflow-hidden group" 
                                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${alerts > 0 ? C.dangerBorder : C.cardBorder}`, boxShadow: S.card }}
                                onMouseEnter={(e) => e.currentTarget.style.boxShadow = S.cardHover}
                                onMouseLeave={(e) => e.currentTarget.style.boxShadow = S.card}
                            >
                                
                                {/* Header */}
                                <div className="px-5 py-4 flex items-start justify-between gap-2" 
                                    style={{ backgroundColor: alerts > 0 ? C.dangerBg : C.innerBg, borderBottom: `1px solid ${alerts > 0 ? C.dangerBorder : C.cardBorder}`, borderTopLeftRadius: R['2xl'], borderTopRightRadius: R['2xl'] }}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="line-clamp-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{exam.title}</h3>
                                            {exam.isProctoringEnabled && <MdWarning style={{ width: 14, height: 14, color: C.btnPrimary }} title="Proctoring Enabled"/>}
                                        </div>
                                        <div className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                                            <MdMenuBook style={{ width: 14, height: 14 }}/> <span className="line-clamp-1">{exam.courseId?.title || 'Unknown Course'}</span>
                                        </div>
                                    </div>
                                    <span className="flex items-center justify-center shrink-0" 
                                        style={{ 
                                            padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.black, 
                                            textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                            backgroundColor: statusData.bg, color: statusData.color, border: statusData.border 
                                        }}>
                                        {exam.status}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: 0, marginBottom: '4px' }}>Total Attempts</p>
                                            <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{totalAttempts}</h4>
                                        </div>
                                        <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: alerts > 0 ? C.dangerBg : C.innerBg, border: `1px solid ${alerts > 0 ? C.dangerBorder : C.cardBorder}` }}>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: 0, marginBottom: '4px', color: alerts > 0 ? C.danger : C.statLabel }}>AI Alerts</p>
                                            <h4 className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, margin: 0, color: alerts > 0 ? C.danger : C.heading }}>
                                                {alerts} {alerts > 0 && <MdWarning style={{ width: 14, height: 14 }} className="animate-pulse"/>}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-2 mt-auto" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>
                                        <div className="flex justify-between pb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                            <span className="flex items-center gap-1.5" style={{ color: C.textMuted }}><MdAccessTime style={{ width: 14, height: 14 }}/> Duration</span>
                                            <span style={{ color: C.heading }}>{exam.duration} mins</span>
                                        </div>
                                        <div className="flex justify-between pb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                            <span className="flex items-center gap-1.5" style={{ color: C.textMuted }}><MdTrackChanges style={{ width: 14, height: 14 }}/> Total Marks</span>
                                            <span style={{ color: C.heading }}>{exam.totalMarks} (Pass: {exam.passingMarks || `${exam.passingPercentage}%`})</span>
                                        </div>
                                        <div className="flex justify-between pt-1">
                                            <span className="flex items-center gap-1.5" style={{ color: C.textMuted }}><MdBusiness style={{ width: 14, height: 14 }}/> Context</span>
                                            <span className="truncate max-w-[150px] text-right" style={{ color: C.btnPrimary }}>{exam.instituteId ? exam.instituteId.name : 'Global Master'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}