'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    PlayCircle, CheckCircle, Lock, Clock, Star, FileQuestion, Award, Users,
    Download, MessageSquare, ThumbsUp, ChevronDown, Edit3, Trash2,
    Zap, Target, Calendar, X, Sparkles, Trophy, Globe,
    ShieldAlert, Eye, ClipboardList, Brain, FileText, Loader2,
    ChevronLeft, ChevronRight, BarChart2,
    AlertCircle, Play, SkipForward, Bot
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import LessonPlayerModal from '@/components/LessonPlayerModal';
import ExamHistoryModal from '@/components/ExamHistoryModal';
import ExamResultModal from '@/components/ExamResultModal';
import { ReportAbuseModal } from '@/components/shared/ReportAbuseModal';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import Link from 'next/link';
import AiTutorWidget from '@/components/AiTutorWidget';
import { C, T, S } from '@/constants/studentTokens';

// gradient shorthand
const GS = { background: C.gradientBtn };

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const cfg = {
        completed:     { label: 'Completed',   bg: C.successBg,              color: C.success,    border: C.successBorder },
        'in-progress': { label: 'In Progress', bg: C.innerBg,                color: C.btnPrimary, border: C.cardBorder },
        locked:        { label: 'Locked',      bg: 'rgba(100,116,139,0.08)', color: '#64748B',    border: 'rgba(100,116,139,0.15)' },
        pending:       { label: 'Pending',     bg: C.warningBg,              color: C.warning,    border: C.warningBorder },
    };
    const c = cfg[status] || cfg.pending;
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>
            {status === 'completed'   && <CheckCircle className="w-3 h-3" />}
            {status === 'in-progress' && <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: C.btnPrimary }} />}
            {status === 'locked'      && <Lock className="w-3 h-3" />}
            {c.label}
        </span>
    );
}

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircularProgress({ pct, completed, total, size = 120 }) {
    const r = 48, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={r} fill="none" stroke={C.innerBg} strokeWidth="8" />
                    <circle cx="60" cy="60" r={r} fill="none" stroke="url(#pg)" strokeWidth="8"
                        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                        transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                    <defs>
                        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={C.btnPrimary} />
                            <stop offset="100%" stopColor={C.chartLine} />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>{pct}%</span>
                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: C.text, opacity: 0.45 }}>Done</span>
                </div>
            </div>
            <div className="text-center">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.text }}>{completed}/{total}</p>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, opacity: 0.45 }}>Lessons Completed</p>
            </div>
        </div>
    );
}

// ─── Quiz Score Row ───────────────────────────────────────────────────────────
function QuizScoreRow({ title, score }) {
    const color = score >= 80 ? C.success : score >= 60 ? C.warning : C.danger;
    return (
        <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: C.innerBg }}>
                <FileQuestion className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>{title}</p>
                <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.innerBg }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
                </div>
            </div>
            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.heading, flexShrink: 0 }}>{score}%</span>
        </div>
    );
}

// ─── Gradient Button ──────────────────────────────────────────────────────────
function DBtn({ children, onClick, disabled, className = '', type = 'button', style: extra = {} }) {
    return (
        <button type={type} onClick={onClick} disabled={disabled}
            className={`text-white rounded-2xl transition-all hover:opacity-90 disabled:opacity-50 ${className}`}
            style={{ ...GS, fontFamily: T.fontFamily, fontWeight: T.weight.black, ...extra }}>
            {children}
        </button>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CourseDetailPage({ params }) {
    const router = useRouter();
    const { id } = use(params);

    const [course, setCourse]                     = useState(null);
    const [lessons, setLessons]                   = useState([]);
    const [exams, setExams]                       = useState([]);
    const [reviews, setReviews]                   = useState([]);
    const [myReview, setMyReview]                 = useState(null);
    const [ratingDistribution, setRatingDistribution] = useState([]);
    const [isEnrolled, setIsEnrolled]             = useState(false);
    const [isInstructor, setIsInstructor]         = useState(false);
    const [loading, setLoading]                   = useState(true);
    const [enrolling, setEnrolling]               = useState(false);
    const [activeTab, setActiveTab]               = useState('overview');
    const [courseProgress, setCourseProgress]     = useState(null);
    const [enrollment, setEnrollment]             = useState(null);
    const [quizScores, setQuizScores]             = useState([]);
    const [sortBy, setSortBy]                     = useState('recent');
    const [expandedModules, setExpandedModules]   = useState([]);
    const [liveClasses, setLiveClasses]           = useState([]);
    const [assignments, setAssignments]           = useState([]);
    const [showReviewModal, setShowReviewModal]   = useState(false);
    const [reviewForm, setReviewForm]             = useState({ rating: 0, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [currentPage, setCurrentPage]           = useState(1);
    const [hasMoreReviews, setHasMoreReviews]     = useState(true);
    const [loadingReviews, setLoadingReviews]     = useState(false);
    const [isWishlisted, setIsWishlisted]         = useState(false);
    const [wishlistLoading, setWishlistLoading]   = useState(false);
    const [showExamHistoryModal, setShowExamHistoryModal] = useState(false);
    const [showLessonPlayerModal, setShowLessonPlayerModal] = useState(false);
    const [selectedExam, setSelectedExam]         = useState(null);
    const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
    const [showResultModal, setShowResultModal]   = useState(false);
    const [selectedResult, setSelectedResult]     = useState(null);
    const [showReportModal, setShowReportModal]   = useState(false);
    const [lessonPage, setLessonPage]             = useState(1);
    const [aiWidgetOpen, setAiWidgetOpen]         = useState(false);
    const LESSONS_PER_PAGE = 6;
    const { confirmDialog } = useConfirm();
    const [aiLoading, setAiLoading]   = useState(null);
    const [aiResult, setAiResult]     = useState(null);
    const [showAiPanel, setShowAiPanel] = useState(false);

    useEffect(() => { loadCourseData(); checkWishlistStatus(); }, [id]);
    useEffect(() => { if (activeTab === 'discussions') loadReviews(); }, [activeTab, sortBy]);

    const loadCourseData = async (background = false) => {
        try {
            if (!background) setLoading(true);
            const response = await api.get(`/courses/${id}`);
            if (response.data.success) {
                const courseData = response.data.course;
                let lessonsData = response.data.lessons || [];
                if (courseData.modules?.length > 0) {
                    let sorted = [];
                    const getModId = (l) => (l.moduleId?._id || l.moduleId || '').toString();
                    const byModule = {};
                    lessonsData.forEach(l => { const mid = getModId(l); if (!byModule[mid]) byModule[mid] = []; byModule[mid].push(l); });
                    courseData.modules.forEach(m => {
                        const mid = m._id.toString();
                        if (byModule[mid]) { sorted = [...sorted, ...byModule[mid].sort((a, b) => (a.order || 0) - (b.order || 0))]; delete byModule[mid]; }
                    });
                    Object.keys(byModule).forEach(k => { sorted = [...sorted, ...byModule[k].sort((a, b) => (a.order || 0) - (b.order || 0))]; });
                    lessonsData = sorted;
                } else { lessonsData.sort((a, b) => (a.order || 0) - (b.order || 0)); }
                setCourse(courseData); setLessons(lessonsData);
                setIsEnrolled(response.data.isEnrolled || false);
                setEnrollment(response.data.enrollment || null);
                setIsInstructor(response.data.isInstructor || false);
                const moduleIds = courseData.modules?.map(m => m._id) || [];
                setExpandedModules(prev => prev.length ? prev : moduleIds);
            }
            if ((response.data.isEnrolled || response.data.isInstructor) && !background) {
                const [examRes, liveClassRes, assignmentRes, progressRes] = await Promise.all([
                    api.get(`/exams/course/${id}`),
                    api.get(`/live-classes?courseId=${id}`),
                    assignmentService.getCourseAssignments(id).catch(() => ({ success: false })),
                    api.get(`/progress/course/${id}`).catch(() => ({ data: {} })),
                ]);
                if (examRes.data.success) setExams(examRes.data.exams || []);
                if (liveClassRes.data.success) setLiveClasses(liveClassRes.data.liveClasses || []);
                if (assignmentRes.success) setAssignments(assignmentRes.assignments || []);
                if (progressRes.data?.progress) setCourseProgress(progressRes.data);
                const quizPromises = (response.data.lessons || []).slice(0, 10).map(l =>
                    api.get(`/quiz/attempts/${l._id}`)
                        .then(r => ({ lessonId: l._id, lessonTitle: l.title, attempts: r.data?.attempts || [] }))
                        .catch(() => ({ lessonId: l._id, lessonTitle: l.title, attempts: [] }))
                );
                const quizResults = await Promise.all(quizPromises);
                setQuizScores(quizResults.filter(q => q.attempts.length > 0).map(q => ({
                    title: q.lessonTitle?.slice(0, 28) || 'Quiz',
                    score: Math.round((q.attempts[0].score ?? 0) / (q.attempts[0].totalQuestions || 1) * 100) || 0,
                })).slice(0, 5));
            }
        } catch (error) {
            console.error('Error loading course:', error);
            if (error.response?.status === 403 && error.response?.data?.message?.includes('Tutors can only preview')) {
                toast.error(error.response.data.message); router.push('/tutor/dashboard');
            }
        } finally { if (!background) setLoading(false); }
    };

    const loadReviews = async (loadMore = false) => {
        if (loadingReviews) return;
        try {
            setLoadingReviews(true);
            if (!myReview && isEnrolled) {
                try { const r = await api.get(`/reviews/my-review/${id}`); if (r.data.success && r.data.review) setMyReview(r.data.review); } catch (_) { }
            }
            const page = loadMore ? currentPage + 1 : 1;
            const response = await api.get(`/reviews/course/${id}`, { params: { page, limit: 10, sortBy } });
            if (response.data.success) {
                if (loadMore) setReviews(prev => [...prev, ...response.data.reviews]);
                else { setReviews(response.data.reviews); setRatingDistribution(response.data.ratingDistribution || []); }
                setHasMoreReviews(response.data.pagination?.hasMore || false);
                setCurrentPage(page);
            }
        } catch (e) { console.error(e); } finally { setLoadingReviews(false); }
    };

    const checkWishlistStatus = async () => { try { const { data } = await api.get(`/wishlist/${id}/status`); setIsWishlisted(data.inWishlist); } catch (_) { } };
    const toggleWishlist = async () => {
        try {
            setWishlistLoading(true);
            if (isWishlisted) { await api.delete(`/wishlist/${id}`); setIsWishlisted(false); }
            else { await api.post('/wishlist', { courseId: id }); setIsWishlisted(true); }
        } catch (_) { } finally { setWishlistLoading(false); }
    };
    const handleEnroll = async () => {
        if (Boolean(course && !course.isFree && Number(course.price || 0) > 0)) { router.push(`/student/checkout/${id}`); return; }
        try {
            setEnrolling(true);
            const response = await api.post('/enrollments', { courseId: id });
            if (response.data.success) { setIsEnrolled(true); loadCourseData(); }
        } catch (e) {
            if (e.response?.status === 402 || e.response?.data?.requiresPayment) { toast('Redirecting to checkout…', { icon: '💳' }); router.push(`/student/checkout/${id}`); return; }
            toast.error(e.response?.data?.message || 'Failed to enroll');
        } finally { setEnrolling(false); }
    };
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (reviewForm.rating === 0) { toast.error('Please select a rating'); return; }
        if (reviewForm.comment.trim().length < 10) { toast.error('Review must be at least 10 characters'); return; }
        try {
            setSubmittingReview(true);
            if (myReview) await api.put(`/reviews/${myReview._id}`, { rating: reviewForm.rating, comment: reviewForm.comment });
            else await api.post('/reviews', { courseId: id, rating: reviewForm.rating, comment: reviewForm.comment });
            setShowReviewModal(false); setMyReview(null); loadReviews(); setReviewForm({ rating: 0, comment: '' });
        } catch (e) { toast.error(e.response?.data?.message || 'Failed to submit review'); }
        finally { setSubmittingReview(false); }
    };
    const handleDeleteReview = async () => {
        const ok = await confirmDialog("Delete Review", "Delete your review?", { variant: 'destructive' });
        if (!ok) return;
        try { await api.delete(`/reviews/${myReview._id}`); setMyReview(null); loadReviews(); toast.success("Review deleted"); }
        catch (_) { toast.error('Failed to delete review'); }
    };
    const toggleHelpful      = async (reviewId) => { try { await api.post(`/reviews/${reviewId}/helpful`); loadReviews(); } catch (_) { } };
    const toggleModule        = (moduleId) => setExpandedModules(prev => prev.includes(moduleId) ? prev.filter(i => i !== moduleId) : [...prev, moduleId]);
    const getLessonsByModule  = (moduleId) => lessons.filter(l => (l.moduleId?._id || l.moduleId)?.toString() === moduleId?.toString()).sort((a, b) => (a.order || 0) - (b.order || 0));
    const isLessonLocked      = (lesson) => !isInstructor && !isEnrolled && !lesson.isFree;
    const handleLessonClick   = (lesson) => {
        if (isLessonLocked(lesson)) { toast.error('Enroll to access this lesson'); return; }
        setSelectedLessonIndex(lessons.findIndex(l => l._id === lesson._id));
        setShowLessonPlayerModal(true);
    };
    const handleExamClick     = (exam) => { setSelectedExam(exam); setShowExamHistoryModal(true); };
    const handleStartExam     = () => { if (selectedExam) { setShowExamHistoryModal(false); router.push(`/student/exams/${selectedExam._id}`); } };
    const handleLessonComplete = async () => { await loadCourseData(true); };
    const handleAISummarize   = async () => {
        if (!course) return; setAiLoading('summarize'); setShowAiPanel(true);
        try { const res = await api.post('/ai/summarize-lesson', { courseId: course._id, lessonTitle: course.title, content: course.description }); setAiResult({ type: 'AI Summary', content: res.data.summary || res.data.data }); }
        catch (e) { toast.error(e.response?.data?.message || 'Failed'); setShowAiPanel(false); } finally { setAiLoading(null); }
    };
    const handleAIRevisionNotes = async () => {
        if (!course) return; setAiLoading('revision'); setShowAiPanel(true);
        try { const res = await api.post('/ai/revision-notes', { courseId: course._id, lessonTitle: course.title, content: course.description }); setAiResult({ type: 'Revision Notes', content: res.data.notes || res.data.data }); }
        catch (e) { toast.error(e.response?.data?.message || 'Failed'); setShowAiPanel(false); } finally { setAiLoading(null); }
    };

    // Derived
    const completedIds     = (courseProgress?.progress || []).filter(p => p.completed).map(p => p.lessonId?.toString());
    const completedCount   = completedIds.length;
    const totalLessons     = lessons.length;
    const totalDuration    = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
    const pct              = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
    const currentLesson    = lessons[selectedLessonIndex] || lessons[0];
    const nextLesson       = lessons[(selectedLessonIndex + 1 < totalLessons) ? selectedLessonIndex + 1 : -1];
    const isCourseSuspended = course && (course.status !== 'published' || !course?.tutorId?.isVerified || course?.tutorId?.userId?.isBlocked);
    const pagedLessons     = lessons.slice((lessonPage - 1) * LESSONS_PER_PAGE, lessonPage * LESSONS_PER_PAGE);
    const totalLessonPages = Math.ceil(totalLessons / LESSONS_PER_PAGE);
    const resumeToFirst    = () => { const idx = lessons.findIndex(l => !completedIds.includes(l._id?.toString())); setSelectedLessonIndex(idx >= 0 ? idx : 0); setShowLessonPlayerModal(true); };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                        style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 animate-pulse" style={{ color: C.btnPrimary }} />
                    </div>
                </div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, opacity: 0.55 }}>Loading course…</p>
            </div>
        </div>
    );

    if (!course) return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: C.dangerBg }}>
                    <X className="w-8 h-8" style={{ color: C.danger }} />
                </div>
                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, marginBottom: 12 }}>Course Not Found</h2>
                <button onClick={() => router.back()}
                    className="px-4 py-2 rounded-2xl transition-colors"
                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.text, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                    Go Back
                </button>
            </div>
        </div>
    );

    const tabs = ['overview', 'lessons', 'assignments', 'discussions', 'resources'];

    return (
        <div className="min-h-screen" style={{ fontFamily: T.fontFamily }}>

            {/* Instructor Preview Banner */}
            {isInstructor && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2.5 flex items-center justify-center gap-2 shadow-sm"
                    style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                    <Eye className="w-3.5 h-3.5 shrink-0" /> Preview Mode — Videos &amp; content are fully unlocked for you.
                </div>
            )}

            {/* ── Sticky Header ──────────────────────────────────────────── */}
            <div className="sticky top-0 z-30 shadow-sm"
                style={{ backgroundColor: C.surfaceWhite, borderBottom: `1px solid ${C.cardBorder}` }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between gap-3 pt-3.5 pb-0">
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>
                                {course.title}
                            </h1>
                            {enrollment?.batchId && (
                                <p className="flex items-center gap-1 mt-0.5"
                                    style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.btnPrimary }}>
                                    <Users className="w-3 h-3" /> Cohort: {enrollment.batchId.name}
                                </p>
                            )}
                        </div>
                        {(isEnrolled || isInstructor) && (
                            <button onClick={resumeToFirst}
                                className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-white rounded-2xl transition-all hover:opacity-90 shadow-sm"
                                style={{ ...GS, fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black }}>
                                <Play className="w-3 h-3 fill-white" /> Resume
                            </button>
                        )}
                    </div>
                    <div className="flex gap-0 overflow-x-auto mt-3 -mb-px">
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className="px-4 py-3 whitespace-nowrap border-b-2 transition-all"
                                style={activeTab === tab
                                    ? { borderBottomColor: C.btnPrimary, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wide }
                                    : { borderBottomColor: 'transparent', color: C.text, opacity: 0.45, fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Suspended Banner */}
            {isCourseSuspended && isEnrolled && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
                    <div className="p-4 rounded-2xl flex items-start gap-3"
                        style={{ backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}` }}>
                        <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" style={{ color: C.warning }} />
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#92400E' }}>Course Suspended</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#92400E', opacity: 0.75, marginTop: 2 }}>This course is no longer publicly available. You retain full access as an enrolled student.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Grid ──────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
                <div className="grid lg:grid-cols-3 gap-5">

                    {/* LEFT: 2 cols */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* ══ OVERVIEW ═══════════════════════════════════════ */}
                        {activeTab === 'overview' && (
                            <div className="rounded-2xl overflow-hidden"
                                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                {/* Progress Hero */}
                                {(isEnrolled || isInstructor) && (
                                    <div className="p-5 relative overflow-hidden" style={GS}>
                                        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '16px 16px' }} />
                                        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-14 h-14 shrink-0">
                                                    <svg width="56" height="56" viewBox="0 0 56 56">
                                                        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="5" />
                                                        <circle cx="28" cy="28" r="22" fill="none" stroke="white" strokeWidth="5"
                                                            strokeDasharray={`${(pct / 100) * 138.2} 138.2`} strokeLinecap="round" transform="rotate(-90 28 28)" />
                                                    </svg>
                                                    <span className="absolute inset-0 flex items-center justify-center text-white"
                                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}>{pct}%</span>
                                                </div>
                                                <div>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: 'rgba(255,255,255,0.55)' }}>
                                                        Current Lesson
                                                    </p>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#ffffff', lineHeight: T.leading.tight, marginTop: 2 }}>
                                                        {currentLesson?.title || 'Start Learning'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        <img src={course.tutorId?.userId?.profileImage || '/default-avatar.svg'} className="w-5 h-5 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.30)' }} alt="" />
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>{course.tutorId?.userId?.name}</span>
                                                        <span style={{ color: 'rgba(255,255,255,0.40)' }}>·</span>
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>{completedCount}/{totalLessons} done</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={resumeToFirst}
                                                className="px-5 py-2.5 bg-white rounded-2xl shadow-md flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                                                style={{ color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}>
                                                <Play className="w-3.5 h-3.5 fill-current" /> Resume Course
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 space-y-7">
                                    {/* What you'll learn */}
                                    {course.whatYouWillLearn?.length > 0 && (
                                        <div>
                                            <h3 className="flex items-center gap-2 mb-3"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>
                                                <span className="p-1.5 rounded-xl" style={{ backgroundColor: C.warningBg }}>
                                                    <Zap className="w-4 h-4" style={{ color: C.warning }} />
                                                </span>
                                                What You'll Learn
                                            </h3>
                                            <div className="grid sm:grid-cols-2 gap-2">
                                                {course.whatYouWillLearn.map((item, i) => (
                                                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-2xl"
                                                        style={{ backgroundColor: C.successBg, border: `1px solid ${C.successBorder}` }}>
                                                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.success }} />
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text }}>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* About */}
                                    <div>
                                        <h3 className="flex items-center gap-2 mb-3"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>
                                            <span className="p-1.5 rounded-xl" style={{ backgroundColor: 'rgba(59,130,246,0.08)' }}>
                                                <Target className="w-4 h-4" style={{ color: '#3B82F6' }} />
                                            </span>
                                            About This Course
                                        </h3>
                                        <p className="leading-relaxed whitespace-pre-line"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, lineHeight: T.leading.relaxed }}>
                                            {course.description}
                                        </p>
                                    </div>

                                    {/* Requirements */}
                                    {course.requirements?.length > 0 && (
                                        <div>
                                            <h3 className="mb-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>Requirements</h3>
                                            <ul className="space-y-2">
                                                {course.requirements.map((req, i) => (
                                                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl"
                                                        style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: C.btnPrimary }} />{req}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* AI Tools */}
                                    {isEnrolled && (
                                        <div className="pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                            <h3 className="mb-3 flex items-center gap-2"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wide, color: C.heading }}>
                                                <Brain className="w-4 h-4" style={{ color: C.btnPrimary }} /> AI Study Tools
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                <button onClick={handleAISummarize} disabled={aiLoading === 'summarize'}
                                                    className="flex items-center gap-2 px-4 py-2 text-white rounded-2xl hover:opacity-90 disabled:opacity-60 transition-all"
                                                    style={{ ...GS, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}>
                                                    {aiLoading === 'summarize' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                    Summarize Course
                                                </button>
                                                <button onClick={handleAIRevisionNotes} disabled={aiLoading === 'revision'}
                                                    className="flex items-center gap-2 px-4 py-2 text-white rounded-2xl hover:opacity-90 disabled:opacity-60 transition-all"
                                                    style={{ background: 'linear-gradient(135deg,#059669,#0d9488)', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}>
                                                    {aiLoading === 'revision' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                                                    Generate Revision Notes
                                                </button>
                                            </div>
                                            {showAiPanel && (
                                                <div className="mt-4 rounded-2xl p-5" style={{ backgroundColor: C.darkCard, border: `1px solid ${C.cardBorder}` }}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="flex items-center gap-2 text-white"
                                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}>
                                                            <Brain className="w-3.5 h-3.5" />{aiResult?.type || 'Generating…'}
                                                        </h4>
                                                        <button onClick={() => setShowAiPanel(false)}><X className="w-4 h-4 text-white/50" /></button>
                                                    </div>
                                                    {aiLoading ? (
                                                        <div className="flex items-center gap-3 py-6 justify-center">
                                                            <Loader2 className="w-5 h-5 animate-spin" style={{ color: C.btnPrimary }} />
                                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.70)' }}>AI is thinking…</span>
                                                        </div>
                                                    ) : (
                                                        <div className="prose prose-sm max-w-none whitespace-pre-wrap"
                                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'rgba(255,255,255,0.80)' }}>
                                                            {aiResult?.content}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ══ LESSONS ════════════════════════════════════════ */}
                        {activeTab === 'lessons' && (
                            <div className="space-y-4">
                                {(isEnrolled || isInstructor) && (
                                    <div className="rounded-2xl p-4"
                                        style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 shrink-0">
                                                    <svg width="40" height="40" viewBox="0 0 48 48">
                                                        <circle cx="24" cy="24" r="19" fill="none" stroke={C.innerBg} strokeWidth="4" />
                                                        <circle cx="24" cy="24" r="19" fill="none" stroke={C.btnPrimary} strokeWidth="4"
                                                            strokeDasharray={`${(pct / 100) * 119.4} 119.4`} strokeLinecap="round" transform="rotate(-90 24 24)" />
                                                    </svg>
                                                    <span className="absolute inset-0 flex items-center justify-center"
                                                        style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black, color: C.btnPrimary }}>{pct}%</span>
                                                </div>
                                                <div>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>
                                                        {currentLesson?.title || 'No lesson selected'}
                                                    </p>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: C.text, opacity: 0.45, marginTop: 2 }}>
                                                        {completedCount}/{totalLessons} Lessons Done
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowLessonPlayerModal(true)}
                                                className="px-4 py-2.5 text-white rounded-2xl flex items-center gap-1.5 hover:opacity-90 transition-all"
                                                style={{ ...GS, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}>
                                                <Play className="w-3 h-3 fill-white" /> Resume
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-2xl overflow-hidden"
                                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                    <div className="p-5">
                                        {(() => {
                                            const modules = course.modules || [];
                                            if (modules.length === 0) return (
                                                <>
                                                    <div className="space-y-2">
                                                        {pagedLessons.map((lesson, idx) => {
                                                            const gIdx = (lessonPage - 1) * LESSONS_PER_PAGE + idx;
                                                            const locked = isLessonLocked(lesson);
                                                            const isDone = completedIds.includes(lesson._id?.toString());
                                                            const isAct = lesson._id === currentLesson?._id;
                                                            const status = locked ? 'locked' : isDone ? 'completed' : isAct ? 'in-progress' : 'pending';
                                                            return (
                                                                <div key={lesson._id} onClick={() => !locked && handleLessonClick(lesson)}
                                                                    className="flex items-center gap-3 p-3.5 rounded-2xl transition-all"
                                                                    style={locked
                                                                        ? { opacity: 0.60, cursor: 'not-allowed', backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }
                                                                        : isAct
                                                                            ? { backgroundColor: C.btnViewAllBg, border: `2px solid ${C.btnPrimary}`, cursor: 'pointer' }
                                                                            : { backgroundColor: C.surfaceWhite, border: `2px solid ${C.cardBorder}`, cursor: 'pointer' }}
                                                                    onMouseEnter={e => { if (!locked && !isAct) e.currentTarget.style.borderColor = C.btnPrimary; }}
                                                                    onMouseLeave={e => { if (!locked && !isAct) e.currentTarget.style.borderColor = C.cardBorder; }}>
                                                                    {isAct && <div className="w-1 h-10 rounded-full shrink-0" style={GS} />}
                                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                                                        style={{ backgroundColor: isDone ? C.successBg : isAct ? C.innerBg : C.cardBg }}>
                                                                        {isDone ? <CheckCircle className="w-4 h-4" style={{ color: C.success }} />
                                                                            : lesson.type === 'video' ? <PlayCircle className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                                                                : lesson.type === 'quiz' ? <FileQuestion className="w-4 h-4" style={{ color: C.warning }} />
                                                                                    : <FileText className="w-4 h-4" style={{ color: C.text, opacity: 0.4 }} />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="truncate"
                                                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: isAct ? C.btnPrimary : C.heading }}>
                                                                            {gIdx + 1}. {lesson.title}
                                                                        </p>
                                                                        {lesson.duration > 0 && (
                                                                            <p className="flex items-center gap-1 mt-0.5"
                                                                                style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.medium, color: C.text, opacity: 0.45 }}>
                                                                                <Clock className="w-3 h-3" />{Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="shrink-0 flex items-center gap-2">
                                                                        <StatusBadge status={status} />
                                                                        {!locked && (
                                                                            <button onClick={e => { e.stopPropagation(); handleLessonClick(lesson); }}
                                                                                className="px-3 py-1.5 text-white rounded-xl hover:opacity-90 flex items-center gap-1 transition-all"
                                                                                style={{ ...GS, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black }}>
                                                                                {isDone ? <><SkipForward className="w-3 h-3" />Resume</> : <><Play className="w-3 h-3 fill-white" />Play</>}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {totalLessonPages > 1 && (
                                                        <div className="flex items-center justify-center gap-2 mt-5 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                                            <button onClick={() => setLessonPage(p => Math.max(1, p - 1))} disabled={lessonPage === 1}
                                                                className="p-2 rounded-xl disabled:opacity-40 transition-colors"
                                                                style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.surfaceWhite }}>
                                                                <ChevronLeft className="w-4 h-4" style={{ color: C.text }} />
                                                            </button>
                                                            {Array.from({ length: totalLessonPages }, (_, i) => i + 1).map(pg => (
                                                                <button key={pg} onClick={() => setLessonPage(pg)}
                                                                    className="w-8 h-8 rounded-xl transition-all"
                                                                    style={lessonPage === pg
                                                                        ? { ...GS, color: '#ffffff', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }
                                                                        : { border: `1px solid ${C.cardBorder}`, color: C.text, backgroundColor: C.surfaceWhite, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                                                    {pg}
                                                                </button>
                                                            ))}
                                                            <button onClick={() => setLessonPage(p => Math.min(totalLessonPages, p + 1))} disabled={lessonPage === totalLessonPages}
                                                                className="p-2 rounded-xl disabled:opacity-40"
                                                                style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.surfaceWhite }}>
                                                                <ChevronRight className="w-4 h-4" style={{ color: C.text }} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                            return (
                                                <div className="space-y-3">
                                                    {modules.map(module => {
                                                        const mLessons = getLessonsByModule(module._id);
                                                        const mDone = mLessons.filter(l => completedIds.includes(l._id?.toString())).length;
                                                        const isExp = expandedModules.includes(module._id);
                                                        return (
                                                            <div key={module._id} className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${C.cardBorder}` }}>
                                                                <button onClick={() => toggleModule(module._id)}
                                                                    className="w-full flex items-center justify-between p-4 transition-colors"
                                                                    style={{ backgroundColor: C.innerBg }}
                                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}>
                                                                    <div className="flex items-center gap-3">
                                                                        <ChevronDown className={`w-4 h-4 transition-transform ${isExp ? '' : '-rotate-90'}`} style={{ color: C.text, opacity: 0.45 }} />
                                                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{module.title}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.text, opacity: 0.45 }}>{mDone}/{mLessons.length}</span>
                                                                        {mDone === mLessons.length && mLessons.length > 0 && <CheckCircle className="w-4 h-4" style={{ color: C.success }} />}
                                                                    </div>
                                                                </button>
                                                                {isExp && (
                                                                    <div>
                                                                        {mLessons.map((lesson, li) => {
                                                                            const locked = isLessonLocked(lesson);
                                                                            const isDone = completedIds.includes(lesson._id?.toString());
                                                                            const isAct = lesson._id === currentLesson?._id;
                                                                            const status = locked ? 'locked' : isDone ? 'completed' : isAct ? 'in-progress' : 'pending';
                                                                            return (
                                                                                <div key={lesson._id} onClick={() => !locked && handleLessonClick(lesson)}
                                                                                    className="flex items-center gap-3 px-5 py-3 transition-all"
                                                                                    style={{
                                                                                        borderTop: li > 0 ? `1px solid ${C.cardBorder}` : 'none',
                                                                                        opacity: locked ? 0.60 : 1,
                                                                                        cursor: locked ? 'not-allowed' : 'pointer',
                                                                                        backgroundColor: isAct ? C.btnViewAllBg : 'transparent',
                                                                                    }}
                                                                                    onMouseEnter={e => { if (!locked && !isAct) e.currentTarget.style.backgroundColor = C.innerBg; }}
                                                                                    onMouseLeave={e => { if (!locked && !isAct) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                                                                        style={{ backgroundColor: isDone ? C.successBg : C.innerBg }}>
                                                                                        {isDone ? <CheckCircle className="w-3.5 h-3.5" style={{ color: C.success }} />
                                                                                            : lesson.type === 'video' ? <PlayCircle className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                                                                                                : lesson.type === 'quiz' ? <FileQuestion className="w-3.5 h-3.5" style={{ color: C.warning }} />
                                                                                                    : <FileText className="w-3.5 h-3.5" style={{ color: C.text, opacity: 0.4 }} />}
                                                                                    </div>
                                                                                    <span className="flex-1 truncate"
                                                                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: isAct ? T.weight.bold : T.weight.medium, color: isAct ? C.btnPrimary : C.text }}>
                                                                                        {lesson.title}
                                                                                    </span>
                                                                                    <StatusBadge status={status} />
                                                                                    {!locked && (
                                                                                        <button onClick={e => { e.stopPropagation(); handleLessonClick(lesson); }}
                                                                                            className="px-3 py-1 text-white rounded-xl hover:opacity-90 flex items-center gap-1"
                                                                                            style={{ ...GS, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black }}>
                                                                                            <Play className="w-3 h-3 fill-white" /> Play
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Video Preview */}
                                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                    <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                                        {currentLesson ? (
                                            <>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <button onClick={() => setShowLessonPlayerModal(true)} className="relative z-10">
                                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50 hover:scale-110 transition-transform">
                                                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                                                    </div>
                                                </button>
                                                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-10">
                                                    <p className="text-white truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black }}>{currentLesson.title}</p>
                                                    {completedIds.includes(currentLesson._id?.toString()) && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 text-white rounded-full"
                                                            style={{ backgroundColor: 'rgba(16,185,129,0.90)', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black }}>
                                                            <CheckCircle className="w-3 h-3" /> Completed
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        ) : <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.35 }}>Select a lesson to preview</span>}
                                    </div>
                                    {nextLesson && (
                                        <div className="flex items-center gap-4 p-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                            <div className="w-14 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: C.innerBg }}>
                                                <PlayCircle className="w-5 h-5" style={{ color: C.text, opacity: 0.25 }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: C.text, opacity: 0.40 }}>
                                                    Upcoming
                                                </p>
                                                <p className="truncate mt-0.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>
                                                    {nextLesson.title}
                                                </p>
                                            </div>
                                            <button onClick={() => { setSelectedLessonIndex(lessons.findIndex(l => l._id === nextLesson._id)); setShowLessonPlayerModal(true); }}
                                                className="px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0 transition-colors"
                                                style={{ border: `1.5px solid ${C.cardBorder}`, color: C.btnPrimary, backgroundColor: C.innerBg, fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black }}
                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}>
                                                <Play className="w-3 h-3 fill-current" /> Play
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ══ ASSIGNMENTS ════════════════════════════════════ */}
                        {activeTab === 'assignments' && (
                            <div className="rounded-2xl p-6 space-y-4"
                                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>Assignments</h3>
                                {(!isEnrolled && !isInstructor) ? (
                                    <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: C.innerBg, border: `2px dashed ${C.cardBorder}` }}>
                                        <Lock className="w-10 h-10 mx-auto mb-3" style={{ color: C.text, opacity: 0.25 }} />
                                        <p className="mb-4" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.text, opacity: 0.55 }}>Enroll to access assignments</p>
                                        <DBtn onClick={handleEnroll} className="px-5 py-2.5 text-xs">Enroll Now</DBtn>
                                    </div>
                                ) : assignments.length > 0 ? assignments.map(assignment => {
                                    const sub = assignment.mySubmission;
                                    const isGraded = sub?.status === 'graded';
                                    const isSubmitted = sub?.status === 'submitted';
                                    return (
                                        <div key={assignment._id} onClick={() => router.push(`/student/courses/${id}/assignments/${assignment._id}`)}
                                            className="flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer"
                                            style={{ border: `2px solid ${C.cardBorder}` }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.boxShadow = S.active; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}>
                                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0"
                                                style={{ backgroundColor: isGraded ? C.success : isSubmitted ? C.warning : C.btnPrimary }}>
                                                <ClipboardList className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{assignment.title}</h4>
                                                    {isGraded
                                                        ? <span className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black }}>{sub.grade}/{assignment.totalMarks}</span>
                                                        : isSubmitted
                                                            ? <span className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: C.warningBg, color: C.warning, border: `1px solid ${C.warningBorder}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black }}>Submitted</span>
                                                            : <span className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: C.innerBg, color: C.text, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black }}>Pending</span>}
                                                </div>
                                                <div className="flex items-center gap-4" style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: C.text, opacity: 0.45 }}>
                                                    {assignment.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due {new Date(assignment.dueDate).toLocaleDateString()}</span>}
                                                    <span className="flex items-center gap-1"><Award className="w-3 h-3" style={{ color: C.btnPrimary, opacity: 0.70 }} />{assignment.totalMarks} pts</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: C.innerBg, border: `2px dashed ${C.cardBorder}` }}>
                                        <ClipboardList className="w-10 h-10 mx-auto mb-3" style={{ color: C.text, opacity: 0.20 }} />
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, opacity: 0.40 }}>No assignments yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ DISCUSSIONS ════════════════════════════════════ */}
                        {activeTab === 'discussions' && (
                            <div className="rounded-2xl p-6 space-y-6"
                                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                {/* Rating hero */}
                                <div className="flex items-start gap-6 p-5 rounded-2xl relative overflow-hidden" style={GS}>
                                    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '16px 16px' }} />
                                    <div className="relative text-center shrink-0">
                                        <div style={{ fontFamily: T.fontFamily, fontSize: '48px', fontWeight: T.weight.black, color: '#ffffff', marginBottom: 4 }}>{course.rating?.toFixed(1)}</div>
                                        <div className="flex gap-0.5 justify-center mb-1">
                                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(course.rating) ? 'text-amber-400 fill-amber-400' : 'fill-white/25 text-white/25'}`} />)}
                                        </div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.50)' }}>{course.reviewCount} reviews</p>
                                    </div>
                                    <div className="relative flex-1 space-y-2">
                                        {ratingDistribution.map(dist => (
                                            <div key={dist.rating} className="flex items-center gap-3">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color: 'rgba(255,255,255,0.55)', width: 20 }}>{dist.rating}★</span>
                                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
                                                    <div className="h-full rounded-full" style={{ width: `${dist.percentage}%`, backgroundColor: 'rgba(255,255,255,0.55)', transition: 'width 0.6s ease' }} />
                                                </div>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', width: 16, textAlign: 'right', fontWeight: T.weight.medium, color: 'rgba(255,255,255,0.50)' }}>{dist.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {isEnrolled && (
                                    <DBtn onClick={() => { if (myReview) setReviewForm({ rating: myReview.rating, comment: myReview.comment }); setShowReviewModal(true); }}
                                        className="w-full py-3 text-sm flex items-center justify-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        {myReview ? 'Edit Your Review' : 'Write a Review'}
                                    </DBtn>
                                )}

                                <div className="flex items-center gap-2">
                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wide, color: C.text, opacity: 0.40 }}>Sort:</span>
                                    {['recent', 'helpful', 'rating'].map(s => (
                                        <button key={s} onClick={() => setSortBy(s)}
                                            className="px-3 py-1.5 rounded-xl capitalize transition-all"
                                            style={sortBy === s
                                                ? { ...GS, color: '#ffffff', fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black }
                                                : { backgroundColor: C.innerBg, color: C.text, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black }}>
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {reviews.length > 0 ? (
                                    <div className="space-y-3">
                                        {reviews.map(review => (
                                            <div key={review._id} className="p-5 rounded-2xl transition-all"
                                                style={review._id === myReview?._id
                                                    ? { border: `2px solid ${C.btnPrimary}`, backgroundColor: C.btnViewAllBg }
                                                    : { border: `2px solid ${C.cardBorder}`, backgroundColor: C.surfaceWhite }}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <img src={review.student?.profileImage || '/default-avatar.svg'} alt="" className="w-9 h-9 rounded-2xl" style={{ border: `2px solid ${C.cardBorder}` }} />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{review.student?.name}</p>
                                                                {review._id === myReview?._id && <span className="px-2 py-0.5 text-white rounded-full" style={{ ...GS, fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black }}>You</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'fill-current'}`} style={i >= review.rating ? { color: C.cardBorder } : {}} />)}
                                                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.text, opacity: 0.40 }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {review._id === myReview?._id && (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => { setReviewForm({ rating: review.rating, comment: review.comment }); setShowReviewModal(true); }}
                                                                className="p-1.5 rounded-xl transition-colors" style={{ color: C.btnPrimary }}
                                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={handleDeleteReview}
                                                                className="p-1.5 rounded-xl transition-colors" style={{ color: C.danger }}
                                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.dangerBg; }}
                                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, lineHeight: T.leading.relaxed }}>{review.comment}</p>
                                                {review.tutorResponse && (
                                                    <div className="mt-3 p-3 rounded-r-2xl" style={{ backgroundColor: C.innerBg, borderLeft: `3px solid ${C.btnPrimary}` }}>
                                                        <p className="flex items-center gap-1 mb-1"
                                                            style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: C.btnPrimary }}>
                                                            <Award className="w-3 h-3" />Instructor
                                                        </p>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text }}>{review.tutorResponse.comment}</p>
                                                    </div>
                                                )}
                                                {review._id !== myReview?._id && (
                                                    <button onClick={() => toggleHelpful(review._id)}
                                                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors"
                                                        style={{ backgroundColor: C.innerBg, color: C.text, fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}>
                                                        <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({review.helpfulCount || 0})
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {hasMoreReviews && (
                                            <button onClick={() => loadReviews(true)} disabled={loadingReviews}
                                                className="w-full py-3 rounded-2xl transition-all"
                                                style={{ border: `2px dashed ${C.cardBorder}`, color: C.text, opacity: 0.50, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.opacity = '1'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.opacity = '0.50'; }}>
                                                {loadingReviews ? 'Loading…' : 'Load More Reviews'}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 rounded-2xl" style={{ backgroundColor: C.innerBg, border: `2px dashed ${C.cardBorder}` }}>
                                        <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: C.text, opacity: 0.18 }} />
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, opacity: 0.40 }}>No reviews yet. Be the first!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ RESOURCES ══════════════════════════════════════ */}
                        {activeTab === 'resources' && (
                            <div className="rounded-2xl p-6 space-y-4"
                                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>Course Resources</h3>
                                {(() => {
                                    const groupedResources = lessons.map(l => {
                                        const lessonRes = [];
                                        const c = typeof l.content === 'object' ? l.content : {};
                                        if (c.attachments?.length) lessonRes.push(...c.attachments);
                                        if (c.documents?.length) lessonRes.push(...c.documents);
                                        return { lessonId: l._id, title: l.title, resources: lessonRes };
                                    }).filter(g => g.resources.length > 0);

                                    if (groupedResources.length === 0) return (
                                        <div className="text-center py-10 rounded-2xl" style={{ backgroundColor: C.innerBg, border: `2px dashed ${C.cardBorder}` }}>
                                            <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: C.text, opacity: 0.20 }} />
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, opacity: 0.40 }}>No resources available for this course.</p>
                                        </div>
                                    );

                                    return (
                                        <div className="space-y-6">
                                            {groupedResources.map((group, idx) => (
                                                <div key={group.lessonId} className="space-y-3">
                                                    <h4 className="pb-2 flex items-center gap-2"
                                                        style={{ borderBottom: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontWeight: T.weight.bold, color: C.heading }}>
                                                        <span className="w-6 h-6 rounded-lg flex items-center justify-center"
                                                            style={{ backgroundColor: C.innerBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}>
                                                            {idx + 1}
                                                        </span>
                                                        {group.title}
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {group.resources.map((res, i) => (
                                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl transition-all"
                                                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}
                                                                onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.boxShadow = S.active; }}
                                                                onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}>
                                                                <div className="flex items-center gap-4 min-w-0">
                                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: C.btnViewAllBg }}>
                                                                        <FileText className="w-5 h-5" style={{ color: C.btnPrimary }} />
                                                                    </div>
                                                                    <div className="min-w-0 pr-4">
                                                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{res.name || 'Document'}</p>
                                                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.widest, color: C.text, opacity: 0.40 }}>
                                                                            {res.type?.split('/')[1] || 'File'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <a href={res.url} target="_blank" rel="noopener noreferrer"
                                                                    className="px-4 py-2 rounded-xl transition-all shrink-0"
                                                                    style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black }}
                                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnPrimary; e.currentTarget.style.color = '#ffffff'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; e.currentTarget.style.color = C.btnViewAllText; }}>
                                                                    View
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="lg:col-span-1 space-y-4">

                        {activeTab === 'lessons' && (isEnrolled || isInstructor) && (
                            <>
                                <div className="rounded-2xl p-5" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>Progress</h3>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.btnPrimary }}>{completedCount}/{totalLessons}</span>
                                    </div>
                                    <CircularProgress pct={pct} completed={completedCount} total={totalLessons} />
                                </div>

                                <div className="rounded-2xl p-5" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                    <h3 className="mb-4" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>Course Info</h3>
                                    <div className="flex items-center gap-3 mb-3">
                                        <img src={course.tutorId?.userId?.profileImage || '/default-avatar.svg'} alt="" className="w-10 h-10 rounded-2xl" style={{ border: `1px solid ${C.cardBorder}` }} />
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{course.tutorId?.userId?.name || 'Instructor'}</p>
                                    </div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: C.text, opacity: 0.45 }}>Updated: {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : '—'}</p>
                                    <p className="flex items-center gap-1 mt-1" style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: C.text, opacity: 0.45 }}>
                                        <Users className="w-3 h-3" /> {(course.enrolledCount || 0).toLocaleString()} Students
                                    </p>
                                </div>

                                <div className="rounded-2xl p-5" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.innerBg }}>
                                            <BarChart2 className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                                        </div>
                                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>Quiz Performance</h3>
                                    </div>
                                    <div className="space-y-3.5">
                                        {quizScores.map((q, i) => <QuizScoreRow key={i} title={q.title} score={q.score} />)}
                                        {quizScores.length === 0 && (
                                            <p className="text-center py-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, opacity: 0.40 }}>No quiz attempts yet</p>
                                        )}
                                    </div>
                                    <Link href={`/student/courses/${id}`} className="inline-flex items-center gap-1 mt-4"
                                        style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black, color: C.btnPrimary }}>
                                        View All <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </>
                        )}

                        {/* Enrollment / Pricing Card */}
                        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="aspect-video relative overflow-hidden group" style={{ backgroundColor: C.innerBg }}>
                                <img src={course.thumbnail || 'https://via.placeholder.com/640x360'} alt={course.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30">
                                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                        <Play className="w-6 h-6 ml-0.5 fill-current" style={{ color: C.btnPrimary }} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                                        {course.isFree ? 'Free' : `₹${course.price}`}
                                    </span>
                                    {course.oldPrice && !course.isFree && (
                                        <>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.md, textDecoration: 'line-through', color: C.text, opacity: 0.40 }}>₹{course.oldPrice}</span>
                                            <span className="px-2 py-0.5 rounded-full"
                                                style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black }}>
                                                {Math.round((1 - course.price / course.oldPrice) * 100)}% OFF
                                            </span>
                                        </>
                                    )}
                                </div>
                                {isInstructor ? (
                                    <DBtn onClick={() => router.push(`/tutor/courses/${id}`)} className="w-full py-3 text-sm flex items-center justify-center gap-2">
                                        <Edit3 className="w-4 h-4" /> Edit Course
                                    </DBtn>
                                ) : !isEnrolled ? (
                                    <DBtn onClick={handleEnroll} disabled={enrolling} className="w-full py-3 text-sm">
                                        {enrolling ? 'Processing…' : course.isFree ? 'Enroll Now' : 'Buy Now'}
                                    </DBtn>
                                ) : (
                                    <div className="w-full py-3 text-white rounded-2xl flex items-center justify-center gap-2"
                                        style={{ backgroundColor: C.success, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black }}>
                                        <CheckCircle className="w-4 h-4" /> Enrolled
                                    </div>
                                )}
                                <p className="text-center mt-3" style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: C.text, opacity: 0.40 }}>
                                    30-Day Money-Back Guarantee
                                </p>
                            </div>
                        </div>

                        {/* Course Includes */}
                        <div className="rounded-2xl p-5" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <h3 className="mb-4" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>This Course Includes</h3>
                            <div className="space-y-2">
                                {[
                                    { icon: <PlayCircle className="w-4 h-4" style={{ color: C.btnPrimary }} />, label: `${totalLessons} video lessons`,    bg: C.innerBg },
                                    { icon: <Clock className="w-4 h-4" style={{ color: C.chartLine }} />,     label: `${Math.round(totalDuration / 3600)}h on-demand`, bg: 'rgba(94,157,157,0.08)' },
                                    { icon: <Download className="w-4 h-4" style={{ color: C.success }} />,   label: 'Downloadable resources',         bg: C.successBg },
                                    { icon: <Trophy className="w-4 h-4" style={{ color: C.warning }} />,     label: 'Certificate of completion',      bg: C.warningBg },
                                    { icon: <Globe className="w-4 h-4" style={{ color: '#3B82F6' }} />,       label: 'Lifetime access',                bg: 'rgba(59,130,246,0.08)' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ backgroundColor: item.bg }}>
                                        {item.icon}
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Instructor */}
                        <div className="rounded-2xl p-5" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <h3 className="mb-4 pb-3" style={{ borderBottom: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>
                                Course Instructor
                            </h3>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3" style={{ border: `2px solid ${C.cardBorder}` }}>
                                    <img src={course.tutorId?.userId?.profileImage || '/default-avatar.svg'} alt="" className="w-full h-full object-cover" />
                                </div>
                                <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{course.tutorId?.userId?.name || 'Unknown'}</h4>
                                {course.tutorId?.experience && (
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.btnPrimary, marginTop: 4 }}>{course.tutorId.experience} Years Experience</p>
                                )}
                                {course.tutorId?.bio && (
                                    <p className="line-clamp-3 mt-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, lineHeight: T.leading.relaxed, color: C.text, opacity: 0.50 }}>
                                        {course.tutorId.bio}
                                    </p>
                                )}
                            </div>
                            <button onClick={() => router.push(`/tutor/${course.tutorId?._id}`)}
                                className="w-full mt-4 py-2 rounded-2xl transition-colors"
                                style={{ border: `1.5px solid ${C.cardBorder}`, color: C.btnPrimary, backgroundColor: C.innerBg, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}>
                                View Full Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ MODALS ══════════════════════════════════════════════════ */}
            {showLessonPlayerModal && lessons[selectedLessonIndex] && (
                <LessonPlayerModal lessons={lessons} modules={course.modules} reviews={reviews}
                    initialIndex={selectedLessonIndex} courseId={id}
                    onClose={() => setShowLessonPlayerModal(false)} onLessonComplete={handleLessonComplete} />
            )}
            {showExamHistoryModal && selectedExam && (
                <ExamHistoryModal exam={selectedExam} onClose={() => setShowExamHistoryModal(false)}
                    onViewAttempt={data => { setSelectedResult(data); setShowExamHistoryModal(false); setShowResultModal(true); }}
                    onStartExam={handleStartExam} />
            )}
            {showResultModal && selectedResult && (
                <ExamResultModal result={selectedResult} onClose={() => { setShowResultModal(false); setShowExamHistoryModal(true); }} />
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: C.surfaceWhite }}>
                        <div className="p-6 relative overflow-hidden" style={{ ...GS, borderBottom: `1px solid ${C.cardBorder}` }}>
                            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '14px 14px' }} />
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#ffffff' }}>
                                        {myReview ? 'Edit Review' : 'Write a Review'}
                                    </h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>{course.title}</p>
                                </div>
                                <button onClick={() => { setShowReviewModal(false); setReviewForm({ rating: 0, comment: '' }); }}
                                    className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmitReview} className="p-6 space-y-5">
                            <div>
                                <label className="block mb-3"
                                    style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: C.text, opacity: 0.55 }}>
                                    Rating
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(r => (
                                        <button key={r} type="button" onClick={() => setReviewForm(prev => ({ ...prev, rating: r }))} className="transition-transform hover:scale-125">
                                            <Star className={`w-9 h-9 ${r <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'fill-current'}`}
                                                style={r > reviewForm.rating ? { color: C.cardBorder } : {}} />
                                        </button>
                                    ))}
                                </div>
                                {reviewForm.rating > 0 && (
                                    <p className="mt-2"
                                        style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: C.btnPrimary }}>
                                        {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating - 1]}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block mb-2"
                                    style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: C.text, opacity: 0.55 }}>
                                    Your Review
                                </label>
                                <textarea value={reviewForm.comment} onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                    rows={5} maxLength={500} placeholder="Share your experience…"
                                    className="w-full px-4 py-3 rounded-2xl resize-none focus:outline-none transition-all"
                                    style={{ border: `1.5px solid ${C.cardBorder}`, color: C.heading, backgroundColor: C.cardBg, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium }}
                                    onFocus={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }} />
                                <p className="text-right mt-1" style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.text, opacity: 0.40 }}>{reviewForm.comment.length}/500</p>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setShowReviewModal(false); setReviewForm({ rating: 0, comment: '' }); }}
                                    className="flex-1 py-2.5 rounded-2xl transition-colors"
                                    style={{ border: `1.5px solid ${C.cardBorder}`, color: C.text, backgroundColor: C.cardBg, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black }}>
                                    Cancel
                                </button>
                                <DBtn type="submit" disabled={submittingReview || reviewForm.rating === 0 || reviewForm.comment.trim().length < 10} className="flex-1 py-2.5 text-sm">
                                    {submittingReview ? 'Submitting…' : myReview ? 'Update Review' : 'Submit Review'}
                                </DBtn>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {course && <ReportAbuseModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} targetId={course._id} targetType="Course" />}

            {/* Floating AI Button */}
            <button onClick={() => setAiWidgetOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 text-white rounded-2xl shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                style={{ ...GS, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                <div className="relative">
                    <Bot className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                Sapience Course Assistant
            </button>

            {/* AI Drawer */}
            {aiWidgetOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setAiWidgetOpen(false)} />
                    <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-[85vh] sm:h-[600px] sm:bottom-6 sm:right-6 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily }}>
                        <div className="px-5 py-4 flex items-center justify-between relative overflow-hidden" style={GS}>
                            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '14px 14px' }} />
                            <div className="relative flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#ffffff' }}>Sapience Course Assistant</p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: 'rgba(255,255,255,0.50)' }}>Ask anything about this course</p>
                                </div>
                            </div>
                            <button onClick={() => setAiWidgetOpen(false)}
                                className="relative w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
                                style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <AiTutorWidget
                                title="Sapience Course Assistant"
                                subtitle="Curious about this course? Ask away!"
                                context={{ pageType: 'course_details', courseId: course._id }}
                                recommendedTopics={['What are the prerequisites?', 'What are the main learning outcomes?', 'Is this suitable for beginners?']}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}