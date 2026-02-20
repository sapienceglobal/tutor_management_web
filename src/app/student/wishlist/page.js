'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { CourseCard } from '@/components/courses/CourseCard';
import { Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, []);

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
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (wishlist.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                    <Heart className="w-12 h-12 text-orange-500 fill-current" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Your wishlist is empty</h2>
                <p className="text-slate-500 mb-8 max-w-md">
                    Explore our courses and save the ones you're interested in!
                </p>
                <Button asChild className="bg-orange-500 hover:bg-orange-600">
                    <Link href="/student/courses">Browse Courses</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Wishlist</h1>
                    <p className="text-slate-500 mt-1">
                        {wishlist.length} course{wishlist.length !== 1 ? 's' : ''} saved for later
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
