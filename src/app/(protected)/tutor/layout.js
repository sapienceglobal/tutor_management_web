'use client';

import { useState } from 'react';
import { TutorSidebar } from '@/components/layout/TutorSidebar';
import { TutorHeader } from '@/components/layout/TutorHeader';
import useInstitute from '@/hooks/useInstitute';
import { C, T } from '@/constants/tutorTokens';
// ✅ ThemeProvider removed — root layout already wraps everything in ThemeProvider

export default function TutorLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { institute } = useInstitute();

    return (
        <div className="min-h-screen" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
            <TutorSidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                isCollapsed={sidebarCollapsed}
                setIsCollapsed={setSidebarCollapsed}
            />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <TutorHeader
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                    onSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    isSidebarCollapsed={sidebarCollapsed}
                    institute={institute}
                />
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
