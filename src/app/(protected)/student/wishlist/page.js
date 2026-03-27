'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { CourseCard } from '@/components/courses/CourseCard';
import { Heart, BookOpen, ArrowRight } from 'lucide-react';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading]  = useState(true);

    useEffect(() => { fetchWishlist(); }, []);

    const fetchWishlist = async () => {
        try {
            const { data } = await api.get('/wishlist');
            setWishlist(data.data);
        } catch (err) {
            console.error('Failed to fetch wishlist', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (courseId) => {
        setWishlist(prev => prev.filter(item => item.course._id !== courseId));
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
        </div>
    );

    // ── Empty ────────────────────────────────────────────────────────────────
    if (wishlist.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
            style={pageStyle}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: `${C.btnPrimary}12` }}>
                <Heart className="w-12 h-12 fill-current"
                    style={{ color: C.btnPrimary, opacity: 0.6 }} />
            </div>
            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, marginBottom: 8 }}>
                Your Wishlist is Empty
            </h2>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, maxWidth: 380, marginBottom: 28, lineHeight: T.leading.relaxed }}>
                Explore our courses and save the ones you're interested in learning!
            </p>
            <Link href="/student/courses">
                <button
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm transition-all hover:opacity-90 hover:-translate-y-px"
                    style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                    <BookOpen className="w-4 h-4" />
                    Browse Courses
                    <ArrowRight className="w-4 h-4" />
                </button>
            </Link>
        </div>
    );

    // ── Wishlist ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 pb-8" style={pageStyle}>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                        My Wishlist
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, marginTop: 2 }}>
                        {wishlist.length} course{wishlist.length !== 1 ? 's' : ''} saved for later
                    </p>
                </div>
                <span className="px-3 py-1.5 rounded-full text-xs font-bold self-center"
                    style={{ backgroundColor: `${C.btnPrimary}12`, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                    {wishlist.length} saved
                </span>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {wishlist.map(item => (
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