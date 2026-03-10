'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { CourseCard } from '@/components/courses/CourseCard';
import { Heart, BookOpen, ArrowRight } from 'lucide-react';

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchWishlist(); }, []);

    const fetchWishlist = async () => {
        try {
            const { data } = await api.get('/wishlist');
            setWishlist(data.data);
        } catch (error) {
            console.error('Failed to fetch wishlist', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (courseId) => {
        setWishlist(prev => prev.filter(item => item.course._id !== courseId));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div
                    className="w-10 h-10 rounded-full border-[3px] animate-spin"
                    style={{
                        borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                        borderTopColor: 'var(--theme-primary)',
                    }}
                />
            </div>
        );
    }

    if (wishlist.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                {/* Icon */}
                <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' }}
                >
                    <Heart
                        className="w-12 h-12 fill-current"
                        style={{ color: 'var(--theme-primary)', opacity: 0.6 }}
                    />
                </div>
                <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--theme-foreground)' }}>
                    Your Wishlist is Empty
                </h2>
                <p className="text-sm max-w-md mb-8" style={{ color: 'var(--theme-foreground)', opacity: 0.45 }}>
                    Explore our courses and save the ones you're interested in learning!
                </p>
                <Link href="/student/courses">
                    <button
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all"
                        style={{ backgroundColor: 'var(--theme-primary)' }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
                    >
                        <BookOpen className="w-4 h-4" />
                        Browse Courses
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-foreground)' }}>
                        My Wishlist
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--theme-foreground)', opacity: 0.45 }}>
                        {wishlist.length} course{wishlist.length !== 1 ? 's' : ''} saved for later
                    </p>
                </div>
                <span
                    className="text-xs font-bold px-3 py-1.5 rounded-full self-center"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                        color: 'var(--theme-primary)',
                    }}
                >
                    {wishlist.length} saved
                </span>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {wishlist.map((item) => (
                    <CourseCard
                        key={item._id}
                        course={item.course}
                        isWishlisted={true}
                        onWishlistChange={() => handleRemove(item.course._id)}
                    />
                ))}
            </div>
        </div>
    );
}