// app/admin/layout.js
'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 relative">
            {/* Sidebar */}
            <Sidebar 
                isOpen={sidebarOpen} 
                setIsOpen={setSidebarOpen}
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
                />

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}