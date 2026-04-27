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
import { C, T, S, cx, pageStyle } from "@/constants/studentTokens";
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
        className={`flex items-center justify-center bg-slate-100 ${className}`}
      >
        <MdMenuBook className="w-6 h-6 text-slate-400" />
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
function IconPill({ icon: Icon, size = 20, bg, customSizeClasses }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg flex-shrink-0"
      style={{ width: 40, height: 40, backgroundColor: bg || C.iconBg }}
    >
      {/* Yahan customSizeClasses pass ki hain taaki custom icon ko apne hisaab se bada kar sakein */}
      <Icon
        style={{ width: size, height: size, color: C.iconColor }}
        className={customSizeClasses || "w-5 h-5"}
      />
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
            fontWeight: T.weight.semibold,
            color: C.heading,
          }}
        >
          {title}
        </h2>
      </div>
      {linkHref && (
        <Link
          href={linkHref}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: C.btnViewAllBg,
            color: C.btnViewAllText,
            fontFamily: T.fontFamily,
            fontSize: T.size.sm,
            fontWeight: T.weight.semibold,
          }}
        >
          {linkLabel} <MdArrowForward className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

// ─── SidePanel ────────────────────────────────────────────────────────────────
function SidePanel({ icon: Icon, title, open, onToggle, children }) {
  return (
    // SidePanel wrapper ko rounded-[10px] kar diya hai
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        backgroundColor: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: S.card,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = C.innerBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div className="flex items-center gap-2.5">
          <IconPill icon={Icon} size={15} />
          <span
            style={{
              fontFamily: T.fontFamily,
              fontSize: T.size.lg,
              fontWeight: T.weight.semibold,
              color: C.heading,
            }}
          >
            {title}
          </span>
        </div>
        {open ? (
          <MdKeyboardArrowUp className="w-5 h-5" style={{ color: C.text }} />
        ) : (
          <MdKeyboardArrowDown className="w-5 h-5" style={{ color: C.text }} />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div
        className="rounded-xl px-3 py-2 shadow-xl"
        style={{ backgroundColor: "#3D3B8E", fontFamily: T.fontFamily }}
      >
        <p
          style={{
            fontSize: T.size.xs,
            fontWeight: T.weight.medium,
            color: "rgba(255,255,255,0.55)",
            marginBottom: 2,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: T.size.lg,
            fontWeight: T.weight.black,
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
            setUpcomingExams(
              examsRes.data.exams
                .filter((e) => e.isScheduled && new Date(e.startDate) > now)
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .slice(0, 5),
            );
          }
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

  return (
    <div
      className="space-y-5 pb-8 min-h-screen"
      style={{ fontFamily: T.fontFamily, backgroundColor: C.pageBg }}
    >
      {/* ── Welcome Header & Switcher (YE HAMESHA DIKHEGA) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* User Profile Info */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              className="w-14 h-14 rounded-2xl overflow-hidden"
              style={{
                border: `2px solid ${C.btnPrimary}`,
                boxShadow: `0 0 0 3px ${C.btnViewAllBg}`,
              }}
            >
              <img
                src={user?.profileImage || "/default-avatar.png"}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
          </div>
          <div>
            <p
              suppressHydrationWarning={true}
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.xs,
                fontWeight: T.weight.semibold,
                color: C.text,
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
                fontWeight: T.weight.black,
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
                fontSize: T.size.md,
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
            className="relative flex items-center p-1 rounded-xl self-start sm:self-auto w-[240px]"
            style={{
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
              }}
            />
            {["institute", "global"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 relative z-10 py-1.5 rounded-lg capitalize transition-colors duration-300"
                style={{
                  fontFamily: T.fontFamily,
                  fontSize: T.size.lg,
                  fontWeight:
                    activeTab === tab ? T.weight.semibold : T.weight.semibold,
                  color: activeTab === tab ? "#ffffff" : C.text,
                }}
              >
                {tab === "institute" ? "My Institute" : "Global"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── NEECHE KA HISSA: LOADING YA DASHBOARD CONTENT ── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-12 h-12">
              <div
                className="w-12 h-12 rounded-full border-[3px] animate-spin"
                style={{
                  borderColor: `${C.btnPrimary}30`,
                  borderTopColor: C.btnPrimary,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <MdAutoAwesome
                  className="w-5 h-5 animate-pulse"
                  style={{ color: C.btnPrimary }}
                />
              </div>
            </div>
            <p
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.sm,
                fontWeight: T.weight.medium,
                color: C.text,
              }}
            >
              Loading dashboard...
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-500">
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

          {/* Continue Learning */}
          {inProgressCourses.length > 0 && (
            <div>
              <SectionHeader
                icon={MdPlayCircleOutline}
                title="Continue Learning"
                linkHref="/student/courses"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {inProgressCourses.map((enrollment, i) => {
                  const course = enrollment.courseId;
                  const pct = enrollment.progress?.percentage || 0;
                  const barColor = progressColors[i % progressColors.length];
                  return (
                    <Link
                      key={enrollment._id}
                      href={`/student/courses/${course?._id}`}
                      className="group rounded-[10px] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                      style={{
                        backgroundColor: C.cardBg,
                        border: `1px solid ${C.cardBorder}`,
                      }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
                          style={{ backgroundColor: C.innerBg }}
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
                              fontSize: T.size.md,
                              fontWeight: T.weight.semibold,
                              color: C.heading,
                            }}
                          >
                            {course?.title}
                          </h3>
                          <p
                            style={{
                              fontFamily: T.fontFamily,
                              fontSize: "11px",
                              color: C.text,

                              marginTop: 2,
                            }}
                          >
                            {timeAgo(
                              enrollment.lastAccessedAt || enrollment.updatedAt,
                            )}
                          </p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1.5">
                          <span
                            style={{
                              fontFamily: T.fontFamily,
                              fontSize: "12px",
                              fontWeight: T.weight.semibold,
                              color: C.text,
                            }}
                          >
                            {pct}% complete
                          </span>
                          <span
                            style={{
                              fontFamily: T.fontFamily,
                              fontSize: "12px",
                              fontWeight: T.weight.semibold,
                              color: barColor,
                            }}
                          >
                            Resume →
                          </span>
                        </div>
                        <div
                          className="w-full h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: C.innerBg }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Main Grid ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Left 2/3 */}
            <div className="xl:col-span-2 space-y-5">
              {/* Performance Overview */}
              <div
                className="rounded-[10px] p-5"
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  boxShadow: S.card,
                }}
              >
                <SectionHeader
                  icon={MdTrendingUp}
                  title="Performance Overview"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              fill: C.text,

                              fontFamily: T.fontFamily,
                            }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{
                              fontSize: 11,
                              fill: C.text,

                              fontFamily: T.fontFamily,
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
                          className="w-14 h-14 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: C.innerBg }}
                        >
                          <MdTrendingUp
                            className="w-6 h-6"
                            style={{ color: C.chartLine }}
                          />
                        </div>
                        <p
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.sm,
                            fontWeight: T.weight.semibold,
                            color: C.text,
                          }}
                        >
                          No activity yet
                        </p>
                        <p
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            color: C.text,

                            textAlign: "center",
                          }}
                        >
                          Complete exams to see your trend
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Score circle wrapper */}
                  <div
                    className="flex flex-col items-center justify-center rounded-[10px] p-4 gap-2"
                    style={{
                      backgroundColor: C.innerBg,
                      border: `1px solid ${C.cardBorder}`,
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full border-[3px] flex items-center justify-center mb-1"
                      style={{ borderColor: C.chartLine }}
                    >
                      <MdCheckCircleOutline
                        className="w-6 h-6"
                        style={{ color: C.chartLine }}
                      />
                    </div>
                    <div className="text-center">
                      <p
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.sm,
                          fontWeight: T.weight.semibold,
                          color: C.text,
                        }}
                      >
                        Score
                      </p>
                      <p
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size["3xl"],
                          fontWeight: T.weight.black,
                          color: C.statValue,
                        }}
                      >
                        {avgScore}%
                      </p>
                      <p
                        className="flex items-center gap-1 justify-center mt-1"
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.xs,
                          fontWeight: T.weight.semibold,
                          color: C.chartLine,
                        }}
                      >
                        <MdTrendingUp className="w-4 h-4" /> This Month
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Batch Details */}
              <div
                className="rounded-[10px] p-5"
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  boxShadow: S.card,
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
                      className="mb-3 uppercase"
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        color: C.btnPrimary,
                        letterSpacing: T.tracking.wider,
                      }}
                    >
                      {batches[0]?.name || "Batch A, Advanced Science"}
                    </p>
                    {batches[0] && (
                      <div
                        className="flex items-center gap-3 mb-4 p-2.5 rounded-[10px]"
                        style={{
                          backgroundColor: C.innerBg,
                          border: `1px solid ${C.cardBorder}`,
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: C.btnViewAllBg }}
                        >
                          <User
                            className="w-5 h-5"
                            style={{ color: C.btnPrimary }}
                          />
                        </div>
                        <div>
                          <p
                            style={{
                              fontFamily: T.fontFamily,
                              fontSize: T.size.base,
                              fontWeight: T.weight.bold,
                              color: C.heading,
                            }}
                          >
                            {batches[0]?.name || "Batch A"}
                          </p>
                          <p
                            style={{
                              fontFamily: T.fontFamily,
                              fontSize: T.size.sm,
                              color: C.text,
                            }}
                          >
                            {batches[0]?.instructorName || ""}
                          </p>
                        </div>
                        <span
                          className="ml-auto text-white px-2.5 py-1 rounded-lg shrink-0"
                          style={{
                            backgroundColor: C.btnPrimary,
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.black,
                          }}
                        >
                          {enrollments[0]?.progress?.percentage || 0}%
                        </span>
                      </div>
                    )}
                    <div className="space-y-3.5">
                      {enrollments.slice(0, 4).length > 0 ? (
                        enrollments.slice(0, 4).map((enrollment, i) => {
                          const pct = enrollment.progress?.percentage || 0;
                          const barColor =
                            progressColors[i % progressColors.length];
                          return (
                            <Link
                              key={enrollment._id}
                              href={`/student/courses/${enrollment.courseId?._id}`}
                              className="block group"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span
                                  className="truncate max-w-[68%]"
                                  style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.sm,
                                    fontWeight: T.weight.semibold,
                                    color: C.text,
                                  }}
                                >
                                  {enrollment.courseId?.title || "Course"}
                                </span>
                                <span
                                  className="text-white px-2 py-0.5 rounded-lg shrink-0 ml-2"
                                  style={{
                                    backgroundColor: barColor,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.black,
                                  }}
                                >
                                  {pct}%
                                </span>
                              </div>
                              <div
                                className="h-2 w-full rounded-full overflow-hidden"
                                style={{ backgroundColor: C.innerBg }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: barColor,
                                  }}
                                />
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <p
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.sm,
                            fontStyle: "italic",
                            color: C.text,
                          }}
                        >
                          No enrolled courses yet.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: upcoming exams */}
                  <div className="pl-0 md:pl-6 mt-4 md:mt-0">
                    <p
                      className="mb-3 uppercase"
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.xs,
                        fontWeight: T.weight.bold,
                        color: C.btnPrimary,
                        letterSpacing: T.tracking.wider,
                      }}
                    >
                      {batches[0]?.name || "Batch A, Advanced Science"}
                    </p>
                    <div className="space-y-2.5">
                      {upcomingExams.slice(0, 4).length > 0 ? (
                        upcomingExams.slice(0, 4).map((exam) => (
                          <div
                            key={exam._id}
                            className="flex items-center justify-between p-3 rounded-[10px] transition-colors"
                            style={{
                              backgroundColor: C.innerBg,
                              border: `1px solid ${C.cardBorder}`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                C.btnViewAllBg;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = C.innerBg;
                            }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: C.iconBg }}
                              >
                                <MdArticle className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p
                                  className="truncate"
                                  style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.sm,
                                    fontWeight: T.weight.semibold,
                                    color: C.heading,
                                  }}
                                >
                                  {exam.title}
                                </p>
                                <p
                                  style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: "11px",
                                    color: C.text,

                                    marginTop: 2,
                                  }}
                                >
                                  Batch in{" "}
                                  {Math.ceil(
                                    (new Date(exam.startDate) - new Date()) /
                                      (1000 * 60 * 60 * 24),
                                  )}{" "}
                                  days
                                </p>
                              </div>
                            </div>
                            <Link
                              href={`/student/exams/${exam._id}`}
                              className="px-3 py-1.5 text-white rounded-lg shrink-0 ml-2 transition-colors"
                              style={{
                                backgroundColor: C.btnPrimary,
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                              }}
                            >
                              Attempt
                            </Link>
                          </div>
                        ))
                      ) : (
                        <p
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontStyle: "italic",
                            color: C.text,
                          }}
                        >
                          No upcoming exams.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                <div
                  className="flex items-center justify-center gap-2 mt-5 pt-4"
                  style={{ borderTop: `1px solid ${C.cardBorder}` }}
                >
                  {["‹ Previous", "1", "2", "3", "Next ›"].map((item) => (
                    <button
                      key={item}
                      className="rounded-lg transition-colors"
                      style={
                        item === "1"
                          ? {
                              backgroundColor: C.btnPrimary,
                              color: "#ffffff",
                              padding: "6px 12px",
                              fontFamily: T.fontFamily,
                              fontSize: T.size.xs,
                              fontWeight: T.weight.black,
                            }
                          : {
                              backgroundColor: C.btnViewAllBg,
                              color: C.btnViewAllText,
                              padding: "6px 12px",
                              fontFamily: T.fontFamily,
                              fontSize: T.size.xs,
                              fontWeight: T.weight.bold,
                            }
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Results */}
              <div
                className="rounded-[10px] p-5"
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  boxShadow: S.card,
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
                          className="flex items-center justify-between p-3.5 rounded-[10px] transition-colors"
                          style={{
                            backgroundColor: C.innerBg,
                            border: `1px solid ${C.cardBorder}`,
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
                              className="w-11 h-11 rounded-lg flex items-center justify-center text-white shrink-0"
                              style={{
                                backgroundColor: passed ? C.success : C.danger,
                                fontFamily: T.fontFamily,
                                fontSize: T.size.md,
                                fontWeight: T.weight.semibold,
                              }}
                            >
                              {scorePct}%
                            </div>
                            <div className="min-w-0">
                              <p
                                className="truncate"
                                style={{
                                  fontFamily: T.fontFamily,
                                  fontSize: T.size.md,
                                  fontWeight: T.weight.semibold,
                                  color: C.heading,
                                }}
                              >
                                {attempt.examId?.title || "Exam"}
                              </p>
                              <p
                                style={{
                                  fontFamily: T.fontFamily,
                                  fontSize: "12px",
                                  color: C.text,

                                  marginTop: 2,
                                }}
                              >
                                {new Date(
                                  attempt.submittedAt,
                                ).toLocaleDateString("en-IN")}
                              </p>
                            </div>
                          </div>
                          <span
                            className="shrink-0 ml-2 px-2.5 py-1 rounded-full"
                            style={
                              passed
                                ? {
                                    backgroundColor: C.successBg,
                                    color: C.success,
                                    fontFamily: T.fontFamily,
                                    fontSize: "11px",
                                    fontWeight: T.weight.bold,
                                  }
                                : {
                                    backgroundColor: C.dangerBg,
                                    color: C.danger,
                                    fontFamily: T.fontFamily,
                                    fontSize: "11px",
                                    fontWeight: T.weight.bold,
                                  }
                            }
                          >
                            {passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: C.innerBg }}
                      >
                        <MdArticle
                          className="w-5 h-5"
                          style={{ color: C.btnPrimary }}
                        />
                      </div>
                      <p
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.sm,
                          color: C.text,
                        }}
                      >
                        No exam results yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              {/* AI Recommendations */}
              <SidePanel
                icon={CustomAIIcon}
                title="AI Recommendations"
                open={aiOpen}
                onToggle={() => setAiOpen((v) => !v)}
              >
                <div className="space-y-2.5">
                  {[
                    {
                      icon: MdMenuBook,
                      text: "Continue your enrolled courses",
                    },
                    { icon: MdArticle, text: "Practice upcoming exam topics" },
                  ].map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-3 rounded-[10px]"
                      style={{
                        backgroundColor: C.innerBg,
                        border: `1px solid ${C.cardBorder}`,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: C.iconBg }}
                      >
                        <rec.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.md,
                          fontWeight: T.weight.semibold,
                          color: C.text,
                        }}
                      >
                        {rec.text}
                      </span>
                    </div>
                  ))}
                  <Link
                    href="/student/ai-analytics"
                    className="flex items-center justify-center gap-2 w-full py-3 text-white rounded-lg mt-1 transition-all"
                    style={{
                      backgroundColor: C.btnPrimary,
                      fontFamily: T.fontFamily,
                      fontSize: T.size.sm,
                      fontWeight: T.weight.bold,
                      boxShadow: `0 4px 14px ${C.btnPrimary}50`,
                    }}
                  >
                    <MdAutoAwesome className="w-5 h-5" />
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
                <div className="space-y-2.5">
                  {upcomingExams.length > 0 ? (
                    upcomingExams.slice(0, 3).map((exam) => (
                      <div
                        key={exam._id}
                        className="flex items-start gap-2.5 p-3 rounded-[10px]"
                        style={{
                          backgroundColor: C.innerBg,
                          border: `1px solid ${C.cardBorder}`,
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: C.iconBg }}
                        >
                          <MdArticle className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            lineHeight: T.leading.relaxed,
                            color: C.text,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: T.weight.bold,
                              color: C.heading,
                            }}
                          >
                            {exam.title}
                          </span>{" "}
                          on{" "}
                          <span
                            style={{
                              fontWeight: T.weight.semibold,
                              color: C.btnPrimary,
                            }}
                          >
                            {new Date(exam.startDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </p>
                      </div>
                    ))
                  ) : (
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontStyle: "italic",
                        color: C.text,
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
                title="Batch Details"
                open={batchPanelOpen}
                onToggle={() => setBatchPanelOpen((v) => !v)}
              >
                <div className="space-y-0.5">
                  {[
                    {
                      label: "My Batches",
                      href: "/student/batches",
                      icon: MdPeople,
                    },
                    {
                      label: "Batch Reportrties",
                      href: "/student/history",
                      icon: MdBarChart,
                    },
                    {
                      label: "Profile",
                      href: "/student/profile",
                      icon: MdPerson,
                    },
                  ].map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-colors"
                      style={{ color: C.text }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.innerBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: C.iconBg }}
                      >
                        <link.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.md,
                          fontWeight: T.weight.semibold,
                        }}
                      >
                        {link.label}
                      </span>
                      <MdArrowForward
                        className="w-4 h-4 ml-auto"
                        style={{ color: C.text }}
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
