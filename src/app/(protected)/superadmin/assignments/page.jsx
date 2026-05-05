'use client';

import { useState, useEffect } from 'react';
import {
    MdHourglassEmpty, MdArticle, MdSearch, MdBusiness, MdCheckCircle,
    MdAccessTime, MdWarning, MdInbox, MdMenuBook, MdCalendarMonth
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

export default function SuperAdminAssignmentsPage() {
    const [assignments, setAssignments] = useState([]);
    const [kpis, setKpis] = useState({ totalAssignments: 0, activeAssignments: 0, totalGlobalSubmissions: 0, globalPendingGrading: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchAssignments();
    }, [statusFilter]);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            let query = `/superadmin/assignments?status=${statusFilter}`;
            if (searchTerm) query += `&search=${searchTerm}`;
            
            const res = await api.get(query);
            if (res.data.success) {
                setAssignments(res.data.data.assignments);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchAssignments();
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
                            Global Assignments
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Monitor coursework, submission rates, and tutor grading backlogs.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdArticle} 
                    value={kpis.totalAssignments} 
                    label="Total Assignments" 
                    iconBg="#EEF2FF" 
                    iconColor="#4F46E5" 
                />
                <StatCard 
                    icon={MdCheckCircle} 
                    value={kpis.activeAssignments} 
                    label="Published" 
                    iconBg="#ECFDF5" 
                    iconColor="#10B981" 
                />
                <StatCard 
                    icon={MdInbox} 
                    value={kpis.totalGlobalSubmissions.toLocaleString()} 
                    label="Total Submissions" 
                    iconBg="#EBF8FF" 
                    iconColor="#3182CE" 
                />
                <StatCard 
                    icon={MdAccessTime} 
                    value={kpis.globalPendingGrading.toLocaleString()} 
                    label="Pending Grading" 
                    iconBg={C.dangerBg} 
                    iconColor={C.danger} 
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
                            {status === 'all' ? 'All Assignments' : status}
                        </button>
                    ))}
                </div>
                
                <form onSubmit={handleSearch} className="relative w-full xl:w-[320px]">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                    <input 
                        type="text" 
                        placeholder="Search assignments..." 
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </form>
            </div>

            {/* ── Assignments List ── */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                            Loading assignments...
                        </p>
                    </div>
                </div>
            ) : assignments.length === 0 ? (
                <div className="p-14 text-center border border-dashed m-8" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdArticle style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No assignments found</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>No records match your search or filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {assignments.map((assignment, idx) => {
                        const isPublished = assignment.status === 'published';
                        const total = assignment.stats.totalSubmissions;
                        const pending = assignment.stats.pendingGrading;
                        const graded = assignment.stats.gradedCount;
                        
                        // Calculate percentage graded for the progress bar
                        const gradedPercentage = total > 0 ? ((graded / total) * 100).toFixed(0) : 0;

                        return (
                            <div key={assignment._id || idx} className="flex flex-col transition-transform hover:-translate-y-1 overflow-hidden group" 
                                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
                                onMouseEnter={(e) => e.currentTarget.style.boxShadow = S.cardHover}
                                onMouseLeave={(e) => e.currentTarget.style.boxShadow = S.card}
                            >
                                
                                {/* Header */}
                                <div className="px-5 py-4 flex items-start justify-between gap-2" 
                                    style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}`, borderTopLeftRadius: R['2xl'], borderTopRightRadius: R['2xl'] }}>
                                    <div className="flex-1">
                                        <h3 className="line-clamp-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0, marginBottom: '4px' }}>
                                            {assignment.title}
                                        </h3>
                                        <div className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                                            <MdMenuBook style={{ width: 14, height: 14 }}/> <span className="line-clamp-1">{assignment.courseId?.title || 'Unknown Course'}</span>
                                        </div>
                                    </div>
                                    <span className="flex items-center justify-center shrink-0" 
                                        style={{ 
                                            padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.black, 
                                            textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                            backgroundColor: isPublished ? C.successBg : C.innerBg, 
                                            color: isPublished ? C.success : C.textMuted, 
                                            border: `1px solid ${isPublished ? C.successBorder : C.cardBorder}` 
                                        }}>
                                        {assignment.status}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: 0, marginBottom: '4px' }}>Submissions</p>
                                            <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{total}</h4>
                                        </div>
                                        <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: pending > 0 ? C.warningBg : C.innerBg, border: `1px solid ${pending > 0 ? C.warningBorder : C.cardBorder}` }}>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: pending > 0 ? C.warning : C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: 0, marginBottom: '4px' }}>Needs Grading</p>
                                            <h4 className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: pending > 0 ? C.warning : C.heading, margin: 0 }}>
                                                {pending} {pending > 0 && <MdWarning style={{ width: 14, height: 14 }} className="animate-pulse"/>}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-5 mt-auto">
                                        <div className="flex justify-between items-center mb-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                            <span style={{ color: C.textMuted }}>Grading Progress</span>
                                            <span style={{ color: C.btnPrimary }}>{gradedPercentage}% Completed</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', backgroundColor: C.innerBg, borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', backgroundColor: C.btnPrimary, borderRadius: '10px', width: `${gradedPercentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
                                        </div>
                                    </div>

                                    {/* Context Details */}
                                    <div className="flex items-center gap-2" style={{ backgroundColor: C.innerBg, padding: '10px 12px', borderRadius: '10px', border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>
                                        <MdBusiness style={{ width: 14, height: 14, color: C.textFaint, flexShrink: 0 }} />
                                        <span className="truncate">{assignment.instituteId ? assignment.instituteId.name : 'Global Master Assignment'}</span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg, borderBottomLeftRadius: R['2xl'], borderBottomRightRadius: R['2xl'] }}>
                                    <span className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted }}>
                                        <MdCheckCircle style={{ width: 14, height: 14 }}/> Max Marks: {assignment.totalMarks || 100}
                                    </span>
                                    <span className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: (assignment.dueDate && new Date(assignment.dueDate) < new Date()) ? C.danger : C.btnPrimary }}>
                                        <MdCalendarMonth style={{ width: 14, height: 14 }}/> 
                                        {assignment.dueDate ? `Due: ${new Date(assignment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'No Deadline'}
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