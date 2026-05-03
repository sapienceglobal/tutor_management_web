"use client";

import { useEffect, useState } from "react";
import {
  MdMenuBook,
  MdTrendingUp,
  MdArrowForward,
  MdPlayCircleOutline,
  MdArticle,
  MdAutoAwesome,
  MdBarChart,
  MdPeople,
  MdPsychology,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdWorkspacePremium,
  MdVideocam,
  MdCheckCircleOutline,
  MdFolder,
  MdAssignment,
  MdPerson,
  MdFlashOn,
  MdAccessTime,
} from "react-icons/md";
import Link from "next/link";
import api from "@/lib/axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-hot-toast";
import useInstitute from "@/hooks/useInstitute";
import { useRouter } from "next/navigation";
import { C, T, S, R, cx, pageStyle } from "@/constants/studentTokens";
import CustomAIIcon from "@/components/CustomAIIcon";
import StatCard from "@/components/StatCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── FallbackImage ────────────────────────────────────────────────────────────
function FallbackImage({ src, alt, className }) {
  const defaultImg =
    "https://images.unsplash.com/photo-1546374823-74e2d36d4bd2?auto=format&fit=crop&q=80&w=600";
  const [imgSrc, setImgSrc] = useState(src || defaultImg);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src || defaultImg);
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ backgroundColor: C.innerBg }}
      >
        <MdMenuBook style={{ width: 24, height: 24, color: C.text }} />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (imgSrc !== defaultImg) {
          setImgSrc(defaultImg);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}

// ─── Icon Pill ────────────────────────────────────────────────────────────────
function IconPill({ icon: Icon, size = 20, bg }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: 40,
        height: 40,
        backgroundColor: bg || C.iconBg,
        borderRadius: "10px",
      }}
    >
      <Icon style={{ width: size, height: size, color: C.iconColor }} />
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  linkHref,
  linkLabel = "View All",
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <IconPill icon={Icon} size={16} />
        <h2
          style={{
            fontFamily: T.fontFamily,
            fontSize: T.size.xl,
            fontWeight: T.weight.bold,
            color: C.heading,
          }}
        >
          {title}
        </h2>
      </div>
      {linkHref && (
        <Link
          href={linkHref}
          className="inline-flex items-center gap-1 px-3 py-1.5 transition-colors hover:opacity-80 text-decoration-none"
          style={{
            backgroundColor: C.btnViewAllBg,
            color: C.btnViewAllText,
            fontFamily: T.fontFamily,
            fontSize: T.size.base,
            fontWeight: T.weight.bold,
            borderRadius: "10px",
            border: `1px solid ${C.cardBorder}`,
          }}
        >
          {linkLabel} <MdArrowForward style={{ width: 16, height: 16 }} />
        </Link>
      )}
    </div>
  );
}

// ─── SidePanel ────────────────────────────────────────────────────────────────
function SidePanel({ icon: Icon, title, open, onToggle, children }) {
  return (
    <div
      style={{
        backgroundColor: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: S.card,
        borderRadius: R["2xl"],
        overflow: "hidden",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <div className="flex items-center gap-2.5">
          <IconPill icon={Icon} size={16} />
          <span
            style={{
              fontFamily: T.fontFamily,
              fontSize: T.size.lg,
              fontWeight: T.weight.bold,
              color: C.heading,
            }}
          >
            {title}
          </span>
        </div>

        {/* Arrow ab smoothly rotate hoga jhatke se change nahi hoga */}
        <MdKeyboardArrowDown
          style={{
            width: 20,
            height: 20,
            color: C.text,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 300ms ease-in-out",
          }}
        />
      </button>

      {/* Smooth Accordion Transition Wrapper */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 300ms ease-in-out",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div
        style={{
          backgroundColor: "#3D3B8E",
          fontFamily: T.fontFamily,
          borderRadius: "10px",
          padding: "8px 12px",
          boxShadow: S.card,
        }}
      >
        <p
          style={{
            fontSize: T.size.xs,
            fontWeight: T.weight.semibold,
            color: "rgba(255,255,255,0.7)",
            marginBottom: 2,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: T.size.lg,
            fontWeight: T.weight.bold,
            color: "#ffffff",
          }}
        >
          {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    inProgress: 0,
  });
  const [history, setHistory] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [liveClassCount, setLiveClassCount] = useState(0);
  const [user, setUser] = useState({ name: "Student" });
  const [activityData, setActivityData] = useState([]);
  const [batches, setBatches] = useState([]);
  const [myInstitutes, setMyInstitutes] = useState([]);
  const [currentInstitute, setCurrentInstitute] = useState(null);
  const [activeTab, setActiveTab] = useState("institute");
  const [aiOpen, setAiOpen] = useState(true);
  const [announcementsOpen, setAnnouncementsOpen] = useState(true);
  const [batchPanelOpen, setBatchPanelOpen] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [allExams, setAllExams] = useState([]); // Today's exam filter karne ke liye
  const [todayCarouselIdx, setTodayCarouselIdx] = useState(0);
  const [batchPage, setBatchPage] = useState(1);

  const router = useRouter();

  useEffect(() => {
    const fetchInitialConfig = async () => {
      try {
        try {
          const institutesRes = await api.get("/membership/my-institutes");
          if (institutesRes.data?.success) {
            setMyInstitutes(institutesRes.data.institutes || []);
            setCurrentInstitute(institutesRes.data.currentInstitute);
            if (!institutesRes.data.currentInstitute) setActiveTab("global");
          }
        } catch {
          setActiveTab("global");
        }
        try {
          const userRes = await api.get("/auth/me");
          if (userRes.data.success) setUser(userRes.data.user);
        } catch {}
      } catch (err) {
        console.error("Initial load error:", err);
      }
    };
    fetchInitialConfig();
  }, []);

  useEffect(() => {
    const fetchContextData = async () => {
      setLoading(true);
      try {
        const s = `?scope=${activeTab}`;
        try {
          const enrollRes = await api.get(`/enrollments/my-enrollments${s}`);
          if (enrollRes.data.success) {
            const data = enrollRes.data.enrollments;
            setEnrollments(data);
            const completed = data.filter(
              (e) => e.progress?.percentage === 100,
            ).length;
            setStats({
              enrolledCourses: data.length,
              completedCourses: completed,
              inProgress: data.length - completed,
            });
          }
        } catch {}
        try {
          const examsRes = await api.get(`/exams/student/all${s}`);
          if (examsRes.data.success) {
            const now = new Date();
            setAllExams(examsRes.data.exams); // Save all for Today's logic
            setUpcomingExams(
              examsRes.data.exams
                .filter((e) => e.isScheduled && new Date(e.startDate) > now)
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .slice(0, 5),
            );
          }
        } catch {}

        try {
          // Fetch real announcements
          const annRes = await api.get(`/enrollments/my-announcements${s}`);
          if (annRes.data.success)
            setAnnouncements(annRes.data.announcements || []);
        } catch {}
        try {
          const liveRes = await api.get(`/live-classes/student${s}`);
          if (liveRes.data.success)
            setLiveClassCount(liveRes.data.liveClasses?.length || 0);
        } catch {}
        try {
          const historyRes = await api.get(`/exams/student/history-all${s}`);
          if (historyRes.data.success)
            setHistory(historyRes.data.attempts.slice(0, 6));
        } catch {}
        try {
          const activityRes = await api.get(`/student/dashboard/activity${s}`);
          if (activityRes.data.success)
            setActivityData(activityRes.data.activity);
        } catch {
          setActivityData([]);
        }
        try {
          const batchRes = await api.get(`/batches/student/my-batches${s}`);
          if (batchRes.data.success)
            setBatches(batchRes.data.batches?.slice(0, 4) || []);
        } catch {}
      } catch (err) {
        console.error("Dashboard load error:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchContextData();
  }, [activeTab]);
  // ─── Image Resolver for VPS Bug ──────────────────────────────────────────────
  const resolveImageUrl = (path) => {
    if (!path) return "/default-avatar.png";
    if (path.startsWith("http")) return path;

    // Yahan tumhara backend API URL aayega .env se
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // API URL se base domain nikalna
    const baseUrl = apiUrl.replace(/\/api\/?$/, "");

    return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  };
  // Helper function for Today's Exam
  const getStatus = (exam) => {
    if (exam.isCompleted) return "completed";
    if (exam.isScheduled) {
      const now = new Date();
      const start = new Date(exam.startDate);
      const end = new Date(exam.endDate);
      if (now < start) return "upcoming";
      if (now > end) return "expired";
    }
    return "available";
  };
  const avgScore =
    history.length > 0
      ? Math.round(
          history.reduce(
            (acc, h) =>
              acc + (h.totalMarks > 0 ? (h.score / h.totalMarks) * 100 : 0),
            0,
          ) / history.length,
        )
      : 0;

  const progressColors = ["#5E9D9D", "#7573E8", "#6267E9", "#4748AA"];

  const inProgressCourses = enrollments
    .filter((e) => e.progress?.percentage > 0 && e.progress?.percentage < 100)
    .sort(
      (a, b) =>
        new Date(b.lastAccessedAt || b.updatedAt) -
        new Date(a.lastAccessedAt || a.updatedAt),
    )
    .slice(0, 3);

  // Reusable Continue Learning Render Block
  const renderContinueLearning = () => (
    <>
      <SectionHeader
        icon={MdPlayCircleOutline}
        title="Continue Learning"
        linkHref="/student/courses"
      />
      <div
        className={`grid grid-cols-1 gap-4 ${inProgressCourses.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}
      >
        {inProgressCourses.map((enrollment, i) => {
          const course = enrollment.courseId;
          const pct = enrollment.progress?.percentage || 0;
          const barColor = progressColors[i % progressColors.length];
          return (
            <Link
              key={enrollment._id}
              href={`/student/courses/${course?._id}`}
              className="group p-4 transition-all duration-200 hover:-translate-y-0.5 text-decoration-none"
              style={{
                backgroundColor: C.cardBg,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: "10px",
                boxShadow: S.card,
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = S.cardHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = S.card;
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center overflow-hidden shrink-0"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "10px",
                    backgroundColor: C.innerBg,
                  }}
                >
                  <FallbackImage
                    src={course?.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3
                    className="truncate"
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      fontWeight: T.weight.bold,
                      color: C.heading,
                    }}
                  >
                    {course?.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.xs,
                      color: C.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {timeAgo(enrollment.lastAccessedAt || enrollment.updatedAt)}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      fontWeight: T.weight.bold,
                      color: C.text,
                    }}
                  >
                    {pct}% complete
                  </span>
                  <span
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      fontWeight: T.weight.bold,
                      color: barColor,
                    }}
                  >
                    Resume →
                  </span>
                </div>
                <div
                  className="w-full overflow-hidden"
                  style={{
                    height: 8,
                    borderRadius: "10px",
                    backgroundColor: C.innerBg,
                  }}
                >
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barColor,
                      borderRadius: "10px",
                    }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );

  return (
    <div
      className="space-y-5 pb-8 min-h-screen"
      style={{ fontFamily: T.fontFamily, backgroundColor: C.pageBg }}
    >
      {/* ── Welcome Header & Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* User Profile Info */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "10px",
                overflow: "hidden",
                border: `2px solid ${C.btnPrimary}`,
                boxShadow: `0 0 0 3px ${C.btnViewAllBg}`,
              }}
            >
              <img
                src={resolveImageUrl(user?.profileImage)}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className="absolute bottom-0 right-0 border-2"
              style={{
                width: 14,
                height: 14,
                backgroundColor: "#34D399",
                borderColor: "#ffffff",
                borderRadius: R.full,
              }}
            />
          </div>
          <div>
            <p
              suppressHydrationWarning={true}
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.xs,
                fontWeight: T.weight.bold,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: T.tracking.wider,
                marginBottom: 2,
              }}
            >
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size["2xl"],
                fontWeight: T.weight.bold,
                color: C.heading,
                lineHeight: T.leading.tight,
              }}
            >
              Hello,{" "}
              <span style={{ color: C.btnPrimary }}>
                {user?.name?.split(" ")[0] || "Student"}
              </span>{" "}
              👋
            </h1>
            <p
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.base,
                fontWeight: T.weight.semibold,
                color: C.text,
                marginTop: 2,
              }}
            >
              {currentInstitute
                ? `Student at ${currentInstitute.name}`
                : "Independent Learner · Global"}
            </p>
          </div>
        </div>

        {/* Animated Switcher */}
        {myInstitutes.length > 0 && (
          <div
            className="relative flex items-center p-1 rounded-xl self-start sm:self-auto"
            style={{
              width: 240,
              backgroundColor: C.cardBg,
              border: `1px solid ${C.cardBorder}`,
            }}
          >
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-transform duration-300 ease-in-out z-0"
              style={{
                backgroundColor: C.btnPrimary,
                transform:
                  activeTab === "institute"
                    ? "translateX(0)"
                    : "translateX(100%)",
                boxShadow: `0 2px 10px ${C.btnPrimary}40`,
                borderRadius: "10px",
              }}
            />
            {["institute", "global"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 relative z-10 px-5 py-1.5 capitalize transition-colors duration-300"
                style={{
                  fontFamily: T.fontFamily,
                  fontSize: T.size.base,
                  fontWeight: T.weight.bold,
                  color: activeTab === tab ? "#ffffff" : C.text,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "10px",
                }}
              >
                {tab === "institute" ? "My Institute" : "Global"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Loading or Dashboard Content ── */}
      {loading ? (
        <div
          className="flex items-center justify-center min-h-[50vh]"
          style={{ backgroundColor: C.pageBg }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-12 h-12">
              <div
                className="w-12 h-12 rounded-full border-[3px] animate-spin"
                style={{
                  borderColor: `${C.btnPrimary}30`,
                  borderTopColor: C.btnPrimary,
                }}
              />
            </div>
            <p
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.base,
                fontWeight: T.weight.bold,
                color: C.text,
              }}
            >
              Loading dashboard...
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={MdFolder}
              value={stats.enrolledCourses}
              label="Enrolled Courses"
              href="/student/courses"
              iconBg="#EEF2FF"
              iconColor="#4F46E5"
            />
            <StatCard
              icon={MdAssignment}
              value={upcomingExams.length}
              label="Upcoming Exams"
              href="/student/exams"
              iconBg="#FFF7ED"
              iconColor="#F59E0B"
            />
            <StatCard
              icon={MdVideocam}
              value={liveClassCount}
              label="Live Classes"
              href="/student/live-classes"
              iconBg="#ECFDF5"
              iconColor="#10B981"
            />
            <StatCard
              value={`${avgScore}%`}
              label="AI Recommendations"
              subtext="Overall Score"
              href="/student/ai-buddy/study-plans"
              bgSvgPath="/icons/robot-assistant.png"
              isAI
            />
          </div>
          {/* Today's Exams Logic & UI */}
          {(() => {
            const now = new Date();
            const todayStr = now.toDateString();
            const todayExams = allExams.filter((exam) => {
              const status = getStatus(exam);
              if (status !== "available") return false;
              if (!exam.startDate) return true;
              return new Date(exam.startDate).toDateString() === todayStr;
            });

            if (todayExams.length === 0) return null;
            const exam = todayExams[todayCarouselIdx];
            if (!exam) return null;

            return (
              <div
                className="p-6 relative overflow-hidden"
                style={{
                  background: "linear-gradient(to top, #4A00E0, #8E2DE2)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: S.card,
                  borderRadius: R["2xl"],
                }}
              >
                <div
                  className="absolute inset-0 opacity-[0.07] pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(white 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 flex items-center justify-center"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.15)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "10px",
                        }}
                      >
                        <MdFlashOn size={18} className="text-amber-300" />
                      </div>
                      <div>
                        <h2
                          style={{
                            fontSize: T.size.md,
                            fontWeight: T.weight.bold,
                            color: "#ffffff",
                            margin: 0,
                          }}
                        >
                          Today's Exams
                        </h2>
                        <p
                          style={{
                            fontSize: T.size.xs,
                            color: "rgba(255,255,255,0.6)",
                            margin: 0,
                            marginTop: 2,
                          }}
                        >
                          {todayExams.length} exam
                          {todayExams.length > 1 ? "s" : ""} available right now
                        </p>
                      </div>
                    </div>
                    {todayExams.length > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setTodayCarouselIdx(
                              (i) =>
                                (i - 1 + todayExams.length) % todayExams.length,
                            )
                          }
                          className="w-9 h-9 flex items-center justify-center border-none cursor-pointer transition-colors"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.15)",
                            color: "#fff",
                            borderRadius: "8px",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "rgba(255,255,255,0.25)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "rgba(255,255,255,0.15)")
                          }
                        >
                          <MdChevronLeft size={18} />
                        </button>
                        <span
                          style={{
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            color: "rgba(255,255,255,0.7)",
                          }}
                        >
                          {todayCarouselIdx + 1} / {todayExams.length}
                        </span>
                        <button
                          onClick={() =>
                            setTodayCarouselIdx(
                              (i) => (i + 1) % todayExams.length,
                            )
                          }
                          className="w-9 h-9 flex items-center justify-center border-none cursor-pointer transition-colors"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.15)",
                            color: "#fff",
                            borderRadius: "8px",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "rgba(255,255,255,0.25)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "rgba(255,255,255,0.15)")
                          }
                        >
                          <MdChevronRight size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "10px",
                    }}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className="w-12 h-12 flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.15)",
                          borderRadius: "10px",
                        }}
                      >
                        <MdArticle size={22} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3
                          className="truncate"
                          style={{
                            fontSize: T.size.lg,
                            fontWeight: T.weight.bold,
                            color: "#ffffff",
                            margin: "0 0 4px 0",
                          }}
                        >
                          {exam.title}
                        </h3>
                        {exam.courseTitle && (
                          <p
                            style={{
                              fontSize: T.size.xs,
                              color: "rgba(255,255,255,0.6)",
                              margin: "0 0 10px 0",
                            }}
                          >
                            {exam.courseTitle}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4">
                          <span
                            className="flex items-center gap-1.5"
                            style={{
                              fontSize: T.size.xs,
                              fontWeight: T.weight.bold,
                              color: "rgba(255,255,255,0.8)",
                            }}
                          >
                            <MdAccessTime
                              size={13}
                              className="text-amber-300"
                            />{" "}
                            {exam.duration} mins
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/student/exams/${exam._id}/take`}
                      className="shrink-0 text-decoration-none"
                    >
                      <button
                        className="flex items-center gap-2 px-7 py-3.5 border-none cursor-pointer transition-transform hover:scale-105 shadow-lg"
                        style={{
                          background: C.surfaceWhite,
                          color: C.btnPrimary,
                          fontFamily: T.fontFamily,
                          fontSize: T.size.base,
                          fontWeight: T.weight.bold,
                          borderRadius: "10px",
                        }}
                      >
                        <MdPlayCircleOutline size={16} /> Take Exam
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })()}
          {/* ── Main Dynamic Grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Case A: 3 Courses -> Take Full Width on Top */}
            {inProgressCourses.length >= 3 && (
              <div className="xl:col-span-3">{renderContinueLearning()}</div>
            )}

            {/* Left Column (Span 2) */}
            <div className="xl:col-span-2 space-y-6">
              {/* Case B: 1 or 2 Courses -> Sit inside left column */}
              {inProgressCourses.length > 0 && inProgressCourses.length < 3 && (
                <div>{renderContinueLearning()}</div>
              )}

              {/* Batch Details */}
              {/* Batch Details (Always Visible, Dynamically Paginated) */}

              {(() => {
                // Safely define variables right here so they are always available
                const totalBatchPages = Math.max(1, batches.length);
                const currentBatch = batches[batchPage - 1];

                // 1. REAL ENROLLMENTS FOR THIS BATCH ONLY (No Fake Fallbacks)
                const displayEnrollments = currentBatch
                  ? enrollments
                      .filter((e) => {
                        // Check both populated and unpopulated batchId
                        const eBatchId =
                          e.batchId?._id || e.batchId || e.batch?._id;
                        return (
                          eBatchId?.toString() === currentBatch._id?.toString()
                        );
                      })
                      .slice(0, 4)
                  : [];

                // 2. REAL EXAMS FOR THIS BATCH ONLY (No Fake Fallbacks)
                const displayUpcomingExams = currentBatch
                  ? upcomingExams
                      .filter((e) => {
                        const eBatchId = e.batchId?._id || e.batchId;
                        const audienceBatchIds = e.audience?.batchIds || [];
                        return (
                          eBatchId?.toString() ===
                            currentBatch._id?.toString() ||
                          audienceBatchIds.some(
                            (id) =>
                              id.toString() === currentBatch._id?.toString(),
                          ) ||
                          e.batches?.includes(currentBatch._id)
                        );
                      })
                      .slice(0, 4)
                  : [];

                // 3. Real Instructor Name
                const instructorName =
                  currentBatch?.tutorId?.userId?.name ||
                  currentBatch?.instructors?.[0]?.userId?.name ||
                  "Instructor";

                // 4. Real Batch Progress
                const batchProgressPct = currentBatch
                  ? enrollments.find((e) => {
                      const eBatchId = e.batchId?._id || e.batchId;
                      return (
                        eBatchId?.toString() === currentBatch._id?.toString()
                      );
                    })?.progress?.percentage || 0
                  : 0;

                return (
                  <div
                    style={{
                      backgroundColor: C.cardBg,
                      border: `1px solid ${C.cardBorder}`,
                      boxShadow: S.card,
                      borderRadius: R["2xl"],
                      padding: 24,
                    }}
                  >
                    <SectionHeader
                      icon={MdPeople}
                      title="Batch Details"
                      linkHref="/student/batches"
                    />

                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x"
                      style={{ borderColor: C.cardBorder }}
                    >
                      {/* Left: course progress */}
                      <div className="pr-0 md:pr-6">
                        <p
                          className="mb-3 uppercase truncate"
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                            color: C.btnPrimary,
                            letterSpacing: T.tracking.wider,
                          }}
                        >
                          {currentBatch?.name || "Not Enrolled in Any Batch"}
                        </p>

                        {currentBatch && (
                          <div
                            className="flex items-center gap-3 mb-4"
                            style={{
                              backgroundColor: C.innerBg,
                              border: `1px solid ${C.cardBorder}`,
                              borderRadius: "10px",
                              padding: 12,
                            }}
                          >
                            <div
                              className="flex items-center justify-center overflow-hidden shrink-0"
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "10px",
                                backgroundColor: C.btnViewAllBg,
                              }}
                            >
                              <MdPerson
                                style={{
                                  width: 20,
                                  height: 20,
                                  color: C.btnPrimary,
                                }}
                              />
                            </div>
                            <div>
                              <p
                                className="truncate max-w-[200px]"
                                style={{
                                  fontFamily: T.fontFamily,
                                  fontSize: T.size.base,
                                  fontWeight: T.weight.bold,
                                  color: C.heading,
                                  margin: 0,
                                }}
                              >
                                {currentBatch.name}
                              </p>
                              <p
                                style={{
                                  fontFamily: T.fontFamily,
                                  fontSize: T.size.xs,
                                  fontWeight: T.weight.semibold,
                                  color: C.textMuted,
                                  margin: 0,
                                }}
                              >
                                {instructorName}
                              </p>
                            </div>
                            <span
                              className="ml-auto text-white shrink-0"
                              style={{
                                backgroundColor: C.btnPrimary,
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                padding: "4px 10px",
                                borderRadius: "10px",
                              }}
                            >
                              {batchProgressPct}%
                            </span>
                          </div>
                        )}

                        <div className="space-y-3.5 flex flex-col" style={{ minHeight: '100px' }}>
                          {displayEnrollments.length > 0 ? (
                            displayEnrollments.map((enrollment, i) => {
                              const pct = enrollment.progress?.percentage || 0;
                              const barColor =
                                progressColors[i % progressColors.length];
                              return (
                                <Link
                                  key={enrollment._id}
                                  href={`/student/courses/${enrollment.courseId?._id}`}
                                  className="block group text-decoration-none"
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span
                                      className="truncate max-w-[68%]"
                                      style={{
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.base,
                                        fontWeight: T.weight.bold,
                                        color: C.text,
                                      }}
                                    >
                                      {enrollment.courseId?.title || "Course"}
                                    </span>
                                    <span
                                      className="text-white shrink-0 ml-2"
                                      style={{
                                        backgroundColor: barColor,
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                        padding: "2px 8px",
                                        borderRadius: "10px",
                                      }}
                                    >
                                      {pct}%
                                    </span>
                                  </div>
                                  <div
                                    className="w-full overflow-hidden"
                                    style={{
                                      height: 8,
                                      borderRadius: "10px",
                                      backgroundColor: C.innerBg,
                                    }}
                                  >
                                    <div
                                      className="h-full transition-all duration-700"
                                      style={{
                                        width: `${pct}%`,
                                        backgroundColor: barColor,
                                        borderRadius: "10px",
                                      }}
                                    />
                                  </div>
                                </Link>
                              );
                            })
                          ) : (
                            <div className="flex-1 flex items-center justify-center">
                              <p
                                style={{
                                  fontFamily: T.fontFamily,
                                  fontSize: T.size.base,
                                  fontStyle: "italic",
                                  color: C.textMuted,
                                  margin: 0,
                                  textAlign: "center",
                                }}
                              >
                                No enrolled courses for this batch yet.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: upcoming exams */}
                      <div className="pl-0 md:pl-6 mt-5 md:mt-0">
                        <p
                          className="mb-3 uppercase truncate"
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            color: C.btnPrimary,
                            letterSpacing: T.tracking.wider,
                          }}
                        >
                          {currentBatch?.name || "Not Enrolled in Any Batch"}
                        </p>
                        <div className="space-y-3 flex flex-col" style={{ minHeight: '100px' }}>
                          {displayUpcomingExams.length > 0 ? (
                            displayUpcomingExams.map((exam) => {
                              const daysLeft = exam.startDate
                                ? Math.max(
                                    0,
                                    Math.ceil(
                                      (new Date(exam.startDate) - new Date()) /
                                        (1000 * 60 * 60 * 24),
                                    ),
                                  )
                                : 0;

                              return (
                                <div
                                  key={exam._id}
                                  className="flex items-center justify-between transition-colors"
                                  style={{
                                    backgroundColor: C.innerBg,
                                    border: `1px solid ${C.cardBorder}`,
                                    borderRadius: "10px",
                                    padding: 12,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      C.btnViewAllBg;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      C.innerBg;
                                  }}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div
                                      className="flex items-center justify-center shrink-0"
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: "10px",
                                        backgroundColor: C.iconBg,
                                      }}
                                    >
                                      <MdArticle
                                        style={{
                                          width: 16,
                                          height: 16,
                                          color: C.iconColor,
                                        }}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p
                                        className="truncate"
                                        style={{
                                          fontFamily: T.fontFamily,
                                          fontSize: T.size.base,
                                          fontWeight: T.weight.bold,
                                          color: C.heading,
                                          margin: 0,
                                        }}
                                      >
                                        {exam.title}
                                      </p>
                                      <p
                                        style={{
                                          fontFamily: T.fontFamily,
                                          fontSize: T.size.xs,
                                          color: C.textMuted,
                                          margin: 0,
                                          marginTop: 2,
                                          fontWeight: T.weight.bold,
                                        }}
                                      >
                                        Batch in {daysLeft} days
                                      </p>
                                    </div>
                                  </div>
                                  <Link
                                    href={`/student/exams/${exam._id}`}
                                    className="text-white shrink-0 ml-3 transition-opacity hover:opacity-80 text-decoration-none"
                                    style={{
                                      backgroundColor: C.btnPrimary,
                                      fontFamily: T.fontFamily,
                                      fontSize: T.size.xs,
                                      fontWeight: T.weight.bold,
                                      padding: "6px 12px",
                                      borderRadius: "10px",
                                    }}
                                  >
                                    Attempt
                                  </Link>
                                </div>
                              );
                            })
                          ) : (
                           <div className="flex-1 flex items-center justify-center">
            <p
                style={{
                    fontFamily: T.fontFamily,
                    fontSize: T.size.base,
                    fontStyle: "italic",
                    color: C.textMuted,
                    margin: 0,
                    textAlign: "center"
                }}
            >
                No upcoming exams for this batch.
            </p>
        </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pagination (Always Visible) */}
                    <div
                      className="flex items-center justify-center gap-2 mt-6 pt-5"
                      style={{ borderTop: `1px solid ${C.cardBorder}` }}
                    >
                      <button
                        onClick={() => setBatchPage((p) => Math.max(1, p - 1))}
                        disabled={batchPage === 1}
                        style={{
                          backgroundColor: C.btnViewAllBg,
                          color: C.btnViewAllText,
                          padding: "6px 12px",
                          fontFamily: T.fontFamily,
                          fontSize: T.size.xs,
                          fontWeight: T.weight.bold,
                          borderRadius: "10px",
                          border: `1px solid ${C.cardBorder}`,
                          cursor: batchPage === 1 ? "not-allowed" : "pointer",
                          opacity: batchPage === 1 ? 0.5 : 1,
                        }}
                      >
                        ‹ Previous
                      </button>

                      {Array.from(
                        { length: Math.max(3, totalBatchPages) },
                        (_, i) => i + 1,
                      ).map((item) => {
                        const isDisabled = item > totalBatchPages;
                        return (
                          <button
                            key={item}
                            onClick={() => !isDisabled && setBatchPage(item)}
                            disabled={isDisabled}
                            style={
                              batchPage === item && !isDisabled
                                ? {
                                    backgroundColor: C.btnPrimary,
                                    color: "#ffffff",
                                    padding: "6px 12px",
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.bold,
                                    borderRadius: "10px",
                                    border: "none",
                                    cursor: "pointer",
                                  }
                                : {
                                    backgroundColor: C.btnViewAllBg,
                                    color: C.btnViewAllText,
                                    padding: "6px 12px",
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.bold,
                                    borderRadius: "10px",
                                    border: `1px solid ${C.cardBorder}`,
                                    cursor: isDisabled
                                      ? "not-allowed"
                                      : "pointer",
                                    opacity: isDisabled ? 0.5 : 1,
                                  }
                            }
                          >
                            {item}
                          </button>
                        );
                      })}

                      <button
                        onClick={() =>
                          setBatchPage((p) => Math.min(totalBatchPages, p + 1))
                        }
                        disabled={batchPage >= totalBatchPages}
                        style={{
                          backgroundColor: C.btnViewAllBg,
                          color: C.btnViewAllText,
                          padding: "6px 12px",
                          fontFamily: T.fontFamily,
                          fontSize: T.size.xs,
                          fontWeight: T.weight.bold,
                          borderRadius: "10px",
                          border: `1px solid ${C.cardBorder}`,
                          cursor:
                            batchPage >= totalBatchPages
                              ? "not-allowed"
                              : "pointer",
                          opacity: batchPage >= totalBatchPages ? 0.5 : 1,
                        }}
                      >
                        Next ›
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Recent Results */}
              <div
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  boxShadow: S.card,
                  borderRadius: R["2xl"],
                  padding: 24,
                }}
              >
                <SectionHeader
                  icon={MdWorkspacePremium}
                  title="Recent Results"
                  linkHref="/student/history"
                />
                <div className="space-y-3">
                  {history.length > 0 ? (
                    history.slice(0, 4).map((attempt) => {
                      const scorePct =
                        attempt.totalMarks > 0
                          ? Math.round(
                              (attempt.score / attempt.totalMarks) * 100,
                            )
                          : 0;
                      const passed = attempt.isPassed;
                      return (
                        <div
                          key={attempt._id}
                          className="flex items-center justify-between transition-colors"
                          style={{
                            backgroundColor: C.innerBg,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: "10px",
                            padding: 14,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              C.btnViewAllBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = C.innerBg;
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="flex items-center justify-center text-white shrink-0"
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: "10px",
                                backgroundColor: passed ? C.success : C.danger,
                                fontFamily: T.fontFamily,
                                fontSize: T.size.md,
                                fontWeight: T.weight.bold,
                              }}
                            >
                              {scorePct}%
                            </div>
                            <div className="min-w-0">
                              <p
                                className="truncate"
                                style={{
                                  fontFamily: T.fontFamily,
                                  fontSize: T.size.base,
                                  fontWeight: T.weight.bold,
                                  color: C.heading,
                                  margin: 0,
                                }}
                              >
                                {attempt.examId?.title || "Exam"}
                              </p>
                              <p
                                style={{
                                  fontFamily: T.fontFamily,
                                  fontSize: T.size.xs,
                                  color: C.textMuted,
                                  margin: 0,
                                  marginTop: 2,
                                  fontWeight: T.weight.bold,
                                }}
                              >
                                {new Date(
                                  attempt.submittedAt,
                                ).toLocaleDateString("en-IN")}
                              </p>
                            </div>
                          </div>
                          <span
                            className="shrink-0 ml-3"
                            style={
                              passed
                                ? {
                                    backgroundColor: C.successBg,
                                    color: C.success,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.bold,
                                    padding: "4px 10px",
                                    borderRadius: "10px",
                                    border: `1px solid ${C.successBorder}`,
                                  }
                                : {
                                    backgroundColor: C.dangerBg,
                                    color: C.danger,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.bold,
                                    padding: "4px 10px",
                                    borderRadius: "10px",
                                    border: `1px solid ${C.dangerBorder}`,
                                  }
                            }
                          >
                            {passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div
                      className="p-14 text-center border border-dashed"
                      style={{
                        backgroundColor: C.cardBg,
                        borderColor: C.cardBorder,
                        borderRadius: "10px",
                      }}
                    >
                      <div
                        className="flex items-center justify-center mx-auto mb-4"
                        style={{
                          width: 56,
                          height: 56,
                          backgroundColor: C.innerBg,
                          borderRadius: "10px",
                        }}
                      >
                        <MdArticle
                          style={{
                            width: 28,
                            height: 28,
                            color: C.btnPrimary,
                            opacity: 0.5,
                          }}
                        />
                      </div>
                      <h3
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.lg,
                          fontWeight: T.weight.bold,
                          color: C.heading,
                        }}
                      >
                        No Results Yet
                      </h3>
                      <p
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.base,
                          color: C.textMuted,
                          marginTop: 4,
                        }}
                      >
                        Complete exams to see your results here
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Overview (MOVED TO BOTTOM) */}
              <div
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  boxShadow: S.card,
                  borderRadius: R["2xl"],
                  padding: 24,
                }}
              >
                <SectionHeader
                  icon={MdTrendingUp}
                  title="Performance Overview"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 h-52">
                    {activityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={activityData}
                          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="chartGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={C.chartLine}
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="100%"
                                stopColor={C.chartLine}
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="month"
                            tick={{
                              fontSize: 11,
                              fill: C.textMuted,
                              fontFamily: T.fontFamily,
                              fontWeight: "bold",
                            }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{
                              fontSize: 11,
                              fill: C.textMuted,
                              fontFamily: T.fontFamily,
                              fontWeight: "bold",
                            }}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke={C.chartLine}
                            strokeWidth={2.5}
                            fill="url(#chartGrad)"
                            dot={{ r: 3, fill: C.chartLine, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: C.chartLine }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "10px",
                            backgroundColor: C.innerBg,
                          }}
                        >
                          <MdTrendingUp
                            style={{
                              width: 24,
                              height: 24,
                              color: C.chartLine,
                            }}
                          />
                        </div>
                        <p
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                            color: C.heading,
                            margin: 0,
                          }}
                        >
                          No activity yet
                        </p>
                        <p
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            color: C.textMuted,
                            textAlign: "center",
                            margin: 0,
                          }}
                        >
                          Complete exams to see your trend
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Score circle wrapper */}
                  <div
                    className="flex flex-col items-center justify-center gap-2"
                    style={{
                      backgroundColor: C.innerBg,
                      border: `1px solid ${C.cardBorder}`,
                      borderRadius: "10px",
                      padding: 16,
                    }}
                  >
                    <div
                      className="flex items-center justify-center mb-1"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: R.full,
                        border: `3px solid ${C.chartLine}`,
                      }}
                    >
                      <MdCheckCircleOutline
                        style={{ width: 24, height: 24, color: C.chartLine }}
                      />
                    </div>
                    <div className="text-center">
                      <p
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.base,
                          fontWeight: T.weight.bold,
                          color: C.heading,
                          margin: 0,
                        }}
                      >
                        Score
                      </p>
                      <p
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size["3xl"],
                          fontWeight: T.weight.bold,
                          color: C.statValue,
                          margin: "4px 0",
                        }}
                      >
                        {avgScore}%
                      </p>
                      <p
                        className="flex items-center gap-1 justify-center mt-1"
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.xs,
                          fontWeight: T.weight.bold,
                          color: C.chartLine,
                          margin: 0,
                        }}
                      >
                        <MdTrendingUp style={{ width: 14, height: 14 }} /> This
                        Month
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar (1 Column) */}
            <div className="xl:col-span-1 space-y-6">
              {/* AI Recommendations */}
              <SidePanel
                icon={MdAutoAwesome}
                title="AI Recommendations"
                open={aiOpen}
                onToggle={() => setAiOpen((v) => !v)}
              >
                <div className="space-y-3">
                  {[
                    {
                      icon: MdMenuBook,
                      text: "Continue your enrolled courses",
                    },
                    { icon: MdArticle, text: "Practice upcoming exam topics" },
                  ].map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3"
                      style={{
                        backgroundColor: C.innerBg,
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: "10px",
                        padding: 12,
                      }}
                    >
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "10px",
                          backgroundColor: C.iconBg,
                        }}
                      >
                        <rec.icon
                          style={{ width: 16, height: 16, color: C.iconColor }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.base,
                          fontWeight: T.weight.bold,
                          color: C.heading,
                        }}
                      >
                        {rec.text}
                      </span>
                    </div>
                  ))}
                  <Link
                    href="/student/ai-analytics"
                    className="flex items-center justify-center gap-2 w-full text-white transition-opacity hover:opacity-90 text-decoration-none"
                    style={{
                      background: C.gradientBtn,
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      fontWeight: T.weight.bold,
                      boxShadow: S.btn,
                      borderRadius: "10px",
                      border: "none",
                      padding: "12px 0",
                      marginTop: 8,
                    }}
                  >
                    <MdAutoAwesome style={{ width: 18, height: 18 }} />
                    Start AI Study Plan
                  </Link>
                </div>
              </SidePanel>

              {/* Instructor Announcements */}
              <SidePanel
                icon={MdPeople}
                title="Instructor Announcements"
                open={announcementsOpen}
                onToggle={() => setAnnouncementsOpen((v) => !v)}
              >
                <div className="space-y-3">
                  {announcements.length > 0 ? (
                    announcements.slice(0, 3).map((a) => (
                      <div
                        key={a.id}
                        className="p-3 border transition-colors hover:bg-slate-50"
                        style={{
                          backgroundColor: C.innerBg,
                          borderColor: C.cardBorder,
                          borderRadius: "10px",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="px-2 py-0.5 text-[9px] uppercase"
                            style={{
                              fontFamily: T.fontFamily,
                              fontWeight: T.weight.bold,
                              backgroundColor: C.cardBg,
                              color: C.text,
                              borderRadius: "8px",
                              border: `1px solid ${C.cardBorder}`,
                            }}
                          >
                            {a.courseTitle || "General"}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                            color: C.heading,
                            lineHeight: 1.3,
                            margin: "0 0 4px 0",
                          }}
                        >
                          {a.title}
                        </p>
                        <p
                          className="line-clamp-2"
                          style={{
                            fontSize: T.size.xs,
                            color: C.textMuted,
                            fontFamily: T.fontFamily,
                            margin: 0,
                          }}
                        >
                          {a.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontStyle: "italic",
                        color: C.textMuted,
                        margin: 0,
                      }}
                    >
                      No announcements at this time.
                    </p>
                  )}
                </div>
              </SidePanel>

              {/* Batch Details quick links */}
              <SidePanel
                icon={MdBarChart}
                title="Quick Links"
                open={batchPanelOpen}
                onToggle={() => setBatchPanelOpen((v) => !v)}
              >
                <div className="space-y-1">
                  {[
                    {
                      label: "My Batches",
                      href: "/student/batches",
                      icon: MdPeople,
                    },
                    {
                      label: "Test History",
                      href: "/student/history",
                      icon: MdBarChart,
                    },
                    {
                      label: "My Profile",
                      href: "/student/profile",
                      icon: MdPerson,
                    },
                  ].map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="flex items-center gap-3 transition-colors text-decoration-none"
                      style={{
                        color: C.heading,
                        padding: "10px 12px",
                        borderRadius: "10px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.innerBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "10px",
                          backgroundColor: C.iconBg,
                        }}
                      >
                        <link.icon
                          style={{ width: 16, height: 16, color: C.iconColor }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.base,
                          fontWeight: T.weight.bold,
                        }}
                      >
                        {link.label}
                      </span>
                      <MdArrowForward
                        className="ml-auto"
                        style={{ width: 16, height: 16, color: C.textMuted }}
                      />
                    </Link>
                  ))}
                </div>
              </SidePanel>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
