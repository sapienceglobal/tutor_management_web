'use client';

import { useState, useEffect, useRef } from 'react';
import {
    CheckSquare, Sparkles, Loader2, ChevronDown,
    User, Clock, FileText, BarChart2, Star,
    ThumbsUp, AlertCircle, Share2, RotateCcw,
    BookOpen, Zap, Filter, Search, CheckCircle2,
    XCircle, Eye, Send, MoreHorizontal, Lightbulb,
    TrendingUp, Award, Target, Brain
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

// ─── Purple palette ───────────────────────────────────────────────────────────
const P = {
    primary: '#7C3AED',
    light: '#8B5CF6',
    soft: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg: '#F5F3FF',
};

// ─── Star rating display ──────────────────────────────────────────────────────
function StarRow({ count = 0, max = 5, color = '#F59E0B' }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }).map((_, i) => (
                <Star key={i} className="w-3 h-3"
                    style={{ color: i < count ? color : '#E2E8F0', fill: i < count ? color : 'none' }} />
            ))}
        </div>
    );
}

// ─── Circular progress ────────────────────────────────────────────────────────
function CircleProgress({ pct = 0, size = 80, stroke = 7, color = P.primary, label, sublabel }) {
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-1">
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDE9FE" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
                    strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ - dash}`} />
            </svg>
            <div className="text-center -mt-[72px] mb-[72px] flex flex-col items-center justify-center" style={{ height: size }}>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#1E293B' }}>{pct}%</p>
            </div>
            {label && <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#334155', textAlign: 'center' }}>{label}</p>}
            {sublabel && <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.regular, color: '#94A3B8', textAlign: 'center', maxWidth: 90, lineHeight: 1.3 }}>{sublabel}</p>}
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ h = 4, w = 'full', r = 'xl' }) {
    return <div className={`h-${h} w-${w} rounded-${r} animate-pulse`} style={{ backgroundColor: P.soft }} />;
}

// ─── Assignment card ──────────────────────────────────────────────────────────
function AssignmentCard({ assignment, isActive, onClick }) {
    const pct = assignment.stats?.total > 0
        ? Math.round((assignment.stats.graded / assignment.stats.total) * 100) : 0;
    return (
        <div onClick={onClick}
            className="p-3.5 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5"
            style={{
                backgroundColor: isActive ? P.soft : '#fff',
                border: isActive ? `1.5px solid ${P.primary}` : `1px solid ${P.border}`,
                boxShadow: isActive ? `0 0 0 3px ${P.primary}12` : S.card,
            }}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B' }}>
                        {assignment.title}
                    </p>
                    <p className="truncate mt-0.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                        {assignment.courseId?.title || 'No course'} · {assignment.totalMarks} marks
                    </p>
                </div>
                <span className="px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: assignment.stats?.pending > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.10)', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: assignment.stats?.pending > 0 ? '#D97706' : '#059669' }}>
                    {assignment.stats?.pending > 0 ? `${assignment.stats.pending} pending` : 'All graded'}
                </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1">
                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                        {assignment.stats?.graded || 0}/{assignment.stats?.total || 0} graded
                    </span>
                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>{pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: P.soft }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: P.gradient }} />
                </div>
            </div>
        </div>
    );
}

// ─── Submission row ───────────────────────────────────────────────────────────
function SubmissionRow({ sub, isActive, onSelect, onEvaluate, evaluating }) {
    const statusColor = sub.status === 'graded' ? '#10B981' : sub.status === 'returned' ? '#6366F1' : '#F59E0B';
    const statusLabel = sub.status === 'graded' ? 'Graded' : sub.status === 'returned' ? 'Returned' : 'Pending';

    return (
        <div onClick={() => onSelect(sub)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
            style={{ backgroundColor: isActive ? P.soft : 'transparent', borderBottom: `1px solid ${P.border}` }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.04)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                style={{ background: P.gradient }}>
                {sub.studentId?.name?.[0]?.toUpperCase() || 'S'}
            </div>

            <div className="flex-1 min-w-0">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: '#1E293B' }}>
                    {sub.studentId?.name || 'Student'}
                </p>
                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{sub.timeAgo}</p>
            </div>

            {/* Grade badge */}
            {sub.status === 'graded' && sub.grade != null && (
                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: P.primary }}>
                    {sub.grade}
                </span>
            )}

            {/* Status */}
            <span className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${statusColor}12`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: statusColor }}>
                {statusLabel}
            </span>

            {/* Evaluate button */}
            {sub.status === 'submitted' && (
                <button onClick={e => { e.stopPropagation(); onEvaluate(sub); }}
                    disabled={evaluating}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ background: P.gradient, flexShrink: 0 }}>
                    {evaluating
                        ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                        : <Sparkles className="w-3 h-3 text-white" />}
                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color: '#fff' }}>AI Eval</span>
                </button>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssignmentEvaluatorPage() {
    // ── Data ───────────────────────────────────────────────────────
    const [assignments, setAssignments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [selectedSub, setSelectedSub] = useState(null);
    const [evaluation, setEvaluation] = useState(null);

    // ── UI state ───────────────────────────────────────────────────
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [bulkEvaluating, setBulkEvaluating] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [courseFilter, setCourseFilter] = useState('');
    const [searchQ, setSearchQ] = useState('');

    // ── Editable grade state (tutor can tweak AI suggestion) ───────
    const [editGrade, setEditGrade] = useState('');
    const [editFeedback, setEditFeedback] = useState('');

    // ── Load assignments ───────────────────────────────────────────
    useEffect(() => {
        loadAssignments();
    }, [courseFilter]);

    const loadAssignments = async () => {
        setLoadingAssignments(true);
        try {
            const params = courseFilter ? `?courseId=${courseFilter}` : '';
            const [assignRes, courseRes] = await Promise.all([
                api.get(`/ai/evaluator/assignments${params}`),
                api.get('/courses/my-courses'),
            ]);
            if (assignRes.data?.success) setAssignments(assignRes.data.assignments || []);
            if (courseRes.data?.success) setCourses((courseRes.data.courses || []).map(c => ({ _id: c._id, title: c.title })));
        } catch { toast.error('Failed to load assignments'); }
        finally { setLoadingAssignments(false); }
    };

    // ── Load submissions when assignment selected ──────────────────
    const selectAssignment = async (assignment) => {
        setSelectedAssignment(assignment);
        setSelectedSub(null);
        setEvaluation(null);
        setLoadingSubmissions(true);
        try {
            const res = await api.get(`/ai/evaluator/assignments/${assignment._id}/submissions`);
            if (res.data?.success) setSubmissions(res.data.submissions || []);
        } catch { toast.error('Failed to load submissions'); }
        finally { setLoadingSubmissions(false); }
    };

    // ── AI evaluate single submission ──────────────────────────────
    const evaluateSubmission = async (sub) => {
        setSelectedSub(sub);
        setEvaluation(null);
        setEvaluating(true);
        try {
            const res = await api.post(`/ai/evaluator/submissions/${sub._id}/evaluate`);
            if (res.data?.success) {
                setEvaluation(res.data.evaluation);
                setEditGrade(String(res.data.evaluation.grade ?? ''));
                setEditFeedback(res.data.evaluation.overallFeedback || '');
            } else { toast.error(res.data?.message || 'Evaluation failed'); }
        } catch (e) { toast.error(e?.response?.data?.message || 'AI evaluation failed'); }
        finally { setEvaluating(false); }
    };

    // ── Confirm & save grade ───────────────────────────────────────
    const confirmGrade = async () => {
        if (!evaluation || !selectedSub) return;
        setConfirming(true);
        try {
            const res = await api.post(`/ai/evaluator/submissions/${selectedSub._id}/confirm-grade`, {
                grade: Number(editGrade),
                feedback: editFeedback,
                rubricScores: evaluation.rubricScores || [],
            });
            if (res.data?.success) {
                toast.success('Grade saved & student notified!');
                // Update local submission list
                setSubmissions(prev => prev.map(s =>
                    s._id === selectedSub._id
                        ? { ...s, status: 'graded', grade: Number(editGrade) }
                        : s
                ));
                // Refresh assignment stats
                loadAssignments();
            } else { toast.error(res.data?.message || 'Failed to save grade'); }
        } catch (e) { toast.error(e?.response?.data?.message || 'Failed to save grade'); }
        finally { setConfirming(false); }
    };

    // ── Bulk evaluate ──────────────────────────────────────────────
    const handleBulkEvaluate = async () => {
        if (!selectedAssignment) return;
        const pending = submissions.filter(s => s.status === 'submitted').length;
        if (pending === 0) return toast.error('No pending submissions to evaluate');
        if (!confirm(`AI will evaluate ${pending} pending submission(s). Continue?`)) return;

        setBulkEvaluating(true);
        try {
            const res = await api.post(`/ai/evaluator/assignments/${selectedAssignment._id}/bulk-evaluate`);
            if (res.data?.success) {
                toast.success(`Bulk evaluated ${res.data.total} submissions! Review and confirm each.`);
                // Reload submissions
                await selectAssignment(selectedAssignment);
            }
        } catch (e) { toast.error(e?.response?.data?.message || 'Bulk evaluation failed'); }
        finally { setBulkEvaluating(false); }
    };

    // ── Filtered assignments ───────────────────────────────────────
    const filteredAssignments = assignments.filter(a =>
        !searchQ || a.title?.toLowerCase().includes(searchQ.toLowerCase())
    );

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-4 h-full p-4" style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg }}>

            {/* ── PANEL 1: Assignment list ─────────────────────────────── */}
            <div className="flex flex-col gap-3 w-[260px] flex-shrink-0">

                {/* Header */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ background: P.gradient, boxShadow: '0 6px 24px rgba(124,58,237,0.30)', position: 'relative', overflow: 'hidden' }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute rounded-full"
                            style={{ width: 2, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', left: `${10 + i * 16}%`, top: `${20 + (i % 3) * 28}%` }} />
                    ))}
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                            <CheckSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#fff' }}>Assignment Evaluator</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: 'rgba(255,255,255,0.75)' }}>Let AI help you grade</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                            placeholder="Search assignments…"
                            className="w-full pl-8 pr-3 py-2 rounded-xl outline-none"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: '#fff' }} />
                    </div>
                    {/* Course filter */}
                    <div className="relative">
                        <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
                            className="w-full appearance-none pl-8 pr-7 py-2 rounded-xl outline-none"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: '#fff' }}>
                            <option value="">All Courses</option>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                    </div>
                </div>

                {/* Assignment list */}
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                    {loadingAssignments ? (
                        [...Array(4)].map((_, i) => <div key={i} className="rounded-2xl p-3.5" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}` }}><Sk h={4} /><div className="mt-2"><Sk h={3} w="3/4" /></div></div>)
                    ) : filteredAssignments.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckSquare className="w-10 h-10 mx-auto mb-2" style={{ color: `${P.primary}30` }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1' }}>No assignments found</p>
                        </div>
                    ) : filteredAssignments.map(a => (
                        <AssignmentCard key={a._id} assignment={a}
                            isActive={selectedAssignment?._id === a._id}
                            onClick={() => selectAssignment(a)} />
                    ))}
                </div>
            </div>

            {/* ── PANEL 2: Submissions + Upload ───────────────────────── */}
            <div className="flex flex-col gap-3 w-[280px] flex-shrink-0">

                {!selectedAssignment ? (
                    <div className="flex-1 flex items-center justify-center rounded-2xl"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}` }}>
                        <div className="text-center px-6">
                            <Brain className="w-12 h-12 mx-auto mb-3" style={{ color: `${P.primary}35` }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#94A3B8' }}>
                                Select an assignment to view submissions
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Upload / Assignment info */}
                        <div className="rounded-2xl overflow-hidden flex-shrink-0"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            {/* Header */}
                            <div className="px-4 py-3" style={{ background: 'linear-gradient(135deg,#EDE9FE,#F5F3FF)', borderBottom: `1px solid ${P.border}` }}>
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>UPLOAD ASSIGNMENT</p>
                            </div>
                            <div className="p-4">
                                {/* File type icons */}
                                <div className="flex items-center justify-center gap-4 mb-3">
                                    {[{ label: 'DOCX', color: '#3B82F6' }, { label: 'PDF', color: '#EF4444' }, { label: 'Paste Text', color: P.primary }].map((f, i) => (
                                        <div key={f.label} className="flex flex-col items-center gap-1">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${f.color}12`, border: `1px solid ${f.color}20` }}>
                                                <FileText className="w-4 h-4" style={{ color: f.color }} />
                                            </div>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>{f.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8', textAlign: 'center', marginBottom: 10 }}>
                                    Drag and drop files DOCX, PDF or paste text
                                </p>
                                {/* Assignment info */}
                                <div className="p-2.5 rounded-xl mb-2" style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: P.primary }} />
                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#334155' }}>
                                            {selectedAssignment.title}
                                        </p>
                                    </div>
                                </div>
                                {/* Bulk evaluate */}
                                <button onClick={handleBulkEvaluate} disabled={bulkEvaluating}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                                    style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff', boxShadow: '0 4px 14px rgba(124,58,237,0.30)' }}>
                                    {bulkEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                    {bulkEvaluating ? 'Bulk Evaluating…' : 'Bulk AI Evaluate All'}
                                </button>
                            </div>
                        </div>

                        {/* Submissions list */}
                        <div className="flex-1 rounded-2xl overflow-hidden flex flex-col"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: `1px solid ${P.border}` }}>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>
                                    Submissions
                                </p>
                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                                    {submissions.length} total
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {loadingSubmissions ? (
                                    <div className="p-4 space-y-3">
                                        {[...Array(4)].map((_, i) => <div key={i} className="flex items-center gap-3"><div className="w-9 h-9 rounded-full animate-pulse" style={{ backgroundColor: P.soft }} /><div className="flex-1 space-y-1.5"><Sk h={3} /><Sk h={3} w="1/2" /></div></div>)}
                                    </div>
                                ) : submissions.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1' }}>No submissions yet</p>
                                    </div>
                                ) : submissions.map(sub => (
                                    <SubmissionRow key={sub._id} sub={sub}
                                        isActive={selectedSub?._id === sub._id}
                                        onSelect={s => { setSelectedSub(s); if (s.status !== 'graded') setEvaluation(null); }}
                                        onEvaluate={evaluateSubmission}
                                        evaluating={evaluating && selectedSub?._id === sub._id} />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── PANEL 3: Evaluation result ───────────────────────────── */}
            <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto custom-scrollbar">

                {!selectedSub && !evaluating ? (
                    <div className="flex-1 flex items-center justify-center rounded-2xl"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}` }}>
                        <div className="text-center px-8">
                            <Sparkles className="w-14 h-14 mx-auto mb-4" style={{ color: `${P.primary}35` }} />
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#3B0764', marginBottom: 8 }}>
                                Select a Submission
                            </h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#7C3AED', lineHeight: 1.6 }}>
                                Click "AI Eval" on any pending submission to get instant AI-powered evaluation with grade, feedback & detailed analysis.
                            </p>
                        </div>
                    </div>
                ) : evaluating ? (
                    <div className="flex-1 flex flex-col items-center justify-center rounded-2xl gap-4"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}` }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: P.gradient, boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                            <Sparkles className="w-8 h-8 text-white animate-pulse" />
                        </div>
                        <div className="text-center">
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 4 }}>AI is evaluating submission…</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>Analyzing content, rubric & generating feedback</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl" style={{ backgroundColor: P.soft }}>
                            {[0, 1, 2].map(i => (
                                <span key={i} className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: P.primary, animation: `ev-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                            ))}
                            <style>{`@keyframes ev-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}`}</style>
                        </div>
                    </div>
                ) : evaluation ? (
                    <>
                        {/* Grade & Feedback header */}
                        <div className="rounded-2xl overflow-hidden flex-shrink-0"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            <div className="px-4 py-2.5" style={{ background: 'linear-gradient(135deg,#EDE9FE,#F5F3FF)', borderBottom: `1px solid ${P.border}` }}>
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>GRADE &amp; FEEDBACK</p>
                            </div>
                            <div className="p-4 flex gap-4 items-start">
                                {/* Big grade */}
                                <div className="flex flex-col items-center flex-shrink-0">
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '48px', fontWeight: T.weight.black, color: P.primary, lineHeight: 1 }}>
                                        {evaluation.letterGrade || 'B+'}
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                                        AI Grade: <strong style={{ color: '#1E293B' }}>{evaluation.grade}</strong>/{selectedAssignment?.totalMarks}
                                    </p>
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* Editable feedback */}
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#64748B', marginBottom: 4 }}>Feedback:</p>
                                    <textarea value={editFeedback} onChange={e => setEditFeedback(e.target.value)}
                                        rows={4} className="w-full resize-none outline-none p-2.5 rounded-xl"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft, lineHeight: 1.55 }} />
                                    {/* Editable grade */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B', fontWeight: T.weight.semibold }}>Final Grade:</label>
                                        <input type="number" value={editGrade} onChange={e => setEditGrade(e.target.value)}
                                            min={0} max={selectedAssignment?.totalMarks}
                                            className="w-20 px-2.5 py-1.5 rounded-xl outline-none text-center"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.primary, border: `1.5px solid ${P.border}`, backgroundColor: '#fff' }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>/ {selectedAssignment?.totalMarks}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Strengths + Areas for Improvement */}
                        <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                            <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <ThumbsUp className="w-4 h-4" style={{ color: '#10B981' }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Strengths</p>
                                </div>
                                <div className="space-y-1.5">
                                    {(evaluation.strengths || []).map((s, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#10B981' }} />
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.5 }}>{s}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertCircle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Areas for Improvement</p>
                                </div>
                                <div className="space-y-1.5">
                                    {(evaluation.areasForImprovement || []).map((a, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#F59E0B' }} />
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.5 }}>{a}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Analysis — 4 circular gauges */}
                        <div className="rounded-2xl p-4 flex-shrink-0" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>DETAILED ANALYSIS</p>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { key: 'accuracy', label: 'Accuracy', color: '#10B981', icon: Target },
                                    { key: 'depthOfKnowledge', label: 'Depth of Knowledge', color: '#F59E0B', icon: BookOpen },
                                    { key: 'clarity', label: 'Clarity', color: P.primary, icon: Lightbulb },
                                    { key: 'realWorldApplication', label: 'Real-World Application', color: '#3B82F6', icon: TrendingUp },
                                ].map(dim => {
                                    const d = evaluation.detailedAnalysis?.[dim.key] || { score: 0, label: '', stars: 0 };
                                    return (
                                        <div key={dim.key} className="flex flex-col items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: P.soft }}>
                                            <CircleProgress pct={d.score} size={76} stroke={6} color={dim.color} />
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#334155', textAlign: 'center' }}>{dim.label}</p>
                                            <StarRow count={d.stars} color={dim.color} />
                                            {d.label && <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', textAlign: 'center', lineHeight: 1.3 }}>{d.label}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Rubric scores */}
                        {(evaluation.rubricScores || []).length > 0 && (
                            <div className="rounded-2xl p-4 flex-shrink-0" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 12 }}>Rubric Scores</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {evaluation.rubricScores.map((r, i) => (
                                        <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#334155', marginBottom: 4 }}>{r.criterion}</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: P.primary }}>
                                                {r.score}<span style={{ fontSize: T.size.xs, color: '#94A3B8' }}>/{r.maxScore}</span>
                                            </p>
                                            {r.comment && <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', marginTop: 2, lineHeight: 1.4 }}>{r.comment}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confirm grade button */}
                        {selectedSub?.status !== 'graded' && (
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={confirmGrade} disabled={confirming}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all hover:opacity-90 disabled:opacity-50"
                                    style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#fff', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
                                    {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {confirming ? 'Saving Grade…' : 'Confirm & Save Grade'}
                                </button>
                                <button onClick={() => evaluateSubmission(selectedSub)}
                                    className="px-4 py-3 rounded-2xl flex items-center gap-2 transition-all hover:opacity-80"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}>
                                    <RotateCcw className="w-3.5 h-3.5" /> Re-evaluate
                                </button>
                            </div>
                        )}
                        {selectedSub?.status === 'graded' && (
                            <div className="flex items-center gap-2 p-3 rounded-2xl flex-shrink-0"
                                style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)' }}>
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#10B981' }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#065F46' }}>
                                    This submission is already graded ({selectedSub.grade}/{selectedAssignment?.totalMarks}). Student has been notified.
                                </p>
                            </div>
                        )}
                    </>
                ) : selectedSub ? (
                    <div className="flex-1 rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}` }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B', marginBottom: 8 }}>
                            Submission by {selectedSub.studentId?.name}
                        </p>
                        <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, minHeight: 120 }}>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                                {selectedSub.content || '[No text content — see attachments]'}
                            </p>
                        </div>
                        {(selectedSub.attachments || []).length > 0 && (
                            <div className="space-y-2">
                                {selectedSub.attachments.map((att, i) => (
                                    <a key={i} href={att.url} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:opacity-80"
                                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}` }}>
                                        <FileText className="w-4 h-4" style={{ color: P.primary }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155' }}>{att.name}</span>
                                    </a>
                                ))}
                            </div>
                        )}
                        {selectedSub.status === 'submitted' && (
                            <button onClick={() => evaluateSubmission(selectedSub)}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl"
                                style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#fff', boxShadow: '0 4px 14px rgba(124,58,237,0.30)' }}>
                                <Sparkles className="w-4 h-4" /> Evaluate with AI
                            </button>
                        )}
                    </div>
                ) : null}
            </div>

            {/* ── PANEL 4: Right sidebar ───────────────────────────────── */}
            <div className="flex flex-col gap-3 w-[220px] flex-shrink-0 overflow-y-auto custom-scrollbar">

                {/* Grade & Feedback mini */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>GRADE &amp; FEEDBACK</p>
                    {evaluation ? (
                        <>
                            <p style={{ fontFamily: T.fontFamily, fontSize: '42px', fontWeight: T.weight.black, color: P.primary, textAlign: 'center', lineHeight: 1 }}>
                                {evaluation.letterGrade}
                            </p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8', textAlign: 'center', marginBottom: 12 }}>
                                {evaluation.grade}/{selectedAssignment?.totalMarks} marks
                            </p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#334155', marginBottom: 6 }}>Feedback:</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B', lineHeight: 1.55 }}>
                                {evaluation.overallFeedback}
                            </p>
                            <div className="mt-4 space-y-2">
                                <button onClick={confirmGrade} disabled={confirming || selectedSub?.status === 'graded'}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl disabled:opacity-50"
                                    style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff' }}>
                                    <Eye className="w-3.5 h-3.5" /> View Detailed Report
                                </button>
                                <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}>
                                    <RotateCcw className="w-3.5 h-3.5" /> Request Corrections
                                </button>
                                <button onClick={() => { if (selectedSub) { toast.success('Shared with student!'); } }}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl"
                                    style={{ background: 'linear-gradient(135deg,#059669,#10B981)', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff' }}>
                                    <Share2 className="w-3.5 h-3.5" /> Share with Student
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <Award className="w-10 h-10 mx-auto mb-2" style={{ color: `${P.primary}30` }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1' }}>Grade will appear here after AI evaluation</p>
                        </div>
                    )}
                </div>

                {/* Tips */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" style={{ color: '#F59E0B' }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Tips</p>
                        </div>
                        <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                    </div>
                    {[
                        '🎯 Focus on key concepts in responses!',
                        '📋 Add rubric to assignments for better AI scoring.',
                        '⚡ Use Bulk Evaluate for faster grading.',
                        '✏️ You can edit AI grade before confirming.',
                    ].map((tip, i) => (
                        <p key={i} style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B', lineHeight: 1.5, marginBottom: 6 }}>{tip}</p>
                    ))}
                </div>
            </div>
        </div>
    );
}