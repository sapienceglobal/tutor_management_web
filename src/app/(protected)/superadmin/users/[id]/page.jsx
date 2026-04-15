'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Loader2, User, Mail, Building2, Phone, CalendarDays,
    GraduationCap, BookOpen, ShieldAlert, CheckCircle2, AlertTriangle,
    Ban, Unlock, TrendingUp, MonitorPlay, FileText,
    UserCog
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminUserProfile() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusLoading, setStatusLoading] = useState(false);

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchUserProfile();
    }, [id]);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get(`/superadmin/users/${id}/profile`);
            if (res.data.success) {
                setProfileData(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load user profile');
            router.push('/superadmin/users'); // Redirect back if error
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!confirm(`Are you sure you want to ${profileData.user.isBlocked ? 'unblock' : 'block'} this user?`)) return;
        setStatusLoading(true);
        try {
            const res = await api.patch(`/superadmin/users/${id}/status`);
            if (res.data.success) {
                setProfileData(prev => ({
                    ...prev,
                    user: { ...prev.user, isBlocked: res.data.isBlocked }
                }));
                toast.success(res.data.message);
            }
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setStatusLoading(false);
        }
    };

    if (loading || !profileData) {
        return <div className="flex h-screen items-center justify-center bg-[#F4EEFD]"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>;
    }

    const { user, stats, recentActivity } = profileData;
    const isStudent = user.role === 'student';
    const isAdmin = user.role === 'admin';

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Top Header & Identity Card ── */}
            <div className="bg-[#27225B] rounded-[24px] p-8 border border-[#1e1a48] relative overflow-hidden shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="absolute right-0 top-0 w-64 h-64 bg-[#6B4DF1] opacity-20 rounded-full filter blur-[60px]"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-24 h-24 rounded-full bg-white border-4 border-[#6B4DF1] overflow-hidden flex items-center justify-center shrink-0">
                        {user.profileImage ? (
                            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="text-[#6B4DF1]" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-[28px] font-black text-white m-0">{user.name}</h1>
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${isStudent ? 'bg-[#ECFDF5] text-[#10B981]' : isAdmin ? 'bg-[#F4F0FD] text-[#6B4DF1]' : 'bg-[#FFF7ED] text-[#EA580C]'}`}>
                                {user.role === 'admin' ? 'Institute Admin' : user.role}
                            </span>
                            {user.isBlocked && (
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#EF4444] text-white flex items-center gap-1">
                                    <Ban size={10} /> Blocked
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium text-[#A0ABC0] mt-2">
                            <span className="flex items-center gap-1.5"><Mail size={14} /> {user.email}</span>
                            {user.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {user.phone}</span>}
                            <span className="flex items-center gap-1.5"><Building2 size={14} /> {user.instituteId?.name || 'Global User'}</span>
                            <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleToggleStatus}
                        disabled={statusLoading}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold transition-all shadow-sm border-none cursor-pointer disabled:opacity-50
                            ${user.isBlocked ? 'bg-[#ECFDF5] text-[#10B981] hover:bg-[#D1FAE5]' : 'bg-[#FEE2E2] text-[#E53E3E] hover:bg-[#FECACA]'}`}
                    >
                        {statusLoading ? <Loader2 size={16} className="animate-spin" /> : user.isBlocked ? <Unlock size={16} /> : <Ban size={16} />}
                        {user.isBlocked ? 'Unblock User' : 'Block User'}
                    </button>
                </div>
            </div>

            {/* ── Dynamic Stats Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {isStudent ? (
                    <>
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center"><MonitorPlay size={24} /></div>
                            <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0">Active Courses</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{stats.activeEnrollments}</h3></div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#EBF8FF] text-[#3182CE] flex items-center justify-center"><FileText size={24} /></div>
                            <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0">Exams Taken</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{stats.totalExams}</h3></div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center"><TrendingUp size={24} /></div>
                            <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0">Avg Score</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{stats.avgScore}%</h3></div>
                        </div>
                        <div className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4 ${stats.cheatingFlags > 0 ? 'border-[#FECACA] bg-[#FEF2F2]' : 'border-[#E9DFFC]'}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.cheatingFlags > 0 ? 'bg-[#FEE2E2] text-[#E53E3E]' : 'bg-gray-100 text-gray-400'}`}><ShieldAlert size={24} /></div>
                            <div><p className={`text-[11px] font-bold uppercase m-0 ${stats.cheatingFlags > 0 ? 'text-[#E53E3E]' : 'text-[#7D8DA6]'}`}>Alerts</p><h3 className={`text-[24px] font-black m-0 ${stats.cheatingFlags > 0 ? 'text-[#E53E3E]' : 'text-[#27225B]'}`}>{stats.cheatingFlags} Flags</h3></div>
                        </div>
                    </>
                ) : isAdmin ? (
                    <>
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center"><GraduationCap size={24} /></div>
                            <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0">Total Students</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{stats.totalStudents}</h3></div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center"><UserCog size={24} /></div>
                            <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0">Total Tutors</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{stats.totalTutors}</h3></div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center"><BookOpen size={24} /></div>
                            <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0">Inst. Courses</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{stats.totalCourses}</h3></div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#EBF8FF] text-[#3182CE] flex items-center justify-center"><Building2 size={24} /></div>
                            <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0">Inst. Batches</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{stats.totalBatches}</h3></div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center"><BookOpen size={24} /></div>
                            <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0">Courses Created</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{stats.totalCourses}</h3></div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center"><GraduationCap size={24} /></div>
                            <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0">Total Students</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{stats.totalStudentsTaught}</h3></div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#EBF8FF] text-[#3182CE] flex items-center justify-center"><CheckCircle2 size={24} /></div>
                            <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0">Active Batches</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{stats.activeBatches}</h3></div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center"><TrendingUp size={24} /></div>
                            <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase m-0">Avg Rating</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{stats.avgRating} <span className="text-[14px]">/ 5</span></h3></div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Deep Dive Content ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Panel */}
                <div className="bg-white rounded-[24px] border border-[#E9DFFC] overflow-hidden" style={{ boxShadow: softShadow }}>
                    <div className="px-6 py-5 border-b border-[#F4F0FD] bg-[#FDFBFF]">
                        <h2 className="text-[16px] font-black text-[#27225B] m-0">
                            {isStudent ? 'Current Enrollments' : isAdmin ? 'Institute Courses' : 'Tutor Courses'}
                        </h2>
                    </div>
                    <div className="p-0">
                        {isStudent ? (
                            recentActivity.enrollments.length === 0 ? <p className="p-6 text-center text-[#A0ABC0] text-[13px] font-bold">No active enrollments.</p> :
                                recentActivity.enrollments.map(e => (
                                    <div key={e._id} className="p-5 border-b border-[#F4F0FD] hover:bg-[#F9F7FC] flex items-center gap-4 transition-colors">
                                        <img src={e.courseId?.thumbnail} className="w-16 h-12 rounded-lg object-cover bg-slate-100" />
                                        <div className="flex-1">
                                            <p className="text-[14px] font-bold text-[#27225B] m-0">{e.courseId?.title}</p>
                                            <p className="text-[11px] text-[#A0ABC0] font-medium m-0 mt-1">Enrolled: {new Date(e.enrolledAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            recentActivity.courses.length === 0 ? <p className="p-6 text-center text-[#A0ABC0] text-[13px] font-bold">No courses found.</p> :
                                recentActivity.courses.map(c => (
                                    <div key={c._id} className="p-5 border-b border-[#F4F0FD] hover:bg-[#F9F7FC] flex items-center justify-between transition-colors">
                                        <div>
                                            <p className="text-[14px] font-bold text-[#27225B] m-0">{c.title}</p>
                                            <p className="text-[11px] text-[#A0ABC0] font-medium m-0 mt-1">{c.enrolledCount} Students Enrolled</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${c.status === 'published' ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F8F6FC] text-[#7D8DA6]'}`}>
                                            {c.status}
                                        </span>
                                    </div>
                                ))
                        )}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="bg-white rounded-[24px] border border-[#E9DFFC] overflow-hidden" style={{ boxShadow: softShadow }}>
                    <div className="px-6 py-5 border-b border-[#F4F0FD] bg-[#FDFBFF]">
                        <h2 className="text-[16px] font-black text-[#27225B] m-0">
                            {isStudent ? 'Assessment History' : isAdmin ? 'Institute Tutors' : 'Active Batches'}
                        </h2>
                    </div>
                    <div className="p-0">
                        {isStudent ? (
                            recentActivity.exams.length === 0 ? <p className="p-6 text-center text-[#A0ABC0] text-[13px] font-bold">No exams taken yet.</p> :
                                recentActivity.exams.map(ex => (
                                    <div key={ex._id} className="p-5 border-b border-[#F4F0FD] hover:bg-[#F9F7FC] flex flex-col gap-3 transition-colors">
                                        <div className="w-full flex items-center justify-between">
                                            <p className="text-[14px] font-bold text-[#27225B] m-0">{ex.examId?.title || 'Exam'}</p>
                                            <h3 className={`text-[18px] font-black m-0 ${ex.isPassed ? 'text-[#10B981]' : 'text-[#E53E3E]'}`}>{ex.percentage}%</h3>
                                        </div>
                                        {(ex.aiRiskLevel === 'Suspicious Detected' || ex.aiRiskLevel === 'Cheating Detected' || ex.tabSwitchCount > 0) && (
                                            <div className="w-full bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3 flex flex-col gap-1.5">
                                                <p className="text-[11px] font-black text-[#E53E3E] uppercase flex items-center gap-1.5 m-0"><AlertTriangle size={14} /> AI Proctor Warning</p>
                                                <p className="text-[12px] text-[#991B1B] font-medium m-0">Risk: {ex.aiRiskLevel} • Tab Switches: {ex.tabSwitchCount}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                        ) : isAdmin ? (
                            recentActivity.tutors.length === 0 ? <p className="p-6 text-center text-[#A0ABC0] text-[13px] font-bold">No tutors in this institute.</p> :
                                recentActivity.tutors.map(t => (
                                    <div key={t._id} className="p-5 border-b border-[#F4F0FD] hover:bg-[#F9F7FC] flex items-center gap-3 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-[#F4F0FD] flex items-center justify-center overflow-hidden">
                                            {t.profileImage ? <img src={t.profileImage} className="w-full h-full object-cover" /> : <User size={16} className="text-[#6B4DF1]" />}
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-[#27225B] m-0">{t.name}</p>
                                            <p className="text-[11px] text-[#A0ABC0] font-medium m-0 mt-0.5">{t.email}</p>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            recentActivity.batches.length === 0 ? <p className="p-6 text-center text-[#A0ABC0] text-[13px] font-bold">No active batches.</p> :
                                recentActivity.batches.map(b => (
                                    <div key={b._id} className="p-5 border-b border-[#F4F0FD] hover:bg-[#F9F7FC] flex items-center justify-between transition-colors">
                                        <div>
                                            <p className="text-[14px] font-bold text-[#27225B] m-0">{b.name}</p>
                                            <p className="text-[11px] text-[#A0ABC0] font-medium m-0 mt-1">{b.courseId?.title}</p>
                                        </div>
                                        <span className="text-[12px] font-bold text-[#6B4DF1] bg-[#F4F0FD] px-3 py-1 rounded-lg">{b.status}</span>
                                    </div>
                                ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}