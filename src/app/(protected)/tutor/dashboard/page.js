"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import {
  MdPeople,
  MdMenuBook,
  MdWallet,
  MdCalendarMonth,
  MdAdd,
  MdVideocam,
  MdQuiz,
  MdUpload,
  MdArrowForward,
  MdAutoAwesome,
  MdWarning,
  MdShowChart,
  MdAssignment,
  MdNotifications,
  MdMoreVert,
  MdKeyboardArrowDown,
  MdTrackChanges,
  MdCampaign
} from 'react-icons/md';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, R } from '@/constants/studentTokens';

import AnalyticsChart from '@/components/widgets/AnalyticsChart';
import TopItemsWidget from '@/components/widgets/TopItemsWidget';
import FeedbackWidget from '@/components/widgets/FeedbackWidget';
import QuickLinksWidget from '@/components/widgets/QuickLinksWidget';
import DataTable from '@/components/widgets/DataTable';
import { UpcomingExamsWidget } from '@/components/calendar/UpcomingExamsWidget';
import StatCard from '@/components/StatCard'; // Rule 3: Using Global StatCard

// ── Section Header (Rule 9 Pattern) ────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="flex items-center justify-center shrink-0"
        style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
        <Icon style={{ width: 20, height: 20, color: C.iconColor }} />
      </div>
      <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
        {title}
      </h2>
    </div>
  );
}

// ── Quick Action Button ────────────────────────────────────────────────────────
function QuickActionBtn({ icon: Icon, bgLight, color, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 w-full transition-all duration-200 border-none cursor-pointer"
      style={{
        backgroundColor: bgLight,
        borderRadius: '10px',
        padding: '14px 20px',
      }}
      onMouseEnter={(e) => {
         e.currentTarget.style.boxShadow = S.cardHover;
         e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
         e.currentTarget.style.boxShadow = 'none';
         e.currentTarget.style.transform = 'none';
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 34, height: 34, backgroundColor: color, borderRadius: '10px' }}
      >
        <Icon style={{ width: 18, height: 18, color: '#ffffff' }} />
      </div>
      <span style={{
        color: C.heading,
        fontFamily: T.fontFamily,
        fontSize: T.size.base,
        fontWeight: T.weight.semibold,
      }}>
        {label}
      </span>
    </button>
  );
}

// ── Score Bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  const color = score >= 80 ? C.success : score >= 50 ? C.warning : C.danger;
  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className="flex-1 overflow-hidden"
        style={{ height: 6, borderRadius: '10px', backgroundColor: C.innerBg, maxWidth: 100 }}
      >
        <div style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: '10px' }} />
      </div>
      <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color, minWidth: 36 }}>
        {score}%
      </span>
    </div>
  );
}

// ── Action Queue Card ──────────────────────────────────────────────────────────
function ActionQueueCard({ icon: Icon, title, value, hint, ctaLabel, onClick }) {
  return (
    <div
      className="flex flex-col gap-3 transition-all duration-200 h-full relative"
      style={{
        backgroundColor: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: S.card,
        borderRadius: R['2xl'],
        padding: 20,
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = S.cardHover}
      onMouseLeave={e => e.currentTarget.style.boxShadow = S.card}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 44, height: 44, backgroundColor: C.iconBg, borderRadius: '10px' }}
        >
          <Icon style={{ width: 22, height: 22, color: C.iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text, margin: '0 0 4px 0' }}>
            {title}
          </p>
          <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.btnPrimary, margin: '0 0 4px 0' }}>
            {value}
          </p>
          <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>
            {hint}
          </p>
        </div>
      </div>
      <div className="mt-auto pt-4 border-t" style={{ borderColor: C.cardBorder }}>
        <button
          onClick={onClick}
          className="w-full flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
          style={{
            backgroundColor: C.btnViewAllBg,
            color: C.btnViewAllText,
            fontFamily: T.fontFamily,
            fontSize: T.size.base,
            fontWeight: T.weight.bold,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: '10px',
            padding: '10px 16px',
          }}
        >
          {ctaLabel} <MdArrowForward style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        backgroundColor: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: '10px',
        boxShadow: S.cardHover,
        padding: '10px 14px',
        fontFamily: T.fontFamily,
      }}>
        <p style={{ fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, marginBottom: 4, margin: 0 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: p.color, margin: '4px 0 0 0' }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function TutorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState('This Month');
  const institute = useInstitute();
  const router = useRouter();
  const { confirmDialog } = useConfirm();

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/tutors/stats');
      setStats(res.data?.stats);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-12 h-12">
                <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                  style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
              </div>
              <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                Loading...
              </p>
            </div>
          </div>
      );
  }

  const formatTrend = (val) => val === null ? 'New' : `${val >= 0 ? '+' : ''}${Math.abs(val).toFixed(0)}%`;
  const trendUp = (val) => val === null || val >= 0;

  const quickActions = [
    { icon: MdAdd,        label: 'Create Course',   bgLight: C.innerBg, color: C.btnPrimary, path: '/tutor/courses/create' },
    { icon: MdVideocam,   label: 'Schedule Class',  bgLight: C.innerBg, color: C.success, path: '/tutor/live-classes' },
    { icon: MdQuiz,       label: 'Create Exam',     bgLight: C.innerBg, color: C.warning, path: '/tutor/quizzes/create' },
    { icon: MdUpload,     label: 'Upload Content',  bgLight: C.innerBg, color: C.danger, path: '/tutor/courses' },
  ];

  const chartData = stats?.weeklyPerformance || [];
  const announcements = stats?.recentAnnouncements || [];
  const recentActivity = stats?.recentStudentActivity || [];

  const queueData = [
    {
      title: 'Pending Assignments', icon: MdAssignment,
      value: stats?.pendingAssignmentReviews?.toLocaleString() || '0',
      hint: 'Submissions waiting for review', ctaLabel: 'Review Assignments',
      onClick: () => router.push('/tutor/assignments'),
    },
    {
      title: 'Upcoming Classes', icon: MdCalendarMonth,
      value: stats?.upcomingClassesCount?.toLocaleString() || '0',
      hint: 'Scheduled sessions in queue', ctaLabel: 'Open Live Classes',
      onClick: () => router.push('/tutor/live-classes'),
    },
    {
      title: 'Unread Notifications', icon: MdNotifications,
      value: stats?.unreadNotificationsCount?.toLocaleString() || '0',
      hint: 'Latest alerts and actions', ctaLabel: 'Open Notifications',
      onClick: () => router.push('/tutor/announcements?tab=notifications'),
    },
  ];

  const totalReviews = stats?.totalReviews || 1;

  const recentEnrollments = stats?.recentEnrollments?.map((e) => ({
    id: `#ENR-${e._id.slice(-4)}`,
    originalId: e._id,
    studentId: e.studentId,
    category: e.courseTitle,
    date: new Date(e.enrolledAt).toLocaleDateString(),
    views: e.studentName,
    price: `₹${e.price}`,
    dueDate: 'Paid',
    action: 'view',
  })) || [];

  return (
    <div
      className="w-full min-h-screen"
      style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
    >

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div
            className="overflow-hidden shrink-0"
            style={{
              width: 64,
              height: 64,
              borderRadius: R.full, // Full radius allowed for avatars
              border: `3px solid ${C.btnPrimary}`,
              boxShadow: `0 0 0 3px ${C.btnViewAllBg}`,
            }}
          >
            <img
              src={institute?.institute?.logo || "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul"}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1
              className="flex items-center gap-2"
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size['2xl'],
                fontWeight: T.weight.bold,
                color: C.heading,
                margin: '0 0 4px 0',
              }}
            >
              Welcome back, {stats?.tutorName || 'Tutor'} <span>👋</span>
            </h1>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text, margin: 0 }}>
              Let's make learning amazing today
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Students"
          value={stats?.totalStudents?.toLocaleString() || '0'}
          subtext={formatTrend(stats?.trends?.students)}
          icon={MdPeople}
          iconBg={C.innerBg}
          iconColor={C.btnPrimary}
        />
        <StatCard
          label="Active Courses"
          value={stats?.activeCourses?.toLocaleString() || '0'}
          subtext="Running"
          icon={MdMenuBook}
          iconBg={C.warningBg}
          iconColor={C.warning}
        />
        <StatCard
          label="Upcoming Classes"
          value={stats?.upcomingClassesCount?.toLocaleString() || '0'}
          subtext="This Week"
          icon={MdCalendarMonth}
          iconBg={C.dangerBg}
          iconColor={C.danger}
        />
        <StatCard
          label="Total Earnings"
          value={`₹${stats?.totalEarnings?.toLocaleString() || '0'}`}
          subtext={formatTrend(stats?.trends?.earnings)}
          icon={MdWallet}
          iconBg={C.successBg}
          iconColor={C.success}
        />
      </div>

      {/* ── SECTION 2: Course Performance & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Chart Area */}
        <div
          className="lg:col-span-2 flex flex-col"
          style={{
            backgroundColor: C.cardBg,
            border: `1px solid ${C.cardBorder}`,
            boxShadow: S.card,
            borderRadius: R['2xl'],
            padding: 24,
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <SectionHeader icon={MdShowChart} title="Course Performance" />
            <div
              className="flex items-center gap-2 cursor-pointer"
              style={{
                backgroundColor: C.innerBg,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: '10px',
                padding: '6px 12px',
              }}
            >
              <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                {chartFilter}
              </span>
              <MdKeyboardArrowDown style={{ width: 16, height: 16, color: C.text }} />
            </div>
          </div>

          <div className="flex-1 w-full" style={{ minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.btnPrimary} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.btnPrimary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.success} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.cardBorder} />
                <XAxis
                  dataKey="name"
                  axisLine={false} tickLine={false}
                  tick={{ fill: C.text, fontSize: 12, fontWeight: 600, fontFamily: T.fontFamily }}
                  dy={10}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: C.text, fontSize: 12, fontWeight: 600, fontFamily: T.fontFamily }}
                  dx={-10}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: C.cardBorder, strokeWidth: 2, strokeDasharray: '3 3' }} />
                <Legend iconType="circle" wrapperStyle={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, paddingTop: 10 }} />
                <Area type="monotone" dataKey="enrollments" name="Enrollments" stroke={C.btnPrimary} strokeWidth={3} fillOpacity={1} fill="url(#colorEnrollments)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="completions" name="Completions" stroke={C.success} strokeWidth={3} fillOpacity={1} fill="url(#colorCompletions)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke={C.warning} strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          style={{
            backgroundColor: C.cardBg,
            border: `1px solid ${C.cardBorder}`,
            boxShadow: S.card,
            borderRadius: R['2xl'],
            padding: 24,
          }}
        >
          <SectionHeader icon={MdTrackChanges} title="Quick Actions" />
          <div className="flex flex-col gap-3">
            {quickActions.map((action, i) => (
              <QuickActionBtn key={i} {...action} onClick={() => router.push(action.path)} />
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Recent Students & Announcements ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Table Area */}
        <div
          className="lg:col-span-2 overflow-hidden"
          style={{
            backgroundColor: C.cardBg,
            border: `1px solid ${C.cardBorder}`,
            boxShadow: S.card,
            borderRadius: R['2xl'],
          }}
        >
          <div className="flex items-center justify-between p-6 pb-4 border-b" style={{ borderColor: C.cardBorder }}>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center shrink-0"
                style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                <MdPeople style={{ width: 20, height: 20, color: C.iconColor }} />
              </div>
              <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                Recent Students Activity
              </h2>
            </div>
            <button
              className="transition-colors bg-transparent border-none cursor-pointer"
              style={{ color: C.textMuted }}
            >
              <MdMoreVert style={{ width: 20, height: 20 }} />
            </button>
          </div>

          <div className="w-full overflow-x-auto p-4 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {['Student', 'Course', 'Score', 'Last Activity'].map(h => (
                    <th
                      key={h}
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: '11px',
                        fontWeight: T.weight.bold,
                        color: C.statLabel,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '12px 16px',
                        borderBottom: `1px solid ${C.cardBorder}`,
                        backgroundColor: C.innerBg,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.semibold,
                        color: C.textMuted,
                        textAlign: 'center',
                        padding: '40px 0',
                        fontStyle: 'italic'
                      }}
                    >
                      No activity yet.
                    </td>
                  </tr>
                ) : recentActivity.map((student, i) => (
                  <tr key={i} className="transition-colors hover:bg-white/40" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <td style={{ padding: '16px', backgroundColor: C.cardBg }}>
                      <div className="flex items-center gap-3">
                        <img
                          src={student.studentImage || `https://ui-avatars.com/api/?name=${student.studentName}&background=E3DFF8&color=7C3AED`}
                          alt="Student"
                          style={{ width: 36, height: 36, borderRadius: R.full, objectFit: 'cover', border: `1px solid ${C.cardBorder}` }}
                        />
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                          {student.studentName}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text, backgroundColor: C.cardBg }}>
                      {student.courseName}
                    </td>
                    <td style={{ padding: '16px', backgroundColor: C.cardBg }}>
                      <ScoreBar score={student.score} />
                    </td>
                    <td style={{ padding: '16px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted, backgroundColor: C.cardBg }}>
                      {student.lastActivity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Announcements */}
        <div
          style={{
            backgroundColor: C.cardBg,
            border: `1px solid ${C.cardBorder}`,
            boxShadow: S.card,
            borderRadius: R['2xl'],
            padding: 24,
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <SectionHeader icon={MdCampaign} title="Announcements" />
            <MdKeyboardArrowDown style={{ width: 18, height: 18, color: C.textMuted, cursor: 'pointer' }} />
          </div>

          <div className="flex flex-col gap-4">
            {announcements.length === 0 ? (
              <div className="py-6 text-center border border-dashed" style={{ borderColor: C.cardBorder, borderRadius: '10px', backgroundColor: C.innerBg }}>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>
                  No new updates.
                </p>
              </div>
            ) : announcements.map((ann, i) => {
              const icons    = ['✨', '📚', '🎙️'];
              return (
                <div key={i} className="flex items-start gap-4 p-4 transition-colors"
                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.surfaceWhite}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                  <div
                    className="flex items-center justify-center shrink-0 text-lg"
                    style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}
                  >
                    {icons[i % icons.length]}
                  </div>
                  <div className="pt-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider" 
                            style={{ fontFamily: T.fontFamily, fontWeight: T.weight.bold, backgroundColor: C.cardBg, color: C.textMuted, borderRadius: '6px', border: `1px solid ${C.cardBorder}` }}>
                        {ann.courseTitle || 'General'}
                      </span>
                    </div>
                    <h4 className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0', lineHeight: T.leading.tight }}>
                      {ann.title}
                    </h4>
                    <p className="line-clamp-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>
                      {ann.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 4: Action Queue + AI Buddy ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-3">
          <SectionHeader icon={MdAssignment} title="Action Queue" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100%-44px)]">
            {queueData.map((item) => <ActionQueueCard key={item.title} {...item} />)}
          </div>
        </div>

        <div className="lg:col-span-1">
          <SectionHeader icon={MdAutoAwesome} title="AI Assistant" />
          <div
            className="flex flex-col h-[calc(100%-44px)] transition-transform duration-200"
            style={{
              backgroundColor: C.cardBg,
              border: `1px solid ${C.cardBorder}`,
              boxShadow: S.card,
              borderRadius: R['2xl'],
              padding: 20,
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = S.cardHover}
            onMouseLeave={e => e.currentTarget.style.boxShadow = S.card}
          >
            <div className="space-y-3 mb-6 flex-1">
              {[
                { icon: MdWarning,   color: C.danger,    label: 'Identify At-Risk Students' },
                { icon: MdQuiz,      color: C.btnPrimary, label: 'Generate AI Quizzes' },
                { icon: MdShowChart, color: C.warning,   label: 'Analyze Engagement' },
              ].map(({ icon: Icon, color, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3"
                  style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: 12 }}
                >
                  <Icon style={{ width: 18, height: 18, color, flexShrink: 0 }} />
                  <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-auto">
              <button
                onClick={() => router.push('/tutor/ai-buddy')}
                className="w-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90"
                style={{
                  height: 44,
                  background: C.gradientBtn,
                  color: '#ffffff',
                  fontFamily: T.fontFamily,
                  fontSize: T.size.base,
                  fontWeight: T.weight.bold,
                  borderRadius: '10px',
                  border: 'none',
                  boxShadow: S.btn,
                }}
              >
                Open AI Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 5: Analytics Chart + Top Courses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], padding: 24, boxShadow: S.card }}>
            <AnalyticsChart data={stats?.monthlyData} isTutor={true} />
          </div>
        </div>
        <div>
          <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], padding: 24, boxShadow: S.card, height: '100%' }}>
            <TopItemsWidget title="Top Performing Courses" data={stats?.topCourses} isTutor={true} />
          </div>
        </div>
      </div>

      {/* ── SECTION 6: Upcoming Exams + Ratings + Quick Links ── */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1 space-y-6">
          <div style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '24px', boxShadow: S.card }}>
            <UpcomingExamsWidget isTutor={true} />
          </div>
          <div style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '24px', boxShadow: S.card }}>
            <FeedbackWidget title="Ratings Overview" data={ratingsData} isTutor={true} />
          </div>
        </div>
        <div className="md:col-span-2">
          <div style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '24px', boxShadow: S.card, height: '100%' }}>
            <QuickLinksWidget stats={stats} isTutor={true} />
          </div>
        </div>
      </div> */}

      {/* ── SECTION 7: Recent Enrollments Table ── */}
      {/* <div>
        <SectionHeader icon={MdPeople} title="Recent Enrollments" />
        <div style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '24px', boxShadow: S.card }}>
          <DataTable data={recentEnrollments} onView={handleViewEnrollment} onDelete={handleDeleteEnrollment} isTutor={true} />
        </div>
      </div> */}

    </div>
  );
}