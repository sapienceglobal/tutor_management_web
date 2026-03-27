'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Search, FolderOpen, FileCheck, Video, ChevronDown,
    FileText, Sparkles, Megaphone, Pencil,
    Trash2, Star, GraduationCap, BookOpen
} from 'lucide-react';
import api from '@/lib/axios';
import { getAudienceDisplay } from '@/lib/audienceDisplay';
import { C, T, S, R } from '@/constants/studentTokens';

const COURSES_PER_PAGE = 8;
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
            src={imgSrc} 
            alt={alt} 
            className={className}
            onError={() => {
                if (imgSrc !== defaultImg) {
                    setImgSrc(defaultImg);
                } else {
                    setHasError(true);
                }
            }}
        />
    );
}

// ─── Icon Pill ────────────────────────────────────────────────────────────────
function IconPill({ icon: Icon, size = 18, bg }) {
    return (
        <div className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, backgroundColor: bg || C.iconBg }}>
            <Icon style={{ width: size, height: size, color: '#ffffff' }} />
        </div>
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, href, iconBg }) {
    const inner = (
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 min-w-[148px] transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: iconBg || C.iconBg }}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.text, opacity: 0.55, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>
                    {label}
                </p>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading }}>
                    {value}
                </p>
            </div>
        </div>
    );
    return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Collapsible side card ────────────────────────────────────────────────────
function SideCard({ title, icon: Icon, iconBg, open, onToggle, children }) {
    return (
        <div className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            <button type="button" onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors"
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <div className="flex items-center gap-2.5">
                    <IconPill icon={Icon} size={15} bg={iconBg || C.iconBg} />
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                        {title}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    style={{ color: C.text, opacity: 0.35 }} />
            </button>
            {open && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
}

// ─── Enrolled course card ─────────────────────────────────────────────────────
function EnrolledCourseCard({ enrollment }) {
    const course = enrollment.courseId;
    if (!course) return null;
    const progress = enrollment.progress?.percentage ?? 0;
    const instructorName = course.tutorId?.userId?.name || 'Instructor';
    const audienceInfo = getAudienceDisplay(course);
    const isNew = enrollment.enrolledAt && (Date.now() - new Date(enrollment.enrolledAt).getTime()) < 14 * 24 * 60 * 60 * 1000;
    const isCertified = progress >= 100;

    return (
        <div className="rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            <div className="relative aspect-video"
                style={{ background: C.gradientBtn }}>
                <FallbackImage src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                {(isNew || isCertified) && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-sm"
                        style={{ backgroundColor: isCertified ? C.success : C.btnPrimary }}>
                        {isCertified ? 'Certified' : 'New'}
                    </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                    <div className="h-full transition-all" style={{ width: `${progress}%`, backgroundColor: C.btnPrimary }} />
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="line-clamp-1 flex-1"
                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                        {course.title}
                    </p>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${audienceInfo.badgeClass}`}>
                        {audienceInfo.label}
                    </span>
                </div>
                <p className="mb-3"
                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, opacity: 0.50 }}>
                    {instructorName}
                </p>

                <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.innerBg }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: C.btnPrimary }} />
                    </div>
                    <span style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.text, opacity: 0.55, whiteSpace: 'nowrap' }}>
                        {progress}%
                    </span>
                </div>

                <div className="flex items-center justify-between mt-auto">
                    <Link href={`/student/courses/${course._id}`}>
                        <button className="px-4 py-2 text-white rounded-xl transition-all hover:opacity-90"
                            style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}>
                            {progress > 0 ? 'Resume' : 'Start'}
                        </button>
                    </Link>
                    <div className="flex items-center gap-1">
                        <button className="p-2 rounded-xl transition-colors"
                            style={{ color: C.text, opacity: 0.30 }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.opacity = '1'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text; e.currentTarget.style.opacity = '0.30'; }}>
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-2 rounded-xl transition-colors"
                            style={{ color: C.text, opacity: 0.30 }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.dangerBg; e.currentTarget.style.color = C.danger; e.currentTarget.style.opacity = '1'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text; e.currentTarget.style.opacity = '0.30'; }}>
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
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
        <div className="rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            <div className="relative aspect-video" style={{ background: C.gradientBtn }}>
                <FallbackImage src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                <div className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl text-[10px] font-black shadow-sm ${isFree ? 'text-white' : 'bg-white/95 text-slate-800'}`}
                    style={isFree ? { backgroundColor: C.success } : {}}>
                    {isFree ? 'FREE' : `₹${course.price}`}
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="line-clamp-2 flex-1"
                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                        {course.title}
                    </p>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${audienceInfo.badgeClass}`}>
                        {audienceInfo.label}
                    </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, opacity: 0.50 }}>
                        {instructorName}
                    </p>
                    {course.rating > 0 && (
                        <span className="flex items-center gap-0.5"
                            style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.text }}>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {course.rating?.toFixed(1)}
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
                    <span className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: C.innerBg, color: C.text, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                        {course.lessons?.length || 0} Lessons
                    </span>
                </div>
                <div className="mt-auto pt-3" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                    <Link href={`/student/courses/${course._id}`} className="block w-full">
                        <button className="w-full py-2.5 rounded-xl transition-colors"
                            style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnPrimary; e.currentTarget.style.color = '#ffffff'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; e.currentTarget.style.color = C.btnViewAllText; }}>
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
    const [aiOpen, setAiOpen]                       = useState(true);
    const [annOpen, setAnnOpen]                     = useState(true);
    const [batchOpen, setBatchOpen]                 = useState(true);
    const [mainTab, setMainTab]                     = useState('enrollments');
    const [scopeTab, setScopeTab]                   = useState('institute');
    const [discoverCourses, setDiscoverCourses]     = useState([]);
    const [loadingDiscover, setLoadingDiscover]     = useState(false);
    const [myInstitutes, setMyInstitutes]           = useState([]);
    const [currentInstitute, setCurrentInstitute]  = useState(null);

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
        return !searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.tutorId?.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / COURSES_PER_PAGE));
    const paginatedEnrollments = filteredEnrollments.slice((currentPage - 1) * COURSES_PER_PAGE, currentPage * COURSES_PER_PAGE);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-11 h-11">
                    <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                        style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 animate-pulse" style={{ color: C.btnPrimary }} />
                    </div>
                </div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, opacity: 0.55 }}>
                    Loading your courses…
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 pb-10" style={{ fontFamily: T.fontFamily }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading }}>Courses</h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, opacity: 0.50, marginTop: 2 }}>
                        Manage your learning journey
                    </p>
                </div>
                <div className="flex p-1 gap-1 rounded-2xl" style={{ backgroundColor: C.innerBg }}>
                    {[
                        { id: 'enrollments', label: 'My Enrollments', icon: BookOpen },
                        { id: 'discover',    label: 'Discover',       icon: Sparkles },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setMainTab(tab.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all"
                            style={mainTab === tab.id
                                ? { background: C.gradientBtn, color: '#ffffff', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }
                                : { color: C.text, opacity: 0.65, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">

                {/* ── LEFT: Main content ────────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-5">

                    {/* ENROLLMENTS tab */}
                    {mainTab === 'enrollments' && (
                        <>
                            <div className="flex flex-wrap gap-3">
                                <StatCard icon={FolderOpen} label="Enrolled Courses" value={enrollments.length} />
                                <StatCard icon={FileCheck}  label="Upcoming Exams"   value={upcomingExamsCount} href="/student/upcoming-exams" iconBg="#F59E0B" />
                                <StatCard icon={Video}      label="Live Classes"      value={liveClassesCount}   href="/student/live-classes"   iconBg="#10B981" />
                            </div>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.text, opacity: 0.35 }} />
                                <input type="text" placeholder="Search my courses…"
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl focus:outline-none transition-all"
                                    style={{ backgroundColor: C.cardBg, border: `1.5px solid ${C.cardBorder}`, color: C.heading, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium }}
                                    onFocus={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                            </div>

                            <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.text, opacity: 0.45, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                My Enrollments <span style={{ color: C.btnPrimary, marginLeft: 6 }}>{filteredEnrollments.length} courses</span>
                            </p>

                            {filteredEnrollments.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {paginatedEnrollments.map(enrollment => (
                                            <EnrolledCourseCard key={enrollment._id} enrollment={enrollment} />
                                        ))}
                                    </div>
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 pt-2">
                                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                                                className="px-4 py-2 rounded-xl disabled:opacity-40 transition-colors"
                                                style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                                Previous
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                <button key={p} onClick={() => setCurrentPage(p)}
                                                    className="w-9 h-9 rounded-xl transition-all"
                                                    style={currentPage === p
                                                        ? { background: C.gradientBtn, color: '#ffffff', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }
                                                        : { backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                                    {p}
                                                </button>
                                            ))}
                                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                                                className="px-4 py-2 rounded-xl disabled:opacity-40 transition-colors"
                                                style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="rounded-2xl p-12 text-center"
                                    style={{ backgroundColor: C.cardBg, border: `2px dashed ${C.cardBorder}` }}>
                                    <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: C.btnViewAllBg }} />
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 4 }}>
                                        No enrolled courses
                                    </h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, opacity: 0.45, marginBottom: 16 }}>
                                        Enroll in courses to see them here.
                                    </p>
                                    <Link href="/student/dashboard">
                                        <button className="px-5 py-2.5 text-white rounded-xl"
                                            style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}>
                                            Go to Dashboard
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </>
                    )}

                    {/* DISCOVER tab */}
                    {mainTab === 'discover' && (
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.text, opacity: 0.45, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                    Explore Courses
                                </p>
                                {myInstitutes.length > 0 && (
                                    <div className="flex p-1 gap-1 rounded-xl" style={{ backgroundColor: C.innerBg }}>
                                        {['institute', 'global'].map(s => (
                                            <button key={s} onClick={() => setScopeTab(s)}
                                                className="px-3 py-1.5 rounded-lg capitalize transition-all"
                                                style={scopeTab === s
                                                    ? { background: C.gradientBtn, color: '#ffffff', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }
                                                    : { color: C.text, opacity: 0.65, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                                {s === 'institute' ? 'My Institute' : 'Global'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {loadingDiscover ? (
                                <div className="flex justify-center py-16">
                                    <div className="relative w-10 h-10">
                                        <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
                                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                                    </div>
                                </div>
                            ) : discoverCourses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {discoverCourses.map(course => <DiscoverCourseCard key={course._id} course={course} />)}
                                </div>
                            ) : (
                                <div className="rounded-2xl p-12 text-center"
                                    style={{ backgroundColor: C.cardBg, border: `2px dashed ${C.cardBorder}` }}>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 4 }}>
                                        No courses found
                                    </h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, opacity: 0.45 }}>
                                        Check back later for new {scopeTab === 'institute' ? 'institute' : 'global'} courses.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Sidebar ───────────────────────────────────── */}
                <div className="w-full lg:w-72 shrink-0 space-y-4">

                    <SideCard title="AI Recommendations" icon={Sparkles} open={aiOpen} onToggle={() => setAiOpen(!aiOpen)}>
                        <div className="space-y-2">
                            {aiRecommendations.length > 0 ? aiRecommendations.map((rec, i) => (
                                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl"
                                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: C.btnPrimary }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, lineHeight: T.leading.relaxed }}>{rec}</span>
                                </div>
                            )) : (
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, opacity: 0.40, textAlign: 'center', padding: '12px 0' }}>No recommendations yet.</p>
                            )}
                            <Link href="/student/ai-analytics" className="block mt-1">
                                <button className="w-full py-2.5 text-white rounded-xl flex items-center justify-center gap-1.5"
                                    style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}>
                                    <Sparkles className="w-3.5 h-3.5" /> Start AI Study Plan
                                </button>
                            </Link>
                        </div>
                    </SideCard>

                    <SideCard title="Announcements" icon={Megaphone} iconBg="#F59E0B" open={annOpen} onToggle={() => setAnnOpen(!annOpen)}>
                        <div className="space-y-2">
                            {announcements.length > 0 ? announcements.map(a => (
                                <div key={a.id} className="p-3 rounded-xl"
                                    style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                    <div className="flex items-start gap-2 mb-1">
                                        <Megaphone className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, lineHeight: T.leading.snug }}>
                                            {a.courseTitle}: {a.title}
                                        </span>
                                    </div>
                                    <p className="pl-5 line-clamp-2" style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.text, opacity: 0.55 }}>{a.message}</p>
                                </div>
                            )) : (
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, opacity: 0.40, textAlign: 'center', padding: '12px 0' }}>No recent announcements.</p>
                            )}
                        </div>
                    </SideCard>

                    <SideCard title="Batch Details" icon={GraduationCap} iconBg={C.chartLine} open={batchOpen} onToggle={() => setBatchOpen(!batchOpen)}>
                        <div className="space-y-1">
                            {batches.length > 0 ? batches.slice(0, 5).map(batch => {
                                const courseId = batch.courseId?._id || batch.courseId;
                                const courseName = batch.courseId?.title || batch.name || 'Course';
                                const instructorName = batch.tutorId?.userId?.name || 'Instructor';
                                const enrollment = enrollments.find(e => (e.courseId?._id ?? e.courseId)?.toString() === courseId?.toString());
                                const pct = enrollment?.progress?.percentage ?? 0;
                                return (
                                    <Link key={batch._id} href={courseId ? `/student/courses/${courseId}` : '#'}
                                        className="flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors"
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: C.btnViewAllBg, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.btnPrimary }}>
                                            {instructorName[0]?.toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>{courseName}</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.text, opacity: 0.50 }}>{pct}% · {instructorName}</p>
                                        </div>
                                    </Link>
                                );
                            }) : (
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, opacity: 0.40, textAlign: 'center', padding: '12px 0' }}>No batches yet.</p>
                            )}
                        </div>
                    </SideCard>
                </div>
            </div>
        </div>
    );
}