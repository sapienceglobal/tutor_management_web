'use client';

import { useState, useEffect, Suspense } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import useInstitute from '@/hooks/useInstitute';
import { C, T } from '@/constants/studentTokens'; // Sourced from single truth

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Default false rakha hai taaki page load hote hi sidebar pura open rahe (bina jhatke ke)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { institute } = useInstitute();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true); // Load hone ke baad hi transition allow karenge
    }, []);

    return (
        <div 
            className="min-h-screen" 
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <Suspense fallback={null}>
                <Sidebar
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    setIsCollapsed={setSidebarCollapsed}
                />
            </Suspense>
            {/* isHydrated hone par hi transition aayega, taaki load par jhatka na lage */}
            <div 
                className={`${isHydrated ? "transition-all duration-300" : ""} ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[256px]"}`}
            >
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