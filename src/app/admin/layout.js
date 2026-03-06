// app/admin/layout.js
'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import useInstitute from '@/hooks/useInstitute';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { institute } = useInstitute();

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-slate-50 relative">
                {/* Sidebar */}
                <Sidebar 
                    isOpen={sidebarOpen} 
                    isCollapsed={sidebarCollapsed}
                    setIsCollapsed={setSidebarCollapsed}
                />

                {/* Main Content Area */}
                <div className={`transition-all duration-300 ${
                    sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
                }`}>
                    {/* Header */}
                    <Header 
                        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                        onSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                        isSidebarCollapsed={sidebarCollapsed}
                        institute={institute}
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