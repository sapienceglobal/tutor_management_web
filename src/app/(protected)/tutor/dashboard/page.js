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
  Loader2, ShieldAlert, Users, BookOpen, Wallet,
  CalendarClock, Plus, PlusCircle, Video, FileQuestion,
  Upload, ArrowRight, Sparkles, CircleAlert, LineChart as LineChartIcon,
  ClipboardCheck, Bell, MoreVertical, ChevronDown
} from 'lucide-react';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, R } from '@/constants/tutorTokens';

import AnalyticsChart from '@/components/widgets/AnalyticsChart';
import TopItemsWidget from '@/components/widgets/TopItemsWidget';
import FeedbackWidget from '@/components/widgets/FeedbackWidget';
import QuickLinksWidget from '@/components/widgets/QuickLinksWidget';
import DataTable from '@/components/widgets/DataTable';
import { UpcomingExamsWidget } from '@/components/calendar/UpcomingExamsWidget';

// ── Soft 3D Shadow Configuration ─────────────────────────────────────────────
const softShadow = '0px 10px 40px -10px rgba(112, 128, 176, 0.15)'; // Yeh wo 3D effect dega

// ── Stat Card (Updated to match Image) ───────────────────────────────────────

function StatCard({ icon: Icon, iconBg, iconColor, title, value, badge, badgeColor, valueColor }) {
  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl transition-transform hover:-translate-y-0.5 bg-white"
      style={{ border: `1px solid #EAE8FA`, boxShadow: '0px 10px 40px -10px rgba(112, 128, 176, 0.15)', minHeight: 120, backgroundColor: "#F4F0FD" }}>

      {/* Row 1: Icon + Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center shrink-0 rounded-xl"
          style={{ width: 40, height: 40, backgroundColor: iconBg }}>
          <Icon size={21} color={iconColor} strokeWidth={2.5} />
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
          {title}
        </p>
      </div>

      {/* Row 2: Value + Badge */}
      <div className="flex items-center gap-4">
        {/* 👇 YAHAN MAIN FIX HAI: valueColor ho toh wo use karo, warna default dark color (#1F2937) */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '38px',
          fontWeight: '900', // T.weight.black
          color: valueColor ? valueColor : '#1F2937',
          margin: 0,
          lineHeight: 1
        }}>
          {value}
        </p>

        {badge && (
          <span style={{
            backgroundColor: badgeColor?.bg,
            color: badgeColor?.text,
            fontSize: '13px',
            fontWeight: '700',
            fontFamily: "'Inter', sans-serif",
            padding: '4px 10px',
            borderRadius: '6px'
          }}>
            {badge}
          </span>
        )}
      </div>

    </div>
  );
}

// ── Quick Action Button (Updated exact matching with image) ──────────────────
function QuickActionBtn({ icon: Icon, bgLight, color, label, onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-4 w-full px-5 py-4 rounded-xl transition-all hover:scale-[1.02] border-none cursor-pointer"
      style={{ backgroundColor: bgLight }}>

      {/* Icon Box */}
      <div className="flex items-center justify-center rounded-lg shrink-0"
        style={{ width: 34, height: 34, backgroundColor: color }}>
        <Icon size={18} color="#ffffff" strokeWidth={2.5} />
      </div>

      {/* Text matching the dark purple/navy from image */}
      <span style={{
        color: '#27225B',
        fontSize: '16px',
        fontWeight: '600',
        fontFamily: "'Inter', sans-serif"
      }}>
        {label}
      </span>

    </button>
  );
}

// ── Score Bar (Updated) ───────────────────────────────────────────────────────
function ScoreBar({ score }) {
  const color = score >= 80 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="rounded-full overflow-hidden flex-1 max-w-[100px]" style={{ height: 6, backgroundColor: '#F3F4F6' }}>
        <div style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 800, color, minWidth: '36px' }}>{score}%</span>
    </div>
  );
}
// ── Action Queue Card (New 3D Style) ──────────────────────────────────────────
function ActionQueueCard({ icon: Icon, title, value, hint, ctaLabel, onClick }) {
  const softShadow = '0px 10px 40px -10px rgba(112, 128, 176, 0.15)';

  return (
    <div className="p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 h-full bg-white rounded-2xl relative"
      style={{ boxShadow: softShadow }}>
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center shrink-0 rounded-xl"
          style={{ width: 44, height: 44, backgroundColor: '#EEF2FF' }}>
          <Icon size={22} color="#6366F1" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 font-bold text-sm m-0 mb-1">
            {title}
          </p>
          <p className="text-[#6366F1] font-black text-2xl m-0 mb-1">
            {value}
          </p>
          <p className="text-gray-400 font-medium text-xs m-0">
            {hint}
          </p>
        </div>
      </div>
      <div className="mt-auto pt-3">
        <button onClick={onClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 cursor-pointer border-none transition-colors hover:bg-[#E0E7FF] rounded-xl text-sm font-bold"
          style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
          {ctaLabel} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
      style={{ backgroundColor: '#F8F7FF' }}>
      <Loader2 className="animate-spin text-purple-600" size={32} />
      <p className="text-gray-500 text-sm font-bold">Loading amazing things...</p>
    </div>
  );

  const formatTrend = (val) => val === null ? 'New' : `${val >= 0 ? '+' : ''}${Math.abs(val).toFixed(0)}%`;
  const trendUp = (val) => val === null || val >= 0;

  // ── Actual DB Data Mapping ──
  const statCards = [
    {
      icon: Users, title: 'Students',
      value: stats?.totalStudents?.toLocaleString() || '0',
      badge: formatTrend(stats?.trends?.students),
      iconBg: '#EEF2FF', iconColor: '#6366F1', // Blueish
      badgeColor: trendUp(stats?.trends?.students) ? { bg: '#DCFCE7', text: '#16A34A' } : { bg: '#FEE2E2', text: '#DC2626' }
    },
    {
      icon: BookOpen, title: 'Active Courses',
      value: stats?.activeCourses?.toLocaleString() || '0',
      badge: 'Running',
      iconBg: '#FFF7ED', iconColor: '#EA580C', // Orange
      badgeColor: { bg: '#EEF2FF', text: '#4F46E5' }
    },
    {
      icon: CalendarClock, title: 'Upcoming Classes',
      value: stats?.upcomingClassesCount?.toLocaleString() || '0',
      badge: 'This Week',
      iconBg: '#FAF5FF', iconColor: '#9333EA', // Purple
      badgeColor: { bg: '#FFE4E6', text: '#E11D48' }
    },
    {
      icon: Wallet, title: 'Total Earnings',
      value: `₹${stats?.totalEarnings?.toLocaleString() || '0'}`,
      badge: formatTrend(stats?.trends?.earnings),
      iconBg: '#ECFDF5', iconColor: '#059669', // Green
      valueColor: '#288E73',
      badgeColor: trendUp(stats?.trends?.earnings) ? { bg: '#DCFCE7', text: '#16A34A' } : { bg: '#DDEEF3', text: '#30876C' }
    },
  ];

  const quickActions = [
    { icon: Plus, label: 'Create Course', bgLight: '#E9DFFC', color: '#8254EE', path: '/tutor/courses/create' },
    { icon: Video, label: 'Schedule Class', bgLight: '#E7E6FA', color: '#2858E5', path: '/tutor/live-classes' },
    { icon: FileQuestion, label: 'Create Exam', bgLight: '#FBE8E5', color: '#F19515', path: '/tutor/quizzes/create' },
    { icon: Upload, label: 'Upload Content', bgLight: '#E4F2EE', color: '#249C65', path: '/tutor/courses' },
  ];

  // Backend se expect kar rahe hain ye structure
  const chartData = stats?.weeklyPerformance || [];
  const announcements = stats?.recentAnnouncements || [];
  const recentActivity = stats?.recentStudentActivity || [];

  const queueData = [
    {
      title: 'Pending Assignments', icon: ClipboardCheck,
      value: stats?.pendingAssignmentReviews?.toLocaleString() || '0',
      hint: 'Submissions waiting for review', ctaLabel: 'Review Assignments',
      onClick: () => router.push('/tutor/assignments'),
    },
    {
      title: 'Upcoming Classes', icon: CalendarClock,
      value: stats?.upcomingClassesCount?.toLocaleString() || '0',
      hint: 'Scheduled sessions in queue', ctaLabel: 'Open Live Classes',
      onClick: () => router.push('/tutor/live-classes'),
    },
    {
      title: 'Unread Notifications', icon: Bell,
      value: stats?.unreadNotificationsCount?.toLocaleString() || '0',
      hint: 'Latest alerts and actions', ctaLabel: 'Open Notifications',
      onClick: () => router.push('/tutor/announcements?tab=notifications'),
    },
  ];

  const totalReviews = stats?.totalReviews || 1;
  const ratingsData = [
    { label: '5 Star', value: Math.round(((stats?.ratingsDistribution?.[5] || 0) / totalReviews) * 100), color: 'bg-emerald-500' },
    { label: '4 Star', value: Math.round(((stats?.ratingsDistribution?.[4] || 0) / totalReviews) * 100), color: 'bg-blue-500' },
    { label: '3 Star', value: Math.round(((stats?.ratingsDistribution?.[3] || 0) / totalReviews) * 100), color: 'bg-yellow-500' },
    { label: '2 Star', value: Math.round(((stats?.ratingsDistribution?.[2] || 0) / totalReviews) * 100), color: 'bg-orange-500' },
    { label: '1 Star', value: Math.round(((stats?.ratingsDistribution?.[1] || 0) / totalReviews) * 100), color: 'bg-red-500' },
  ];

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


  // 👇 Data Table Action Handlers (Ye add karo) 👇
  const handleViewEnrollment = (row) => {
    if (row.studentId) router.push(`/tutor/students/${row.studentId}`);
    else toast.error('Student details not available');
  };

  const handleDeleteEnrollment = async (row) => {
    const ok = await confirmDialog('Remove Enrollment', 'Are you sure you want to remove this enrollment?', { variant: 'destructive' });
    if (!ok) return;
    try {
      const res = await api.delete(`/enrollments/tutor/${row.originalId}`);
      if (res.data.success) {
        toast.success('Enrollment removed');
        fetchDashboardData();
      }
    } catch {
      toast.error('Failed to remove enrollment');
    }
  };

  return (
    <div className="w-full min-h-screen p-6 md:p-8"
      style={{ backgroundColor: C.pageBg, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-lg border-[3px] border-white">
            <img src={institute?.institute?.logo || "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul"} alt="avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 m-0 mb-1 flex items-center gap-2">
              Welcome back, {stats?.tutorName || 'Tutor'} <span className="text-2xl">👋</span>
            </h1>
            <p className="text-gray-500 font-medium text-[15px] m-0">
              Let's make learning amazing today
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">
        {statCards.map((card, i) => <StatCard key={i} {...card} />)}
      </div>

      {/* ── SECTION 2: Course Performance & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"  >

        {/* Chart Area */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white flex flex-col"
          style={{ boxShadow: softShadow, backgroundColor: "#F4F0FD" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-800 m-0">Course Performance</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
              <span className="text-sm font-semibold text-gray-600">{chartFilter}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
          </div>

          <div className="flex-1 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Gradients to match the beautiful soft shadows in the chart image */}
                  <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 13, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 13, fontWeight: 500 }} dx={-10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: softShadow, fontWeight: 600 }}
                  cursor={{ stroke: '#E5E7EB', strokeWidth: 2, strokeDasharray: '3 3' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingTop: '10px' }} />

                {/* Enrollments - Purple Area */}
                <Area type="monotone" dataKey="enrollments" name="Enrollments" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorEnrollments)" activeDot={{ r: 6, strokeWidth: 0 }} />

                {/* Completions - Green Area */}
                <Area type="monotone" dataKey="completions" name="Completions" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCompletions)" activeDot={{ r: 6, strokeWidth: 0 }} />

                {/* Revenue - Orange Line */}
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#F59E0B" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-2xl" style={{ boxShadow: softShadow, backgroundColor: "#F4F0FD" }}>
          <h3 className="text-lg font-black m-0 mb-5" style={{ color: '#27225B', fontFamily: "'Inter', sans-serif" }}>
            Quick Actions
          </h3>
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
        <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden" style={{ boxShadow: softShadow, backgroundColor: "#F4F0FD" }}>
          <div className="flex items-center justify-between p-6 pb-4">
            <h3 className="text-lg font-black text-gray-800 m-0">Recent Students Activity</h3>
            <button className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="w-full overflow-x-auto px-6 pb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {['Student', 'Course', 'Score', 'Last Activity'].map(h => (
                    <th key={h} className="pb-3 text-[13px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 font-sans">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-500 font-medium">No activity yet.</td></tr>
                ) : recentActivity.map((student, i) => (
                  <tr key={i} className="group">
                    <td className="py-4 border-b border-gray-50 group-last:border-none">
                      <div className="flex items-center gap-3">
                        <img src={student.studentImage || `https://ui-avatars.com/api/?name=${student.studentName}&background=E3DFF8&color=7C3AED`}
                          alt="Student" className="w-10 h-10 rounded-full object-cover" />
                        <span className="font-bold text-gray-800 text-[15px]">{student.studentName}</span>
                      </div>
                    </td>
                    <td className="py-4 border-b border-gray-50 group-last:border-none text-gray-600 font-medium text-[15px]">
                      {student.courseName}
                    </td>
                    <td className="py-4 border-b border-gray-50 group-last:border-none">
                      <ScoreBar score={student.score} />
                    </td>
                    <td className="py-4 border-b border-gray-50 group-last:border-none text-gray-500 text-sm font-medium">
                      {student.lastActivity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Announcements Area */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: softShadow, backgroundColor: "#F4F0FD" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-black text-gray-800 m-0">Announcements</h3>
            <ChevronDown size={18} className="text-gray-400 cursor-pointer" />
          </div>

          <div className="flex flex-col gap-4">
            {announcements.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No announcements right now.</p>
            ) : announcements.map((ann, i) => {
              // Same exact icons as in the image
              const icons = ['✨', '📚', '🎙️'];
              const bgColors = ['#FFF7ED', '#FEE2E2', '#EEF2FF'];
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg"
                    style={{ backgroundColor: bgColors[i % bgColors.length] }}>
                    {icons[i % icons.length]}
                  </div>
                  <div className="pt-1">
                    <h4 className="text-[15px] font-bold text-gray-800 m-0 leading-tight mb-1">{ann.title}</h4>
                    <p className="text-[13px] text-gray-500 font-medium m-0">{ann.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* ── SECTION 4: Action Queue + AI Buddy ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-3">
          <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>
            Action Queue
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100%-36px)]">
            {queueData.map((item) => <ActionQueueCard key={item.title} {...item} />)}
          </div>
        </div>

        <div className="lg:col-span-1">
          <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>
            AI Assistant
          </h3>
          <div className="p-5 flex flex-col h-[calc(100%-36px)] transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                <Sparkles size={20} color={C.btnPrimary} />
              </div>
              <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>AI Buddy</h3>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { icon: CircleAlert, color: C.danger, label: 'Identify At-Risk Students' },
                { icon: FileQuestion, color: C.btnPrimary, label: 'Generate AI Quizzes' },
                { icon: LineChartIcon, color: C.warning, label: 'Analyze Engagement' },
              ].map(({ icon: Icon, color, label }) => (
                <div key={label} className="flex items-center gap-3 p-3"
                  style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                  <Icon size={16} color={color} className="shrink-0" />
                  <span className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto">
              <button onClick={() => router.push('/tutor/ai-buddy')}
                className="w-full flex items-center justify-center h-11 border-none cursor-pointer transition-opacity hover:opacity-90 shadow-sm"
                style={{ background: C.gradientBtn, color: '#fff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                Open AI Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 5: Analytics Chart + Top Courses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '16px', boxShadow: S.card }}>
            <AnalyticsChart data={stats?.monthlyData} isTutor={true} />
          </div>
        </div>
        <div>
          <div style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '16px', boxShadow: S.card, height: '100%' }}>
            <TopItemsWidget title="Top Performing Courses" data={stats?.topCourses} isTutor={true} />
          </div>
        </div>
      </div>

      {/* ── SECTION 6: Upcoming Exams + Ratings + Quick Links ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1 space-y-6">
          <div style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '16px', boxShadow: S.card }}>
            <UpcomingExamsWidget isTutor={true} />
          </div>
          <div style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '16px', boxShadow: S.card }}>
            <FeedbackWidget title="Ratings Overview" data={ratingsData} isTutor={true} />
          </div>
        </div>
        <div className="md:col-span-2">
          <div style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '16px', boxShadow: S.card, height: '100%' }}>
            <QuickLinksWidget stats={stats} isTutor={true} />
          </div>
        </div>
      </div>

      {/* ── SECTION 7: Recent Enrollments Table ── */}
      <div>
        <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>
          Recent Enrollments
        </h3>
        <div style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '16px', boxShadow: S.card }}>
          <DataTable data={recentEnrollments} onView={handleViewEnrollment} onDelete={handleDeleteEnrollment} isTutor={true} />
        </div>
      </div>

    </div>
  );
}   