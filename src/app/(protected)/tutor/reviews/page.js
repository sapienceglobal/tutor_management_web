'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Star, MessageSquare, Reply, Loader2, User, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

function StarRow({ rating }) {
    return (
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
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
    const [page, setPage]     = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => { fetchReviews(1); }, []);

    const fetchReviews = async (pageNum = 1) => {
        try {
            pageNum === 1 ? setLoading(true) : setLoadingMore(true);
            const res = await api.get(`/reviews/tutor/all?page=${pageNum}&limit=10`);
            if (res.data.success) {
                setReviews(prev => pageNum === 1 ? res.data.reviews : [...prev, ...res.data.reviews]);
                setHasMore(res.data.pagination.hasMore);
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
            if (res.data.success) {
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

    return (
        <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                        <Star className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Student Reviews</h1>
                        <p className="text-xs text-slate-400">View and reply to feedback from your students</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                    <p className="text-sm text-slate-400">Loading reviews...</p>
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                    <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, white)' }}>
                        <MessageSquare className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">No reviews yet</p>
                    <p className="text-xs text-slate-400">Reviews from your students will appear here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reviews.map(review => (
                        <div key={review._id}
                            className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
                            <div className="flex gap-3.5">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                    {review.studentId?.profileImage
                                        ? <img src={review.studentId.profileImage} alt="" className="w-full h-full object-cover" />
                                        : (review.studentId?.name?.[0]?.toUpperCase() || 'S')}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* Top row */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{review.studentId?.name || 'Student'}</p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <StarRow rating={review.rating} />
                                                {review.courseId?.title && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                                                        style={{
                                                            backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, white)',
                                                            color: 'var(--theme-primary)',
                                                            borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, white)'
                                                        }}>
                                                        {review.courseId.title}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-slate-400 flex-shrink-0">
                                            {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>

                                    {/* Comment bubble */}
                                    <div className="bg-slate-50 rounded-xl px-4 py-3 mb-3">
                                        <p className="text-sm text-slate-700 leading-relaxed">"{review.comment}"</p>
                                    </div>

                                    {/* Reply section */}
                                    {review.tutorResponse ? (
                                        <div className="pl-4 border-l-2 border-slate-200">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)' }}>
                                                    <Reply className="w-3 h-3" style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <span className="text-xs font-bold" style={{ color: 'var(--theme-primary)' }}>Your Reply</span>
                                                <span className="text-[11px] text-slate-400">· {new Date(review.tutorResponse.respondedAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{review.tutorResponse.comment}</p>
                                        </div>
                                    ) : replyingTo === review._id ? (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <textarea value={replyComment}
                                                onChange={e => setReplyComment(e.target.value)}
                                                className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10 resize-none transition-colors"
                                                placeholder="Write your reply here..."
                                                rows={3} autoFocus />
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => { setReplyingTo(null); setReplyComment(''); }}
                                                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                                                    Cancel
                                                </button>
                                                <button onClick={() => handleReply(review._id)}
                                                    disabled={submittingReply || !replyComment.trim()}
                                                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-opacity disabled:opacity-50"
                                                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                                                    {submittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                    Post Reply
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setReplyingTo(review._id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors"
                                            style={{
                                                color: 'var(--theme-primary)',
                                                borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, white)',
                                                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, white)'
                                            }}>
                                            <Reply className="w-3.5 h-3.5" /> Reply
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {hasMore && (
                        <div className="text-center pt-2">
                            <button onClick={() => fetchReviews(page + 1)} disabled={loadingMore}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors mx-auto disabled:opacity-50">
                                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                                {loadingMore ? 'Loading...' : 'Load More Reviews'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}