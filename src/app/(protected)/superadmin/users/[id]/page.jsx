'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    MdPerson, MdEmail, MdBusiness, MdPhone, MdCalendarMonth,
    MdSchool, MdMenuBook, MdWarning, MdCheckCircle, MdErrorOutline,
    MdBlock, MdLockOpen, MdTrendingUp, MdMonitor, MdArticle,
    MdManageAccounts, MdHourglassEmpty, MdPeople
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

export default function SuperAdminUserProfile() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusLoading, setStatusLoading] = useState(false);

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
            router.push('/superadmin/users');
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
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading profile...
                    </p>
                </div>
            </div>
        );
    }

    const { user, stats, recentActivity } = profileData;
    const isStudent = user.role === 'student';
    const isAdmin = user.role === 'admin';

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>

            {/* ── Top Header & Identity Card ── */}
            <div className="relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8"
                style={{ backgroundColor: C.darkCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                <div className="absolute right-0 top-0 opacity-20 rounded-full filter blur-[60px]" style={{ width: 256, height: 256, backgroundColor: C.btnPrimary, zIndex: 0 }}></div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ width: 96, height: 96, borderRadius: R.full, backgroundColor: C.surfaceWhite, border: `4px solid ${C.btnPrimary}` }}>
                        {user.profileImage ? (
                            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <MdPerson style={{ width: 40, height: 40, color: C.btnPrimary }} />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.darkCardText, margin: 0 }}>
                                {user.name}
                            </h1>
                            <span style={{
                                padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                ...(isStudent ? { backgroundColor: C.successBg, color: C.success } : isAdmin ? { backgroundColor: C.btnViewAllBg, color: C.btnPrimary } : { backgroundColor: C.warningBg, color: C.warning })
                            }}>
                                {user.role === 'admin' ? 'Institute Admin' : user.role}
                            </span>
                            {user.isBlocked && (
                                <span className="flex items-center gap-1" style={{ padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider, backgroundColor: C.danger, color: '#ffffff' }}>
                                    <MdBlock style={{ width: 12, height: 12 }} /> Blocked
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.darkCardMuted }}>
                            <span className="flex items-center gap-1.5"><MdEmail style={{ width: 16, height: 16 }} /> {user.email}</span>
                            {user.phone && <span className="flex items-center gap-1.5"><MdPhone style={{ width: 16, height: 16 }} /> {user.phone}</span>}
                            <span className="flex items-center gap-1.5"><MdBusiness style={{ width: 16, height: 16 }} /> {user.instituteId?.name || 'Global User'}</span>
                            <span className="flex items-center gap-1.5"><MdCalendarMonth style={{ width: 16, height: 16 }} /> Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleToggleStatus}
                        disabled={statusLoading}
                        className="flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        style={{
                            padding: '12px 24px',
                            borderRadius: '10px',
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                            border: `1px solid ${user.isBlocked ? C.successBorder : C.dangerBorder}`,
                            backgroundColor: user.isBlocked ? C.successBg : C.dangerBg,
                            color: user.isBlocked ? C.success : C.danger,
                        }}
                    >
                        {statusLoading ? <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" /> : user.isBlocked ? <MdLockOpen style={{ width: 16, height: 16 }} /> : <MdBlock style={{ width: 16, height: 16 }} />}
                        {user.isBlocked ? 'Unblock User' : 'Block User'}
                    </button>
                </div>
            </div>

            {/* ── Dynamic Stats Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {isStudent ? (
                    <>
                        <StatCard icon={MdMonitor} value={stats.activeEnrollments} label="Active Courses" iconBg="#EEF2FF" iconColor="#4F46E5" />
                        <StatCard icon={MdArticle} value={stats.totalExams} label="Exams Taken" iconBg="#EBF8FF" iconColor="#3182CE" />
                        <StatCard icon={MdTrendingUp} value={`${stats.avgScore}%`} label="Avg Score" iconBg="#ECFDF5" iconColor="#10B981" />
                        <StatCard icon={MdWarning} value={stats.cheatingFlags} label="Alerts" subtext="Flags Detected" iconBg={stats.cheatingFlags > 0 ? C.dangerBg : C.innerBg} iconColor={stats.cheatingFlags > 0 ? C.danger : C.textFaint} />
                    </>
                ) : isAdmin ? (
                    <>
                        <StatCard icon={MdSchool} value={stats.totalStudents} label="Total Students" iconBg="#ECFDF5" iconColor="#10B981" />
                        <StatCard icon={MdManageAccounts} value={stats.totalTutors} label="Total Tutors" iconBg="#FFF7ED" iconColor="#EA580C" />
                        <StatCard icon={MdMenuBook} value={stats.totalCourses} label="Inst. Courses" iconBg="#EEF2FF" iconColor="#6B4DF1" />
                        <StatCard icon={MdBusiness} value={stats.totalBatches} label="Inst. Batches" iconBg="#EBF8FF" iconColor="#3182CE" />
                    </>
                ) : (
                    <>
                        <StatCard icon={MdMenuBook} value={stats.totalCourses} label="Courses Created" iconBg="#EEF2FF" iconColor="#6B4DF1" />
                        <StatCard icon={MdSchool} value={stats.totalStudentsTaught} label="Total Students" iconBg="#FFF7ED" iconColor="#EA580C" />
                        <StatCard icon={MdCheckCircle} value={stats.activeBatches} label="Active Batches" iconBg="#EBF8FF" iconColor="#3182CE" />
                        <StatCard icon={MdTrendingUp} value={`${stats.avgRating} / 5`} label="Avg Rating" iconBg="#ECFDF5" iconColor="#10B981" />
                    </>
                )}
            </div>

            {/* ── Deep Dive Content ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Panel */}
                <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 py-5" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                <MdMenuBook style={{ width: 16, height: 16, color: C.iconColor }} />
                            </div>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                                {isStudent ? 'Current Enrollments' : isAdmin ? 'Institute Courses' : 'Tutor Courses'}
                            </h2>
                        </div>
                    </div>
                    <div className="p-0">
                        {isStudent ? (
                            recentActivity.enrollments.length === 0 ? (
                                <div className="p-14 text-center border border-dashed m-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                        <MdMenuBook style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                    </div>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No Enrollments</h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, margin: 0, marginTop: 4 }}>User has no active enrollments.</p>
                                </div>
                            ) : (
                                recentActivity.enrollments.map(e => (
                                    <div key={e._id} className="p-5 flex items-center gap-4 transition-colors" style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(ev) => { ev.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(ev) => { ev.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <img src={e.courseId?.thumbnail} alt="" className="object-cover" style={{ width: 64, height: 48, borderRadius: '10px', backgroundColor: C.innerBg }} />
                                        <div className="flex-1">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{e.courseId?.title}</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 4 }}>Enrolled: {new Date(e.enrolledAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            recentActivity.courses.length === 0 ? (
                                <div className="p-14 text-center border border-dashed m-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                        <MdMenuBook style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                    </div>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No Courses Found</h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, margin: 0, marginTop: 4 }}>No courses are available.</p>
                                </div>
                            ) : (
                                recentActivity.courses.map(c => (
                                    <div key={c._id} className="p-5 flex items-center justify-between transition-colors" style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(ev) => { ev.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(ev) => { ev.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{c.title}</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 4 }}>{c.enrolledCount} Students Enrolled</p>
                                        </div>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.black, textTransform: 'uppercase',
                                            ...(c.status === 'published' ? { backgroundColor: C.successBg, color: C.success } : { backgroundColor: C.innerBg, color: C.textMuted })
                                        }}>
                                            {c.status}
                                        </span>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 py-5" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                {isStudent ? <MdArticle style={{ width: 16, height: 16, color: C.iconColor }} /> : isAdmin ? <MdPerson style={{ width: 16, height: 16, color: C.iconColor }} /> : <MdPeople style={{ width: 16, height: 16, color: C.iconColor }} />}
                            </div>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                                {isStudent ? 'Assessment History' : isAdmin ? 'Institute Tutors' : 'Active Batches'}
                            </h2>
                        </div>
                    </div>
                    <div className="p-0">
                        {isStudent ? (
                            recentActivity.exams.length === 0 ? (
                                <div className="p-14 text-center border border-dashed m-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                        <MdArticle style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                    </div>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No Exams Taken</h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, margin: 0, marginTop: 4 }}>User has not taken any exams yet.</p>
                                </div>
                            ) : (
                                recentActivity.exams.map(ex => (
                                    <div key={ex._id} className="p-5 flex flex-col gap-3 transition-colors" style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(ev) => { ev.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(ev) => { ev.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <div className="w-full flex items-center justify-between">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{ex.examId?.title || 'Exam'}</p>
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, margin: 0, color: ex.isPassed ? C.success : C.danger }}>{ex.percentage}%</h3>
                                        </div>
                                        {(ex.aiRiskLevel === 'Suspicious Detected' || ex.aiRiskLevel === 'Cheating Detected' || ex.tabSwitchCount > 0) && (
                                            <div className="w-full flex flex-col gap-1.5 p-3" style={{ backgroundColor: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: '10px' }}>
                                                <p className="flex items-center gap-1.5 m-0" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.danger, textTransform: 'uppercase' }}>
                                                    <MdWarning style={{ width: 14, height: 14 }} /> AI Proctor Warning
                                                </p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.danger, margin: 0 }}>
                                                    Risk: {ex.aiRiskLevel} • Tab Switches: {ex.tabSwitchCount}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        ) : isAdmin ? (
                            recentActivity.tutors.length === 0 ? (
                                <div className="p-14 text-center border border-dashed m-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                        <MdPerson style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                    </div>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No Tutors</h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, margin: 0, marginTop: 4 }}>No tutors found in this institute.</p>
                                </div>
                            ) : (
                                recentActivity.tutors.map(t => (
                                    <div key={t._id} className="p-5 flex items-center gap-3 transition-colors" style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(ev) => { ev.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(ev) => { ev.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <div className="flex items-center justify-center overflow-hidden shrink-0" style={{ width: 40, height: 40, borderRadius: R.full, backgroundColor: C.innerBg }}>
                                            {t.profileImage ? <img src={t.profileImage} className="w-full h-full object-cover" /> : <MdPerson style={{ width: 20, height: 20, color: C.btnPrimary }} />}
                                        </div>
                                        <div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{t.name}</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 4 }}>{t.email}</p>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            recentActivity.batches.length === 0 ? (
                                <div className="p-14 text-center border border-dashed m-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                        <MdPeople style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                    </div>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No Active Batches</h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, margin: 0, marginTop: 4 }}>User has no active batches.</p>
                                </div>
                            ) : (
                                recentActivity.batches.map(b => (
                                    <div key={b._id} className="p-5 flex items-center justify-between transition-colors" style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(ev) => { ev.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(ev) => { ev.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{b.name}</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 4 }}>{b.courseId?.title}</p>
                                        </div>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, backgroundColor: C.innerBg, padding: '4px 12px', borderRadius: '10px', textTransform: 'capitalize' }}>
                                            {b.status}
                                        </span>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}