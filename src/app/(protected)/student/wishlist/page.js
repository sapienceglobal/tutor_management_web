'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { CourseCard } from '@/components/courses/CourseCard';
import {
    MdFavorite,
    MdMenuBook,
    MdArrowForward,
    MdAutoAwesome,
} from 'react-icons/md';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';
import toast from 'react-hot-toast';

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

  const handleRemove = async (courseId) => {
        try {
 
            const res = await api.delete(`/wishlist/${courseId}`);
            if (res.data?.success) {
                // Update frontend state only if backend delete is successful
                setWishlist(prev => prev.filter(item => item.course._id !== courseId));
                toast.success('Course removed from wishlist');
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            toast.error('Failed to remove course from wishlist');
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div
            className="flex items-center justify-center min-h-[60vh]"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div
                        className="w-12 h-12 rounded-full border-[3px] animate-spin"
                        style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <MdAutoAwesome
                            className="animate-pulse"
                            style={{ width: 18, height: 18, color: C.btnPrimary }}
                        />
                    </div>
                </div>
                <p
                    style={{
                        fontFamily:  T.fontFamily,
                        fontSize:    T.size.base,
                        fontWeight:  T.weight.medium,
                        color:       C.text,
                    }}
                >
                    Loading your wishlist…
                </p>
            </div>
        </div>
    );

    // ── Empty State ──────────────────────────────────────────────────────────
    if (wishlist.length === 0) return (
        <div
            className="w-full min-h-screen space-y-5 pb-8"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            {/* Page Header */}
            <div
                className="flex items-center gap-3 p-5"
                style={{
                    backgroundColor: C.cardBg,
                    border:          `1px solid ${C.cardBorder}`,
                    boxShadow:       S.card,
                    borderRadius:    R['2xl'],
                }}
            >
                <div
                    className="flex items-center justify-center rounded-lg shrink-0"
                    style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                >
                    <MdFavorite style={{ width: 20, height: 20, color: C.iconColor }} />
                </div>
                <div>
                    <h1
                        style={{
                            fontFamily:  T.fontFamily,
                            fontSize:    T.size['2xl'],
                            fontWeight:  T.weight.bold,
                            color:       C.heading,
                            margin:      '0 0 2px 0',
                            lineHeight:  T.leading.tight,
                        }}
                    >
                        My Wishlist
                    </h1>
                    <p
                        style={{
                            fontFamily:  T.fontFamily,
                            fontSize:    T.size.base,
                            color:       C.text,
                            fontWeight:  T.weight.medium,
                            margin:      0,
                        }}
                    >
                        Courses you've saved for later
                    </p>
                </div>
            </div>

            {/* Empty card */}
            <div
                className="p-14 text-center border border-dashed flex flex-col items-center"
                style={{
                    backgroundColor: C.cardBg,
                    borderColor:     C.cardBorder,
                    borderRadius:    R['2xl'],
                }}
            >
                <div
                    className="flex items-center justify-center mx-auto mb-4"
                    style={{
                        width:           56,
                        height:          56,
                        backgroundColor: C.innerBg,
                        borderRadius:    R.lg,
                    }}
                >
                    <MdFavorite
                        style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }}
                    />
                </div>
                <h2
                    style={{
                        fontFamily:   T.fontFamily,
                        fontSize:     T.size.lg,
                        fontWeight:   T.weight.bold,
                        color:        C.heading,
                        marginBottom: 8,
                    }}
                >
                    Your Wishlist is Empty
                </h2>
                <p
                    style={{
                        fontFamily:   T.fontFamily,
                        fontSize:     T.size.base,
                        color:        C.text,
                        maxWidth:     380,
                        marginBottom: 24,
                        lineHeight:   T.leading.relaxed,
                    }}
                >
                    Explore our courses and save the ones you're interested in learning!
                </p>
                <Link href="/student/courses">
                    <button
                        className="flex items-center gap-2 px-6 py-2.5 text-white transition-all hover:opacity-90"
                        style={{
                            backgroundColor: C.btnPrimary,
                            fontFamily:      T.fontFamily,
                            fontSize:        T.size.base,
                            fontWeight:      T.weight.bold,
                            borderRadius:    '10px',
                            boxShadow:       S.btn,
                            border:          'none',
                            cursor:          'pointer',
                        }}
                    >
                        <MdMenuBook style={{ width: 16, height: 16 }} />
                        Browse Courses
                        <MdArrowForward style={{ width: 16, height: 16 }} />
                    </button>
                </Link>
            </div>
        </div>
    );

    // ── Wishlist ─────────────────────────────────────────────────────────────
    return (
        <div
            className="w-full min-h-screen space-y-5 pb-8"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
                className="flex items-center justify-between gap-4 p-5"
                style={{
                    backgroundColor: C.cardBg,
                    border:          `1px solid ${C.cardBorder}`,
                    boxShadow:       S.card,
                    borderRadius:    R['2xl'],
                }}
            >
                <div className="flex items-center gap-3">
                    {/* Icon Pill */}
                    <div
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                    >
                        <MdFavorite style={{ width: 20, height: 20, color: C.iconColor }} />
                    </div>
                    <div>
                        <h1
                            style={{
                                fontFamily:  T.fontFamily,
                                fontSize:    T.size['2xl'],
                                fontWeight:  T.weight.bold,
                                color:       C.heading,
                                margin:      '0 0 2px 0',
                                lineHeight:  T.leading.tight,
                            }}
                        >
                            My Wishlist
                        </h1>
                        <p
                            style={{
                                fontFamily:  T.fontFamily,
                                fontSize:    T.size.base,
                                color:       C.text,
                                fontWeight:  T.weight.medium,
                                margin:      0,
                            }}
                        >
                            {wishlist.length} course{wishlist.length !== 1 ? 's' : ''} saved for later
                        </p>
                    </div>
                </div>

                {/* Count Badge */}
                <span
                    className="self-center px-3 py-1.5"
                    style={{
                        backgroundColor: C.innerBg,
                        color:           C.btnPrimary,
                        fontFamily:      T.fontFamily,
                        fontSize:        T.size.xs,
                        fontWeight:      T.weight.bold,
                        borderRadius:    '10px',
                        border:          `1px solid ${C.cardBorder}`,
                    }}
                >
                    {wishlist.length} saved
                </span>
            </div>

            {/* ── Course Grid ─────────────────────────────────────────────── */}
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