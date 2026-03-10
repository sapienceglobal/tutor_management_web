'use client';

import { StudentHeader } from '@/components/layout/StudentHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import useInstitute from '@/hooks/useInstitute';
// ✅ ThemeProvider removed — root layout already wraps everything in ThemeProvider

export default function StudentLayout({ children }) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [user, setUser] = useState(null);
    const { institute } = useInstitute();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.success) setUser(res.data.user);
            } catch (err) {
                console.warn("Failed to fetch user in layout", err);
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
        <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-background)' }}>
            <StudentSidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                isCollapsed={sidebarCollapsed}
                setIsCollapsed={setSidebarCollapsed}
            />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <StudentHeader
                    user={user}
                    institute={institute}
                    onLogout={handleLogout}
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                    onSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    isSidebarCollapsed={sidebarCollapsed}
                />
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}