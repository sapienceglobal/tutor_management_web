'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    Star,
    MessageSquare,
    Reply,
    Loader2,
    AlertCircle,
    User,
    BookOpen,
    Calendar,
    CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

export default function TutorReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyComment, setReplyComment] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async (pageNum = 1) => {
        try {
            setLoading(true);
            const response = await api.get(`/reviews/tutor/all?page=${pageNum}&limit=10`);
            if (response.data.success) {
                if (pageNum === 1) {
                    setReviews(response.data.reviews);
                } else {
                    setReviews(prev => [...prev, ...response.data.reviews]);
                }
                setHasMore(response.data.pagination.hasMore);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (reviewId) => {
        if (!replyComment.trim()) {
            toast.error('Please enter a reply');
            return;
        }

        try {
            setSubmittingReply(true);
            const response = await api.post(`/reviews/${reviewId}/reply`, {
                comment: replyComment
            });

            if (response.data.success) {
                toast.success('Reply posted successfully');
                // Update local state
                setReviews(prev => prev.map(review => {
                    if (review._id === reviewId) {
                        return {
                            ...review,
                            tutorResponse: {
                                comment: replyComment,
                                respondedAt: new Date()
                            }
                        };
                    }
                    return review;
                }));
                setReplyingTo(null);
                setReplyComment('');
            }
        } catch (error) {
            console.error('Error submitting reply:', error);
            toast.error('Failed to post reply');
        } finally {
            setSubmittingReply(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Student Reviews</h1>
                <p className="text-slate-500 mt-2">View and reply to feedback from your students.</p>
            </div>

            {loading && page === 1 ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : reviews.length > 0 ? (
                <div className="space-y-6">
                    {reviews.map(review => (
                        <div key={review._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Student Info */}
                                <div className="shrink-0 flex items-start gap-4 md:w-48">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                                        {review.studentId?.profileImage ? (
                                            <img src={review.studentId.profileImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{review.studentId?.name || 'Student'}</p>
                                        <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Review Content */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
                                                    />
                                                ))}
                                            </div>
                                            <Badge variant="outline" className="font-normal text-slate-500">
                                                {review.courseId?.title}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl">
                                        <p>"{review.comment}"</p>
                                    </div>

                                    {/* Reply Section */}
                                    {review.tutorResponse ? (
                                        <div className="pl-4 border-l-2 border-indigo-200">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <Reply className="w-3 h-3 text-indigo-600" />
                                                </div>
                                                <span className="text-sm font-semibold text-indigo-900">Your Reply</span>
                                                <span className="text-xs text-slate-400">• {new Date(review.tutorResponse.respondedAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-slate-600 text-sm">{review.tutorResponse.comment}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {replyingTo === review._id ? (
                                                <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                                                    <textarea
                                                        value={replyComment}
                                                        onChange={(e) => setReplyComment(e.target.value)}
                                                        className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        placeholder="Write your reply here..."
                                                        rows={3}
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setReplyingTo(null);
                                                                setReplyComment('');
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleReply(review._id)}
                                                            disabled={submittingReply || !replyComment.trim()}
                                                            className="bg-indigo-600 hover:bg-indigo-700"
                                                        >
                                                            {submittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Reply'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setReplyingTo(review._id)}
                                                    className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                >
                                                    <Reply className="w-4 h-4" /> Reply
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {hasMore && (
                        <div className="text-center pt-6">
                            <Button
                                variant="outline"
                                onClick={() => fetchReviews(page + 1)}
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Load More Reviews'}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No reviews yet</h3>
                    <p className="text-slate-500">Reviews from your students will appear here.</p>
                </div>
            )}
        </div>
    );
}
