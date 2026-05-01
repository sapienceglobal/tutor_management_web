'use client';

import { TutorHeader } from '@/components/layout/TutorHeader';
import { TutorSidebar } from '@/components/layout/TutorSidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import useInstitute from '@/hooks/useInstitute';
import { C, T } from '@/constants/studentTokens';

export default function TutorLayout({ children }) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [user, setUser] = useState(null);
    const { institute } = useInstitute();
    
    // 🌟 Layout shift rokne ke liye state
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true); // Load hone ke baad hi transition allow karenge
        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.success) setUser(res.data.user);
            } catch (err) {
                console.warn('Failed to fetch user in layout', err);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        Cookies.remove('token');
        Cookies.remove('user_role');
        router.push('/login');
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
            <TutorSidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                isCollapsed={sidebarCollapsed}
                setIsCollapsed={setSidebarCollapsed}
            />
            
            {/* 🌟 Exactly Student Layout ki tarah: isHydrated aur lg:ml-[256px] */}
            <div className={`${isHydrated ? 'transition-all duration-300' : ''} ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[256px]'}`}>
                <TutorHeader
                    user={user}
                    institute={institute}
                    onLogout={handleLogout}
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                    onSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    isSidebarCollapsed={sidebarCollapsed}
                />
                <main className="p-4 lg:p-6 w-full overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}