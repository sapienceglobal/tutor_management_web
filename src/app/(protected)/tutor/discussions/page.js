'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { 
    MdWarning, MdCheckCircle, MdVisibilityOff, MdFlag, MdHourglassEmpty,
    MdForum, MdSearch, MdSend, MdVerifiedUser, MdRefresh
} from 'react-icons/md';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard'; // Global StatCard Component

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
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}30`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: `1.5px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

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
        return { bg: C.innerBg, border: C.cardBorder, color: C.textMuted };
    };

    const pendingReplies = useMemo(() => {
        return comments.filter((comment) => !comment.tutorReply).length;
    }, [comments]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <MdHourglassEmpty className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading discussions...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen pb-24 space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: C.iconBg, borderRadius: '10px' }}>
                        <MdForum size={24} color={C.iconColor} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>Discussion Forum</h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.semibold, margin: 0 }}>Moderate lesson discussions and reply to student comments.</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchModeration(false)}
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-colors hover:bg-opacity-80 shadow-sm w-full sm:w-auto"
                    style={{ backgroundColor: C.innerBg, color: C.btnPrimary, borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}
                >
                    {refreshing ? <MdHourglassEmpty size={18} className="animate-spin" /> : <MdRefresh size={18} />} Refresh
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-in fade-in duration-500 delay-100">
                <StatCard label="Total Comments" value={summary?.total ?? 0} subtext="Across your lessons" icon={MdForum} iconBg={C.iconBg} iconColor={C.btnPrimary} />
                <StatCard label="Flagged" value={summary?.flagged ?? 0} subtext="Need moderation" icon={MdFlag} iconBg={(summary?.flagged ?? 0) > 0 ? C.warningBg : C.iconBg} iconColor={(summary?.flagged ?? 0) > 0 ? C.warning : C.btnPrimary} />
                <StatCard label="Hidden" value={summary?.hidden ?? 0} subtext="Currently hidden" icon={MdVisibilityOff} iconBg={(summary?.hidden ?? 0) > 0 ? C.dangerBg : C.iconBg} iconColor={(summary?.hidden ?? 0) > 0 ? C.danger : C.btnPrimary} />
                <StatCard label="Pending Replies" value={pendingReplies} subtext="No tutor reply yet" icon={MdWarning} iconBg={pendingReplies > 0 ? C.warningBg : C.successBg} iconColor={pendingReplies > 0 ? C.warning : C.success} />
            </div>

            {/* Filters Area */}
            <div className="p-5 flex flex-col md:flex-row gap-4 items-center justify-between animate-in fade-in duration-500 delay-200" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="relative w-full md:flex-1">
                    <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2" size={18} color={C.textMuted} />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by comment, student, lesson..."
                        style={{ ...baseInputStyle, paddingLeft: '40px', backgroundColor: C.surfaceWhite }}
                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, width: '100%', minWidth: '180px', cursor: 'pointer' }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, width: '100%', minWidth: '180px', cursor: 'pointer' }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                        <option value="all">All Courses</option>
                        {courses.map((course) => (
                            <option key={course._id} value={course._id}>{course.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Comments List */}
            {comments.length > 0 ? (
                <div className="space-y-4 animate-in fade-in duration-500 delay-300">
                    {comments.map((comment) => {
                        const tone = statusTone(comment.moderationStatus);
                        const isBusy = moderatingFor === comment._id || submittingReplyFor === comment._id;

                        return (
                            <div key={comment._id} className="p-6 transition-all" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                
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
                                                <span style={{ fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, letterSpacing: T.tracking.wider }}>
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, margin: 0 }}>
                                                {comment.lesson?.courseTitle || 'Unknown Course'} <span style={{ color: C.textMuted, margin: '0 4px' }}>•</span> <span style={{ color: C.text }}>{comment.lesson?.title || 'Lesson'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center shrink-0 h-fit" style={{ fontSize: '10px', fontWeight: T.weight.black, padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: T.tracking.wider, backgroundColor: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}>
                                        {comment.moderationStatus}
                                    </span>
                                </div>

                                {/* Comment Body */}
                                <div className="p-4 mb-4" style={{ backgroundColor: C.surfaceWhite, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                        {comment.text}
                                    </p>
                                </div>

                                {/* Reply Section */}
                                {comment.tutorReply ? (
                                    <div className="p-4 ml-4 sm:ml-12" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                        <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: '0 0 6px 0' }}>Tutor Reply</p>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                            {comment.tutorReply.text}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="ml-4 sm:ml-12 space-y-3">
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
                                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}
                                            >
                                                {submittingReplyFor === comment._id ? <MdHourglassEmpty size={16} className="animate-spin" /> : <MdSend size={16} />} Reply
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2 pt-4 mt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                    <button onClick={() => moderate(comment._id, 'flag')} disabled={isBusy} className="flex items-center justify-center gap-1.5 h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-50 shadow-sm"
                                        style={{ backgroundColor: C.warningBg, color: C.warning, borderRadius: '8px', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.warningBorder}` }}>
                                        <MdFlag size={14} /> Flag
                                    </button>

                                    {comment.moderationStatus === 'hidden' ? (
                                        <button onClick={() => moderate(comment._id, 'unhide')} disabled={isBusy} className="flex items-center justify-center gap-1.5 h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-50 shadow-sm"
                                            style={{ backgroundColor: C.successBg, color: C.success, borderRadius: '8px', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.successBorder}` }}>
                                            <MdVerifiedUser size={14} /> Unhide
                                        </button>
                                    ) : (
                                        <button onClick={() => moderate(comment._id, 'hide')} disabled={isBusy} className="flex items-center justify-center gap-1.5 h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-50 shadow-sm"
                                            style={{ backgroundColor: C.dangerBg, color: C.danger, borderRadius: '8px', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.dangerBorder}` }}>
                                            <MdVisibilityOff size={14} /> Hide
                                        </button>
                                    )}

                                    <button onClick={() => moderate(comment._id, 'resolve')} disabled={isBusy} className="flex items-center justify-center gap-1.5 h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-50 shadow-sm"
                                        style={{ backgroundColor: C.successBg, color: C.success, borderRadius: '8px', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.successBorder}` }}>
                                        <MdCheckCircle size={14} /> Resolve
                                    </button>
                                </div>

                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 flex flex-col items-center animate-in fade-in duration-500" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                    <div className="flex items-center justify-center mb-4" style={{ width: 64, height: 64, backgroundColor: C.innerBg, borderRadius: '12px' }}>
                        <MdForum size={32} color={C.textMuted} style={{ opacity: 0.5 }} />
                    </div>
                    <p style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No comments found</p>
                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>No discussion comments matched your current filters.</p>
                </div>
            )}
        </div>
    );
}