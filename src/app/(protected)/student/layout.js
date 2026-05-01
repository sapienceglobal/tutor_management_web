"use client";

import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import useInstitute from "@/hooks/useInstitute";
import { C, T } from "@/constants/studentTokens";
import { Suspense } from "react";

export default function StudentLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Default false rakha hai taaki page load hote hi sidebar pura open rahe (bina jhatke ke)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const { institute } = useInstitute();
  const [isHydrated, setIsHydrated] = useState(false);

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
