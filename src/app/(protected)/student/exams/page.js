"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MdArticle,
  MdTimer,
  MdCheckCircle,
  MdArrowForward,
  MdAccessTime,
  MdSearch,
  MdFilterList,
  MdAutoAwesome,
  MdCalendarToday,
  MdMenuBook,
  MdPlayCircleOutline,
  MdChevronLeft,
  MdChevronRight,
  MdFlashOn,
} from "react-icons/md";
import api from "@/lib/axios";
import { getAudienceDisplay } from "@/lib/audienceDisplay";
import { C, T, S, R, FX } from "@/constants/studentTokens";
import StatCard from "@/components/StatCard";

// Focus Handlers
const onFocusHandler = (e) => {
  e.target.style.borderColor = C.btnPrimary;
  e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`;
};
const onBlurHandler = (e) => {
  e.target.style.borderColor = "transparent";
  e.target.style.boxShadow = "none";
};

const baseInputStyle = {
  backgroundColor: C.surfaceWhite,
  border: "1.5px solid transparent",
  borderRadius: "10px",
  color: C.heading,
  fontFamily: T.fontFamily,
  fontSize: T.size.base, // Updated from sm to base
  fontWeight: T.weight.semibold,
  outline: "none",
  width: "100%",
  padding: "10px 16px",
  transition: "all 0.2s ease",
};

export default function StudentExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [todayCarouselIdx, setTodayCarouselIdx] = useState(0);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get("/exams/student/all");
        if (res.data.success) setExams(res.data.exams);
      } catch (error) {
        console.error("Failed to load exams", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

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

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const status = getStatus(exam);
      const matchesSearch = exam.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      if (filter === "all") return matchesSearch;
      return status === filter && matchesSearch;
    });
  }, [exams, filter, searchTerm]);

  const stats = useMemo(
    () => ({
      all: exams.length,
      available: exams.filter((e) => getStatus(e) === "available").length,
      upcoming: exams.filter((e) => getStatus(e) === "upcoming").length,
      completed: exams.filter((e) => getStatus(e) === "completed").length,
    }),
    [exams],
  );

  // Today's exams: active exams that have a specific schedule
  const todayExams = useMemo(() => {
    return exams.filter((exam) => {
      // Must be 'available' right now AND must be a scheduled event
      return getStatus(exam) === "available" && exam.isScheduled;
    });
  }, [exams]);

  const statusConfig = {
    available: {
      label: "Available",
      bg: C.successBg,
      text: C.success,
      border: C.successBorder,
    },
    upcoming: {
      label: "Upcoming",
      bg: C.warningBg,
      text: C.warning,
      border: C.warningBorder,
    },
    completed: {
      label: "Completed",
      bg: C.btnViewAllBg,
      text: C.btnPrimary,
      border: C.btnViewAllBg, // Avoided strong border for completed
    },
    expired: {
      label: "Expired",
      bg: C.dangerBg,
      text: C.danger,
      border: C.dangerBorder,
    },
  };

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
        style={{ backgroundColor: C.pageBgAlt, fontFamily: T.fontFamily }}
      >
        <div
          className="w-12 h-12 rounded-full border-[3px] animate-spin"
          style={{
            borderColor: `${C.btnPrimary}30`,
            borderTopColor: C.btnPrimary,
          }}
        />
        <p
          style={{
            color: C.textMuted,
            fontSize: T.size.base, // Updated from sm to base
            fontWeight: T.weight.bold,
          }}
        >
          Loading your exams...
        </p>
      </div>
    );
  }

  const FILTER_TABS = [
    { key: "all", label: `All (${stats.all})` },
    { key: "available", label: `Available (${stats.available})` },
    { key: "upcoming", label: `Upcoming (${stats.upcoming})` },
    { key: "completed", label: `Completed (${stats.completed})` },
  ];

  return (
    <div
      className="w-full min-h-screen space-y-6"
      style={{
        backgroundColor: C.pageBg,
        fontFamily: T.fontFamily,
        color: C.text,
      }}
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
        style={{
          backgroundColor: C.outerCard,
          borderRadius: R["2xl"],
          border: `1px solid ${C.cardBorder}`,
          boxShadow: S.card,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 flex items-center justify-center shrink-0"
            style={{ backgroundColor: C.innerBox, borderRadius: "10px" }}
          >
            <MdArticle size={24} color={C.btnPrimary} />
          </div>
          <div>
            <h1
              style={{
                color: C.heading,
                fontSize: T.size.xl,
                fontWeight: T.weight.bold, // Updated from black to bold
                margin: "0 0 4px 0",
              }}
            >
              My Exams
            </h1>
            <p
              style={{
                color: C.textMuted,
                fontSize: T.size.base, // Updated from sm to base
                fontWeight: T.weight.semibold,
                margin: 0,
              }}
            >
              Access and attempt exams from your enrolled courses.
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards — uses global dashboard-consistent StatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Exams"
          value={stats.all}
          icon={MdArticle}
          iconBg="#E3DFF8"
          iconColor={C.btnPrimary}
        />
        <StatCard
          label="Available Now"
          value={stats.available}
          icon={MdPlayCircleOutline}
          iconBg={C.successBg}
          iconColor={C.success}
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          icon={MdCalendarToday}
          iconBg={C.warningBg}
          iconColor={C.warning}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={MdCheckCircle}
          iconBg="rgba(79,70,229,0.1)"
          iconColor="#4F46E5"
        />
      </div>

      {/* ── Today's Exams Carousel ─────────────────────────────── */}
      {todayExams.length > 0 && (
        <div
          className="p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(to top, #4A00E0, #8E2DE2)", // Consistent Neon Glow Gradient
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: S.card,
            borderRadius: R["2xl"],
          }}
        >
          {/* dot grid bg */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(white 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          <div className="relative z-10">
            {/* Header */}
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
                      fontWeight: T.weight.bold, // Updated from black to bold
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
                    {todayExams.length} exam{todayExams.length > 1 ? "s" : ""}{" "}
                    available right now
                  </p>
                </div>
              </div>
              {/* Arrow nav */}
              {todayExams.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setTodayCarouselIdx(
                        (i) => (i - 1 + todayExams.length) % todayExams.length,
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
                      setTodayCarouselIdx((i) => (i + 1) % todayExams.length)
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

            {/* Exam Card */}
            {(() => {
              const exam = todayExams[todayCarouselIdx];
              if (!exam) return null;
              return (
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
                      style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "10px" }}
                    >
                      <MdArticle size={22} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="truncate"
                        style={{
                          fontSize: T.size.lg,
                          fontWeight: T.weight.bold, // Updated from black to bold
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
                          <MdTimer size={13} className="text-amber-300" />
                          {exam.duration} mins
                        </span>
                        <span
                          className="flex items-center gap-1.5"
                          style={{
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            color: "rgba(255,255,255,0.8)",
                          }}
                        >
                          <MdMenuBook size={13} className="text-sky-300" />
                          {exam.totalQuestions ||
                            exam.questions?.length ||
                            "—"}{" "}
                          Questions
                        </span>
                        {exam.endDate && (
                          <span
                            className="flex items-center gap-1.5"
                            style={{
                              fontSize: T.size.xs,
                              fontWeight: T.weight.bold,
                              color: "rgba(255,255,255,0.8)",
                            }}
                          >
                            <MdAccessTime size={13} className="text-red-300" />
                            Ends{" "}
                            {new Date(exam.endDate).toLocaleTimeString(
                              "en-US",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        )}
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
                        background: C.surfaceWhite, // Changed from gradient to keep it clean
                        color: C.btnPrimary,
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base, // Updated from sm to base
                        fontWeight: T.weight.bold, // Updated from black to bold
                        borderRadius: "10px",
                      }}
                    >
                      <MdPlayCircleOutline size={16} /> Take Exam
                    </button>
                  </Link>
                </div>
              );
            })()}

            {/* Dot indicators */}
            {todayExams.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-4">
                {todayExams.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTodayCarouselIdx(i)}
                    className="rounded-full border-none cursor-pointer transition-all"
                    style={{
                      width: i === todayCarouselIdx ? "20px" : "6px",
                      height: "6px",
                      backgroundColor:
                        i === todayCarouselIdx
                          ? "#fff"
                          : "rgba(255,255,255,0.35)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Area */}
      <div
        className="overflow-hidden flex flex-col"
        style={{
          backgroundColor: C.outerCard,
          borderRadius: R["2xl"],
          border: `1px solid ${C.cardBorder}`,
          boxShadow: S.card,
        }}
      >
        <div
          className="p-5"
          style={{
            backgroundColor: C.innerBox,
            borderBottom: `1px solid ${C.cardBorder}`,
          }}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto w-full lg:w-auto custom-scrollbar pb-2 lg:pb-0">
              {FILTER_TABS.map(({ key, label }) => {
                const isActive = filter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className="flex items-center gap-2 px-4 py-2 cursor-pointer border-none transition-all shrink-0"
                    style={{
                      backgroundColor: isActive ? C.btnPrimary : C.surfaceWhite,
                      color: isActive ? "#fff" : C.textMuted,
                      borderRadius: "8px",
                      fontSize: T.size.base, // Updated from sm to base
                      fontWeight: isActive ? T.weight.bold : T.weight.semibold,
                      fontFamily: T.fontFamily,
                      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : "none",
                      border: isActive ? "none" : `1px solid ${C.cardBorder}`,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-72 shrink-0">
              <MdSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: C.textMuted }}
              />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...baseInputStyle,
                  paddingLeft: "36px",
                  height: "40px",
                }}
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[900px]">
            {/* Header Row */}
            <div
              className="grid grid-cols-[40px_2.5fr_1fr_1fr_1fr_120px] gap-4 px-6 py-4"
              style={{ borderBottom: `1px solid ${C.cardBorder}` }}
            >
              {[
                "#",
                "Exam Details",
                "Duration",
                "Questions",
                "Status",
                "Action",
              ].map((h, i) => (
                <span
                  key={i}
                  className={i === 5 ? "text-right" : ""}
                  style={{
                    fontSize: "10px",
                    fontWeight: T.weight.bold, // Updated from black to bold
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* List */}
            {filteredExams.length > 0 ? (
              <div className="flex flex-col">
                {filteredExams.map((exam, idx) => {
                  const status = getStatus(exam);
                  const cfg = statusConfig[status] || statusConfig.available;
                  const audienceInfo = getAudienceDisplay(exam);

                  return (
                    <div
                      key={exam._id}
                      className="grid grid-cols-[40px_2.5fr_1fr_1fr_1fr_120px] gap-4 px-6 py-4 items-center transition-colors hover:bg-white/40"
                      style={{
                        borderBottom:
                          idx !== filteredExams.length - 1
                            ? `1px solid ${C.cardBorder}`
                            : "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: T.size.base, // Updated from sm to base
                          fontWeight: T.weight.bold,
                          color: C.textMuted,
                        }}
                      >
                        {idx + 1}
                      </span>

                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p
                            className="truncate"
                            style={{
                              fontSize: T.size.md,
                              fontWeight: T.weight.bold, // Updated from black to bold
                              color: C.heading,
                              margin: 0,
                            }}
                          >
                            {exam.title}
                          </p>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider ${audienceInfo.badgeClass}`}
                            style={{ fontWeight: T.weight.bold }} // Updated from black to bold
                          >
                            {audienceInfo.label}
                          </span>
                          {exam.isFree && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-md uppercase tracking-wider border border-emerald-200">
                              Free
                            </span>
                          )}
                        </div>
                        {exam.courseTitle && (
                          <p
                            className="truncate"
                            style={{
                              fontSize: T.size.xs,
                              fontWeight: T.weight.bold,
                              color: C.textMuted,
                              margin: "0 0 2px 0",
                            }}
                          >
                            {exam.courseTitle}
                          </p>
                        )}
                        <p
                          className="truncate"
                          style={{
                            fontSize: "10px",
                            color: C.text,
                            opacity: 0.5,
                            margin: 0,
                          }}
                        >
                          {audienceInfo.reason}
                        </p>
                      </div>

                      <div
                        className="flex items-center gap-1.5"
                        style={{
                          fontSize: T.size.base, // Updated from sm to base
                          fontWeight: T.weight.bold,
                          color: C.heading,
                        }}
                      >
                        <MdTimer size={14} color={C.textMuted} /> {exam.duration}{" "}
                        mins
                      </div>

                      <div
                        style={{
                          fontSize: T.size.base, // Updated from sm to base
                          fontWeight: T.weight.bold,
                          color: C.heading,
                        }}
                      >
                        {exam.totalQuestions || exam.questions?.length || "—"}{" "}
                        Qs
                      </div>

                      <div>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: T.weight.bold, // Updated from black to bold
                            padding: "4px 10px",
                            borderRadius: R.full,
                            textTransform: "uppercase",
                            backgroundColor: cfg.bg,
                            color: cfg.text,
                            border: `1px solid ${cfg.border}`,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      <div className="text-right">
                        {status === "available" ? (
                          <Link
                            href={`/student/exams/${exam._id}/take`}
                            className="text-decoration-none"
                          >
                            <button
                              className="h-9 w-full cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                              style={{
                                background: C.gradientBtn,
                                color: "#fff",
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                fontFamily: T.fontFamily,
                                borderRadius: "10px",
                              }}
                            >
                              Start Exam
                            </button>
                          </Link>
                        ) : status === "completed" ? (
                          <Link
                            href={`/student/exams/${exam._id}/result${exam.lastAttemptId ? `?attemptId=${exam.lastAttemptId}` : ""}`}
                            className="text-decoration-none"
                          >
                            <button
                              className="h-9 w-full cursor-pointer transition-colors hover:bg-slate-50 shadow-sm border"
                              style={{
                                backgroundColor: C.surfaceWhite,
                                borderColor: C.cardBorder,
                                color: C.btnPrimary,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                fontFamily: T.fontFamily,
                                borderRadius: "10px",
                              }}
                            >
                              View Result
                            </button>
                          </Link>
                        ) : status === "upcoming" ? (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: T.weight.bold,
                              color: C.textMuted,
                              display: "block",
                              textAlign: "center",
                              backgroundColor: C.innerBox,
                              padding: "6px",
                              borderRadius: "8px",
                            }}
                          >
                            {new Date(exam.startDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: T.weight.bold,
                              color: C.danger,
                              display: "block",
                              textAlign: "center",
                              backgroundColor: C.dangerBg,
                              padding: "6px",
                              borderRadius: "8px",
                              border: `1px solid ${C.dangerBorder}`,
                            }}
                          >
                            Expired
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="text-center py-20 flex flex-col items-center"
                style={{ backgroundColor: C.outerCard }}
              >
                <MdArticle
                  size={48}
                  color={C.textMuted}
                  style={{ opacity: 0.3, marginBottom: "16px" }}
                />
                <p
                  style={{
                    fontSize: T.size.md,
                    fontWeight: T.weight.bold,
                    color: C.heading,
                    margin: "0 0 4px 0",
                  }}
                >
                  No exams found
                </p>
                <p
                  style={{
                    fontSize: T.size.base, // Updated from sm to base
                    fontWeight: T.weight.semibold,
                    color: C.textMuted,
                    margin: 0,
                  }}
                >
                  Enroll in courses or adjust your filters to see exams.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}