'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Star, MessageSquare, Reply, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { C, T, FX, S, R } from '@/constants/tutorTokens';

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
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

function StarRow({ rating }) {
    return (
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5"
                    style={{
                        color: i < rating ? C.warning : '#CBD5E1',
                        fill: i < rating ? C.warning : 'transparent'
                    }}
                />
            ))}
        </div>
    );
}

export default function TutorReviewsPage() {
    const [reviews, setReviews]               = useState([]);
    const [loading, setLoading]               = useState(true);
    const [loadingMore, setLoadingMore]       = useState(false);
    const [replyingTo, setReplyingTo]         = useState(null);
    const [replyComment, setReplyComment]     = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [page, setPage]                     = useState(1);
    const [hasMore, setHasMore]               = useState(true);

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading reviews...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 pb-24 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <Star size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            Student Reviews
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>
                            View and reply to feedback from your students
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Reviews List ───────────────────────────────────────── */}
            {reviews.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                    <MessageSquare size={48} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No reviews yet</p>
                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Reviews from your students will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4 max-w-4xl">
                    {reviews.map(review => (
                        <div key={review._id} className="p-6 transition-all" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white shrink-0 overflow-hidden"
                                    style={{ background: C.gradientBtn, border: `2px solid ${C.surfaceWhite}`, boxShadow: S.cardHover }}>
                                    {review.studentId?.profileImage
                                        ? <img src={review.studentId.profileImage} alt="" className="w-full h-full object-cover" />
                                        : (review.studentId?.name?.[0]?.toUpperCase() || 'S')}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* Top row: Name, Stars, Date */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                        <div>
                                            <p style={{ fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>
                                                {review.studentId?.name || 'Student'}
                                            </p>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <StarRow rating={review.rating} />
                                                {review.courseId?.title && (
                                                    <span style={{ 
                                                        backgroundColor: '#E3DFF8', color: C.btnPrimary, border: `1px solid ${C.cardBorder}`,
                                                        padding: '2px 8px', borderRadius: R.md, fontSize: '10px', fontWeight: T.weight.bold,
                                                        whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '200px'
                                                    }}>
                                                        {review.courseId.title}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="shrink-0" style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted }}>
                                            {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>

                                    {/* Review Comment */}
                                    <div className="p-4 mb-4" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                            "{review.comment}"
                                        </p>
                                    </div>

                                    {/* Reply Section */}
                                    {review.tutorResponse ? (
                                        <div className="pl-4 ml-2" style={{ borderLeft: `2px solid ${C.btnPrimary}` }}>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E3DFF8' }}>
                                                    <Reply size={12} color={C.btnPrimary} />
                                                </div>
                                                <span style={{ fontSize: '11px', fontWeight: T.weight.black, color: C.btnPrimary, textTransform: 'uppercase' }}>Your Reply</span>
                                                <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>· {new Date(review.tutorResponse.respondedAt).toLocaleDateString()}</span>
                                            </div>
                                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.heading, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                                {review.tutorResponse.comment}
                                            </p>
                                        </div>
                                    ) : replyingTo === review._id ? (
                                        <div className="space-y-3 pt-2">
                                            <textarea value={replyComment} onChange={e => setReplyComment(e.target.value)}
                                                style={{ ...baseInputStyle, minHeight: '80px', resize: 'vertical' }}
                                                placeholder="Write your reply to the student here..."
                                                onFocus={onFocusHandler} onBlur={onBlurHandler} autoFocus />
                                            <div className="flex gap-3 justify-end">
                                                <button onClick={() => { setReplyingTo(null); setReplyComment(''); }}
                                                    className="px-4 py-2 cursor-pointer border-none transition-opacity hover:opacity-80 bg-transparent"
                                                    style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                                    Cancel
                                                </button>
                                                <button onClick={() => handleReply(review._id)} disabled={submittingReply || !replyComment.trim()}
                                                    className="flex items-center justify-center gap-2 h-10 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
                                                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                                    {submittingReply ? <Loader2 size={16} className="animate-spin" /> : <Reply size={16} />} Post Reply
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setReplyingTo(review._id)}
                                            className="flex items-center justify-center gap-1.5 h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80"
                                            style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                            <Reply size={14} /> Reply to review
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Pagination / Load More */}
                    {hasMore && (
                        <div className="text-center pt-6">
                            <button onClick={() => fetchReviews(page + 1)} disabled={loadingMore}
                                className="flex items-center justify-center gap-2 h-11 px-6 mx-auto cursor-pointer transition-opacity hover:opacity-80 shadow-sm disabled:opacity-50"
                                style={{ backgroundColor: C.surfaceWhite, color: C.heading, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
                                {loadingMore ? 'Loading...' : 'Load More Reviews'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}