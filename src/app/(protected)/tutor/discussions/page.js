'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import {
    AlertTriangle, CheckCircle2, EyeOff, Flag, Loader2,
    MessageCircle, Search, Send, ShieldCheck, RefreshCw, XCircle
} from 'lucide-react';
import { C, T, FX, S, R } from '@/constants/tutorTokens';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'visible', label: 'Visible' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'hidden', label: 'Hidden' },
];

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: '1.5px solid transparent',
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

function StatCard({ title, value, sub, icon: Icon, tone = 'default' }) {
    const toneMap = {
        default: { bg: '#E3DFF8', color: C.btnPrimary },
        success: { bg: C.successBg, color: C.success },
        warning: { bg: C.warningBg, color: C.warning },
        danger: { bg: C.dangerBg, color: C.danger },
    };
    const style = toneMap[tone] || toneMap.default;
    return (
        <div className="p-5 flex flex-col justify-between transition-transform hover:-translate-y-0.5" 
            style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, minHeight: '120px' }}>
            <div className="flex items-center justify-between gap-2 mb-2">
                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', margin: 0 }}>
                    {title}
                </p>
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: style.bg, borderRadius: R.xl }}>
                    <Icon size={20} color={style.color} />
                </div>
            </div>
            <div className="mt-auto">
                <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: style.color === C.btnPrimary ? C.heading : style.color, margin: 0, lineHeight: 1 }}>
                    {value}
                </p>
                {sub && (
                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: '6px 0 0 0' }}>
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function TutorDiscussionsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submittingReplyFor, setSubmittingReplyFor] = useState('');
    const [moderatingFor, setModeratingFor] = useState('');
    const [summary, setSummary] = useState(null);
    const [courses, setCourses] = useState([]);
    const [comments, setComments] = useState([]);

    const [statusFilter, setStatusFilter] = useState('all');
    const [courseFilter, setCourseFilter] = useState('all');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [replyDrafts, setReplyDrafts] = useState({});

    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchModeration(loading);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, courseFilter, search]);

    const fetchModeration = async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            else setRefreshing(true);

            const res = await api.get('/comments/moderation', {
                params: {
                    status: statusFilter,
                    courseId: courseFilter !== 'all' ? courseFilter : undefined,
                    search: search || undefined,
                },
            });

            if (res.data?.success) {
                setSummary(res.data.summary || null);
                setCourses(res.data.courses || []);
                setComments(res.data.comments || []);
            } else {
                toast.error('Failed to load discussions');
            }
        } catch (error) {
            console.error('Discussion fetch error:', error);
            toast.error('Failed to load discussions');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyCommentUpdate = (updated) => {
        setComments((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    };

    const moderate = async (commentId, action, reason = '') => {
        try {
            setModeratingFor(commentId);
            const res = await api.patch(`/comments/moderation/${commentId}`, { action, reason });
            if (res.data?.success && res.data.comment) {
                applyCommentUpdate(res.data.comment);
                toast.success('Comment updated');
            } else {
                toast.error('Failed to update comment');
            }
        } catch (error) {
            console.error('Moderation error:', error);
            toast.error(error.response?.data?.message || 'Failed to update comment');
        } finally {
            setModeratingFor('');
            fetchModeration(false);
        }
    };

    const submitReply = async (commentId) => {
        const text = String(replyDrafts[commentId] || '').trim();
        if (!text) return toast.error('Reply text required');

        try {
            setSubmittingReplyFor(commentId);
            const res = await api.post(`/comments/${commentId}/reply`, { text });
            if (res.data?.success && res.data.comment) {
                applyCommentUpdate(res.data.comment);
                setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
                toast.success('Reply posted');
            } else {
                toast.error('Failed to post reply');
            }
        } catch (error) {
            console.error('Reply error:', error);
            toast.error(error.response?.data?.message || 'Failed to post reply');
        } finally {
            setSubmittingReplyFor('');
            fetchModeration(false);
        }
    };

    const statusTone = (status) => {
        if (status === 'hidden') return { bg: C.dangerBg, border: C.dangerBorder, color: C.danger };
        if (status === 'flagged') return { bg: C.warningBg, border: C.warningBorder, color: C.warning };
        if (status === 'resolved') return { bg: C.successBg, border: C.successBorder, color: C.success };
        return { bg: C.surfaceWhite, border: C.cardBorder, color: C.heading };
    };

    const pendingReplies = useMemo(() => {
        return comments.filter((comment) => !comment.tutorReply).length;
    }, [comments]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading discussions...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 pb-24 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <MessageCircle size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>Discussion Forum</h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>Moderate lesson discussions and reply to student comments.</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchModeration(false)}
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                    style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                >
                    {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Refresh
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Total Comments" value={summary?.total ?? 0} sub="Across your lessons" icon={MessageCircle} />
                <StatCard title="Flagged" value={summary?.flagged ?? 0} sub="Need moderation" icon={Flag} tone={(summary?.flagged ?? 0) > 0 ? 'warning' : 'default'} />
                <StatCard title="Hidden" value={summary?.hidden ?? 0} sub="Currently hidden" icon={EyeOff} tone={(summary?.hidden ?? 0) > 0 ? 'danger' : 'default'} />
                <StatCard title="Pending Replies" value={pendingReplies} sub="No tutor reply yet" icon={AlertTriangle} tone={pendingReplies > 0 ? 'warning' : 'success'} />
            </div>

            {/* Filters Area */}
            <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by comment, student, lesson..."
                        style={{ ...baseInputStyle, paddingLeft: '36px', backgroundColor: C.surfaceWhite }}
                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, width: '160px' }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, width: '160px' }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                        <option value="all">All Courses</option>
                        {courses.map((course) => (
                            <option key={course._id} value={course._id}>{course.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Comments List */}
            {comments.length > 0 ? (
                <div className="space-y-4">
                    {comments.map((comment) => {
                        const tone = statusTone(comment.moderationStatus);
                        const isBusy = moderatingFor === comment._id || submittingReplyFor === comment._id;

                        return (
                            <div key={comment._id} className="p-6 transition-all" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold" style={{ backgroundColor: C.btnPrimary }}>
                                            {comment.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                                    {comment.student?.name || 'Student'}
                                                </p>
                                                <span style={{ fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold }}>
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, margin: 0 }}>
                                                {comment.lesson?.courseTitle || 'Unknown Course'} <span style={{ color: C.textMuted, margin: '0 4px' }}>•</span> <span style={{ color: C.text }}>{comment.lesson?.title || 'Lesson'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center shrink-0 h-fit" style={{ fontSize: '10px', fontWeight: T.weight.black, padding: '4px 10px', borderRadius: R.md, textTransform: 'uppercase', backgroundColor: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}>
                                        {comment.moderationStatus}
                                    </span>
                                </div>

                                {/* Comment Body */}
                                <div className="p-4 mb-4" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                        {comment.text}
                                    </p>
                                </div>

                                {/* Reply Section */}
                                {comment.tutorReply ? (
                                    <div className="p-4 ml-6 sm:ml-12" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                        <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, textTransform: 'uppercase', margin: '0 0 6px 0' }}>Tutor Reply</p>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                            {comment.tutorReply.text}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="ml-6 sm:ml-12 space-y-3">
                                        <textarea
                                            value={replyDrafts[comment._id] || ''}
                                            onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [comment._id]: e.target.value }))}
                                            rows={2}
                                            placeholder="Write a reply..."
                                            style={{ ...baseInputStyle, resize: 'vertical', minHeight: '60px', backgroundColor: C.surfaceWhite }}
                                            onFocus={onFocusHandler} onBlur={onBlurHandler}
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => submitReply(comment._id)}
                                                disabled={isBusy}
                                                className="flex items-center justify-center gap-2 h-10 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
                                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                                            >
                                                {submittingReplyFor === comment._id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Reply
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2 pt-4 mt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                    <button onClick={() => moderate(comment._id, 'flag')} disabled={isBusy} className="flex items-center justify-center gap-1.5 h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-50"
                                        style={{ backgroundColor: C.warningBg, color: C.warning, borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.warningBorder}` }}>
                                        <Flag size={14} /> Flag
                                    </button>

                                    {comment.moderationStatus === 'hidden' ? (
                                        <button onClick={() => moderate(comment._id, 'unhide')} disabled={isBusy} className="flex items-center justify-center gap-1.5 h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-50"
                                            style={{ backgroundColor: C.successBg, color: C.success, borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.successBorder}` }}>
                                            <ShieldCheck size={14} /> Unhide
                                        </button>
                                    ) : (
                                        <button onClick={() => moderate(comment._id, 'hide')} disabled={isBusy} className="flex items-center justify-center gap-1.5 h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-50"
                                            style={{ backgroundColor: C.dangerBg, color: C.danger, borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.dangerBorder}` }}>
                                            <EyeOff size={14} /> Hide
                                        </button>
                                    )}

                                    <button onClick={() => moderate(comment._id, 'resolve')} disabled={isBusy} className="flex items-center justify-center gap-1.5 h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-50"
                                        style={{ backgroundColor: C.successBg, color: C.success, borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.successBorder}` }}>
                                        <CheckCircle2 size={14} /> Resolve
                                    </button>
                                </div>

                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 flex flex-col items-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                    <MessageCircle size={48} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <p style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 8px 0' }}>No comments found</p>
                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>No discussion comments matched your current filters.</p>
                </div>
            )}
        </div>
    );
}