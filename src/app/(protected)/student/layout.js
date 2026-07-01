"use client";

import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import useInstitute from "@/hooks/useInstitute";
import { C, T } from "@/constants/studentTokens";
import { Suspense } from "react";

// Routes that should render fullscreen, with NO sidebar/header chrome.
// Add more patterns here if other immersive pages (exams, proctoring, etc.)
// need the same treatment later.
// Matches /student/live-classes/[id] and /student/live-classes/[id]/join
// (the actual route the app uses), and any other trailing segment too,
// so this doesn't silently break again if a /room or /session suffix
// gets added later.
const FULLSCREEN_ROUTE_PATTERNS = [/^\/student\/live-classes\/[^/]+(\/.*)?$/];

function isFullscreenRoute(pathname) {
  return FULLSCREEN_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

function StudentLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAppView = searchParams.get("platform") === "app";
  const isFullscreen = isFullscreenRoute(pathname);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Default false rakha hai taaki page load hote hi sidebar pura open rahe (bina jhatke ke)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const { institute } = useInstitute();
  const [isHydrated, setIsHydrated] = useState(false);

  // On fullscreen routes (e.g. live class), this controls whether the
  // sidebar+header are shown as a floating overlay on top of the page
  // content. Toggled via a window event dispatched by ZoomMeetingEmbed's
  // own "Show menu" button, so no new Context wiring is needed.
  const [chromeOverlayVisible, setChromeOverlayVisible] = useState(false);

  useEffect(() => {
    // Reset whenever we leave/enter a fullscreen route so it doesn't leak
    // state into the next page.
    setChromeOverlayVisible(false);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleToggle = () => setChromeOverlayVisible((prev) => !prev);
    window.addEventListener('lms:toggle-chrome', handleToggle);
    return () => window.removeEventListener('lms:toggle-chrome', handleToggle);
  }, [isFullscreen]);

  useEffect(() => {
    setIsHydrated(true); // Load hone ke baad hi transition allow karenge
  }, []);

  useEffect(() => {
    setIsHydrated(true); // Hydration complete hone ke baad hi transition allow karenge
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data.success) setUser(res.data.user);
      } catch (err) {
        console.warn("Failed to fetch user in layout", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    Cookies.remove("token");
    Cookies.remove("user_role");
    router.push("/login");
  };

  // ── App Mode: Strip all navigation chrome for Flutter InAppWebView ──
  if (isAppView) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
      >
        {children}
      </div>
    );
  }

  // ── Fullscreen Mode: Live class / immersive pages skip the normal
  // margin-shifted layout entirely — the page owns 100% of the viewport.
  // The sidebar+header can still be summoned as a floating overlay (via
  // the 'lms:toggle-chrome' window event), which does NOT resize the
  // page content underneath — it just floats on top, like Zoom/Meet's
  // own "show controls" pattern.
  if (isFullscreen) {
    return (
      <div
        className="min-h-screen relative"
        style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
      >
        {children}

        {chromeOverlayVisible && (
          <>
            {/* Backdrop: click outside to dismiss */}
            <div
              onClick={() => setChromeOverlayVisible(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.45)',
                zIndex: 10000,
              }}
            />
            <div style={{ position: 'fixed', inset: 0, zIndex: 10001, pointerEvents: 'none' }}>
              <div style={{ pointerEvents: 'auto' }}>
                <Suspense fallback={null}>
                  <StudentSidebar
                    isOpen={true}
                    setIsOpen={() => {}}
                    isCollapsed={false}
                    setIsCollapsed={() => {}}
                  />
                </Suspense>
              </div>
              <div
                className="lg:ml-[256px]"
                style={{ pointerEvents: 'auto' }}
              >
                <StudentHeader
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

  // ── Normal Web Mode: Full layout with sidebar & header ──
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
    >
      <Suspense fallback={null}>
        <StudentSidebar
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
        <StudentHeader
          user={user}
          institute={institute}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onSidebarCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function StudentLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <StudentLayoutInner>{children}</StudentLayoutInner>
    </Suspense>
  );
}