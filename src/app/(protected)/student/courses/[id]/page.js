'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    PlayCircle, CheckCircle, Lock, Clock, Star, FileQuestion, Award, Users,
    Download, MessageSquare, ThumbsUp, ChevronDown, Edit3, Trash2,
    Zap, Target, Calendar, X, Sparkles, Trophy, Globe,
    ShieldAlert, Eye, ClipboardList, Brain, FileText, Loader2,
    ChevronLeft, ChevronRight, BarChart2,
    AlertCircle, Play, SkipForward, Bot,
    BookOpen
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import LessonPlayerModal from '@/components/LessonPlayerModal';
import ExamHistoryModal from '@/components/ExamHistoryModal';
import { ReportAbuseModal } from '@/components/shared/ReportAbuseModal';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import Link from 'next/link';
import AiTutorWidget from '@/components/AiTutorWidget';
import { motion, AnimatePresence } from 'framer-motion';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const themeBg = '#dfdaf3';
const outerCard = '#EAE8FA';
const innerBox = '#E3DFF8';

// gradient shorthand
const GS = { background: C.gradientBtn };

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const cfg = {
        completed:     { label: 'Completed',   bg: C.successBg,              color: C.success,    border: C.successBorder },
        'in-progress': { label: 'In Progress', bg: innerBox,                 color: C.btnPrimary, border: C.btnPrimary },
        locked:        { label: 'Locked',      bg: 'rgba(100,116,139,0.08)', color: '#64748B',    border: 'rgba(100,116,139,0.15)' },
        pending:       { label: 'Pending',     bg: C.warningBg,              color: C.warning,    border: C.warningBorder },
    };
    const c = cfg[status] || cfg.pending;
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}`, fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                <svg width={size} height={size} viewBox="0 0 120 120" className="drop-shadow-sm">
                    <circle cx="60" cy="60" r={r} fill="none" stroke={innerBox} strokeWidth="8" />
                    <circle cx="60" cy="60" r={r} fill="none" stroke="url(#pg)" strokeWidth="8"
                        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                        transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 0.8s ease-out' }} />
                    <defs>
                        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4F46E5" />
                            <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, lineHeight: 1 }}>{pct}%</span>
                </div>
            </div>
        </div>
    );
}

// ─── Quiz Score Row ───────────────────────────────────────────────────────────
function QuizScoreRow({ title, score }) {
    const color = score >= 80 ? C.success : score >= 60 ? C.warning : C.danger;
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-white/40" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-white">
                <FileQuestion className="w-4 h-4" style={{ color: C.btnPrimary }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>{title}</p>
                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: outerCard }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, backgroundColor: color }} />
                </div>
            </div>
            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color, flexShrink: 0 }}>{score}%</span>
        </div>
    );
}

// ─── Gradient Button ──────────────────────────────────────────────────────────
function DBtn({ children, onClick, disabled, className = '', type = 'button', style: extra = {} }) {
    return (
        <button type={type} onClick={onClick} disabled={disabled}
            className={`text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer border-none shadow-md ${className}`}
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
            if (response.data?.success) {
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
                
                setCourse(courseData); 
                setLessons(lessonsData);
                setIsEnrolled(response.data.isEnrolled || false);
                setEnrollment(response.data.enrollment || null);
                setIsInstructor(response.data.isInstructor || false);
                const moduleIds = courseData.modules?.map(m => m._id) || [];
                setExpandedModules(prev => prev.length ? prev : moduleIds);
            }
            if ((response.data?.isEnrolled || response.data?.isInstructor) && !background) {
                const [examRes, liveClassRes, assignmentRes, progressRes] = await Promise.all([
                    api.get(`/exams/course/${id}`),
                    api.get(`/live-classes?courseId=${id}`),
                    assignmentService.getCourseAssignments(id).catch(() => ({ success: false })),
                    api.get(`/progress/course/${id}`).catch(() => ({ data: {} })),
                ]);
                if (examRes.data?.success) setExams(examRes.data.exams || []);
                if (liveClassRes.data?.success) setLiveClasses(liveClassRes.data.liveClasses || []);
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
                try { const r = await api.get(`/reviews/my-review/${id}`); if (r.data?.success && r.data?.review) setMyReview(r.data.review); } catch (_) { }
            }
            const page = loadMore ? currentPage + 1 : 1;
            const response = await api.get(`/reviews/course/${id}`, { params: { page, limit: 10, sortBy } });
            if (response.data?.success) {
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
            if (response.data?.success) { setIsEnrolled(true); loadCourseData(); }
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
        <div className="flex h-screen items-center justify-center" style={{ backgroundColor: themeBg }}>
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[#4F46E5] animate-pulse" />
                    </div>
                </div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>Loading course hub…</p>
            </div>
        </div>
    );

    if (!course) return (
        <div className="flex h-screen items-center justify-center" style={{ backgroundColor: themeBg }}>
            <div className="text-center rounded-3xl p-10 shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: C.dangerBg }}>
                    <X className="w-8 h-8" style={{ color: C.danger }} />
                </div>
                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, marginBottom: 12 }}>Course Not Found</h2>
                <button onClick={() => router.back()}
                    className="px-6 py-2.5 rounded-xl transition-colors font-bold border cursor-pointer"
                    style={{ backgroundColor: innerBox, borderColor: C.cardBorder, color: C.heading, fontFamily: T.fontFamily, fontSize: T.size.sm }}>
                    Go Back
                </button>
            </div>
        </div>
    );

    const tabs = ['overview', 'lessons', 'assignments', 'discussions', 'resources'];

    return (
        <div className="min-h-screen pb-20" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily }}>

            {/* Instructor Preview Banner */}
            {isInstructor && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2.5 flex items-center justify-center gap-2 shadow-sm"
                    style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                    <Eye className="w-3.5 h-3.5 shrink-0" /> Preview Mode — Videos &amp; content are fully unlocked for you.
                </div>
            )}

            {/* ── Sticky Header ──────────────────────────────────────────── */}
            <div className="sticky top-0 z-30 shadow-sm"
                style={{ backgroundColor: 'rgba(234, 232, 250, 0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.cardBorder}` }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between gap-3 pt-4 pb-2">
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate" style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                {course.title}
                            </h1>
                            {enrollment?.batchId && (
                                <p className="flex items-center gap-1 mt-1" style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.btnPrimary, margin: 0 }}>
                                    <Users className="w-3 h-3" /> Cohort: {enrollment.batchId.name}
                                </p>
                            )}
                        </div>
                        {(isEnrolled || isInstructor) && (
                            <button onClick={resumeToFirst}
                                className="shrink-0 flex items-center gap-2 px-5 py-2.5 text-white rounded-xl transition-transform hover:scale-105 shadow-md cursor-pointer border-none"
                                style={{ ...GS, fontSize: '12px', fontWeight: T.weight.black }}>
                                <Play className="w-3.5 h-3.5 fill-white" /> Resume Learning
                            </button>
                        )}
                    </div>
                    
                    {/* Modern Tabs */}
                    <div className="flex gap-2 overflow-x-auto mt-2 pb-2 custom-scrollbar">
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className="px-4 py-2 rounded-lg whitespace-nowrap transition-all cursor-pointer border-none"
                                style={activeTab === tab
                                    ? { backgroundColor: C.btnPrimary, color: '#fff', fontSize: '11px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
                                    : { backgroundColor: 'transparent', color: C.textMuted, fontSize: '11px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Suspended Banner */}
            {isCourseSuspended && isEnrolled && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
                    <div className="p-4 rounded-2xl flex items-start gap-3 border shadow-sm"
                        style={{ backgroundColor: C.warningBg, borderColor: C.warningBorder }}>
                        <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" style={{ color: C.warning }} />
                        <div>
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: '#92400E', margin: 0 }}>Course Suspended</p>
                            <p style={{ fontSize: T.size.xs, color: '#92400E', opacity: 0.8, marginTop: 4, margin: 0 }}>This course is no longer publicly available. You retain full access as an enrolled student.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Layout ──────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* LEFT: 2 cols */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* ══ OVERVIEW ═══════════════════════════════════════ */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* What you'll learn */}
                                {course.whatYouWillLearn?.length > 0 && (
                                    <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                        <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-100"><Zap className="w-4 h-4 text-amber-600" /></div>
                                            What You'll Learn
                                        </h3>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {course.whatYouWillLearn.map((item, i) => (
                                                <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl border" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.success }} />
                                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* About */}
                                <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                    <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-100"><Target className="w-4 h-4 text-blue-600" /></div>
                                        About This Course
                                    </h3>
                                    <p className="leading-relaxed whitespace-pre-line" style={{ fontSize: T.size.sm, color: C.text, fontWeight: T.weight.medium, margin: 0 }}>
                                        {course.description}
                                    </p>
                                </div>

                                {/* Requirements */}
                                {course.requirements?.length > 0 && (
                                    <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                        <h3 className="mb-4" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Prerequisites</h3>
                                        <ul className="space-y-2 m-0 p-0 list-none">
                                            {course.requirements.map((req, i) => (
                                                <li key={i} className="flex items-start gap-3 p-3.5 rounded-2xl border" style={{ backgroundColor: innerBox, borderColor: C.cardBorder, color: C.heading, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: C.btnPrimary }} />{req}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* AI Tools (Magical Section) */}
                                {isEnrolled && (
                                    <div className="rounded-3xl p-6 shadow-lg border relative overflow-hidden" 
                                        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)', borderColor: 'rgba(255,255,255,0.1)' }}>
                                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                        
                                        <div className="relative z-10">
                                            <h3 className="mb-5 flex items-center gap-2 text-white" style={{ fontSize: T.size.md, fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                                                <Brain className="w-5 h-5 text-amber-300" /> AI Study Toolkit
                                            </h3>
                                            
                                            <div className="flex flex-wrap gap-3">
                                                <button onClick={handleAISummarize} disabled={aiLoading === 'summarize'}
                                                    className="flex items-center gap-2 px-5 py-3 rounded-xl transition-transform hover:scale-105 disabled:opacity-60 cursor-pointer shadow-md border-none"
                                                    style={{ backgroundColor: '#ffffff', color: '#1E1B4B', fontSize: T.size.sm, fontWeight: T.weight.black }}>
                                                    {aiLoading === 'summarize' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
                                                    Summarize Course
                                                </button>
                                                <button onClick={handleAIRevisionNotes} disabled={aiLoading === 'revision'}
                                                    className="flex items-center gap-2 px-5 py-3 text-white rounded-xl transition-transform hover:scale-105 disabled:opacity-60 cursor-pointer shadow-md border-none"
                                                    style={{ background: 'linear-gradient(135deg,#059669,#0d9488)', fontSize: T.size.sm, fontWeight: T.weight.black }}>
                                                    {aiLoading === 'revision' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                                    Generate Revision Notes
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {showAiPanel && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-5">
                                                        <div className="rounded-2xl p-5 border shadow-inner relative" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="flex items-center gap-2 text-white" style={{ fontSize: T.size.sm, fontWeight: T.weight.black, margin: 0 }}>
                                                                    <Brain className="w-4 h-4 text-amber-300" />{aiResult?.type || 'Generating Magic…'}
                                                                </h4>
                                                                <button onClick={() => setShowAiPanel(false)} className="bg-transparent border-none cursor-pointer"><X className="w-4 h-4 text-white/60 hover:text-white" /></button>
                                                            </div>
                                                            
                                                            {aiLoading ? (
                                                                <div className="flex items-center gap-3 py-8 justify-center">
                                                                    <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
                                                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.8)' }}>Reading course content…</span>
                                                                </div>
                                                            ) : (
                                                                <div className="prose prose-sm max-w-none whitespace-pre-wrap" style={{ fontSize: T.size.sm, color: 'rgba(255,255,255,0.9)', fontWeight: T.weight.medium, lineHeight: 1.6 }}>
                                                                    {aiResult?.content}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ LESSONS (Clean Accordions) ════════════════════════════════════════ */}
                        {activeTab === 'lessons' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white shadow-sm border" style={{ borderColor: C.cardBorder }}>
                                            <BookOpen className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                        </div>
                                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Course Content</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {(course.modules || []).map(module => {
                                            const mLessons = getLessonsByModule(module._id);
                                            if (mLessons.length === 0) return null;
                                            const mDone = mLessons.filter(l => completedIds.includes(l._id?.toString())).length;
                                            const isExp = expandedModules.includes(module._id);
                                            
                                            return (
                                                <div key={module._id} className="rounded-2xl border overflow-hidden transition-all shadow-sm" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                                    <button onClick={() => toggleModule(module._id)}
                                                        className="w-full flex items-center justify-between p-5 border-none cursor-pointer transition-colors"
                                                        style={{ backgroundColor: 'transparent' }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-transform ${isExp ? 'rotate-180 bg-white' : 'bg-slate-200/50'}`}>
                                                                <ChevronDown size={14} style={{ color: C.textMuted }} />
                                                            </div>
                                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{module.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>{mDone}/{mLessons.length} Completed</span>
                                                            {mDone === mLessons.length && mLessons.length > 0 && <CheckCircle size={16} style={{ color: C.success }} />}
                                                        </div>
                                                    </button>
                                                    
                                                    <AnimatePresence>
                                                        {isExp && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                                                <div className="px-3 pb-3 space-y-2">
                                                                    {mLessons.map((lesson, li) => {
                                                                        const locked = isLessonLocked(lesson);
                                                                        const isDone = completedIds.includes(lesson._id?.toString());
                                                                        const isAct = lesson._id === currentLesson?._id;
                                                                        const status = locked ? 'locked' : isDone ? 'completed' : isAct ? 'in-progress' : 'pending';
                                                                        
                                                                        return (
                                                                            <div key={lesson._id} onClick={() => !locked && handleLessonClick(lesson)}
                                                                                className={`flex items-center gap-3 p-4 rounded-xl transition-all border ${isAct ? 'shadow-md' : 'shadow-sm'}`}
                                                                                style={{ 
                                                                                    backgroundColor: isAct ? '#ffffff' : outerCard, 
                                                                                    borderColor: isAct ? C.btnPrimary : C.cardBorder,
                                                                                    opacity: locked ? 0.6 : 1,
                                                                                    cursor: locked ? 'not-allowed' : 'pointer'
                                                                                }}
                                                                                onMouseEnter={e => { if(!locked && !isAct) { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                                                                                onMouseLeave={e => { if(!locked && !isAct) { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.transform = 'none'; } }}>
                                                                                
                                                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                                                                    style={{ backgroundColor: isDone ? C.successBg : isAct ? `${C.btnPrimary}15` : innerBox }}>
                                                                                    {isDone ? <CheckCircle size={18} style={{ color: C.success }} />
                                                                                        : lesson.type === 'video' ? <PlayCircle size={18} style={{ color: C.btnPrimary }} />
                                                                                        : lesson.type === 'quiz' ? <FileQuestion size={18} style={{ color: C.warning }} />
                                                                                        : <FileText size={18} style={{ color: C.textMuted }} />}
                                                                                </div>
                                                                                
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: isAct ? C.btnPrimary : C.heading, margin: '0 0 2px 0' }}>
                                                                                        {li + 1}. {lesson.title}
                                                                                    </p>
                                                                                    {lesson.duration > 0 && (
                                                                                        <p className="flex items-center gap-1" style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                                                                                            <Clock size={10} /> {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')} mins
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                
                                                                                <div className="shrink-0 flex items-center gap-3">
                                                                                    <StatusBadge status={status} />
                                                                                    {!locked && (
                                                                                        <button onClick={e => { e.stopPropagation(); handleLessonClick(lesson); }}
                                                                                            className="hidden sm:flex items-center gap-1.5 px-4 h-8 text-white rounded-lg transition-transform hover:scale-105 border-none cursor-pointer shadow-sm"
                                                                                            style={{ ...GS, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                                            {isDone ? <><SkipForward size={12} />Review</> : <><Play size={12} className="fill-white" />Play</>}
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── ASSIGNMENTS ── */}
                        {activeTab === 'assignments' && (
                            <div className="rounded-3xl p-6 space-y-4 shadow-sm border animate-in fade-in slide-in-from-bottom-2 duration-300"
                                style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white shadow-sm border" style={{ borderColor: C.cardBorder }}>
                                        <ClipboardList className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                    </div>
                                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Assignments</h3>
                                </div>
                                
                                {(!isEnrolled && !isInstructor) ? (
                                    <div className="text-center py-12 rounded-2xl border-2 border-dashed" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                        <Lock className="w-12 h-12 mx-auto mb-4" style={{ color: C.textMuted, opacity: 0.3 }} />
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Enroll to access assignments</p>
                                        <DBtn onClick={handleEnroll} className="px-6 py-3 text-sm">Enroll Now</DBtn>
                                    </div>
                                ) : assignments.length > 0 ? assignments.map(assignment => {
                                    const sub = assignment.mySubmission;
                                    const isGraded = sub?.status === 'graded';
                                    const isSubmitted = sub?.status === 'submitted';
                                    
                                    return (
                                        <div key={assignment._id} onClick={() => router.push(`/student/courses/${id}/assignments/${assignment._id}`)}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl transition-all cursor-pointer border shadow-sm"
                                            style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.transform = 'none'; }}>
                                            
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                                                    style={{ backgroundColor: isGraded ? C.success : isSubmitted ? C.warning : C.btnPrimary }}>
                                                    <ClipboardList size={20} />
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>{assignment.title}</h4>
                                                    <div className="flex items-center gap-3">
                                                        {isGraded
                                                            ? <span className="px-2 py-0.5 rounded-md" style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}`, fontSize: '9px', fontWeight: T.weight.black, textTransform: 'uppercase' }}>Score: {sub.grade}/{assignment.totalMarks}</span>
                                                            : isSubmitted
                                                            ? <span className="px-2 py-0.5 rounded-md" style={{ backgroundColor: C.warningBg, color: C.warning, border: `1px solid ${C.warningBorder}`, fontSize: '9px', fontWeight: T.weight.black, textTransform: 'uppercase' }}>Submitted</span>
                                                            : <span className="px-2 py-0.5 rounded-md" style={{ backgroundColor: C.surfaceWhite, color: C.textMuted, border: `1px solid ${C.cardBorder}`, fontSize: '9px', fontWeight: T.weight.black, textTransform: 'uppercase' }}>Pending</span>}
                                                        
                                                        {assignment.dueDate && <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}><Calendar size={10} className="inline mb-0.5 mr-1" />Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="h-9 px-5 rounded-xl border-none text-white text-xs font-bold transition-opacity hover:opacity-80 cursor-pointer shadow-sm w-full sm:w-auto"
                                                style={{ backgroundColor: isGraded || isSubmitted ? C.success : C.btnPrimary }}>
                                                {isGraded || isSubmitted ? 'View Details' : 'Start Assignment'}
                                            </button>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-12 rounded-2xl border-2 border-dashed" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                        <ClipboardList className="w-12 h-12 mx-auto mb-3" style={{ color: C.textMuted, opacity: 0.3 }} />
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No assignments found.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── REVIEWS ── */}
                        {activeTab === 'discussions' && (
                            <div className="rounded-3xl p-6 space-y-6 shadow-sm border animate-in fade-in slide-in-from-bottom-2 duration-300"
                                style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                
                                {/* Rating hero */}
                                <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-3xl relative overflow-hidden shadow-inner border border-white/10" style={GS}>
                                    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '16px 16px' }} />
                                    <div className="relative text-center shrink-0">
                                        <div style={{ fontSize: '56px', fontWeight: T.weight.black, color: '#ffffff', lineHeight: 1, marginBottom: 8 }}>{course.rating?.toFixed(1) || '0.0'}</div>
                                        <div className="flex gap-1 justify-center mb-2">
                                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(course.rating) ? 'text-amber-400 fill-amber-400' : 'fill-white/25 text-white/25'}`} />)}
                                        </div>
                                        <p style={{ fontSize: '11px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{course.reviewCount} Course Reviews</p>
                                    </div>
                                    <div className="relative flex-1 w-full space-y-2.5">
                                        {ratingDistribution.map(dist => (
                                            <div key={dist.rating} className="flex items-center gap-3">
                                                <span style={{ fontSize: '11px', fontWeight: T.weight.black, color: 'rgba(255,255,255,0.7)', width: 24 }}>{dist.rating}★</span>
                                                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                                    <div className="h-full rounded-full" style={{ width: `${dist.percentage}%`, backgroundColor: '#fff', transition: 'width 0.8s ease' }} />
                                                </div>
                                                <span style={{ fontSize: '11px', width: 20, textAlign: 'right', fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.6)' }}>{dist.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {isEnrolled && (
                                    <DBtn onClick={() => { if (myReview) setReviewForm({ rating: myReview.rating, comment: myReview.comment }); setShowReviewModal(true); }}
                                        className="w-full py-4 text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01]">
                                        <MessageSquare size={16} /> {myReview ? 'Edit Your Review' : 'Write a Review'}
                                    </DBtn>
                                )}

                                <div className="flex items-center gap-3 bg-white p-1 rounded-xl w-fit shadow-sm border border-slate-200">
                                    {['recent', 'helpful', 'rating'].map(s => (
                                        <button key={s} onClick={() => setSortBy(s)}
                                            className="px-4 py-2 rounded-lg capitalize transition-all border-none cursor-pointer"
                                            style={sortBy === s
                                                ? { backgroundColor: C.btnPrimary, color: '#fff', fontSize: '11px', fontWeight: T.weight.black, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
                                                : { backgroundColor: 'transparent', color: C.textMuted, fontSize: '11px', fontWeight: T.weight.bold }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>

                                {loadingReviews ? (
                                    <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" /></div>
                                ) : reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {reviews.map(review => (
                                            <div key={review._id} className="p-6 rounded-2xl transition-all border"
                                                style={{ backgroundColor: review._id === myReview?._id ? '#ffffff' : innerBox, borderColor: review._id === myReview?._id ? C.btnPrimary : C.cardBorder, boxShadow: review._id === myReview?._id ? S.cardHover : 'none' }}>
                                                <div className="flex items-start justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border-2 shadow-sm bg-white" style={{ borderColor: C.cardBorder }}>
                                                            {review.student?.profileImage
                                                                ? <img src={review.student.profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                                : <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.btnPrimary }}>{review.student?.name?.[0]?.toUpperCase() || '?'}</span>}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{review.student?.name}</p>
                                                                {review._id === myReview?._id && <span className="px-2 py-0.5 text-white rounded-md" style={{ ...GS, fontSize: '9px', fontWeight: T.weight.black, textTransform: 'uppercase' }}>You</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <StarRow rating={review.rating} size={3} />
                                                                <span style={{ fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <p style={{ fontSize: T.size.sm, color: C.heading, lineHeight: 1.6, fontWeight: T.weight.medium, margin: '0 0 12px 0' }}>"{review.comment}"</p>

                                                {review.tutorResponse?.comment && (
                                                    <div className="mt-4 p-4 rounded-xl border-l-[4px] shadow-sm" style={{ backgroundColor: '#ffffff', borderLeftColor: C.btnPrimary }}>
                                                        <p className="flex items-center gap-1.5" style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>
                                                            <Award size={14} /> Instructor Reply
                                                        </p>
                                                        <p style={{ fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.medium, margin: 0, lineHeight: 1.5 }}>{review.tutorResponse.comment}</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: C.cardBorder }}>
                                                    {review._id !== myReview?._id ? (
                                                        <button onClick={() => toggleHelpful(review._id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
                                                            style={{ backgroundColor: C.surfaceWhite, color: C.textMuted, fontSize: '11px', fontWeight: T.weight.bold, border: `1px solid ${C.cardBorder}` }}
                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EAE8FA'} onMouseLeave={e => e.currentTarget.style.backgroundColor = C.surfaceWhite}>
                                                            <ThumbsUp size={14} /> Helpful ({review.helpfulCount || 0})
                                                        </button>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => { setReviewForm({ rating: review.rating, comment: review.comment }); setShowReviewModal(true); }}
                                                                className="p-2 rounded-lg bg-white border cursor-pointer hover:bg-slate-50 transition-colors" style={{ borderColor: C.cardBorder }}>
                                                                <Edit3 size={14} style={{ color: C.btnPrimary }} />
                                                            </button>
                                                            <button onClick={handleDeleteReview}
                                                                className="p-2 rounded-lg bg-white border cursor-pointer hover:bg-red-50 transition-colors" style={{ borderColor: C.cardBorder }}>
                                                                <Trash2 size={14} style={{ color: C.danger }} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 rounded-3xl border-2 border-dashed" style={{ borderColor: C.cardBorder, backgroundColor: innerBox }}>
                                        <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: C.textMuted, opacity: 0.3 }} />
                                        <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No reviews yet.</p>
                                        <p style={{ fontSize: T.size.sm, color: C.textMuted, margin: 0 }}>Be the first one to share your experience!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── RESOURCES ── */}
                        {activeTab === 'resources' && (
                            <div className="rounded-3xl p-6 space-y-6 shadow-sm border animate-in fade-in slide-in-from-bottom-2 duration-300"
                                style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white shadow-sm border" style={{ borderColor: C.cardBorder }}>
                                        <Download className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                    </div>
                                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Course Resources</h3>
                                </div>

                                {(() => {
                                    const groupedResources = lessons.map(l => {
                                        const lessonRes = [];
                                        const c = typeof l.content === 'object' ? l.content : {};
                                        if (c.attachments?.length) lessonRes.push(...c.attachments);
                                        if (c.documents?.length) lessonRes.push(...c.documents);
                                        return { lessonId: l._id, title: l.title, resources: lessonRes };
                                    }).filter(g => g.resources.length > 0);

                                    if (groupedResources.length === 0) return (
                                        <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: C.textMuted, opacity: 0.3 }} />
                                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No resources available</p>
                                        </div>
                                    );

                                    return (
                                        <div className="space-y-8">
                                            {groupedResources.map((group, idx) => (
                                                <div key={group.lessonId} className="space-y-4">
                                                    <h4 className="flex items-center gap-3" style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ background: C.gradientBtn, fontSize: '10px' }}>{idx + 1}</span>
                                                        {group.title}
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {group.resources.map((res, i) => (
                                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl transition-all hover:-translate-y-1 shadow-sm border"
                                                                style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                                                <div className="flex items-center gap-3 min-w-0 pr-4">
                                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm shrink-0">
                                                                        <FileText size={18} color={C.btnPrimary} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{res.name || 'Document'}</p>
                                                                        <span style={{ fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '1px', color: C.textMuted }}>
                                                                            {res.type?.split('/')[1] || 'File'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <a href={res.url} target="_blank" rel="noopener noreferrer"
                                                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white border cursor-pointer hover:bg-slate-50 transition-colors"
                                                                    style={{ borderColor: C.cardBorder, color: C.btnPrimary }}>
                                                                    <Download size={16} />
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

                    {/* ── RIGHT: Sidebar (Progress, Pricing, Instructor) ───────────────────────────────── */}
                    <div className="lg:col-span-1 space-y-6">

                        {activeTab === 'lessons' && (isEnrolled || isInstructor) && (
                            <div className="rounded-3xl p-6 shadow-sm border sticky top-24" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Progress Tracker</h3>
                                    <span className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: innerBox, color: C.btnPrimary, fontSize: '10px', fontWeight: T.weight.black }}>{completedCount}/{totalLessons}</span>
                                </div>
                                <CircularProgress pct={pct} completed={completedCount} total={totalLessons} />
                                
                                <div className="mt-8 pt-6 border-t" style={{ borderColor: C.cardBorder }}>
                                    <h3 className="mb-4" style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>Quiz Performance</h3>
                                    <div className="space-y-3">
                                        {quizScores.map((q, i) => <QuizScoreRow key={i} title={q.title} score={q.score} />)}
                                        {quizScores.length === 0 && (
                                            <p className="text-center py-4 rounded-xl border-2 border-dashed" style={{ backgroundColor: innerBox, borderColor: C.cardBorder, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>No quizzes attempted yet</p>
                                        )}
                                    </div>
                                    <Link href={`/student/history`} className="mt-4 block text-center py-3 rounded-xl border transition-colors cursor-pointer"
                                        style={{ backgroundColor: innerBox, borderColor: C.cardBorder, color: C.btnPrimary, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                        View Full Report
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Enrollment / Pricing Card — only for non-enrolled, non-instructor */}
                        {activeTab !== 'lessons' && !isEnrolled && !isInstructor && (
                            <div className="rounded-3xl overflow-hidden shadow-lg border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                <div className="aspect-video relative overflow-hidden group" style={{ backgroundColor: innerBox }}>
                                    <img src={course.thumbnail || 'https://via.placeholder.com/640x360'} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                        <div className="w-16 h-16 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 transition-transform">
                                            <Play className="w-6 h-6 ml-1" style={{ fill: C.btnPrimary, color: C.btnPrimary }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-5">
                                        <span style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, lineHeight: 1 }}>
                                            {course.isFree ? 'Free' : `₹${course.price}`}
                                        </span>
                                        {course.oldPrice && !course.isFree && (
                                            <div className="flex items-center gap-2">
                                                <span style={{ fontSize: T.size.md, textDecoration: 'line-through', color: C.textMuted, fontWeight: T.weight.bold }}>₹{course.oldPrice}</span>
                                                <span className="px-2 py-0.5 rounded-md" style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}`, fontSize: '10px', fontWeight: T.weight.black }}>
                                                    {Math.round((1 - course.price / course.oldPrice) * 100)}% OFF
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <DBtn onClick={handleEnroll} disabled={enrolling} className="w-full py-4 text-sm shadow-[0_4px_14px_rgba(79,70,229,0.3)]">
                                        {enrolling ? <><Loader2 className="w-4 h-4 inline mr-2 animate-spin" />Processing…</> : course.isFree ? 'Enroll Now for Free' : 'Buy Now Securely'}
                                    </DBtn>
                                    <p className="text-center mt-4" style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '16px 0 0 0' }}>
                                        🔒 30-Day Money-Back Guarantee
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Course Includes — always visible */}
                        {activeTab !== 'lessons' && (
                            <>
                                <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                    <h3 className="mb-5" style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>This Course Includes</h3>
                                    <div className="space-y-3">
                                        {[
                                            { icon: <PlayCircle size={16} style={{ color: C.btnPrimary }} />,  label: `${totalLessons} video lessons` },
                                            { icon: <Clock size={16} style={{ color: C.chartLine }} />,        label: `${Math.round(totalDuration / 3600)} hours on-demand video` },
                                            { icon: <Download size={16} style={{ color: C.success }} />,       label: 'Downloadable study resources' },
                                            { icon: <Trophy size={16} style={{ color: C.warning }} />,         label: 'Certificate of completion' },
                                            { icon: <Globe size={16} style={{ color: '#3B82F6' }} />,          label: 'Full lifetime access' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">{item.icon}</div>
                                                <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Instructor Info Mini */}
                                <div className="rounded-3xl p-6 shadow-sm border text-center" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                    <h3 className="mb-5 pb-4 border-b" style={{ borderColor: C.cardBorder, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                        Your Instructor
                                    </h3>
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 shadow-md border-4" style={{ borderColor: C.surfaceWhite }}>
                                            <img src={course.tutorId?.userId?.profileImage || '/default-avatar.svg'} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <h4 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>{course.tutorId?.userId?.name || 'Instructor Name'}</h4>
                                        <p style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                                            {course.tutorId?.experience || 0} Years Experience
                                        </p>
                                        <button onClick={() => router.push(`/tutor/${course.tutorId?._id}`)}
                                            className="w-full mt-6 py-3 rounded-xl border cursor-pointer transition-colors hover:bg-white"
                                            style={{ backgroundColor: innerBox, borderColor: C.cardBorder, color: C.btnPrimary, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                            View Full Profile
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </div>

            {/* ── Floating AI Button ────────────────────────────────────── */}
            <button onClick={() => setAiWidgetOpen(true)}
                className="fixed bottom-8 right-8 z-40 flex items-center gap-3 px-5 h-14 text-white rounded-full shadow-2xl transition-all hover:scale-105 cursor-pointer border-none"
                style={{ background: C.gradientBtn, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                    <Bot size={18} />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-600" />
                </div>
                Ask Course AI
            </button>

            {/* ── AI Drawer ─────────────────────────────────────────────── */}
            {aiWidgetOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setAiWidgetOpen(false)} />
                    <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-[85vh] sm:h-[600px] sm:bottom-8 sm:right-8 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border animate-in slide-in-from-bottom-10 sm:slide-in-from-right-10 duration-300"
                        style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                        
                        <div className="px-6 py-5 flex items-center justify-between relative overflow-hidden shrink-0 border-b"
                            style={{ background: C.gradientBtn, borderColor: C.cardBorder }}>
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                            <div className="relative flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner" style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }}>
                                    <Bot size={20} className="text-white" />
                                </div>
                                <div>
                                    <p style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: '#ffffff', margin: '0 0 2px 0' }}>Course Assistant</p>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Ask anything about content</p>
                                </div>
                            </div>
                            <button onClick={() => setAiWidgetOpen(false)} className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer border-none hover:bg-white/20"
                                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                <X size={16} className="text-white" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-hidden" style={{ backgroundColor: innerBox }}>
                            <AiTutorWidget
                                title="AI Insights"
                                subtitle="I have analyzed the entire course curriculum for you."
                                context={{ pageType: 'course_details', courseId: course._id }}
                                className="h-full border-none rounded-none shadow-none bg-transparent"
                                recommendedTopics={['What are the prerequisites?', 'What are the main learning outcomes?', 'Is this suitable for beginners?']}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Other Modals remain unchanged visually as they are imported components */}
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
            {course && <ReportAbuseModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} targetId={course._id} targetType="Course" />}
        </div>
    );
}