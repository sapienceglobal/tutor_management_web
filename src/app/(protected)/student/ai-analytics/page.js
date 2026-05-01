"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MdBarChart,
  MdCheckCircle,
  MdAccessTime,
  MdTrendingUp,
  MdTrackChanges,
  MdCancel,
  MdArticle,
  MdDownload,
  MdPrint,
  MdViewList
} from "react-icons/md";
import api from "@/lib/axios";
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

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const PIE_COLORS = [C.success, C.btnPrimary, C.warning, C.danger];

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 shadow-xl"
      style={{
        backgroundColor: C.headingDark,
        border: "1px solid rgba(255,255,255,0.1)",
        fontFamily: T.fontFamily,
        borderRadius: '10px'
      }}
    >
      <p
        style={{
          fontSize: T.size.xs,
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
          fontWeight: T.weight.bold,
          color: "#fff",
        }}
      >
        {payload[0].value}%{" "}
        <span
          style={{
            fontSize: T.size.xs,
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
        backgroundColor: C.headingDark,
        border: "1px solid rgba(255,255,255,0.1)",
        fontFamily: T.fontFamily,
        borderRadius: '10px'
      }}
    >
      <p
        style={{
          fontSize: T.size.xs,
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
          fontWeight: T.weight.bold,
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
export default function ReportsAnalyticsPage() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
              style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
          </div>
          <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
            Loading Reports & Analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-screen space-y-6"
      style={{
        backgroundColor: C.pageBg,
        fontFamily: T.fontFamily,
        color: C.text,
      }}
    >
      {/* Print Stylesheet */}
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
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 no-print"
        style={{
          backgroundColor: C.cardBg,
          border: `1px solid ${C.cardBorder}`,
          boxShadow: S.card,
          borderRadius: R['2xl']
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: 48, height: 48, backgroundColor: C.iconBg, borderRadius: '10px' }}
          >
            <MdViewList style={{ width: 24, height: 24, color: C.iconColor }} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: T.fontFamily, 
                fontSize: T.size['2xl'],
                fontWeight: T.weight.bold,
                color: C.heading,
                margin: "0 0 2px 0",
              }}
            >
              Reports & Analytics
            </h1>
            <p
              style={{
                fontSize: T.size.base,
                fontWeight: T.weight.semibold,
                color: C.textMuted,
                margin: 0,
              }}
            >
              Analyze your performance and download official reports.
            </p>
          </div>
        </div>

        {/* Tab Switcher Pattern */}
        <div className="relative flex items-center p-1 self-start xl:self-auto no-print"
          style={{ width: '100%', maxWidth: '380px', backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
          <div className="absolute top-1 bottom-1 w-[calc(50%-4px)] transition-transform duration-300 ease-in-out z-0"
            style={{ 
              backgroundColor: C.btnPrimary, 
              transform: activeTab === 'analytics' ? 'translateX(0)' : 'translateX(100%)',
              boxShadow: `0 2px 10px ${C.btnPrimary}40`,
              borderRadius: '10px'
            }} />
          {[{ id: 'analytics', label: 'Analytics', icon: MdBarChart }, { id: 'reports', label: 'Reports & Downloads', icon: MdArticle }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 relative z-10 px-3 py-2 transition-colors duration-300 border-none cursor-pointer flex items-center justify-center gap-2"
              style={{ 
                fontFamily: T.fontFamily, 
                fontSize: T.size.base, 
                fontWeight: T.weight.bold,
                color: activeTab === tab.id ? '#ffffff' : C.text, 
                background: 'transparent', 
                borderRadius: '10px' 
              }}>
              <tab.icon style={{ width: 16, height: 16 }} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id === 'analytics' ? 'Stats' : 'Reports'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ ANALYTICS TAB ═══════════════════════════════════════════ */}
      {activeTab === "analytics" && (
        <div className="space-y-6 no-print animate-in fade-in duration-500">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Average Score"
              value={`${insights.avgScore}%`}
              icon={MdTrendingUp}
              iconBg={C.iconBg}
              iconColor={C.iconColor}
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
              className="p-6 shadow-sm flex flex-col"
              style={{
                backgroundColor: C.cardBg,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: R['2xl']
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center shrink-0"
                    style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                    <MdBarChart style={{ width: 16, height: 16, color: C.iconColor }} />
                  </div>
                  <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading }}>
                    Performance Trend
                  </h2>
                </div>
                <span
                  className="px-3 py-1"
                  style={{
                    backgroundColor: C.innerBg,
                    color: C.textMuted,
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                    borderRadius: '10px'
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
                        stroke={C.cardBorder}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 12,
                          fill: C.textMuted,
                          fontWeight: 600,
                          fontFamily: T.fontFamily
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fontSize: 12,
                          fill: C.textMuted,
                          fontWeight: 600,
                          fontFamily: T.fontFamily
                        }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                      />
                      <RechartsTooltip
                        content={<CustomBarTooltip />}
                        cursor={{ fill: C.innerBg }}
                      />
                      <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {performanceTrend.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              i === performanceTrend.length - 1
                                ? C.btnPrimary
                                : C.chartLine
                            }
                            opacity={i === performanceTrend.length - 1 ? 1 : 0.6}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="p-14 text-center border border-dashed flex-1"
                  style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: '10px' }}>
                  <div className="flex items-center justify-center mx-auto mb-4"
                    style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                    <MdBarChart style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                  </div>
                  <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No data to show</h3>
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>Complete tests to see your trend</p>
                </div>
              )}
            </div>

            {/* Score Distribution */}
            <div
              className="p-6 shadow-sm flex flex-col"
              style={{
                backgroundColor: C.cardBg,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: R['2xl']
              }}
            >
              <div className="flex items-center gap-2.5 mb-6">
                <div className="flex items-center justify-center shrink-0"
                  style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                  <MdTrackChanges style={{ width: 16, height: 16, color: C.iconColor }} />
                </div>
                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading }}>
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
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                color: C.textMuted,
                                textTransform: "uppercase",
                                letterSpacing: T.tracking.wider,
                              }}
                            >
                              {range.name}
                            </span>
                            <span
                              style={{
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                color: PIE_COLORS[i % PIE_COLORS.length],
                              }}
                            >
                              {range.count} Tests
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ backgroundColor: C.innerBg }}
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
                <div className="p-14 text-center border border-dashed flex-1"
                  style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: '10px' }}>
                  <div className="flex items-center justify-center mx-auto mb-4"
                    style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                    <MdTrackChanges style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                  </div>
                  <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No data to show</h3>
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>Complete tests to see distribution</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent attempts */}
          {recentScores.length > 0 && (
            <div
              className="p-6 shadow-sm border flex flex-col"
              style={{
                backgroundColor: C.cardBg,
                borderColor: C.cardBorder,
                borderRadius: R['2xl']
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center shrink-0"
                    style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                    <MdAccessTime style={{ width: 16, height: 16, color: C.iconColor }} />
                  </div>
                  <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading }}>
                    Recent Attempts
                  </h2>
                </div>
                <Link
                  href="/student/history"
                  className="inline-flex items-center gap-1 px-4 py-2 transition-colors hover:opacity-80 text-decoration-none"
                  style={{
                    backgroundColor: C.btnViewAllBg,
                    color: C.btnViewAllText,
                    fontFamily: T.fontFamily,
                    fontSize: T.size.base,
                    fontWeight: T.weight.bold,
                    borderRadius: '10px',
                    border: `1px solid ${C.cardBorder}`,
                  }}
                >
                  View All
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {recentScores.map((attempt, i) => {
                  const pct =
                    attempt.totalMarks > 0
                      ? Math.round((attempt.score / attempt.totalMarks) * 100)
                      : 0;
                  const passed = attempt.isPassed;
                  return (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition-colors"
                      style={{
                        // backgroundColor: C.innerBg,
                        border: `1px solid ${C.cardBorder}`,
                        borderLeft: `4px solid ${passed ? C.success : C.danger}`,
                        borderRadius: '10px'
                      }}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: passed ? C.successBg : C.dangerBg,
                            borderRadius: '10px'
                          }}
                        >
                          {passed ? (
                            <MdCheckCircle style={{ width: 20, height: 20, color: C.success }} />
                          ) : (
                            <MdCancel style={{ width: 20, height: 20, color: C.danger }} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="truncate"
                            style={{
                              fontSize: T.size.base,
                              fontWeight: T.weight.bold,
                              color: C.heading,
                              margin: "0 0 2px 0",
                            }}
                          >
                            {attempt.examTitle || attempt.exam?.title || "Exam"}
                          </p>
                          <p
                            style={{
                              fontSize: T.size.xs,
                              fontWeight: T.weight.semibold,
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
                              fontSize: T.size.lg,
                              fontWeight: T.weight.bold,
                              color: passed ? C.success : C.danger,
                              margin: "0 0 2px 0",
                              lineHeight: 1,
                            }}
                          >
                            {pct}%
                          </p>
                          <p
                            style={{
                              fontSize: T.size.xs,
                              fontWeight: T.weight.semibold,
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
                            className="px-4 py-2 border-none cursor-pointer transition-opacity hover:opacity-80"
                            style={{
                              backgroundColor: C.surfaceWhite,
                              color: C.btnPrimary,
                              fontSize: T.size.sm,
                              fontWeight: T.weight.bold,
                              border: `1px solid ${C.cardBorder}`,
                              borderRadius: '10px'
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
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 no-print">
            <button
              onClick={handlePrintPDF}
              className="flex items-center justify-center gap-2 h-11 px-6 border-none cursor-pointer transition-transform hover:-translate-y-0.5"
              style={{
                background: C.gradientBtn,
                color: "#ffffff",
                fontSize: T.size.base,
                fontWeight: T.weight.bold,
                borderRadius: '10px',
                boxShadow: S.btn
              }}
            >
              <MdPrint style={{ width: 18, height: 18 }} /> Print / Save as PDF
            </button>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer transition-transform hover:-translate-y-0.5"
              style={{
                backgroundColor: C.btnViewAllBg,
                color: C.btnViewAllText,
                border: `1px solid ${C.cardBorder}`,
                fontSize: T.size.base,
                fontWeight: T.weight.bold,
                borderRadius: '10px'
              }}
            >
              <MdDownload style={{ width: 18, height: 18 }} /> Download CSV
            </button>
          </div>

          {/* Official Report Card (This section is printable) */}
          <div
            id="printable-report"
            className="p-8 md:p-12"
            style={{ 
              maxWidth: "900px", 
              margin: "0 auto",
              backgroundColor: C.surfaceWhite,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: R['2xl'],
              boxShadow: S.card
            }}
          >
            {/* Report Header */}
            <div className="flex items-center justify-between border-b pb-8 mb-8" style={{ borderColor: C.cardBorder }}>
              <div>
                <h1
                  style={{
                    fontSize: T.size['3xl'],
                    fontWeight: T.weight.bold,
                    color: C.heading,
                    margin: 0,
                  }}
                >
                  Official Student Report
                </h1>
                <p
                  style={{
                    color: C.textMuted,
                    fontSize: T.size.sm,
                    fontWeight: T.weight.semibold,
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
                    fontSize: T.size.xl,
                    fontWeight: T.weight.bold,
                    color: C.heading,
                    margin: 0,
                  }}
                >
                  {reportData?.student?.name || "Student Name"}
                </h3>
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
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
                  className="p-4"
                  style={{
                    backgroundColor: C.innerBg,
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: '10px'
                  }}
                >
                  <p
                    style={{
                      fontSize: T.size.xs,
                      color: C.textMuted,
                      textTransform: "uppercase",
                      fontWeight: T.weight.bold,
                      letterSpacing: T.tracking.wider,
                      margin: "0 0 4px 0",
                    }}
                  >
                    {stat.label}
                  </p>
                  <p
                    style={{
                      fontSize: T.size['2xl'],
                      fontWeight: T.weight.bold,
                      color: C.heading,
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
                fontSize: T.size.lg,
                fontWeight: T.weight.bold,
                color: C.heading,
                marginBottom: "16px",
              }}
            >
              Exam Performance History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.cardBorder}` }}>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider" style={{ color: C.textMuted, fontSize: T.size.xs }}>
                      Exam Title
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider" style={{ color: C.textMuted, fontSize: T.size.xs }}>
                      Date
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-center" style={{ color: C.textMuted, fontSize: T.size.xs }}>
                      Score
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-center" style={{ color: C.textMuted, fontSize: T.size.xs }}>
                      Percentage
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-right" style={{ color: C.textMuted, fontSize: T.size.xs }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.examAttempts?.length > 0 ? (
                    reportData.examAttempts.map((exam, idx) => (
                      <tr
                        key={idx}
                        className="transition-colors hover:bg-black/5"
                        style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                      >
                        <td className="py-4 px-4 font-semibold" style={{ color: C.heading, fontSize: T.size.base }}>
                          {exam.examTitle}
                        </td>
                        <td className="py-4 px-4" style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
                          {new Date(exam.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-center" style={{ color: C.text, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
                          {exam.score} / {exam.totalMarks}
                        </td>
                        <td className="py-4 px-4 text-center font-bold" style={{ color: C.heading, fontSize: T.size.base }}>
                          {exam.pct}%
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span
                            className="px-3 py-1 uppercase tracking-wider"
                            style={{
                              backgroundColor: exam.isPassed ? C.successBg : C.dangerBg,
                              color: exam.isPassed ? C.success : C.danger,
                              border: `1px solid ${exam.isPassed ? C.successBorder : C.dangerBorder}`,
                              borderRadius: '10px',
                              fontSize: T.size.xs,
                              fontWeight: T.weight.bold
                            }}
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
                        className="py-8 text-center"
                        style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.semibold }}
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