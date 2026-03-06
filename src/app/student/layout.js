'use client';

import { StudentHeader } from '@/components/layout/StudentHeader';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import useInstitute from '@/hooks/useInstitute';
import { ThemeProvider } from '@/contexts/ThemeContext';

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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Cookies.remove('token');
        Cookies.remove('user_role');
        router.push('/login');
    };

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-[#f0f2f8] relative">
                {/* Sidebar */}
                <StudentSidebar
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    setIsCollapsed={setSidebarCollapsed}
                />

                {/* Main Content Area */}
                <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                    {/* Header */}
                    <StudentHeader
                        user={user}
                        institute={institute}
                        onLogout={handleLogout}
                        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                        onSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                        isSidebarCollapsed={sidebarCollapsed}
                    />

                    {/* Page Content */}
                    <main className="p-4 lg:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}
