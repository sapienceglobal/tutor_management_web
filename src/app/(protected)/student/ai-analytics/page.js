"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle,
  Clock,
  TrendingUp,
  Sparkles,
  Brain,
  Target,
  Award,
  XCircle,
  FileText,
  Download,
  Printer,
  LayoutList,
} from "lucide-react";
import api from "@/lib/axios";
import { Suspense } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { C, T, S, R } from "@/constants/studentTokens";

import StatCard from "@/components/StatCard";
import { MdTrendingUp, MdCheckCircle, MdAccessTime } from "react-icons/md";

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const PIE_COLORS = [C.success, C.btnPrimary, C.warning, C.danger];

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 shadow-xl"
      style={{
        backgroundcolor: C.headingDark,
        border: "1px solid rgba(255,255,255,0.1)",
        fontFamily: T.fontFamily,
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: T.weight.bold,
          color: "rgba(255,255,255,0.6)",
          marginBottom: 2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: T.size.lg,
          fontWeight: T.weight.black,
          color: "#fff",
        }}
      >
        {payload[0].value}%{" "}
        <span
          style={{
            fontSize: "10px",
            fontWeight: T.weight.bold,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          AVG
        </span>
      </p>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 shadow-xl"
      style={{
        backgroundcolor: C.headingDark,
        border: "1px solid rgba(255,255,255,0.1)",
        fontFamily: T.fontFamily,
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: T.weight.bold,
          color: "rgba(255,255,255,0.6)",
          textTransform: "uppercase",
        }}
      >
        {payload[0].name} Score
      </p>
      <p
        style={{
          fontSize: T.size.md,
          fontWeight: T.weight.black,
          color: payload[0].payload.fill,
          marginTop: 2,
        }}
      >
        {payload[0].value} Tests
      </p>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
function AIAnalyticsContent() {
  const [attempts, setAttempts] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("analytics");

  // Naya State: Report data store karne ke liye
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyRes, examsRes, summaryRes] = await Promise.all([
          api.get("/exams/student/history-all"),
          api.get("/exams/student/all"),
          api.get("/reports/student/summary"), // NAYA BACKEND ROUTE
        ]);

        if (historyRes.data?.success)
          setAttempts(historyRes.data.attempts || []);
        if (examsRes.data?.success) setAllExams(examsRes.data.exams || []);
        if (summaryRes.data?.success) setReportData(summaryRes.data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const insights = useMemo(() => {
    if (!attempts.length) return { avgScore: 0, completed: 0, pending: 0 };
    const totalPct = attempts.reduce(
      (sum, a) =>
        sum +
        (a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0),
      0,
    );
    return {
      avgScore: Math.round(totalPct / attempts.length),
      completed: attempts.length,
      pending: allExams.filter((e) => !e.isCompleted).length,
    };
  }, [attempts, allExams]);

  const performanceTrend = useMemo(() => {
    const monthMap = {};
    attempts.forEach((a) => {
      const key = new Date(
        a.date || a.submittedAt || a.createdAt,
      ).toLocaleDateString("en-US", { month: "short" });
      if (!monthMap[key]) monthMap[key] = { name: key, total: 0, count: 0 };
      monthMap[key].total +=
        a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      monthMap[key].count++;
    });
    return Object.values(monthMap).map((m) => ({
      name: m.name,
      avg: Math.round(m.total / m.count),
      count: m.count,
    }));
  }, [attempts]);

  const scoreDistribution = useMemo(() => {
    const ranges = [
      { name: "90–100%", count: 0 },
      { name: "80–89%", count: 0 },
      { name: "70–79%", count: 0 },
      { name: "Below 70%", count: 0 },
    ];
    attempts.forEach((a) => {
      const pct =
        a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      if (pct >= 90) ranges[0].count++;
      else if (pct >= 80) ranges[1].count++;
      else if (pct >= 70) ranges[2].count++;
      else ranges[3].count++;
    });
    return ranges.filter((r) => r.count > 0);
  }, [attempts]);

  const recentScores = useMemo(
    () =>
      [...attempts]
        .sort(
          (a, b) =>
            new Date(b.date || b.submittedAt) -
            new Date(a.date || a.submittedAt),
        )
        .slice(0, 5),
    [attempts],
  );

  // ─── Export Functions ──────────────────────────────────────────────────
  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (!reportData?.examAttempts) {
      toast.error("No exam data available to download.");
      return;
    }

    const headers = "Exam Title,Score,Total Marks,Percentage,Status,Date\n";
    const rows = reportData.examAttempts
      .map((a) => {
        const status = a.isPassed ? "Passed" : "Failed";
        const dateStr = new Date(a.date).toLocaleDateString();
        return `"${a.examTitle}",${a.score},${a.totalMarks},${a.pct}%,"${status}","${dateStr}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Student_Report_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("CSV Downloaded Successfully");
  };

  if (loading)
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-3"
        style={{ backgroundColor: C.pageBgAlt }}
      >
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-[#4F46E5] animate-pulse" />
          </div>
        </div>
        <p
          style={{
            fontFamily: T.fontFamily,
            fontSize: T.size.sm,
            fontWeight: T.weight.bold,
            color: C.textMuted,
          }}
        >
          Loading Reports & Analytics...
        </p>
      </div>
    );

  return (
    <div
      className="w-full min-h-screen p-6 space-y-6"
      style={{
        backgroundColor: C.pageBgAlt,
        fontFamily: T.fontFamily,
        color: C.text,
      }}
    >
      {/* Print Stylesheet (Hides everything except the report card when printing) */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report,
          #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl no-print"
        style={{
          backgroundColor: C.outerCard,
          border: `1px solid ${C.cardBorder}`,
          boxShadow: S.card,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: C.innerBox, borderRadius: R.xl }}
          >
            <LayoutList size={24} color={C.btnPrimary} />
          </div>
          <div>
            <h1
              style={{
                fontSize: T.size.xl,
                fontWeight: T.weight.black,
                color: C.heading,
                margin: "0 0 2px 0",
              }}
            >
              Reports & Analytics
            </h1>
            <p
              style={{
                fontSize: T.size.sm,
                fontWeight: T.weight.medium,
                color: C.textMuted,
                margin: 0,
              }}
            >
              Analyze your performance and download official reports.
            </p>
          </div>
        </div>

        <div
          className="flex p-1 rounded-xl shrink-0"
          style={{
            backgroundColor: C.innerBox,
            border: `1px solid ${C.cardBorder}`,
          }}
        >
          {[
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "reports", label: "Reports & Downloads", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer border-none"
              style={
                activeTab === tab.id
                  ? {
                      backgroundColor: C.btnPrimary,
                      color: "#ffffff",
                      fontSize: T.size.sm,
                      fontWeight: T.weight.bold,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }
                  : {
                      backgroundColor: "transparent",
                      color: C.textMuted,
                      fontSize: T.size.sm,
                      fontWeight: T.weight.bold,
                    }
              }
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ ANALYTICS TAB ═══════════════════════════════════════════ */}
      {activeTab === "analytics" && (
        <div className="space-y-6 no-print">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Average Score"
              value={`${insights.avgScore}%`}
              icon={MdTrendingUp}
              iconBg={C.innerBox}
              iconColor={C.btnPrimary}
            />
            <StatCard
              label="Completed Tests"
              value={insights.completed}
              icon={MdCheckCircle}
              iconBg={C.successBg}
              iconColor={C.success}
            />
            <StatCard
              label="Tests Pending"
              value={insights.pending}
              icon={MdAccessTime}
              iconBg={C.warningBg}
              iconColor={C.warning}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Performance Trend */}
            <div
              className="rounded-3xl p-6 shadow-sm border flex flex-col"
              style={{
                backgroundColor: C.outerCard,
                borderColor: C.cardBorder,
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: C.innerBox }}
                  >
                    <BarChart3 size={16} color={C.btnPrimary} />
                  </div>
                  <h2
                    style={{
                      fontSize: T.size.md,
                      fontWeight: T.weight.black,
                      color: C.heading,
                      margin: 0,
                    }}
                  >
                    Performance Trend
                  </h2>
                </div>
                <span
                  className="px-3 py-1 rounded-lg"
                  style={{
                    backgroundColor: C.innerBox,
                    color: C.textMuted,
                    fontSize: "10px",
                    fontWeight: T.weight.bold,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Monthly Avg
                </span>
              </div>

              {performanceTrend.length > 0 ? (
                <div className="flex-1 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performanceTrend}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      barCategoryGap="25%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(0,0,0,0.05)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 10,
                          fill: C.textMuted,
                          fontWeight: 700,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fontSize: 10,
                          fill: C.textMuted,
                          fontWeight: 700,
                        }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                      />
                      <RechartsTooltip
                        content={<CustomBarTooltip />}
                        cursor={{ fill: "rgba(0,0,0,0.02)" }}
                      />
                      <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {performanceTrend.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              i === performanceTrend.length - 1
                                ? C.btnPrimary
                                : "#C5BFEA"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50 py-10">
                  <BarChart3 size={32} color={C.textMuted} />
                  <p
                    style={{
                      fontSize: T.size.sm,
                      fontWeight: T.weight.bold,
                      color: C.textMuted,
                    }}
                  >
                    No data to show
                  </p>
                </div>
              )}
            </div>

            {/* Score Distribution */}
            <div
              className="rounded-3xl p-6 shadow-sm border flex flex-col"
              style={{
                backgroundColor: C.outerCard,
                borderColor: C.cardBorder,
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: C.successBg }}
                >
                  <Target size={16} color={C.success} />
                </div>
                <h2
                  style={{
                    fontSize: T.size.md,
                    fontWeight: T.weight.black,
                    color: C.heading,
                    margin: 0,
                  }}
                >
                  Score Distribution
                </h2>
              </div>

              {scoreDistribution.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-8 flex-1">
                  <div className="w-48 h-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={scoreDistribution}
                          dataKey="count"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          stroke="none"
                        >
                          {scoreDistribution.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4 flex-1 w-full">
                    {scoreDistribution.map((range, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1.5">
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: T.weight.bold,
                                color: C.textMuted,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              {range.name}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: T.weight.black,
                                color: PIE_COLORS[i % PIE_COLORS.length],
                              }}
                            >
                              {range.count} Tests
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ backgroundColor: C.innerBox }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(range.count / attempts.length) * 100}%`,
                              }}
                              transition={{ duration: 1 }}
                              className="h-full rounded-full"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[i % PIE_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50 py-10">
                  <Target size={32} color={C.textMuted} />
                  <p
                    style={{
                      fontSize: T.size.sm,
                      fontWeight: T.weight.bold,
                      color: C.textMuted,
                    }}
                  >
                    Complete tests to see distribution
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent attempts */}
          {recentScores.length > 0 && (
            <div
              className="rounded-3xl shadow-sm border overflow-hidden"
              style={{
                backgroundColor: C.outerCard,
                borderColor: C.cardBorder,
              }}
            >
              <div
                className="px-6 py-5 flex items-center justify-between"
                style={{
                  borderBottom: `1px solid ${C.cardBorder}`,
                  backgroundColor: C.innerBox,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm">
                    <Clock size={16} color={C.btnPrimary} />
                  </div>
                  <h2
                    style={{
                      fontSize: T.size.md,
                      fontWeight: T.weight.black,
                      color: C.heading,
                      margin: 0,
                    }}
                  >
                    Recent Attempts
                  </h2>
                </div>
                <Link href="/student/history" className="text-decoration-none">
                  <button
                    className="flex items-center gap-1 h-8 px-3 rounded-lg border-none cursor-pointer transition-colors hover:bg-slate-200"
                    style={{
                      backgroundColor: C.surfaceWhite,
                      color: C.btnPrimary,
                      fontSize: "11px",
                      fontWeight: T.weight.bold,
                    }}
                  >
                    View all
                  </button>
                </Link>
              </div>

              <div className="flex flex-col p-3 gap-2">
                {recentScores.map((attempt, i) => {
                  const pct =
                    attempt.totalMarks > 0
                      ? Math.round((attempt.score / attempt.totalMarks) * 100)
                      : 0;
                  const passed = attempt.isPassed;
                  return (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 rounded-2xl transition-colors hover:bg-white/40"
                      style={{
                        backgroundColor: C.innerBox,
                        border: `1px solid ${C.cardBorder}`,
                        borderLeft: `4px solid ${passed ? C.success : C.danger}`,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{
                            backgroundColor: passed ? C.successBg : C.dangerBg,
                          }}
                        >
                          {passed ? (
                            <CheckCircle size={18} color={C.success} />
                          ) : (
                            <XCircle size={18} color={C.danger} />
                          )}
                        </div>
                        <div>
                          <p
                            className="truncate max-w-[250px] md:max-w-md"
                            style={{
                              fontSize: T.size.sm,
                              fontWeight: T.weight.bold,
                              color: C.heading,
                              margin: "0 0 2px 0",
                            }}
                          >
                            {attempt.examTitle || attempt.exam?.title || "Exam"}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              fontWeight: T.weight.bold,
                              color: C.textMuted,
                              margin: 0,
                            }}
                          >
                            {new Date(
                              attempt.date || attempt.submittedAt,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <div className="text-right">
                          <p
                            style={{
                              fontSize: T.size.md,
                              fontWeight: T.weight.black,
                              color: passed ? C.success : C.danger,
                              margin: "0 0 2px 0",
                              lineHeight: 1,
                            }}
                          >
                            {pct}%
                          </p>
                          <p
                            style={{
                              fontSize: "10px",
                              fontWeight: T.weight.bold,
                              color: C.textMuted,
                              margin: 0,
                            }}
                          >
                            {attempt.score} / {attempt.totalMarks}
                          </p>
                        </div>
                        <Link
                          href={`/student/exams/attempt/${attempt._id}`}
                          className="text-decoration-none"
                        >
                          <button
                            className="h-9 px-4 rounded-xl border-none cursor-pointer transition-opacity hover:opacity-80 shadow-sm"
                            style={{
                              backgroundColor: C.surfaceWhite,
                              color: C.btnPrimary,
                              fontSize: "11px",
                              fontWeight: T.weight.bold,
                              border: `1px solid ${C.cardBorder}`,
                            }}
                          >
                            View Details
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ REPORTS & DOWNLOADS TAB ═════════════════════════════════════ */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 no-print">
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-2 h-11 px-6 rounded-xl border-none cursor-pointer transition-transform hover:-translate-y-0.5 shadow-md"
              style={{
                backgroundColor: C.btnPrimary,
                color: "white",
                fontSize: T.size.sm,
                fontWeight: T.weight.bold,
              }}
            >
              <Printer size={18} /> Print / Save as PDF
            </button>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 h-11 px-6 rounded-xl cursor-pointer transition-transform hover:-translate-y-0.5 shadow-sm"
              style={{
                backgroundColor: C.outerCard,
                color: C.heading,
                border: `1px solid ${C.cardBorder}`,
                fontSize: T.size.sm,
                fontWeight: T.weight.bold,
              }}
            >
              <Download size={18} color={C.btnPrimary} /> Download CSV
            </button>
          </div>

          {/* Official Report Card (This section is printable) */}
          <div
            id="printable-report"
            className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200"
            style={{ maxWidth: "900px", margin: "0 auto" }}
          >
            {/* Report Header */}
            <div className="flex items-center justify-between border-b pb-8 mb-8">
              <div>
                <h1
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    color: C.headingDark,
                    margin: 0,
                  }}
                >
                  Official Student Report
                </h1>
                <p
                  style={{
                    color: "#6B7280",
                    fontSize: "14px",
                    marginTop: "4px",
                  }}
                >
                  Generated on{" "}
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: C.headingDark,
                    margin: 0,
                  }}
                >
                  {reportData?.student?.name || "Student Name"}
                </h3>
                <p style={{ color: "#6B7280", fontSize: "14px" }}>
                  {reportData?.student?.email || "Student Email"}
                </p>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              {[
                {
                  label: "Total Exams",
                  val: reportData?.summary?.totalExams || 0,
                },
                {
                  label: "Passed Exams",
                  val: reportData?.summary?.passedExams || 0,
                },
                {
                  label: "Average Score",
                  val: `${reportData?.summary?.avgScore || 0}%`,
                },
                {
                  label: "Active Courses",
                  val: reportData?.summary?.totalCourses || 0,
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                >
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      margin: "0 0 4px 0",
                    }}
                  >
                    {stat.label}
                  </p>
                  <p
                    style={{
                      fontSize: "24px",
                      fontWeight: 900,
                      color: C.headingDark,
                      margin: 0,
                    }}
                  >
                    {stat.val}
                  </p>
                </div>
              ))}
            </div>

            {/* Detailed Exam History */}
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: C.headingDark,
                marginBottom: "16px",
              }}
            >
              Exam Performance History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-3 px-4 font-bold text-gray-600 text-sm uppercase tracking-wider">
                      Exam Title
                    </th>
                    <th className="py-3 px-4 font-bold text-gray-600 text-sm uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-3 px-4 font-bold text-gray-600 text-sm uppercase tracking-wider text-center">
                      Score
                    </th>
                    <th className="py-3 px-4 font-bold text-gray-600 text-sm uppercase tracking-wider text-center">
                      Percentage
                    </th>
                    <th className="py-3 px-4 font-bold text-gray-600 text-sm uppercase tracking-wider text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.examAttempts?.length > 0 ? (
                    reportData.examAttempts.map((exam, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          {exam.examTitle}
                        </td>
                        <td className="py-4 px-4 text-gray-500 text-sm">
                          {new Date(exam.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700">
                          {exam.score} / {exam.totalMarks}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-gray-900">
                          {exam.pct}%
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${exam.isPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                          >
                            {exam.isPassed ? "Passed" : "Failed"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-8 text-center text-gray-500"
                      >
                        No exam history available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function ReportsAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading analytics...</p>
        </div>
      }
    >
      <AIAnalyticsContent />
    </Suspense>
  );
}
