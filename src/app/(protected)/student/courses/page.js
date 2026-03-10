'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Search, FolderOpen, FileCheck, Video, ChevronDown,
    FileText, Sparkles, Megaphone, PlayCircle, Pencil,
    Trash2, Star, GraduationCap, BookOpen, Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { getAudienceDisplay } from '@/lib/audienceDisplay';

const COURSES_PER_PAGE = 8;

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, iconColor, label, value, href }) {
    const inner = (
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 min-w-[148px] hover:border-[var(--theme-primary)]/30 hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.06em]">{label}</p>
                <p className="text-xl font-black text-slate-800">{value}</p>
            </div>
        </div>
    );
    return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Collapsible sidebar card ─────────────────────────────────────────────────
function SideCard({ title, icon: Icon, iconColor = 'text-[var(--theme-primary)]', open, onToggle, children }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button type="button" onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <span className="text-sm font-bold text-slate-800">{title}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
}

// ─── Course card (enrolled) ───────────────────────────────────────────────────
function EnrolledCourseCard({ enrollment }) {
    const course = enrollment.courseId;
    if (!course) return null;
    const progress = enrollment.progress?.percentage ?? 0;
    const instructorName = course.tutorId?.userId?.name || 'Instructor';
    const audienceInfo = getAudienceDisplay(course);
    const isNew = enrollment.enrolledAt && (Date.now() - new Date(enrollment.enrolledAt).getTime()) < 14 * 24 * 60 * 60 * 1000;
    const isCertified = progress >= 100;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col">
            <div className="relative aspect-video bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-accent)]">
                <img src={course.thumbnail || 'https://images.unsplash.com/photo-1546374823-74e2d36d4bd2?auto=format&fit=crop&q=80&w=600'}
                    alt={course.title} className="w-full h-full object-cover" />
                {(isNew || isCertified) && (
                    <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-sm
                        ${isCertified ? 'bg-emerald-500' : 'bg-[var(--theme-primary)]'}`}>
                        {isCertified ? 'Certified' : 'New'}
                    </span>
                )}
                {/* Progress overlay strip */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                    <div className="h-full bg-[var(--theme-primary)]/20 transition-all" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-sm font-bold text-slate-800 line-clamp-1 flex-1">{course.title}</p>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${audienceInfo.badgeClass}`}>
                        {audienceInfo.label}
                    </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mb-3">{instructorName}</p>

                {/* Progress bar */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--theme-primary), var(--theme-accent))' }} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{progress}%</span>
                </div>

                <div className="flex items-center justify-between mt-auto">
                    <Link href={`/student/courses/${course._id}`}>
                        <button className="px-4 py-2 text-xs font-black text-white rounded-xl transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                            {progress > 0 ? 'Resume' : 'Start'}
                        </button>
                    </Link>
                    <div className="flex items-center gap-1">
                        <button className="p-2 text-slate-300 hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/20 rounded-xl transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Course card (discover) ───────────────────────────────────────────────────
function DiscoverCourseCard({ course }) {
    const instructorName = course.tutorId?.userId?.name || 'Instructor';
    const audienceInfo = getAudienceDisplay(course);
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col">
            <div className="relative aspect-video bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-accent)]">
                <img src={course.thumbnail || 'https://images.unsplash.com/photo-1546374823-74e2d36d4bd2?auto=format&fit=crop&q=80&w=600'}
                    alt={course.title} className="w-full h-full object-cover" />
                <div className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl text-[10px] font-black shadow-sm
                    ${!course.price || course.price === 0 ? 'bg-emerald-500 text-white' : 'bg-white/95 text-slate-800'}`}>
                    {!course.price || course.price === 0 ? 'FREE' : `₹${course.price}`}
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-sm font-bold text-slate-800 line-clamp-2 flex-1">{course.title}</p>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${audienceInfo.badgeClass}`}>
                        {audienceInfo.label}
                    </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-slate-400 font-medium">{instructorName}</p>
                    {course.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] font-bold text-slate-600">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {course.rating?.toFixed(1)}
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider rounded-full">
                        {course.lessons?.length || 0} Lessons
                    </span>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100">
                    <Link href={`/student/courses/${course._id}`} className="block w-full">
                        <button className="w-full py-2.5 text-xs font-black text-[var(--theme-primary)] bg-[var(--theme-primary)]/20 hover:bg-[var(--theme-primary)]/20 rounded-xl transition-colors">
                            View Details
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyCoursesPage() {
    const [enrollments, setEnrollments]             = useState([]);
    const [upcomingExamsCount, setUpcomingExamsCount] = useState(0);
    const [liveClassesCount, setLiveClassesCount]   = useState(0);
    const [batches, setBatches]                     = useState([]);
    const [announcements, setAnnouncements]         = useState([]);
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [loading, setLoading]                     = useState(true);
    const [searchQuery, setSearchQuery]             = useState('');
    const [currentPage, setCurrentPage]             = useState(1);

    const [aiOpen, setAiOpen]           = useState(true);
    const [annOpen, setAnnOpen]         = useState(true);
    const [batchOpen, setBatchOpen]     = useState(true);

    const [mainTab, setMainTab]         = useState('enrollments');
    const [scopeTab, setScopeTab]       = useState('institute');
    const [discoverCourses, setDiscoverCourses] = useState([]);
    const [loadingDiscover, setLoadingDiscover] = useState(false);
    const [myInstitutes, setMyInstitutes]       = useState([]);
    const [currentInstitute, setCurrentInstitute] = useState(null);

    useEffect(() => { fetchData(); fetchMembership(); }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const tab = new URLSearchParams(window.location.search).get('tab');
        if (tab === 'discover') setMainTab('discover');
    }, []);

    const fetchMembership = async () => {
        try {
            const res = await api.get('/membership/my-institutes');
            if (res.data?.success) {
                setMyInstitutes(res.data.institutes || []);
                setCurrentInstitute(res.data.currentInstitute);
                if (!res.data.currentInstitute) setScopeTab('global');
            }
        } catch { setScopeTab('global'); }
    };

    useEffect(() => { if (mainTab === 'discover') fetchDiscoverCourses(); }, [mainTab, scopeTab]);

    const fetchDiscoverCourses = async () => {
        setLoadingDiscover(true);
        try {
            const res = await api.get(`/courses?scope=${scopeTab}`);
            if (res.data.success) setDiscoverCourses(res.data.courses || []);
        } catch { setDiscoverCourses([]); }
        finally { setLoadingDiscover(false); }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [enrollRes, examsRes, liveRes, batchesRes, annRes, aiRes] = await Promise.all([
                api.get('/enrollments/my-enrollments'),
                api.get('/student/exams/all').catch(() => ({ data: { exams: [] } })),
                api.get('/live-classes').catch(() => ({ data: { liveClasses: [] } })),
                api.get('/batches/my').catch(() => ({ data: { batches: [] } })),
                api.get('/enrollments/my-announcements').catch(() => ({ data: { announcements: [] } })),
                api.get('/ai/quick-recommendations').catch(() => ({ data: { recommendations: [] } })),
            ]);
            if (enrollRes.data.success) setEnrollments(enrollRes.data.enrollments || []);
            if (examsRes.data?.exams) setUpcomingExamsCount(examsRes.data.exams.filter(e => e.endDate && new Date(e.endDate) >= new Date() && !e.isCompleted).length);
            if (liveRes.data?.liveClasses) setLiveClassesCount(liveRes.data.liveClasses.filter(c => c.dateTime && new Date(c.dateTime) >= new Date()).length);
            if (batchesRes.data?.batches) setBatches(batchesRes.data.batches);
            if (annRes.data?.announcements) setAnnouncements(annRes.data.announcements);
            if (aiRes.data?.recommendations) setAiRecommendations(aiRes.data.recommendations);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const filteredEnrollments = enrollments.filter(e => {
        const c = e.courseId;
        if (!c) return false;
        return !searchQuery ||
            c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.tutorId?.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / COURSES_PER_PAGE));
    const paginatedEnrollments = filteredEnrollments.slice((currentPage - 1) * COURSES_PER_PAGE, currentPage * COURSES_PER_PAGE);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-11 h-11">
                    <div className="w-11 h-11 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[var(--theme-primary)] animate-pulse" />
                    </div>
                </div>
                <p className="text-sm text-slate-400 font-medium">Loading your courses…</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 pb-10" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Header row ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-black text-slate-800">Courses</h1>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Manage your learning journey</p>
                </div>

                {/* Main tab switcher */}
                <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
                    {[
                        { id: 'enrollments', label: 'My Enrollments', icon: BookOpen },
                        { id: 'discover',    label: 'Discover',       icon: Sparkles },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setMainTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all
                                ${mainTab === tab.id
                                    ? 'text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'}`}
                            style={mainTab === tab.id ? { background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' } : {}}>
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">

                {/* ── LEFT: Main content ────────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-5">

                    {/* ── ENROLLMENTS tab ─────────────────────────────────── */}
                    {mainTab === 'enrollments' && (
                        <>
                            {/* Stat cards */}
                            <div className="flex flex-wrap gap-3">
                                <StatCard icon={FolderOpen} iconBg="bg-[var(--theme-primary)]/20" iconColor="text-[var(--theme-primary)]"
                                    label="Enrolled Courses" value={enrollments.length} />
                                <StatCard icon={FileCheck} iconBg="bg-amber-50" iconColor="text-amber-500"
                                    label="Upcoming Exams" value={upcomingExamsCount} href="/student/upcoming-exams" />
                                <StatCard icon={Video} iconBg="bg-emerald-50" iconColor="text-emerald-500"
                                    label="Live Classes" value={liveClassesCount} href="/student/live-classes" />
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Search my courses…"
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent font-medium transition-all"
                                />
                            </div>

                            {/* Section title */}
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em]">
                                    Performance Overview
                                    <span className="ml-2 text-[var(--theme-primary)]">{filteredEnrollments.length} courses</span>
                                </p>
                            </div>

                            {filteredEnrollments.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {paginatedEnrollments.map(enrollment => (
                                            <EnrolledCourseCard key={enrollment._id} enrollment={enrollment} />
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 pt-2">
                                            <button disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(p => p - 1)}
                                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                                                Previous
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                <button key={p} onClick={() => setCurrentPage(p)}
                                                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all
                                                        ${currentPage === p ? 'text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                    style={currentPage === p ? { background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' } : {}}>
                                                    {p}
                                                </button>
                                            ))}
                                            <button disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(p => p + 1)}
                                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                                    <FolderOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                    <h3 className="text-sm font-bold text-slate-700 mb-1">No enrolled courses</h3>
                                    <p className="text-xs text-slate-400 mb-4">Enroll in courses to see them here.</p>
                                    <Link href="/student/dashboard">
                                        <button className="px-5 py-2.5 text-xs font-black text-white rounded-xl"
                                            style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                            Go to Dashboard
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── DISCOVER tab ────────────────────────────────────── */}
                    {mainTab === 'discover' && (
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em]">Explore Courses</p>

                                {myInstitutes.length > 0 && (
                                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                                        {['institute', 'global'].map(s => (
                                            <button key={s} onClick={() => setScopeTab(s)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize
                                                    ${scopeTab === s ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                style={scopeTab === s ? { background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' } : {}}>
                                                {s === 'institute' ? 'My Institute' : 'Global'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {loadingDiscover ? (
                                <div className="flex justify-center py-16">
                                    <div className="relative w-10 h-10">
                                        <div className="w-10 h-10 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-[var(--theme-primary)]/70 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            ) : discoverCourses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {discoverCourses.map(course => (
                                        <DiscoverCourseCard key={course._id} course={course} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                                    <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-1">No courses found</h3>
                                    <p className="text-xs text-slate-400">
                                        Check back later for new {scopeTab === 'institute' ? 'institute' : 'global'} courses.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Sidebar ───────────────────────────────────── */}
                <div className="w-full lg:w-72 shrink-0 space-y-4">

                    {/* AI Recommendations */}
                    <SideCard title="AI Recommendations" icon={Sparkles} iconColor="text-[var(--theme-primary)]"
                        open={aiOpen} onToggle={() => setAiOpen(!aiOpen)}>
                        <div className="space-y-2">
                            {aiRecommendations.length > 0 ? aiRecommendations.map((rec, i) => (
                                <div key={i} className="flex items-start gap-2.5 p-3 bg-[var(--theme-primary)]/20/60 border border-[var(--theme-primary)]/30 rounded-xl">
                                    <Sparkles className="w-3.5 h-3.5 text-[var(--theme-primary)] shrink-0 mt-0.5" />
                                    <span className="text-xs font-medium text-slate-700 leading-relaxed">{rec}</span>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 text-center py-3">No recommendations yet.</p>
                            )}
                            <Link href="/student/ai-analytics" className="block mt-1">
                                <button className="w-full py-2.5 text-xs font-black text-white rounded-xl flex items-center justify-center gap-1.5 mt-2"
                                    style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                    <Sparkles className="w-3.5 h-3.5" /> Start AI Study Plan
                                </button>
                            </Link>
                        </div>
                    </SideCard>

                    {/* Announcements */}
                    <SideCard title="Announcements" icon={Megaphone} iconColor="text-amber-500"
                        open={annOpen} onToggle={() => setAnnOpen(!annOpen)}>
                        <div className="space-y-2">
                            {announcements.length > 0 ? announcements.map(a => (
                                <div key={a.id} className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
                                    <div className="flex items-start gap-2 mb-1">
                                        <Megaphone className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        <span className="text-xs font-bold text-slate-800 leading-snug">{a.courseTitle}: {a.title}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 pl-5 line-clamp-2">{a.message}</p>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 text-center py-3">No recent announcements.</p>
                            )}
                        </div>
                    </SideCard>

                    {/* Batch Details */}
                    <SideCard title="Batch Details" icon={GraduationCap} iconColor="text-[var(--theme-accent)]"
                        open={batchOpen} onToggle={() => setBatchOpen(!batchOpen)}>
                        <div className="space-y-1">
                            {batches.length > 0 ? batches.slice(0, 5).map(batch => {
                                const courseId = batch.courseId?._id || batch.courseId;
                                const courseName = batch.courseId?.title || batch.name || 'Course';
                                const instructorName = batch.tutorId?.userId?.name || 'Instructor';
                                const enrollment = enrollments.find(e => (e.courseId?._id ?? e.courseId)?.toString() === courseId?.toString());
                                const pct = enrollment?.progress?.percentage ?? 0;
                                return (
                                    <Link key={batch._id} href={courseId ? `/student/courses/${courseId}` : '#'}
                                        className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black text-[var(--theme-primary)]"
                                            style={{ background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)' }}>
                                            {instructorName[0]?.toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-800 truncate">{courseName}</p>
                                            <p className="text-[11px] text-slate-400">{pct}% · {instructorName}</p>
                                        </div>
                                    </Link>
                                );
                            }) : (
                                <p className="text-xs text-slate-400 text-center py-3">No batches yet.</p>
                            )}
                        </div>
                    </SideCard>
                </div>
            </div>
        </div>
    );
}