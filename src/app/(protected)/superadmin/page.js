'use client';

import { useState, useEffect } from 'react';
import { fetchPlatformStats } from '@/services/superadminService';
import { 
    Building2, Users, GraduationCap, MonitorPlay, ChevronRight, Plus, 
    BookOpen, ShieldAlert, CreditCard, Activity, AlertTriangle, IndianRupee,
    Server, Zap, ChevronDown, CheckCircle2, Bookmark, FileText, Lock,
    Calendar,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function SuperadminDashboard() {
    const [stats, setStats] = useState({
        totalInstitutes: 0,
        activeInstitutes: 0,
        totalUsers: 0,
        totalTutors: 0,
        totalStudents: 0
    });
    const [loading, setLoading] = useState(true);

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await fetchPlatformStats();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                toast.error('Failed to load platform stats');
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    // Mock Analytics Data for Chart
    const analyticsData = [
        { name: 'Week 1', students: 0, instructors: 0, revenue: 0 },
        { name: 'Week 2', students: 180, instructors: 200, revenue: 280 },
        { name: 'Week 3', students: 400, instructors: 250, revenue: 350 },
        { name: 'Week 4', students: 500, instructors: 320, revenue: 500 },
        { name: 'Week 5', students: 680, instructors: 480, revenue: 650 }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F4EEFD]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#6B4DF1]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin&backgroundColor=E9DFFC" alt="Admin" className="w-14 h-14 rounded-full border-2 border-white shadow-sm" />
                    <div>
                        <h1 className="text-[22px] font-black text-[#27225B] m-0 flex items-center gap-2">
                            Welcome back, Super Admin 👋
                        </h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Here's your complete platform overview.</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-[#6B4DF1] text-white font-bold text-[14px] rounded-xl hover:bg-[#5839D6] transition-colors shadow-md border-none cursor-pointer">
                    <Plus size={16} strokeWidth={3} /> Quick Actions <ChevronRight size={16} />
                </button>
            </div>

            {/* ── MAIN SPLIT LAYOUT ── */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* ── LEFT COLUMN (75% Width) ── */}
                <div className="xl:col-span-3 flex flex-col gap-6">
                    
                    {/* 1. Top KPI Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { title: 'Total Institutes', value: stats.totalInstitutes || '20', growth: '+ 30%', color: '#6B4DF1', bg: '#F4F0FD', icon: Building2 },
                            { title: 'Total Students', value: (stats.totalStudents || '18,450').toLocaleString(), growth: '+ 5%', color: '#4ABCA8', bg: '#ECFDF5', icon: Users },
                            { title: 'Total Instructors', value: (stats.totalTutors || '525').toLocaleString(), growth: '+ 6%', color: '#FC8730', bg: '#FFF7ED', icon: GraduationCap },
                            { title: 'Total Courses', value: '1,280', growth: '+ 8%', color: '#6B4DF1', bg: '#F4F0FD', icon: MonitorPlay }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 hover:-translate-y-1 transition-transform relative" style={{ boxShadow: softShadow }}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: stat.bg, color: stat.color }}>
                                        <stat.icon size={16} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[14px] font-bold text-[#4A5568]">{stat.title}</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[28px] font-black text-[#27225B] leading-none">{stat.value}</span>
                                        <span className="text-[11px] font-bold text-[#4ABCA8] bg-[#ECFDF5] px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                            ↑ {stat.growth.replace('+', '')}
                                        </span>
                                    </div>
                                    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2 18L12 10L20 14L38 2" stroke={stat.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 2. Middle Row (Analytics & Top Courses) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Platform Analytics */}
                        <div className="bg-white rounded-2xl p-5 lg:col-span-2 border border-[#E9DFFC]/50 flex flex-col" style={{ boxShadow: softShadow }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[16px] font-black text-[#27225B] m-0">Platform Analytics</h2>
                                <button className="flex items-center gap-1 text-[12px] font-bold text-[#6B4DF1] bg-[#F4F0FD] px-3 py-1.5 rounded-lg border-none cursor-pointer">
                                    This Month <ChevronDown size={14} />
                                </button>
                            </div>
                            <div className="flex items-center gap-5 mb-4">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#6B4DF1]"></div><span className="text-[11px] font-bold text-[#7D8DA6]">Students</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4ABCA8]"></div><span className="text-[11px] font-bold text-[#7D8DA6]">Instructors</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FC8730]"></div><span className="text-[11px] font-bold text-[#7D8DA6]">Revenue</span></div>
                            </div>
                            <div className="h-[220px] w-full mt-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analyticsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F0FD" />
                                        <XAxis dataKey="name" stroke="#A0ABC0" tickLine={false} axisLine={false} tick={{ fill: '#7D8DA6', fontSize: 11, fontWeight: 600 }} dy={10} />
                                        <YAxis stroke="#A0ABC0" tickLine={false} axisLine={false} tick={{ fill: '#7D8DA6', fontSize: 11, fontWeight: 600 }} dx={-10} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: softShadow, fontWeight: 'bold', color: '#27225B' }} />
                                        <Line type="monotone" dataKey="revenue" stroke="#FC8730" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#FC8730', strokeWidth: 2 }} />
                                        <Line type="monotone" dataKey="instructors" stroke="#4ABCA8" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#4ABCA8', strokeWidth: 2 }} />
                                        <Line type="monotone" dataKey="students" stroke="#6B4DF1" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#6B4DF1', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Courses */}
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex flex-col" style={{ boxShadow: softShadow }}>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-[16px] font-black text-[#27225B] m-0">Top Courses</h2>
                                <button className="flex items-center gap-1 text-[12px] font-bold text-[#6B4DF1] bg-[#F4F0FD] px-3 py-1.5 rounded-lg border-none cursor-pointer">
                                    This Year <ChevronDown size={14} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-4 flex-1 justify-center">
                                {[
                                    { name: 'Python Programming', count: '1,250', rev: '45', icon: BookOpen },
                                    { name: 'Data Science', count: '980', rev: '30', icon: FileText },
                                    { name: 'Java Development', count: '980', rev: '22', icon: MonitorPlay }
                                ].map((c, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8F7FF] transition-colors cursor-pointer">
                                        <div className="w-10 h-10 rounded-full bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0"><c.icon size={18} /></div>
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-[#27225B] leading-tight mb-0.5">{c.name}</span>
                                            <span className="text-[11px] font-medium text-[#7D8DA6]">{c.count} students • {c.rev}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. Lists Row (Top Institutes, Instructors, Recent Activities) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Institutes */}
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex flex-col" style={{ boxShadow: softShadow }}>
                            <h2 className="text-[16px] font-black text-[#27225B] m-0 mb-5">Top Institutes</h2>
                            <div className="flex flex-col gap-4 flex-1">
                                {[
                                    { name: 'Sapient Academy', students: '3,050', val: '3,150' },
                                    { name: 'LearnQuest College', students: '1,230', val: '932' },
                                    { name: 'Technoskill Academy', students: '1,250', val: '690' },
                                    { name: 'EduFuture Institute', students: '1,250', val: '518' },
                                    { name: 'SkillWave University', students: '980', val: '590' }
                                ].map((inst, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0"><Building2 size={14} /></div>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-[#27225B] truncate w-[110px]">{inst.name}</span>
                                                <span className="text-[11px] font-medium text-[#7D8DA6]">{inst.students} students</span>
                                            </div>
                                        </div>
                                        <span className="text-[13px] font-black text-[#4A5568]">{inst.val}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 pt-3 border-t border-[#F4F0FD] flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#6B4DF1]"><div className="w-2 h-2 rounded-full bg-[#6B4DF1]"></div> Finance</div>
                                <span className="text-[14px] font-black text-[#27225B]">₹85,20,000</span>
                            </div>
                        </div>

                        {/* Top Instructors */}
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex flex-col" style={{ boxShadow: softShadow }}>
                            <h2 className="text-[16px] font-black text-[#27225B] m-0 mb-5">Top Instructors</h2>
                            <div className="flex flex-col gap-4 flex-1">
                                {[
                                    { name: 'Preeti Sharma', students: '1132 students • 13', val: '1,124' },
                                    { name: 'Amit Verma', students: '1250 students • 15', val: '132' },
                                    { name: 'Anjali Mehta', students: '990 students • 10', val: '64' },
                                    { name: 'Rohit Das', students: '630 students • 8', val: '80' },
                                    { name: 'Karishma Singh', students: '980 students', val: '99' }
                                ].map((inst, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${inst.name}`} alt="" className="w-8 h-8 rounded-full bg-[#F4F0FD]" />
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-[#27225B] truncate w-[110px]">{inst.name}</span>
                                                <span className="text-[11px] font-medium text-[#7D8DA6]">{inst.students}</span>
                                            </div>
                                        </div>
                                        <span className="text-[13px] font-black text-[#4A5568]">{inst.val}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 pt-3 border-t border-[#F4F0FD] flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#6B4DF1]"><div className="w-2 h-2 rounded-full bg-[#6B4DF1] flex items-center justify-center"></div> Certificates</div>
                                <span className="text-[14px] font-black text-[#27225B]">11</span>
                            </div>
                        </div>

                        {/* Recent Activities */}
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex flex-col" style={{ boxShadow: softShadow }}>
                            <h2 className="text-[16px] font-black text-[#27225B] m-0 mb-5">Recent Activities</h2>
                            <div className="flex flex-col gap-4 flex-1">
                                {[
                                    { name: 'SkillWave University', students: '1250 students • 43', val: '# 991' },
                                    { name: 'Data Science', students: '940 students • 32', val: '1210', color: '#4ABCA8' },
                                    { name: 'Java Development', students: '990 students • 32', val: '990', color: '#4ABCA8' },
                                    { name: 'Machine Learning', students: '690 students • 32', val: '630', color: '#4ABCA8' },
                                    { name: 'Advanced Chemistry', students: '722 students • 11', val: '590', color: '#4ABCA8' }
                                ].map((act, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0"><Server size={14} /></div>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-[#27225B] truncate w-[110px]">{act.name}</span>
                                                <span className="text-[11px] font-medium text-[#7D8DA6]">{act.students}</span>
                                            </div>
                                        </div>
                                        <span className="text-[13px] font-black" style={{ color: act.color || '#4A5568' }}>{act.val}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 pt-3 border-t border-[#F4F0FD] flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#6B4DF1]"><div className="w-3 h-2 rounded bg-[#6B4DF1]"></div> Coodis</div>
                                <span className="text-[13px] font-bold text-[#6B4DF1]">14 more</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── RIGHT COLUMN (25% Width) ── */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    
                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                        <h2 className="text-[16px] font-black text-[#27225B] m-0 mb-4 flex items-center gap-2">
                            <Building2 size={18} className="text-[#6B4DF1]" /> Quick Actions
                        </h2>
                        <div className="flex flex-col gap-2">
                            {[
                                { label: 'Add Institute', icon: Building2, color: '#6B4DF1', bg: '#F4F0FD' },
                                { label: 'Approve Institute', icon: CheckCircle2, color: '#6B4DF1', bg: '#F4F0FD' },
                                { label: 'Add Admin', icon: Users, color: '#6B4DF1', bg: '#F4F0FD' },
                                { label: 'Create Course', icon: BookOpen, color: '#FC8730', bg: '#FFF7ED' }
                            ].map((action, i) => (
                                <button key={i} className="flex items-center justify-between w-full p-3 rounded-xl border border-transparent bg-white hover:bg-[#F8F7FF] hover:border-[#E9DFFC] transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: action.bg, color: action.color }}>
                                            <action.icon size={16} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[13px] font-bold text-[#27225B]">{action.label}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-[#A0ABC0] group-hover:text-[#6B4DF1]" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                        <h2 className="text-[16px] font-black text-[#27225B] m-0 mb-4 flex items-center gap-2">
                            <ShieldAlert size={18} className="text-[#6B4DF1]"/> Alerts
                        </h2>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center bg-[#F9F7FC] p-2.5 rounded-lg border border-[#E9DFFC]">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#27225B]"><div className="w-5 h-5 rounded bg-[#FEE2E2] text-[#E53E3E] flex justify-center items-center text-[10px] font-black">IZ</div> Pending approvals</div>
                                <span className="bg-[#FFF7ED] text-[#FC8730] px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1"><AlertTriangle size={10}/> 12</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#F9F7FC] p-2.5 rounded-lg border border-[#E9DFFC]">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#27225B]"><div className="w-5 h-5 rounded bg-[#FFF7ED] text-[#FC8730] flex justify-center items-center text-[11px] font-black">₹</div> Payment failures</div>
                                <span className="bg-[#FEE2E2] text-[#E53E3E] px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1"><ShieldAlert size={10}/> 5</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#F9F7FC] p-2.5 rounded-lg border border-[#E9DFFC]">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#27225B]"><div className="w-5 h-5 rounded bg-[#FEF3C7] text-[#D97706] flex justify-center items-center text-[12px] font-black">✦</div> System alerts</div>
                                <span className="bg-[#FEF3C7] text-[#D97706] px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1"><AlertCircle size={10}/> 3</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#F9F7FC] p-2.5 rounded-lg border border-[#E9DFFC]">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#27225B]"><div className="w-5 h-5 rounded bg-[#EBF8FF] text-[#3182CE] flex justify-center items-center text-[12px] font-black">✦</div> High risk users</div>
                                <span className="bg-[#EBF8FF] text-[#3182CE] px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1">+ 18</span>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Overview */}
                    <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex-1" style={{ boxShadow: softShadow }}>
                        <h2 className="text-[16px] font-black text-[#27225B] m-0 mb-4">Revenue Overview</h2>
                        <div className="flex flex-col gap-5">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 bg-[#F4F0FD] text-[#6B4DF1] rounded flex items-center justify-center shrink-0"><IndianRupee size={14}/></div>
                                    <div className="flex flex-col"><span className="text-[13px] font-bold text-[#27225B]">Total Revenue</span><span className="text-[10px] text-[#A0ABC0] font-medium leading-tight">521, pending payments</span></div>
                                </div>
                                <span className="text-[12px] font-black text-[#4ABCA8] bg-[#ECFDF5] px-2 py-0.5 rounded">₹85,20,000</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 bg-[#F4F0FD] text-[#6B4DF1] rounded flex items-center justify-center shrink-0"><Calendar size={14}/></div>
                                    <div className="flex flex-col"><span className="text-[13px] font-bold text-[#27225B]">Monthly Revenue</span><span className="text-[10px] text-[#A0ABC0] font-medium leading-tight">52, pending payments</span></div>
                                </div>
                                <span className="text-[12px] font-black text-[#4ABCA8] bg-[#ECFDF5] px-2 py-0.5 rounded">₹7,20,000</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 bg-[#F4F0FD] text-[#6B4DF1] rounded flex items-center justify-center shrink-0"><CheckCircle2 size={14}/></div>
                                    <div className="flex flex-col"><span className="text-[13px] font-bold text-[#27225B]">Active Subscriptions</span><span className="text-[10px] text-[#A0ABC0] font-medium leading-tight">44 tnls • 32</span></div>
                                </div>
                                <span className="text-[12px] font-black text-[#4ABCA8]">1,250</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 bg-[#F4F0FD] text-[#6B4DF1] rounded flex items-center justify-center shrink-0"><CreditCard size={14}/></div>
                                    <div className="flex flex-col"><span className="text-[13px] font-bold text-[#27225B]">Payout Requests</span><span className="text-[10px] text-[#A0ABC0] font-medium leading-tight">9 pending • 8</span></div>
                                </div>
                                <span className="text-[12px] font-black text-[#4A5568] bg-[#F1F5F9] px-2 py-0.5 rounded">₹85,000 <span className="font-medium text-[#A0ABC0] ml-1">pending</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 3. Bottom Horizontal Row (Full Width) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex items-center justify-between" style={{ boxShadow: softShadow }}>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-black text-[#27225B] mb-1">Financial Overview</span>
                        <span className="text-[13px] font-bold text-[#7D8DA6]">Total Revenue</span>
                    </div>
                    <span className="text-[20px] font-black text-[#4F7BF0]">₹85,20,000</span>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex items-center justify-between" style={{ boxShadow: softShadow }}>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-black text-[#27225B] mb-1">Server Health</span>
                        <span className="text-[13px] font-bold text-[#4ABCA8] flex items-center gap-1.5"><CheckCircle2 size={14}/> Server Status</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[14px] font-black text-[#4F7BF0] flex items-center gap-1.5"><Activity size={14}/> 365ms</span>
                        <span className="text-[11px] font-bold text-[#4ABCA8] bg-[#ECFDF5] px-2 py-1 rounded-md">+8%</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex items-center justify-between" style={{ boxShadow: softShadow }}>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-black text-[#27225B] mb-1">API Diagnostics</span>
                        <span className="text-[13px] font-bold text-[#6B4DF1] flex items-center gap-1.5"><Zap size={14} className="bg-[#F4F0FD] px-0.5 rounded"/> API Performance</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[14px] font-black text-[#4A5568]">1,200s</span>
                        <span className="text-[11px] font-bold text-[#4ABCA8] bg-[#ECFDF5] px-2 py-1 rounded-md">+8%</span>
                    </div>
                </div>
            </div>

        </div>
    );
}