'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Search, Upload, X, FileText, CheckCircle, AlertCircle, Clock,
    ChevronLeft, ChevronRight, Award, MessageSquare, Download,
    Star, BarChart2, Loader2, Eye, BookOpen
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Theme ───────────────────────────────────────────────────────────────────
const themeBg = '#dfdaf3';
const outerCard = '#EAE8FA';
const innerBox = '#E3DFF8';
const PAGE_SIZE = 8;

const onFocus = e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)'; };
const onBlur = e => { e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; };

const baseInput = {
    backgroundColor: C.surfaceWhite, border: '1.5px solid transparent', borderRadius: R.xl,
    color: C.heading, fontFamily: T.fontFamily, fontSize: T.size.sm,
    fontWeight: T.weight.medium, outline: 'none', width: '100%',
    padding: '10px 16px', transition: 'all 0.2s ease',
};

// ─── Submission Detail Drawer ─────────────────────────────────────────────────
function SubmissionDrawer({ row, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await assignmentService.getMySubmission(row._id);
                if (res.success) setData(res);
            } catch (e) {
                setError('Could not load submission details.');
            } finally { setLoading(false); }
        };
        load();
    }, [row._id]);

    const sub = data?.submission;
    const asgn = data?.assignment || row;
    const pct = sub?.grade != null && asgn?.totalMarks
        ? Math.round((sub.grade / asgn.totalMarks) * 100) : null;
    const pctColor = pct == null ? C.textMuted : pct >= 75 ? C.success : pct >= 50 ? C.warning : C.danger;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-[520px] shadow-2xl overflow-hidden"
                style={{ backgroundColor: outerCard, borderLeft: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily }}>

                {/* Header */}
                <div className="p-6 border-b flex items-start justify-between gap-4 shrink-0"
                    style={{ borderColor: C.cardBorder, backgroundColor: innerBox }}>
                    <div className="min-w-0 flex-1">
                        <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>
                            Submission Detail
                        </p>
                        <h2 className="truncate" style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            {row.title}
                        </h2>
                        <p style={{ fontSize: T.size.xs, color: C.textMuted, margin: '3px 0 0 0' }}>{row.courseTitle}</p>
                    </div>
                    <button onClick={onClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer border-none transition-colors"
                        style={{ backgroundColor: C.surfaceWhite, color: C.heading, border: `1px solid ${C.cardBorder}` }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.surfaceWhite}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

                    {loading && (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.btnPrimary }} />
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>
                            <p style={{ color: C.danger, fontSize: T.size.sm, fontWeight: T.weight.bold }}>{error}</p>
                        </div>
                    )}
                    {/* ── ASSIGNMENT INSTRUCTIONS & FILES (NEW) ── */}
                    {data && asgn && (
                        <div className="rounded-2xl p-5 mb-6 border" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                            <h3 className="flex items-center gap-2" style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: '0 0 12px 0' }}>
                                <FileText size={16} style={{ color: C.btnPrimary }} /> Assignment Details
                            </h3>
                            <p className="whitespace-pre-wrap" style={{ fontSize: T.size.sm, color: C.heading, lineHeight: 1.6, margin: 0 }}>
                                {asgn.description || 'No description provided.'}
                            </p>

                            {/* Tutor's Reference Files */}
                            {asgn.attachments?.length > 0 && (
                                <div className="mt-4 pt-4 border-t" style={{ borderColor: C.cardBorder }}>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                                        Reference Materials
                                    </p>
                                    <div className="space-y-2">
                                        {asgn.attachments.map((file, idx) => (
                                            <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 rounded-xl transition-all border text-decoration-none group"
                                                style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.backgroundColor = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.backgroundColor = outerCard; }}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="p-2 rounded-lg bg-white shadow-sm shrink-0">
                                                        <Download className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                                    </div>
                                                    <p className="truncate m-0" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {file.name || 'Download Attachment'}
                                                    </p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
             
                    {data && sub && (
                        <>
                            {/* Grade Card */}
                            {sub.status === 'graded' ? (
                                <div className="rounded-2xl p-5 relative overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: `1px solid ${C.successBorder}` }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}>
                                                <Award size={18} style={{ color: C.success }} />
                                            </div>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: '#065F46' }}>Your Grade</span>
                                        </div>
                                        <span style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.success, backgroundColor: C.successBg, border: `1px solid ${C.successBorder}`, padding: '3px 10px', borderRadius: R.full }}>
                                            GRADED
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-4">
                                        <div>
                                            <span style={{ fontSize: '42px', fontWeight: T.weight.black, color: '#065F46', lineHeight: 1 }}>
                                                {sub.grade}
                                            </span>
                                            <span style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: '#065F46' }}>
                                                /{asgn.totalMarks}
                                            </span>
                                        </div>
                                        {pct != null && (
                                            <div className="flex flex-col items-start gap-1 flex-1">
                                                <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#065F46' }}>
                                                    {pct}%
                                                </span>
                                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(16,185,129,0.2)' }}>
                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pctColor, transition: 'width 0.8s ease' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {sub.gradedAt && (
                                        <p style={{ fontSize: T.size.xs, color: 'rgba(6,95,70,0.7)', margin: '10px 0 0 0' }}>
                                            Graded on {new Date(sub.gradedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            {sub.gradedBy?.name ? ` by ${sub.gradedBy.name}` : ''}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-2xl p-5 flex items-center gap-4"
                                    style={{ backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}` }}>
                                    <Clock size={22} style={{ color: C.warning, shrink: 0 }} />
                                    <div>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: '#92400E', margin: 0 }}>
                                            Awaiting Grade
                                        </p>
                                        <p style={{ fontSize: T.size.xs, color: '#B45309', margin: '2px 0 0 0' }}>
                                            Submitted on {new Date(sub.submittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Overall Feedback */}
                            {sub.feedback && (
                                <div className="rounded-2xl p-5" style={{ backgroundColor: outerCard, border: `1px solid ${C.cardBorder}` }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <MessageSquare size={15} style={{ color: C.btnPrimary }} />
                                        <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                                            Tutor Feedback
                                        </p>
                                    </div>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.heading, lineHeight: 1.7, margin: 0 }}>
                                        {sub.feedback}
                                    </p>
                                </div>
                            )}

                            {/* Rubric Scores */}
                            {asgn.rubric?.length > 0 && (
                                <div className="rounded-2xl overflow-hidden border" style={{ borderColor: C.cardBorder }}>
                                    <div className="px-5 py-3.5 flex items-center gap-2 border-b" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                        <BarChart2 size={15} style={{ color: C.warning }} />
                                        <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                                            Rubric Breakdown
                                        </p>
                                    </div>
                                    <div className="divide-y" style={{ borderColor: C.cardBorder }}>
                                        {asgn.rubric.map((criterion, i) => {
                                            const rs = sub.rubricScores?.find(r => r.criterionId?.toString() === criterion._id?.toString());
                                            return (
                                                <div key={i} className="p-4" style={{ backgroundColor: rs ? 'rgba(16,185,129,0.04)' : outerCard }}>
                                                    <div className="flex items-start justify-between gap-3 mb-1">
                                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                                            {criterion.criterion}
                                                        </p>
                                                        <span className="shrink-0 px-2.5 py-0.5 rounded-lg"
                                                            style={rs
                                                                ? { backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}`, fontSize: '11px', fontWeight: T.weight.black }
                                                                : { backgroundColor: innerBox, color: C.textMuted, border: `1px solid ${C.cardBorder}`, fontSize: '11px', fontWeight: T.weight.black }}>
                                                            {rs ? `${rs.points} / ` : '— / '}{criterion.points} pts
                                                        </span>
                                                    </div>
                                                    {criterion.description && (
                                                        <p style={{ fontSize: T.size.xs, color: C.textMuted, margin: '0 0 4px 0', lineHeight: 1.5 }}>
                                                            {criterion.description}
                                                        </p>
                                                    )}
                                                    {rs?.comments && (
                                                        <div className="mt-2 p-3 rounded-xl flex items-start gap-2.5 border"
                                                            style={{ backgroundColor: C.surfaceWhite, borderColor: C.successBorder }}>
                                                            <MessageSquare size={13} style={{ color: C.success, flexShrink: 0, marginTop: 2 }} />
                                                            <p style={{ fontSize: T.size.xs, color: C.heading, fontWeight: T.weight.medium, margin: 0 }}>
                                                                {rs.comments}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Submitted Files */}
                            {sub.attachments?.length > 0 && (
                                <div className="rounded-2xl overflow-hidden border" style={{ borderColor: C.cardBorder }}>
                                    <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                        <FileText size={15} style={{ color: C.btnPrimary }} />
                                        <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                                            Submitted Files
                                        </p>
                                    </div>
                                    <div className="p-4 space-y-2.5">
                                        {sub.attachments.map((file, i) => (
                                            <a key={i} href={file.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3.5 rounded-xl border transition-all group no-underline"
                                                style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.backgroundColor = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.backgroundColor = outerCard; }}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: innerBox }}>
                                                        <FileText size={14} style={{ color: C.btnPrimary }} />
                                                    </div>
                                                    <p className="truncate m-0" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {file.name}
                                                    </p>
                                                </div>
                                                <Download size={14} style={{ color: C.textMuted, flexShrink: 0 }} className="group-hover:text-indigo-600 transition-colors" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Text response */}
                            {sub.content && (
                                <div className="rounded-2xl overflow-hidden border" style={{ borderColor: C.cardBorder }}>
                                    <div className="px-5 py-3.5 border-b flex items-center gap-2" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                        <BookOpen size={15} style={{ color: C.btnPrimary }} />
                                        <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                                            Your Written Answer
                                        </p>
                                    </div>
                                    <div className="p-5">
                                        <p className="whitespace-pre-wrap leading-relaxed m-0"
                                            style={{ fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.medium }}>
                                            {sub.content}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t shrink-0" style={{ borderColor: C.cardBorder, backgroundColor: innerBox }}>
                    <Link href={`/student/courses/${row.courseId}/assignments/${row._id}`} className="no-underline block">
                        <button className="w-full py-3 rounded-xl text-white border-none cursor-pointer font-bold text-sm transition-opacity hover:opacity-90"
                            style={{ background: C.gradientBtn, fontFamily: T.fontFamily }}>
                            Open Full Assignment Page
                        </button>
                    </Link>
                </div>
            </div>
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentAssignmentsPage() {
    const [enrollments, setEnrollments] = useState([]);
    const [allRows, setAllRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [courseFilter, setCourseFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewRow, setViewRow] = useState(null); // for drawer

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const enrollRes = await api.get('/enrollments/my-enrollments');
                const enrollmentsList = enrollRes.data?.enrollments || [];
                setEnrollments(enrollmentsList);

                const rows = [];
                for (const enr of enrollmentsList) {
                    const cid = enr.courseId?._id || enr.courseId;
                    if (!cid) continue;
                    const res = await assignmentService.getCourseAssignments(cid);
                    const assignments = res.assignments || [];
                    const courseTitle = enr.courseId?.title || 'Course';
                    assignments.forEach(a => rows.push({ ...a, courseTitle, courseId: cid }));
                }
                rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                setAllRows(rows);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const now = new Date();

    const getStatus = (row) => {
        const sub = row.mySubmission;
        const due = row.dueDate ? new Date(row.dueDate) : null;
        if (sub?.status === 'graded') return { label: 'Graded', type: 'graded' };
        if (sub?.status === 'submitted') return { label: 'Submitted', type: 'submitted' };
        if (due && due < now) return { label: 'Overdue', type: 'overdue' };
        return { label: 'Pending', type: 'pending' };
    };

    const pendingCount = allRows.filter(r => getStatus(r).type === 'pending').length;
    const submittedCount = allRows.filter(r => ['submitted', 'graded'].includes(getStatus(r).type)).length;
    const overdueCount = allRows.filter(r => getStatus(r).type === 'overdue').length;
    const gradedCount = allRows.filter(r => getStatus(r).type === 'graded').length;

    const filtered = allRows.filter(row => {
        const s = getStatus(row);
        if (activeTab === 'Pending' && s.type !== 'pending') return false;
        if (activeTab === 'Submitted' && !['submitted', 'graded'].includes(s.type)) return false;
        if (activeTab === 'Overdue' && s.type !== 'overdue') return false;
        if (activeTab === 'Graded' && s.type !== 'graded') return false;
        if (courseFilter && !row.courseTitle.toLowerCase().includes(courseFilter.toLowerCase())) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const getStatusCfg = (type) => {
        if (type === 'overdue') return { bg: C.dangerBg, color: C.danger, border: C.dangerBorder, icon: AlertCircle, accent: C.danger };
        if (type === 'graded') return { bg: C.successBg, color: C.success, border: C.successBorder, icon: Star, accent: C.success };
        if (type === 'submitted') return { bg: C.warningBg, color: C.warning, border: C.warningBorder, icon: CheckCircle, accent: C.warning };
        return { bg: '#EEF2FF', color: C.btnPrimary, border: '#C7D2FE', icon: Clock, accent: C.btnPrimary };
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily }}>
            <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading assignments...</p>
        </div>
    );

    const TABS = [
        { key: 'All', label: `All (${allRows.length})` },
        { key: 'Pending', label: `${pendingCount} Pending`, danger: false },
        { key: 'Submitted', label: `Submitted (${submittedCount})` },
        { key: 'Graded', label: `${gradedCount} Graded` },
        { key: 'Overdue', label: `${overdueCount} Overdue`, danger: true },
    ];

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
                style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: innerBox, borderRadius: R.xl }}>
                        <FileText size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            Assignments
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>
                            {allRows.length} Total ·{' '}
                            <span style={{ color: C.warning, fontWeight: T.weight.bold }}>{pendingCount} Pending</span> ·{' '}
                            <span style={{ color: C.success, fontWeight: T.weight.bold }}>{gradedCount} Graded</span>
                        </p>
                    </div>
                </div>
                <Link href="/student/assignments/upload" className="text-decoration-none">
                    <button className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        <Upload size={16} /> Upload Work
                    </button>
                </Link>
            </div>

            {/* ── Stats Row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Pending', value: pendingCount, bg: '#EEF2FF', color: C.btnPrimary, icon: Clock },
                    { label: 'Submitted', value: submittedCount, bg: C.warningBg, color: C.warning, icon: CheckCircle },
                    { label: 'Graded', value: gradedCount, bg: C.successBg, color: C.success, icon: Award },
                    { label: 'Overdue', value: overdueCount, bg: C.dangerBg, color: C.danger, icon: AlertCircle },
                ].map(({ label, value, bg, color, icon: Icon }) => (
                    <div key={label} className="p-5 rounded-2xl border transition-transform hover:-translate-y-0.5 cursor-pointer"
                        style={{ backgroundColor: outerCard, borderColor: C.cardBorder, boxShadow: S.card }}
                        onClick={() => { setActiveTab(label); setCurrentPage(1); }}>
                        <div className="flex items-center justify-between mb-3">
                            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: 0 }}>{label}</p>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                                <Icon size={16} style={{ color }} />
                            </div>
                        </div>
                        <p style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Main Table Card ─────────────────────────────────────── */}
            <div className="overflow-hidden flex flex-col" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>

                {/* Filters */}
                <div className="p-5 flex flex-col xl:flex-row items-center justify-between gap-4"
                    style={{ backgroundColor: innerBox, borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border overflow-x-auto w-full xl:w-auto custom-scrollbar" style={{ borderColor: C.cardBorder }}>
                        {TABS.map(tab => (
                            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                                className="px-4 py-2 rounded-lg text-xs capitalize transition-all cursor-pointer border-none whitespace-nowrap"
                                style={activeTab === tab.key
                                    ? { backgroundColor: tab.danger ? C.danger : C.btnPrimary, color: '#fff', fontWeight: T.weight.bold, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontFamily: T.fontFamily }
                                    : { backgroundColor: 'transparent', color: C.textMuted, fontWeight: T.weight.semibold, fontFamily: T.fontFamily }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full xl:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textMuted }} />
                        <input type="text" placeholder="Filter by course..." value={courseFilter}
                            onChange={e => setCourseFilter(e.target.value)}
                            style={{ ...baseInput, paddingLeft: '36px', height: '40px' }}
                            onFocus={onFocus} onBlur={onBlur} />
                    </div>
                </div>

                {/* List */}
                <div className="p-4 space-y-3 custom-scrollbar">
                    {pageRows.length === 0 ? (
                        <div className="text-center py-16 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: innerBox }}>
                                <FileText size={32} color={C.btnPrimary} style={{ opacity: 0.5 }} />
                            </div>
                            <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No assignments found</p>
                            <p style={{ fontSize: T.size.sm, color: C.textMuted, margin: 0 }}>No assignments match your current filter.</p>
                        </div>
                    ) : pageRows.map((row) => {
                        const status = getStatus(row);
                        const cfg = getStatusCfg(status.type);
                        const StatusIcon = cfg.icon;
                        const isSubmittedOrGraded = ['submitted', 'graded'].includes(status.type);

                        return (
                            <div key={row._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl transition-all border"
                                style={{ backgroundColor: innerBox, borderColor: C.cardBorder, borderLeft: `5px solid ${cfg.accent}` }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.surfaceWhite; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = innerBox; }}>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap mb-1.5">
                                        <h3 className="truncate" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                            {row.title}
                                        </h3>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                                            style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '9px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            <StatusIcon size={11} /> {status.label}
                                        </span>
                                        {/* Show marks inline if graded */}
                                        {status.type === 'graded' && row.mySubmission?.grade != null && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                                                style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}`, fontSize: '10px', fontWeight: T.weight.black }}>
                                                <Award size={11} /> {row.mySubmission.grade}/{row.totalMarks}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1"
                                        style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>
                                        <span className="truncate max-w-[200px]">
                                            Course: <span style={{ color: C.heading }}>{row.courseTitle}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={13} />
                                            Due: {row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Due Date'}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Award size={13} /> {row.totalMarks} pts
                                        </span>
                                    </div>
                                </div>

                                <div className="shrink-0 flex gap-2 items-center pt-3 sm:pt-0 border-t sm:border-none" style={{ borderColor: C.cardBorder }}>
                                    {/* View Submission button for submitted/graded */}
                                    {isSubmittedOrGraded && (
                                        <button onClick={() => setViewRow(row)}
                                            className="flex items-center gap-1.5 h-10 px-4 rounded-xl cursor-pointer transition-all hover:scale-105 border font-bold"
                                            style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderColor: C.cardBorder, fontSize: T.size.xs, fontFamily: T.fontFamily, boxShadow: S.card }}>
                                            <Eye size={14} /> View Submission
                                        </button>
                                    )}

                                    {/* Primary action */}
                                    <Link href={`/student/courses/${row.courseId}/assignments/${row._id}`} className="text-decoration-none">
                                        <button className="h-10 px-5 rounded-xl cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm font-bold"
                                            style={isSubmittedOrGraded
                                                ? { backgroundColor: innerBox, color: C.heading, fontSize: T.size.xs, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }
                                                : { background: C.gradientBtn, color: '#fff', fontSize: T.size.xs, fontFamily: T.fontFamily }}>
                                            {isSubmittedOrGraded ? 'Open' : 'Upload Work'}
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: innerBox }}>
                        <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>
                            Page {currentPage} of {totalPages} · {filtered.length} assignments
                        </span>
                        <div className="flex items-center gap-2">
                            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-none transition-colors disabled:opacity-50"
                                style={{ backgroundColor: C.surfaceWhite, color: C.heading, border: `1px solid ${C.cardBorder}` }}>
                                <ChevronLeft size={16} />
                            </button>
                            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-none transition-colors disabled:opacity-50"
                                style={{ backgroundColor: C.surfaceWhite, color: C.heading, border: `1px solid ${C.cardBorder}` }}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Submission Drawer */}
            {viewRow && <SubmissionDrawer row={viewRow} onClose={() => setViewRow(null)} />}
        </div>
    );
}