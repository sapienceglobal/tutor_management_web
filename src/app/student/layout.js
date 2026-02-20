'use client';

import { StudentHeader } from '@/components/layout/StudentHeader';
import { Footer } from '@/components/layout/Footer';


import useLocomotiveScroll from '@/hooks/useLocomotiveScroll';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Cookies from 'js-cookie';

export default function StudentLayout({ children }) {
    const router = useRouter();
    // Initialize smooth scrolling for the entire student section
    useLocomotiveScroll(true);

    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.success) {
                    setUser(res.data.user);
                }
            } catch (err) {
                console.warn("Failed to fetch user in layout", err);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Cookies.remove('token');
        Cookies.remove('user_role');

        // Redirect to login
        router.push('/login');
    };

    return (
        <div data-scroll-container className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <StudentHeader user={user} onLogout={handleLogout} />

            {/* Main Content */}
            <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 min-w-0 overflow-x-hidden">
                {children}
            </main>

            <Footer />
        </div>
    );
}
