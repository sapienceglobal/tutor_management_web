import Link from 'next/link';
import { Star, Clock, BookOpen, Users, PlayCircle, Award } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export function CourseCard({ course, viewMode = 'grid', isWishlisted = false, onWishlistChange }) {
    const { title, thumbnail, tutorId, rating, price, isFree, level, duration, categoryId, reviewCount, enrolledCount, createdAt } = course;

    // Safe access for nested tutor data
    const tutorName = tutorId?.userId?.name || 'Unknown Tutor';
    const tutorImage = tutorId?.userId?.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (tutorId?._id || 'default');
    const categoryName = categoryId?.name || 'General';

    // Format date (mocking "5 hours ago" style or just using date)
    const formattedDate = new Date(createdAt || Date.now()).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    if (viewMode === 'list') {
        return (
            <Link href={`/student/courses/${course._id}`} className="block group">
                <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 flex gap-6 items-start">
                    <div className="w-60 h-40 shrink-0 rounded-lg overflow-hidden relative bg-slate-100">
                        <img
                            src={thumbnail || 'https://images.unsplash.com/photo-1546374823-74e2d36d4bd2?auto=format&fit=crop&q=80&w=1000'}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                                {categoryName}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formattedDate}
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {enrolledCount || 0}
                            </span>
                        </div>
                        <h3 className="font-bold text-xl text-slate-800 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-1">
                            {title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                            {course.description || "Unlock your potential with this comprehensive course designed to master new skills."}
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < Math.round(rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
                                    />
                                ))}
                                <span className="text-sm text-slate-500 ml-1">({rating || '0.0'})</span>
                            </div>
                            <Button className="rounded text-xs font-bold px-4 h-8 uppercase tracking-wide">
                                Read More
                            </Button>
                        </div>
                    </div>
                </div>
            </Link>
        )
    }

    return (
        <Link href={`/student/courses/${course._id}`} className="block h-full cursor-pointer group">
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl border border-slate-200 transition-all duration-300 flex flex-col h-full relative">
                {/* Thumbnail Section */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 group">
                    {/* "Featured" Ribbon - Mock logic */}
                    {rating > 4.5 && (
                        <div className="absolute top-4 -right-12 bg-red-600 text-white text-[10px] font-bold px-12 py-1 rotate-45 shadow-md z-10">
                            Featured
                        </div>
                    )}

                    <img
                        src={thumbnail || 'https://images.unsplash.com/photo-1546374823-74e2d36d4bd2?auto=format&fit=crop&q=80&w=1000'}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/50">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-4">
                        <span className="bg-[#10B981] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                            {categoryName}
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1 mb-3 group-hover:text-indigo-600 transition-colors">
                        {title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{enrolledCount || 0}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${i < Math.round(rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
                                />
                            ))}
                            <span className="text-xs font-bold text-slate-700 ml-1">{rating || '0.0'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Wishlist Toggle (Prevent Link navigation) */}
                            {(onWishlistChange || isWishlisted) && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onWishlistChange && onWishlistChange();
                                    }}
                                    className="p-1.5 hover:bg-slate-50 rounded-full transition-colors group/heart"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill={isWishlisted ? "currentColor" : "none"}
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={`w-5 h-5 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-slate-400 group-hover/heart:text-red-400'}`}
                                    >
                                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                    </svg>
                                </button>
                            )}

                            <Button variant="default" className="rounded text-[10px] font-bold px-3 h-7 uppercase tracking-wide shadow-sm hover:shadow-md transition-all">
                                Read More
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
