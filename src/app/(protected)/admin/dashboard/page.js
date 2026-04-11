'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import StatsCard from '@/components/widgets/StatsCard';
import AnalyticsChart from '@/components/widgets/AnalyticsChart';
import { Users, BookOpen, Layers, ChevronRight, Zap, UserPlus, FileCheck, Calendar, FileText, CheckCircle2, MoreVertical, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/stats');
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (error) {
            toast.error('Failed to load dashboard stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F1EAFB]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#6854F3]"></div>
            </div>
        );
    }

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.15)';
    const formatTrend = (val) => val === null ? 'New' : `${val >= 0 ? '+' : ''}${Math.abs(val).toFixed(0)}%`;

    const statsData = [
        { title: 'Total Students', value: stats?.totalStudents?.toLocaleString() || '0', trend: formatTrend(stats?.trends?.students), trendUp: true, icon: Users, iconColor: '#4F7BF0', iconBg: '#EFEFFC' },
        { title: 'Total Instructors', value: stats?.totalTutors?.toLocaleString() || '0', trend: formatTrend(stats?.trends?.tutors), trendUp: true, icon: Users, iconColor: '#6854F3', iconBg: '#F4F0FD' },
        { title: 'Total Courses', value: stats?.totalCourses?.toLocaleString() || '0', trend: formatTrend(stats?.trends?.courses), trendUp: true, icon: Layers, iconColor: '#FD9017', iconBg: '#FFF7ED' },
        { title: 'Active Batches', value: stats?.activeBatches?.toLocaleString() || '0', trend: 'Running', trendUp: true, icon: BookOpen, iconColor: '#4ABCA8', iconBg: '#ECFDF5' }
    ];

    return (
        <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F1EAFB', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <img src={stats?.adminImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=AdminProfile"} alt="Admin" className="w-14 h-14 rounded-full border-[3px] border-white shadow-sm object-cover" />
                    <div>
                        <h1 className="text-2xl font-black text-[#27225B] m-0 mb-1">
                            Welcome back, {stats?.adminName || 'Admin'} 👋
                        </h1>
                        <p className="text-[14px] font-medium text-[#7D8DA6] m-0">
                            Here's an overview of your institute's performance and upcoming activities.
                        </p>
                    </div>
                </div>

                <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-bold text-[15px] shadow-lg hover:opacity-90 transition-opacity border-none cursor-pointer"
                    style={{ background: 'linear-gradient(90deg, #6D4FF1 0%, #5F41E3 100%)' }}>
                    <Zap size={18} fill="white" /> Quick Actions <ChevronRight size={16} />
                </button>
            </div>

            {/* ── Main Split Layout (Left: 3/4 Width, Right: 1/4 Width) ── */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                {/* =========================================
                    LEFT SIDE (Main Dashboard Content)
                ========================================= */}
                <div className="xl:col-span-3 flex flex-col gap-6">
                    
                    {/* Row 1: 4 Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statsData.map((stat, index) => <StatsCard key={index} {...stat} />)}
                    </div>

                    {/* Row 2: Course Perf (Spans 2/3) + Upcoming Classes (Spans 1/3) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <AnalyticsChart data={stats?.monthlyData} title="Course Performance" />
                        </div>
                        
                        <div className="lg:col-span-1 bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[16px] font-black text-[#27225B] m-0">Upcoming Classes</h3>
                                <Link href="/admin/classes" className="text-[12px] font-bold text-[#6854F3] no-underline hover:underline">View All</Link>
                            </div>
                            <div className="flex flex-col gap-4 flex-1">
                                {stats?.upcomingClasses?.map((cls, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ['#EFEFFC', '#FFF7ED', '#ECFDF5', '#F4F0FD'][i % 4] }}>
                                            <Calendar size={18} color={['#4F7BF0', '#FD9017', '#4ABCA8', '#6854F3'][i % 4]} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[14px] font-bold text-[#27225B] m-0">{cls.title}</h4>
                                                {cls.status === 'Live' ? (
                                                    <span className="text-[10px] font-bold text-[#6854F3] bg-[#F4F0FD] px-2 py-0.5 rounded-md uppercase tracking-wider">Live</span>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-[#4ABCA8] bg-[#ECFDF5] px-2 py-0.5 rounded-md">+ 12%</span>
                                                )}
                                            </div>
                                            <p className="text-[12px] font-medium text-[#7D8DA6] m-0 mt-0.5">{cls.date} • {cls.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Recent Activities + Exams & Assessments + Fee Collection */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Recent Activity */}
                        <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[16px] font-black text-[#27225B] m-0">Recent Activities</h3>
                                <Link href="/admin/activity" className="text-[12px] font-bold text-[#6854F3] no-underline hover:underline">View All</Link>
                            </div>
                            <div className="flex flex-col gap-5">
                                {stats?.recentActivity?.map((act, i) => (
                                    <div key={i} className="flex gap-3 items-center">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} className="w-10 h-10 rounded-full bg-slate-100 shrink-0 border border-slate-200" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[13px] font-bold text-[#27225B] m-0 truncate pr-2">
                                                    {act.text.split(':')[1] || 'User Name'}
                                                </p>
                                                <span className="text-[11px] font-semibold text-[#7D8DA6] whitespace-nowrap">{act.time}</span>
                                            </div>
                                            <p className="text-[12px] font-medium text-[#7D8DA6] m-0 truncate">{act.text.split(':')[0]}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Exams & Assessments */}
                        <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[16px] font-black text-[#27225B] m-0">Exams & Assessments</h3>
                                <Link href="/admin/exams" className="text-[12px] font-bold text-[#6854F3] no-underline hover:underline">View All</Link>
                            </div>
                            <div className="flex flex-col gap-4">
                                {stats?.upcomingExams?.length > 0 ? (
                                    stats.upcomingExams.map((exam, i) => {
                                        const badgeStyle = i === 0 ? { bg: '#FFF7ED', text: '#FC8730', label: 'Upcoming' } : 
                                                           i === 1 ? { bg: '#ECFDF5', text: '#4ABCA8', label: 'Live' } : 
                                                           { bg: '#F4F0FD', text: '#6854F3', label: 'Draft' };
                                        return (
                                            <div key={i} className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#EFEFFC]">
                                                    <FileText size={18} color="#4F7BF0" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-[13px] font-bold text-[#27225B] m-0">{exam.title}</h4>
                                                    <p className="text-[11px] font-medium text-[#7D8DA6] m-0 mt-0.5">{exam.date} • {exam.time}</p>
                                                </div>
                                                <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}>
                                                    {badgeStyle.label}
                                                </span>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-[13px] text-[#7D8DA6] italic">No exams found.</p>
                                )}
                            </div>
                        </div>

                        {/* Fee Collection Summary (With Donut) */}
                        <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[16px] font-black text-[#27225B] m-0">Fee Collection</h3>
                                <span className="text-[12px] font-semibold text-[#7D8DA6]">This Month ▾</span>
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <p className="text-[12px] font-semibold text-[#7D8DA6] m-0">Total Collected</p>
                                        <p className="text-[18px] font-black text-[#27225B] m-0">₹{stats?.feeCollection?.collected?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-semibold text-[#7D8DA6] m-0">Pending Fees</p>
                                        <p className="text-[15px] font-black text-[#27225B] m-0">₹{stats?.feeCollection?.pending?.toLocaleString() || '0'}</p>
                                    </div>
                                </div>

                                {/* Custom CSS Donut Chart */}
                                <div className="relative w-[100px] h-[100px] rounded-full flex items-center justify-center"
                                     style={{ background: `conic-gradient(#6854F3 ${stats?.feeCollection?.percentage || 0}%, #F4F0FD ${stats?.feeCollection?.percentage || 0}%)` }}>
                                     <div className="w-[76px] h-[76px] bg-white rounded-full flex flex-col items-center justify-center">
                                         <span className="text-[20px] font-black text-[#27225B] leading-none">{stats?.feeCollection?.percentage || 0}%</span>
                                         <span className="text-[9px] font-bold text-[#7D8DA6] uppercase mt-1 tracking-wider">Collected</span>
                                     </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-auto pt-4">
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6854F3]"></span><span className="text-[11px] font-bold text-[#7D8DA6]">Collected</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F4F0FD]"></span><span className="text-[11px] font-bold text-[#7D8DA6]">Pending</span></div>
                            </div>
                        </div>

                    </div>

                    {/* Row 4: Extra Sections (Batch Overview & Pending Approvals) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                            <h3 className="text-[16px] font-black text-[#27225B] m-0 mb-4">Batch Overview</h3>
                            <div className="w-full">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr>
                                            <th className="pb-3 text-[12px] font-bold text-[#27225B]">Batch</th>
                                            <th className="pb-3 text-[12px] font-bold text-[#27225B]">Students</th>
                                            <th className="pb-3 text-[12px] font-bold text-[#27225B]">Progress</th>
                                            <th className="pb-3 text-[12px] font-bold text-[#27225B]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats?.batchOverview?.map((batch, i) => (
                                            <tr key={i} className="border-t border-[#F4F0FD]">
                                                <td className="py-3 text-[13px] font-semibold text-[#7D8DA6]">{batch.name}</td>
                                                <td className="py-3 text-[13px] font-black text-[#27225B]">{batch.students}</td>
                                                <td className="py-3 text-[13px] font-black text-[#4ABCA8]">{batch.progress}%</td>
                                                <td className="py-3 text-[13px] font-semibold">
                                                    <span className={batch.status === 'Active' ? 'text-[#4ABCA8]' : 'text-[#4F7BF0]'}>{batch.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className="lg:col-span-1 bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                            <h3 className="text-[16px] font-black text-[#27225B] m-0 mb-4">Pending Approvals</h3>
                            <div className="flex flex-col gap-4 flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><UserPlus size={16} className="text-[#4F7BF0]" /><span className="text-[13px] font-bold text-[#27225B]">Instructors</span></div>
                                    <span className="text-[11px] font-bold text-[#FC8730] bg-[#FFF7ED] px-2 py-0.5 rounded-md">{stats?.pendingApprovals?.instructors} Pending</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><Users size={16} className="text-[#6854F3]" /><span className="text-[13px] font-bold text-[#27225B]">Students</span></div>
                                    <span className="text-[11px] font-bold text-[#6854F3] bg-[#F4F0FD] px-2 py-0.5 rounded-md">{stats?.pendingApprovals?.students} Pending</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><FileCheck size={16} className="text-[#4ABCA8]" /><span className="text-[13px] font-bold text-[#27225B]">Courses</span></div>
                                    <span className="text-[11px] font-bold text-[#4ABCA8] bg-[#ECFDF5] px-2 py-0.5 rounded-md">{stats?.pendingApprovals?.courses} Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =========================================
                    RIGHT SIDEBAR (Quick Actions, AI Buddy)
                ========================================= */}
                <div className="xl:col-span-1 flex flex-col gap-6">

                    {/* Quick Actions List */}
                 
                    <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                        <h3 className="text-[16px] font-black text-[#27225B] m-0 mb-4 flex items-center gap-2">
                           <Layers size={18} className="text-[#7D8DA6]" /> Quick Actions
                        </h3>
                        <div className="flex flex-col gap-3">
                            {[
                                { label: 'Add Student', icon: UserPlus, color: '#6854F3', link: '/admin/students' },
                                { label: 'Create Batch', icon: Layers, color: '#4F7BF0', link: '/admin/batches' },
                                { label: 'Schedule Class', icon: Calendar, color: '#FC8730', link: '/admin/classes' },
                                { label: 'Create Exam', icon: FileText, color: '#4ABCA8', link: '/admin/exams' },
                            ].map((action, i) => (
                                <Link 
                                    href={action.link} 
                                    key={i} 
                                    className="flex items-center justify-between w-full p-3 rounded-xl transition-all cursor-pointer group no-underline border border-transparent hover:border-[#D1C4F9]"
                                    style={{ backgroundColor: '#EDECFC' }}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Solid colored icon box with white icon inside */}
                                        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: action.color }}>
                                            <action.icon size={18} color="#ffffff" strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[14px] font-bold text-[#27225B] group-hover:text-[#6854F3] transition-colors">{action.label}</span>
                                    </div>
                                    <ChevronRight size={18} className="text-[#7D8DA6] group-hover:text-[#6854F3] transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* AI Buddy */}
                 
                    <div className="bg-white p-6 rounded-2xl border-[1px] border-[#F4F0FD] relative overflow-hidden" 
                         style={{ boxShadow: '0 8px 30px -10px rgba(95, 66, 228, 0.12)' }}>
                        
                        <div className="flex items-center justify-between mb-1 relative z-10">
                            <div className="flex items-center gap-2.5">
                                {/* Custom Robot Icon matching the image */}
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#EEECFC" />
                                    <path d="M12 7C9.23858 7 7 9.23858 7 12V14C7 15.6569 8.34315 17 10 17H14C15.6569 17 17 15.6569 17 14V12C17 9.23858 14.7614 7 12 7ZM10.5 12.5C10.5 13.3284 9.82843 14 9 14C8.17157 14 7.5 13.3284 7.5 12.5C7.5 11.6716 8.17157 11 9 11C9.82843 11 10.5 11.6716 10.5 12.5ZM16.5 12.5C16.5 13.3284 15.8284 14 15 14C14.1716 14 13.5 13.3284 13.5 12.5C13.5 11.6716 14.1716 11 15 11C15.8284 11 16.5 11.6716 16.5 12.5Z" fill="#3F22DF"/>
                                    <circle cx="12" cy="15" r="1" fill="#3F22DF"/>
                                </svg>
                                <h3 className="text-[17px] font-black text-[#1A1549] m-0">
                                    AI Buddy
                                </h3>
                                <span className="text-[10px] font-bold text-[#6854F3] bg-[#F4F0FD] px-2 py-0.5 rounded-[5px] uppercase tracking-wider">
                                    Beta
                                </span>
                            </div>
                            <MoreVertical size={18} className="text-[#A0ABC0] cursor-pointer" />
                        </div>
                        
                        <p className="text-[14px] font-medium text-[#4A5568] mb-6 relative z-10">Smart insights to help you grow</p>

                        <div className="flex flex-col gap-4 mb-7 relative z-10">
                            {/* Alert/High Risk item (Red Check) */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-[18px] h-[18px] rounded-full bg-[#FF6B6B] flex items-center justify-center shrink-0">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <span className="text-[14px] font-bold text-[#1A1549]">{stats?.pendingApprovals?.instructors || 0} students are at high risk</span>
                            </div>
                            
                            {/* Action items (Yellow Plus) */}
                            {[
                                `${stats?.pendingApprovals?.students || 0} instructor requests pending`,
                                `${stats?.activeBatches || 0} active batches running smoothly`,
                                `Fee collection pending: ₹${stats?.feeCollection?.pending?.toLocaleString() || '0'}`
                            ].map((text, i) => (
                                <div key={i} className="flex items-center gap-3.5">
                                    <div className="w-[18px] h-[18px] rounded-full bg-[#FFB72B] flex items-center justify-center shrink-0">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    </div>
                                    <span className="text-[14px] font-bold text-[#1A1549]">{text}</span>
                                </div>
                            ))}
                        </div>

                        <button className="w-full py-[14px] rounded-xl text-white font-bold text-[15px] cursor-pointer border-none transition-opacity relative z-10"
                            style={{ backgroundColor: '#6442E8', boxShadow: '0 4px 14px rgba(100, 66, 232, 0.3)' }}>
                            Open AI Dashboard
                        </button>
                        
                    </div>

                    {/* Upcoming Events */}
                    <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[16px] font-black text-[#27225B] m-0">Upcoming Events</h3>
                            <Link href="/admin/events" className="text-[12px] font-bold text-[#6854F3] no-underline hover:underline">View All</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            {(() => {
                                const events = [
                                    ...(stats?.upcomingExams?.map(e => ({ ...e, type: 'exam', color: '#4F7BF0', Icon: BookOpen })) || []),
                                    ...(stats?.upcomingClasses?.map(c => ({ ...c, type: 'class', color: '#FD9017', Icon: Calendar })) || [])
                                ].sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 3);

                                if (events.length === 0) {
                                    return <p className="text-[13px] text-[#7D8DA6] italic relative z-10 m-0">No upcoming events found.</p>;
                                }

                                return events.map((event, i) => (
                                    <div key={i} className="flex gap-3 relative z-10">
                                        <event.Icon size={18} className={`mt-0.5 shrink-0`} style={{ color: event.color }} />
                                        <div>
                                            <h4 className="text-[13px] font-bold text-[#27225B] m-0 leading-tight">{event.title}</h4>
                                            <p className="text-[12px] font-medium text-[#7D8DA6] m-0 mt-1">{event.date} • {event.time}</p>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}