'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Search, FolderOpen, FileCheck, Video, ChevronDown,
    FileText, Sparkles, Megaphone, Pencil,
    Trash2, Star, GraduationCap, BookOpen, Brain, PlayCircle, ChevronLeft, ChevronRight, ArrowRight,
    Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { getAudienceDisplay } from '@/lib/audienceDisplay';
import { C, T, S, R } from '@/constants/studentTokens';

const COURSES_PER_PAGE = 8;
const progressColors = ['#4F46E5', '#059669', '#EA580C', '#DB2777'];

// ─── FallbackImage ────────────────────────────────────────────────────────────
function FallbackImage({ src, alt, className }) {
    const defaultImg = 'https://images.unsplash.com/photo-1546374823-74e2d36d4bd2?auto=format&fit=crop&q=80&w=600';
    const [imgSrc, setImgSrc] = useState(src || defaultImg);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src || defaultImg);
        setHasError(false);
    }, [src]);

    if (hasError) {
        return (
            <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
                <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
        );
    }

    return (
        <img 
            src={imgSrc} alt={alt} className={className}
            onError={() => {
                if (imgSrc !== defaultImg) setImgSrc(defaultImg);
                else setHasError(true);
            }}
        />
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, href, iconBg, iconColor }) {
    const inner = (
        <div className="flex items-center gap-3 rounded-3xl p-4 transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: iconBg || C.iconBg }}>
                <Icon className="w-6 h-6" style={{ color: iconColor || C.btnPrimary }} />
            </div>
            <div>
                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.text, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {label}
                </p>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, lineHeight: 1 }}>
                    {value}
                </p>
            </div>
        </div>
    );
    return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

// ─── Enrolled course card ─────────────────────────────────────────────────────
function EnrolledCourseCard({ enrollment, index }) {
    const course = enrollment.courseId;
    if (!course) return null;
    const progress = enrollment.progress?.percentage ?? 0;
    const instructorName = course.tutorId?.userId?.name || 'Instructor';
    const audienceInfo = getAudienceDisplay(course);
    const isNew = enrollment.enrolledAt && (Date.now() - new Date(enrollment.enrolledAt).getTime()) < 14 * 24 * 60 * 60 * 1000;
    const isCertified = progress >= 100;
    const barColor = progressColors[index % progressColors.length];

    return (
        <div className="group rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            
            <div className="relative aspect-video overflow-hidden" style={{ background: C.gradientBtn }}>
                <FallbackImage src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white opacity-90 shadow-2xl rounded-full" />
                </div>

                {(isNew || isCertified) && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-md backdrop-blur-sm"
                        style={{ backgroundColor: isCertified ? 'rgba(16, 185, 129, 0.9)' : 'rgba(79, 70, 229, 0.9)' }}>
                        {isCertified ? 'Certified' : 'New'}
                    </span>
                )}
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="line-clamp-2 flex-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, lineHeight: 1.3 }}>
                        {course.title}
                    </p>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                    <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: C.text, opacity: 0.6 }}>
                        By {instructorName}
                    </p>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${audienceInfo.badgeClass}`}>
                        {audienceInfo.label}
                    </span>
                </div>

                <div className="mt-auto space-y-2">
                    <div className="flex justify-between items-center">
                        <span style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.text, opacity: 0.6 }}>{progress}% Complete</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.innerBg }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: barColor }} />
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                    <Link href={`/student/courses/${course._id}`} className="flex-1">
                        <button className="w-full py-2 text-white rounded-xl transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                            style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}>
                            {progress > 0 ? 'Resume Course' : 'Start Course'} <ArrowRight size={14} />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Discover course card ─────────────────────────────────────────────────────
function DiscoverCourseCard({ course }) {
    const instructorName = course.tutorId?.userId?.name || 'Instructor';
    const audienceInfo = getAudienceDisplay(course);
    const isFree = !course.price || course.price === 0;
    
    return (
        <Link href={`/student/courses/${course._id}`} className="group rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            <div className="relative aspect-video overflow-hidden" style={{ background: C.innerBg }}>
                <FallbackImage src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-xl text-[11px] font-black shadow-md backdrop-blur-md ${isFree ? 'text-white' : 'bg-white/95 text-slate-900'}`}
                    style={isFree ? { backgroundColor: 'rgba(16, 185, 129, 0.9)' } : {}}>
                    {isFree ? 'FREE' : `₹${course.price}`}
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="line-clamp-2 flex-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, lineHeight: 1.3 }}>
                        {course.title}
                    </p>
                </div>
                
                <div className="flex items-center justify-between mb-3 mt-1">
                    <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: C.text, opacity: 0.6 }}>
                        By {instructorName}
                    </p>
                    {course.rating > 0 && (
                        <span className="flex items-center gap-1" style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black, color: '#F59E0B' }}>
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {course.rating?.toFixed(1)}
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mt-auto pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                    <span className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: C.innerBg, color: C.text, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold }}>
                        <BookOpen className="w-3 h-3 inline mr-1 opacity-50" />
                        {course.lessons?.length || 0} Lessons
                    </span>
                    <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold ${audienceInfo.badgeClass}`}>
                        {audienceInfo.label}
                    </span>
                </div>
            </div>
        </Link>
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
    
    // Tabs state
    const [mainTab, setMainTab]                     = useState('enrollments');
    const [scopeTab, setScopeTab]                   = useState('institute');
    
    const [discoverCourses, setDiscoverCourses]     = useState([]);
    const [loadingDiscover, setLoadingDiscover]     = useState(false);
    const [myInstitutes, setMyInstitutes]           = useState([]);

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
        return !searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.tutorId?.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / COURSES_PER_PAGE));
    const paginatedEnrollments = filteredEnrollments.slice((currentPage - 1) * COURSES_PER_PAGE, currentPage * COURSES_PER_PAGE);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.text, opacity: 0.7 }}>
                    Loading your courses...
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 p-6 min-h-screen" style={{ fontFamily: T.fontFamily, backgroundColor: C.pageBg }}>

            {/* ── Header & Tabs ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading }}>My Learning Hub</h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, opacity: 0.6, marginTop: 2 }}>
                        Manage your enrollments and discover new courses.
                    </p>
                </div>
                
                {/* Modern Segmented Tab Switcher */}
                <div className="flex p-1 gap-1 rounded-xl shrink-0" style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                    {[
                        { id: 'enrollments', label: 'My Enrollments', icon: BookOpen },
                        { id: 'discover',    label: 'Discover Courses', icon: Sparkles },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setMainTab(tab.id)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200"
                            style={mainTab === tab.id
                                ? { backgroundColor: C.btnPrimary, color: '#ffffff', fontSize: T.size.sm, fontWeight: T.weight.bold, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                                : { color: C.text, opacity: 0.7, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── LEFT: Main content (8 cols) ────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-6">

                    {/* ENROLLMENTS tab */}
                    {mainTab === 'enrollments' && (
                        <>
                            {/* Quick Stats Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatCard icon={FolderOpen} label="Enrolled Courses" value={enrollments.length} iconBg="rgba(79, 70, 229, 0.1)" iconColor="#4F46E5" />
                                <StatCard icon={FileCheck}  label="Upcoming Exams"   value={upcomingExamsCount} href="/student/exams" iconBg="rgba(245, 158, 11, 0.1)" iconColor="#F59E0B" />
                                <StatCard icon={Video}      label="Live Classes"     value={liveClassesCount}   href="/student/live-classes" iconBg="rgba(16, 185, 129, 0.1)" iconColor="#10B981" />
                            </div>

                            {/* Search & List Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-4">
                                <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading }}>
                                    Active Courses <span style={{ color: C.btnPrimary, fontSize: T.size.sm }}>({filteredEnrollments.length})</span>
                                </h2>
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.text, opacity: 0.4 }} />
                                    <input type="text" placeholder="Search my courses…"
                                        value={searchQuery}
                                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-11 pr-4 py-2.5 rounded-xl focus:outline-none transition-all"
                                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.heading, fontSize: T.size.sm }}
                                        onFocus={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                        onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>

                            {filteredEnrollments.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {paginatedEnrollments.map((enrollment, i) => (
                                            <EnrolledCourseCard key={enrollment._id} enrollment={enrollment} index={i} />
                                        ))}
                                    </div>
                                    
                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 pt-6">
                                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl disabled:opacity-40 transition-colors bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                <button key={p} onClick={() => setCurrentPage(p)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl transition-all font-bold text-sm"
                                                    style={currentPage === p
                                                        ? { background: C.gradientBtn, color: '#ffffff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }
                                                        : { backgroundColor: C.surfaceWhite, color: C.textMuted, border: `1px solid ${C.cardBorder}` }}>
                                                    {p}
                                                </button>
                                            ))}
                                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl disabled:opacity-40 transition-colors bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="rounded-3xl p-12 text-center mt-6" style={{ backgroundColor: C.cardBg, border: `1px dashed ${C.cardBorder}` }}>
                                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, marginBottom: 8 }}>No courses found</h3>
                                    <p style={{ fontSize: T.size.sm, color: C.text, opacity: 0.6, marginBottom: 20 }}>
                                        {searchQuery ? "We couldn't find any courses matching your search." : "You haven't enrolled in any courses yet."}
                                    </p>
                                    {!searchQuery && (
                                        <button onClick={() => setMainTab('discover')} className="px-6 py-3 text-white rounded-xl transition-all hover:scale-105"
                                            style={{ background: C.gradientBtn, fontWeight: T.weight.bold }}>
                                            Discover Courses
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* DISCOVER tab */}
                    {mainTab === 'discover' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl" style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                <div>
                                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>Course Catalog</h2>
                                    <p style={{ fontSize: T.size.xs, color: C.textMuted, marginTop: '2px' }}>Find the perfect course for your goals.</p>
                                </div>
                                {myInstitutes.length > 0 && (
                                    <div className="flex p-1 gap-1 rounded-xl bg-white border border-slate-200 shadow-sm shrink-0">
                                        {['institute', 'global'].map(s => (
                                            <button key={s} onClick={() => setScopeTab(s)}
                                                className="px-4 py-1.5 rounded-lg capitalize transition-all"
                                                style={scopeTab === s
                                                    ? { backgroundColor: C.btnPrimary, color: '#ffffff', fontSize: T.size.xs, fontWeight: T.weight.bold }
                                                    : { color: C.textMuted, fontSize: T.size.xs, fontWeight: T.weight.semibold }}>
                                                {s === 'institute' ? 'My Institute' : 'Global'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {loadingDiscover ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.btnPrimary }} />
                                </div>
                            ) : discoverCourses.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {discoverCourses.map(course => <DiscoverCourseCard key={course._id} course={course} />)}
                                </div>
                            ) : (
                                <div className="rounded-3xl p-12 text-center" style={{ backgroundColor: C.cardBg, border: `1px dashed ${C.cardBorder}` }}>
                                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, marginBottom: 8 }}>No courses available</h3>
                                    <p style={{ fontSize: T.size.sm, color: C.textMuted }}>Check back later for new {scopeTab === 'institute' ? 'institute' : 'global'} courses.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Sidebar (4 cols) ────────────────────────────────── */}
                <div className="lg:col-span-4 space-y-6">

                    {/* AI Magic Study Plan Card */}
                    <div className="relative rounded-3xl p-6 overflow-hidden transition-transform hover:-translate-y-1 shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 pointer-events-none" />
                        
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/20 shadow-inner">
                                <Brain className="w-6 h-6 text-amber-300" />
                            </div>
                            <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: '#fff', marginBottom: '8px' }}>AI Study Buddy</h2>
                            <p style={{ fontSize: T.size.sm, color: 'rgba(255,255,255,0.7)', fontWeight: T.weight.medium, marginBottom: '20px', lineHeight: 1.5 }}>
                                Get smart recommendations based on your current progress and weak topics.
                            </p>
                            
                            <div className="space-y-2 mb-5">
                                {aiRecommendations.slice(0,2).map((rec, i) => (
                                    <div key={i} className="flex items-start gap-2 text-white/80 text-xs font-medium">
                                        <Sparkles className="w-3.5 h-3.5 mt-0.5 text-amber-300 shrink-0" />
                                        <span className="line-clamp-2">{rec}</span>
                                    </div>
                                ))}
                            </div>

                            <Link href="/student/ai-analytics" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white text-indigo-900 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
                                style={{ fontSize: T.size.sm, fontWeight: T.weight.black }}>
                                Open AI Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Announcements */}
                    <div className="p-6 rounded-3xl" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Megaphone className="w-4 h-4 text-amber-600" />
                            </div>
                            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>Recent Updates</h2>
                        </div>
                        
                        <div className="space-y-3">
                            {announcements.length > 0 ? announcements.slice(0, 3).map(a => (
                                <div key={a.id} className="p-3.5 rounded-2xl border transition-colors hover:bg-slate-50"
                                    style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder }}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-200 text-slate-600">
                                            {a.courseTitle || 'General'}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, lineHeight: 1.3, marginBottom: '4px' }}>
                                        {a.title}
                                    </p>
                                    <p className="line-clamp-2" style={{ fontSize: '11px', color: C.text, opacity: 0.6 }}>
                                        {a.message}
                                    </p>
                                </div>
                            )) : (
                                <div className="py-6 text-center border border-dashed rounded-2xl" style={{ borderColor: C.cardBorder }}>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No new updates.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Links / Batches */}
                    <div className="p-6 rounded-3xl" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-emerald-600" />
                            </div>
                            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>My Batches</h2>
                        </div>
                        
                        <div className="space-y-2">
                            {batches.length > 0 ? batches.slice(0, 4).map(batch => {
                                const courseName = batch.courseId?.title || batch.name || 'Course';
                                return (
                                    <Link key={batch._id} href="/student/batches" className="flex items-center justify-between p-3 rounded-2xl border transition-colors hover:bg-slate-50"
                                        style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder }}>
                                        <div className="min-w-0 pr-2">
                                            <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{batch.name}</p>
                                            <p className="truncate" style={{ fontSize: '10px', color: C.textMuted }}>{courseName}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                                    </Link>
                                );
                            }) : (
                                <p style={{ fontSize: T.size.sm, color: C.textMuted, textAlign: 'center', padding: '12px 0' }}>You are not assigned to any batches.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}