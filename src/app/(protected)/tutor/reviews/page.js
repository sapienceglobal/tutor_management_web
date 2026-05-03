'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    MdStar,
    MdStarBorder,
    MdMessage,
    MdReply,
    MdKeyboardArrowDown,
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

// ─── Base Input Style — directive 13 ─────────────────────────────────────────
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

// ─── Star Row ─────────────────────────────────────────────────────────────────
function StarRow({ rating }) {
    return (
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
                i < rating
                    ? <MdStar     key={i} style={{ width: 14, height: 14, color: C.warning }} />
                    : <MdStarBorder key={i} style={{ width: 14, height: 14, color: C.cardBorder }} />
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TutorReviewsPage() {
    const [reviews, setReviews]                   = useState([]);
    const [loading, setLoading]                   = useState(true);
    const [loadingMore, setLoadingMore]           = useState(false);
    const [replyingTo, setReplyingTo]             = useState(null);
    const [replyComment, setReplyComment]         = useState('');
    const [submittingReply, setSubmittingReply]   = useState(false);
    const [page, setPage]                         = useState(1);
    const [hasMore, setHasMore]                   = useState(true);

    useEffect(() => { fetchReviews(1); }, []);

    const fetchReviews = async (pageNum = 1) => {
        try {
            pageNum === 1 ? setLoading(true) : setLoadingMore(true);
            const res = await api.get(`/reviews/tutor/all?page=${pageNum}&limit=10`);
            if (res.data?.success) {
                setReviews(prev => pageNum === 1 ? res.data.reviews : [...prev, ...res.data.reviews]);
                setHasMore(res.data.pagination?.hasMore || false);
                setPage(pageNum);
            }
        } catch { toast.error('Failed to load reviews'); }
        finally { setLoading(false); setLoadingMore(false); }
    };

    const handleReply = async (reviewId) => {
        if (!replyComment.trim()) { toast.error('Please enter a reply'); return; }
        setSubmittingReply(true);
        try {
            const res = await api.post(`/reviews/${reviewId}/reply`, { comment: replyComment });
            if (res.data?.success) {
                toast.success('Reply posted successfully');
                setReviews(prev => prev.map(r =>
                    r._id === reviewId
                        ? { ...r, tutorResponse: { comment: replyComment, respondedAt: new Date() } }
                        : r
                ));
                setReplyingTo(null);
                setReplyComment('');
            }
        } catch { toast.error('Failed to post reply'); }
        finally { setSubmittingReply(false); }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
            <div className="flex flex-col items-center gap-3">
                <div className="rounded-full border-[3px] animate-spin"
                    style={{ width: 48, height: 48, borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                    Loading reviews...
                </p>
            </div>
        </div>
    );

    return (
        <div className="w-full min-h-screen pb-24 space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ── */}
            <div
                className="flex items-center justify-between"
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, padding: 20 }}
            >
                <div className="flex items-center gap-4">
                    <div
                        className="flex items-center justify-center shrink-0"
                        style={{ width: 48, height: 48, backgroundColor: C.iconBg, borderRadius: '10px' }}
                    >
                        <MdStar style={{ width: 24, height: 24, color: C.iconColor }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.bold, margin: '0 0 4px 0' }}>
                            Student Reviews
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, color: C.text, fontSize: T.size.base, fontWeight: T.weight.medium, margin: 0 }}>
                            View and reply to feedback from your students
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Empty State ── */}
            {reviews.length === 0 ? (
                <div
                    className="p-14 text-center flex flex-col items-center border border-dashed"
                    style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}
                >
                    <div
                        className="flex items-center justify-center mx-auto mb-4"
                        style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}
                    >
                        <MdMessage style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                        No reviews yet
                    </h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                        Reviews from your students will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4 max-w-4xl">
                    {reviews.map(review => (
                        <div
                            key={review._id}
                            style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, padding: 24 }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = S.cardHover}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = S.card}
                        >
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Avatar */}
                                <div
                                    className="flex items-center justify-center text-white shrink-0 overflow-hidden"
                                    style={{
                                        width: 48, height: 48,
                                        borderRadius: R.full,
                                        background: C.gradientBtn,
                                        border: `2px solid ${C.cardBg}`,
                                        boxShadow: S.card,
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.lg,
                                        fontWeight: T.weight.bold,
                                    }}
                                >
                                    {review.studentId?.profileImage
                                        ? <img src={review.studentId.profileImage} alt="" className="w-full h-full object-cover" />
                                        : (review.studentId?.name?.[0]?.toUpperCase() || 'S')}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* Top row: Name, Stars, Date */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                        <div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                                                {review.studentId?.name || 'Student'}
                                            </p>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <StarRow rating={review.rating} />
                                                {review.courseId?.title && (
                                                    <span style={{
                                                        backgroundColor: C.btnViewAllBg,
                                                        color: C.btnPrimary,
                                                        border: `1px solid ${C.cardBorder}`,
                                                        fontFamily: T.fontFamily,
                                                        padding: '2px 8px',
                                                        borderRadius: '10px',
                                                        fontSize: T.size.xs,
                                                        fontWeight: T.weight.bold,
                                                        whiteSpace: 'nowrap',
                                                        textOverflow: 'ellipsis',
                                                        overflow: 'hidden',
                                                        maxWidth: 200,
                                                    }}>
                                                        {review.courseId.title}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="shrink-0" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>
                                            {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>

                                    {/* Review Comment */}
                                    <div
                                        style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}`, padding: 16, marginBottom: 16 }}
                                    >
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                            "{review.comment}"
                                        </p>
                                    </div>

                                    {/* Reply Section */}
                                    {review.tutorResponse ? (
                                        <div className="pl-4 ml-2" style={{ borderLeft: `2px solid ${C.btnPrimary}` }}>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div
                                                    className="flex items-center justify-center"
                                                    style={{ width: 20, height: 20, borderRadius: R.full, backgroundColor: C.btnViewAllBg }}
                                                >
                                                    <MdReply style={{ width: 12, height: 12, color: C.btnPrimary }} />
                                                </div>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Your Reply
                                                </span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>
                                                    · {new Date(review.tutorResponse.respondedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.heading, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                                {review.tutorResponse.comment}
                                            </p>
                                        </div>
                                    ) : replyingTo === review._id ? (
                                        <div className="space-y-3 pt-2">
                                            <textarea
                                                value={replyComment}
                                                onChange={e => setReplyComment(e.target.value)}
                                                style={{ ...baseInputStyle, minHeight: 80, resize: 'vertical' }}
                                                placeholder="Write your reply to the student here..."
                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                autoFocus
                                            />
                                            <div className="flex gap-3 justify-end">
                                                <button
                                                    onClick={() => { setReplyingTo(null); setReplyComment(''); }}
                                                    className="cursor-pointer transition-all hover:opacity-80"
                                                    style={{ color: C.text, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, background: 'none', border: 'none', padding: '8px 16px' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleReply(review._id)}
                                                    disabled={submittingReply || !replyComment.trim()}
                                                    className="flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
                                                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, border: 'none', boxShadow: S.btn, height: 40, padding: '0 24px' }}
                                                >
                                                    {submittingReply
                                                        ? <div className="rounded-full border-2 animate-spin" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                                                        : <MdReply style={{ width: 16, height: 16 }} />}
                                                    Post Reply
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setReplyingTo(review._id)}
                                            className="flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:opacity-80"
                                            style={{ backgroundColor: C.btnViewAllBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, height: 36, padding: '0 16px' }}
                                        >
                                            <MdReply style={{ width: 14, height: 14 }} /> Reply to review
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Load More */}
                    {hasMore && (
                        <div className="text-center pt-6">
                            <button
                                onClick={() => fetchReviews(page + 1)}
                                disabled={loadingMore}
                                className="flex items-center justify-center gap-2 mx-auto cursor-pointer transition-all hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: C.cardBg, color: C.heading, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.card, height: 44, padding: '0 24px' }}
                            >
                                {loadingMore
                                    ? <div className="rounded-full border-2 animate-spin" style={{ width: 16, height: 16, borderColor: `${C.text}30`, borderTopColor: C.text }} />
                                    : <MdKeyboardArrowDown style={{ width: 16, height: 16 }} />}
                                {loadingMore ? 'Loading...' : 'Load More Reviews'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}