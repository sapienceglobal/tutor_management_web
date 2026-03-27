'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, EyeOff, Flag, Loader2, MessageCircle, Search, Send, ShieldCheck } from 'lucide-react';
import { C, T, FX, S, pageStyle } from '@/constants/tutorTokens';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'visible', label: 'Visible' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'hidden', label: 'Hidden' },
];

function Card({ title, value, sub, icon: Icon, tone = 'default' }) {
    const toneMap = {
        default: { bg: FX.primary08, color: C.btnPrimary },
        success: { bg: C.successBg, color: C.success },
        warning: { bg: C.warningBg, color: C.warning },
        danger: { bg: C.dangerBg, color: C.danger },
    };
    const style = toneMap[tone] || toneMap.default;
    return (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
            <div className="flex items-center justify-between mb-3">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.bold }}>{title}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: style.bg }}>
                    <Icon className="w-4 h-4" style={{ color: style.color }} />
                </div>
            </div>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], color: C.heading, fontWeight: T.weight.black, lineHeight: T.leading.tight }}>{value}</p>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>{sub}</p>
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
                toast.error('Failed to load discussion moderation');
            }
        } catch (error) {
            console.error('Discussion moderation fetch error:', error);
            toast.error('Failed to load discussion moderation');
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
        return { bg: FX.primary08, border: FX.primary20, color: C.btnPrimary };
    };

    const pendingReplies = useMemo(() => {
        return comments.filter((comment) => !comment.tutorReply).length;
    }, [comments]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>Loading discussions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={pageStyle}>
            <div className="rounded-2xl px-5 py-4 flex items-center justify-between gap-3" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}>
                        <MessageCircle className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>Discussion Forum</h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>Moderate lesson discussions and reply to student comments</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchModeration(false)}
                    disabled={refreshing}
                    className="px-3 py-2 rounded-xl border text-xs font-semibold disabled:opacity-60"
                    style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
                >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card title="Total Comments" value={summary?.total ?? 0} sub="Across your lessons" icon={MessageCircle} />
                <Card title="Flagged" value={summary?.flagged ?? 0} sub="Need moderation" icon={Flag} tone={(summary?.flagged ?? 0) > 0 ? 'warning' : 'default'} />
                <Card title="Hidden" value={summary?.hidden ?? 0} sub="Currently hidden" icon={EyeOff} tone={(summary?.hidden ?? 0) > 0 ? 'danger' : 'default'} />
                <Card title="Pending Replies" value={pendingReplies} sub="No tutor reply yet" icon={AlertTriangle} tone={pendingReplies > 0 ? 'warning' : 'success'} />
            </div>

            <div className="rounded-2xl border p-3 grid grid-cols-1 lg:grid-cols-3 gap-3" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
                <label className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by comment, student, lesson..."
                        className="w-full h-10 rounded-xl border pl-9 pr-3 text-sm"
                        style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading, backgroundColor: C.surfaceWhite }}
                    />
                </label>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-xl border px-3 text-sm"
                    style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading, backgroundColor: C.surfaceWhite }}
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                <select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="h-10 rounded-xl border px-3 text-sm"
                    style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading, backgroundColor: C.surfaceWhite }}
                >
                    <option value="all">All Courses</option>
                    {courses.map((course) => (
                        <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-3">
                {comments.length > 0 ? comments.map((comment) => {
                    const tone = statusTone(comment.moderationStatus);
                    const isBusy = moderatingFor === comment._id || submittingReplyFor === comment._id;

                    return (
                        <div key={comment._id} className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                            {comment.student?.name || 'Student'}
                                        </p>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full border" style={{ backgroundColor: tone.bg, borderColor: tone.border, color: tone.color, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>
                                            {comment.moderationStatus}
                                        </span>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                        {comment.lesson?.courseTitle || 'Unknown Course'} • {comment.lesson?.title || 'Lesson'}
                                    </p>
                                </div>
                            </div>

                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, lineHeight: T.leading.relaxed, whiteSpace: 'pre-wrap' }}>
                                {comment.text}
                            </p>

                            {comment.tutorReply ? (
                                <div className="rounded-xl border p-3" style={{ backgroundColor: C.successBg, borderColor: C.successBorder }}>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.success, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>
                                        Tutor Reply
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                                        {comment.tutorReply.text}
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                                    <textarea
                                        value={replyDrafts[comment._id] || ''}
                                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [comment._id]: e.target.value }))}
                                        rows={2}
                                        placeholder="Write a tutor reply..."
                                        className="w-full rounded-xl border px-3 py-2 text-sm resize-none"
                                        style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading, backgroundColor: C.surfaceWhite }}
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => submitReply(comment._id)}
                                            disabled={isBusy}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
                                            style={{ backgroundColor: C.btnPrimary }}
                                        >
                                            {submittingReplyFor === comment._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                            Reply
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => moderate(comment._id, 'flag')}
                                    disabled={isBusy}
                                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold disabled:opacity-60"
                                    style={{ borderColor: C.warningBorder, color: C.warning, backgroundColor: C.warningBg }}
                                >
                                    <span className="inline-flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> Flag</span>
                                </button>

                                {comment.moderationStatus === 'hidden' ? (
                                    <button
                                        onClick={() => moderate(comment._id, 'unhide')}
                                        disabled={isBusy}
                                        className="px-3 py-1.5 rounded-xl border text-xs font-semibold disabled:opacity-60"
                                        style={{ borderColor: C.successBorder, color: C.success, backgroundColor: C.successBg }}
                                    >
                                        <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Unhide</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => moderate(comment._id, 'hide')}
                                        disabled={isBusy}
                                        className="px-3 py-1.5 rounded-xl border text-xs font-semibold disabled:opacity-60"
                                        style={{ borderColor: C.dangerBorder, color: C.danger, backgroundColor: C.dangerBg }}
                                    >
                                        <span className="inline-flex items-center gap-1"><EyeOff className="w-3.5 h-3.5" /> Hide</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => moderate(comment._id, 'resolve')}
                                    disabled={isBusy}
                                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold disabled:opacity-60"
                                    style={{ borderColor: C.successBorder, color: C.success, backgroundColor: C.successBg }}
                                >
                                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Resolve</span>
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="rounded-2xl border p-10 text-center" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
                        <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: C.textMuted }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                            No discussion comments found for current filters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
