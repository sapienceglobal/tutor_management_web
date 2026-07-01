'use client';

import { TutorHeader } from '@/components/layout/TutorHeader';
import { TutorSidebar } from '@/components/layout/TutorSidebar';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import useInstitute from '@/hooks/useInstitute';
import { C, T } from '@/constants/studentTokens';

// Routes that should render fullscreen, with NO sidebar/header chrome.
// Matches /tutor/live-classes/[id] and /tutor/live-classes/[id]/join
// (the actual route the app uses), and any other trailing segment too,
// so this doesn't silently break again if a /room or /session suffix
// gets added later.
const FULLSCREEN_ROUTE_PATTERNS = [/^\/tutor\/live-classes\/[^/]+(\/.*)?$/];

function isFullscreenRoute(pathname) {
    return FULLSCREEN_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export default function TutorLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const isFullscreen = isFullscreenRoute(pathname);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [user, setUser] = useState(null);
    const { institute } = useInstitute();

    // On fullscreen routes (e.g. live class), this controls whether the
    // sidebar+header are shown as a floating overlay on top of the page
    // content. Toggled via a window event dispatched by ZoomMeetingEmbed's
    // own "Show menu" button, so no new Context wiring is needed.
    const [chromeOverlayVisible, setChromeOverlayVisible] = useState(false);

    useEffect(() => {
        setChromeOverlayVisible(false);
    }, [isFullscreen]);

    useEffect(() => {
        if (!isFullscreen) return;
        const handleToggle = () => setChromeOverlayVisible((prev) => !prev);
        window.addEventListener('lms:toggle-chrome', handleToggle);
        return () => window.removeEventListener('lms:toggle-chrome', handleToggle);
    }, [isFullscreen]);

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

    // ── Fullscreen Mode: Live class pages skip the normal margin-shifted
    // layout entirely. The sidebar+header can still be summoned as a
    // floating overlay (toggled via 'lms:toggle-chrome'), which floats on
    // top of the meeting without resizing it.
    if (isFullscreen) {
        return (
            <div className="min-h-screen relative" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                {children}

                {chromeOverlayVisible && (
                    <>
                        <div
                            onClick={() => setChromeOverlayVisible(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10000 }}
                        />
                        <div style={{ position: 'fixed', inset: 0, zIndex: 10001, pointerEvents: 'none' }}>
                            <div style={{ pointerEvents: 'auto' }}>
                                <TutorSidebar
                                    isOpen={true}
                                    setIsOpen={() => {}}
                                    isCollapsed={false}
                                    setIsCollapsed={() => {}}
                                />
                            </div>
                            <div className="lg:ml-[256px]" style={{ pointerEvents: 'auto' }}>
                                <TutorHeader
                                    user={user}
                                    institute={institute}
                                    onLogout={handleLogout}
                                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                                    onSidebarCollapse={() => {}}
                                    isSidebarCollapsed={false}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

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