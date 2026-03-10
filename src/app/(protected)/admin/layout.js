'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import useInstitute from '@/hooks/useInstitute';
// ✅ ThemeProvider removed — root layout already wraps everything in ThemeProvider

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { institute } = useInstitute();

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-background)' }}>
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                isCollapsed={sidebarCollapsed}
                setIsCollapsed={setSidebarCollapsed}
            />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <Header
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