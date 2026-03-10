'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    PlayCircle, CheckCircle, Lock, Clock, Star, FileQuestion, Award, Users,
    Download, MessageSquare, ThumbsUp, ChevronDown, Edit3, Trash2,
    Zap, Target, Calendar, X, Video, Sparkles, Trophy, Globe,
    ShieldAlert, Eye, ClipboardList, Brain, FileText, Loader2,
    ChevronLeft, ChevronRight, BookOpen, BarChart2, Layers,
    AlertCircle, Play, SkipForward, Volume2, Maximize2, Bot
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import LessonPlayerModal from '@/components/LessonPlayerModal';
import ExamHistoryModal from '@/components/ExamHistoryModal';
import ExamResultModal from '@/components/ExamResultModal';
import { ReportAbuseModal } from '@/components/shared/ReportAbuseModal';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import Link from 'next/link';
import AiTutorWidget from '@/components/AiTutorWidget';

// ─── Shared style constant ───────────────────────────────────────────────────
const darkGrad = { background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' };

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const cfg = {
        completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        'in-progress': { label: 'In Progress', cls: 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border-[var(--theme-primary)]/30' },
        locked: { label: 'Locked', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
        pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    };
    const c = cfg[status] || cfg.pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.04em] border ${c.cls}`}>
            {status === 'completed' && <CheckCircle className="w-3 h-3" />}
            {status === 'in-progress' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)] animate-pulse inline-block" />}
            {status === 'locked' && <Lock className="w-3 h-3" />}
            {c.label}
        </span>
    );
}

// ─── Circular Progress ───────────────────────────────────────────────────────
function CircularProgress({ pct, completed, total, size = 120 }) {
    const r = 48, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle cx="60" cy="60" r={r} fill="none" stroke="url(#pg)" strokeWidth="8"
                        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                        transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                    <defs>
                        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--theme-primary)" /><stop offset="100%" stopColor="var(--theme-accent)" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-800">{pct}%</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Done</span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-sm font-bold text-slate-700">{completed}/{total}</p>
                <p className="text-xs text-slate-400">Lessons Completed</p>
            </div>
        </div>
    );
}

// ─── Quiz Score Row ──────────────────────────────────────────────────────────
function QuizScoreRow({ title, score }) {
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-[var(--theme-primary)]/20 flex items-center justify-center shrink-0">
                <FileQuestion className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{title}</p>
                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
                </div>
            </div>
            <span className="text-xs font-black text-slate-700 shrink-0">{score}%</span>
        </div>
    );
}

// ─── Dark gradient button helper ─────────────────────────────────────────────
function DBtn({ children, onClick, disabled, className = '', type = 'button', style: extraStyle = {} }) {
    return (
        <button type={type} onClick={onClick} disabled={disabled}
            className={`text-white font-black rounded-2xl transition-all hover:opacity-90 disabled:opacity-50 ${className}`}
            style={{ ...darkGrad, ...extraStyle }}>
            {children}
        </button>
    );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function CourseDetailPage({ params }) {
    const router = useRouter();
    const { id } = use(params);

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [exams, setExams] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [myReview, setMyReview] = useState(null);
    const [ratingDistribution, setRatingDistribution] = useState([]);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isInstructor, setIsInstructor] = useState(false);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [curriculumTab, setCurriculumTab] = useState('lessons');
    const [courseProgress, setCourseProgress] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [quizScores, setQuizScores] = useState([]);
    const [sortBy, setSortBy] = useState('recent');
    const [expandedModules, setExpandedModules] = useState([]);
    const [liveClasses, setLiveClasses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreReviews, setHasMoreReviews] = useState(true);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [showExamHistoryModal, setShowExamHistoryModal] = useState(false);
    const [showLessonPlayerModal, setShowLessonPlayerModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [lessonPage, setLessonPage] = useState(1);
    const [aiWidgetOpen, setAiWidgetOpen] = useState(false);
    const LESSONS_PER_PAGE = 6;
    const { confirmDialog } = useConfirm();

    const [aiLoading, setAiLoading] = useState(null);
    const [aiResult, setAiResult] = useState(null);
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

    const checkWishlistStatus = async () => {
        try { const { data } = await api.get(`/wishlist/${id}/status`); setIsWishlisted(data.inWishlist); } catch (_) { }
    };
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
    const toggleHelpful = async (reviewId) => { try { await api.post(`/reviews/${reviewId}/helpful`); loadReviews(); } catch (_) { } };
    const toggleModule = (moduleId) => setExpandedModules(prev => prev.includes(moduleId) ? prev.filter(i => i !== moduleId) : [...prev, moduleId]);
    const getLessonsByModule = (moduleId) => lessons.filter(l => (l.moduleId?._id || l.moduleId)?.toString() === moduleId?.toString()).sort((a, b) => (a.order || 0) - (b.order || 0));
    const isLessonLocked = (lesson) => !isInstructor && !isEnrolled && !lesson.isFree;
    const handleLessonClick = (lesson) => {
        if (isLessonLocked(lesson)) { toast.error('Enroll to access this lesson'); return; }
        setSelectedLessonIndex(lessons.findIndex(l => l._id === lesson._id));
        setShowLessonPlayerModal(true);
    };
    const handleExamClick = (exam) => { setSelectedExam(exam); setShowExamHistoryModal(true); };
    const handleStartExam = () => { if (selectedExam) { setShowExamHistoryModal(false); router.push(`/student/exams/${selectedExam._id}`); } };
    const handleLessonComplete = async () => { await loadCourseData(true); };
    const handleAISummarize = async () => {
        if (!course) return; setAiLoading('summarize'); setShowAiPanel(true);
        try { const res = await api.post('/ai/summarize-lesson', { courseId: course._id, lessonTitle: course.title, content: course.description }); setAiResult({ type: 'AI Summary', content: res.data.summary || res.data.data }); }
        catch (e) { toast.error(e.response?.data?.message || 'Failed'); setShowAiPanel(false); } finally { setAiLoading(null); }
    };
    const handleAIRevisionNotes = async () => {
        if (!course) return; setAiLoading('revision'); setShowAiPanel(true);
        try { const res = await api.post('/ai/revision-notes', { courseId: course._id, lessonTitle: course.title, content: course.description }); setAiResult({ type: 'Revision Notes', content: res.data.notes || res.data.data }); }
        catch (e) { toast.error(e.response?.data?.message || 'Failed'); setShowAiPanel(false); } finally { setAiLoading(null); }
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const completedIds = (courseProgress?.progress || []).filter(p => p.completed).map(p => p.lessonId?.toString());
    const completedCount = completedIds.length;
    const totalLessons = lessons.length;
    const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
    const pct = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
    const currentLesson = lessons[selectedLessonIndex] || lessons[0];
    const nextLesson = lessons[(selectedLessonIndex + 1 < totalLessons) ? selectedLessonIndex + 1 : -1];
    const isCourseSuspended = course && (course.status !== 'published' || !course?.tutorId?.isVerified || course?.tutorId?.userId?.isBlocked);
    const pagedLessons = lessons.slice((lessonPage - 1) * LESSONS_PER_PAGE, lessonPage * LESSONS_PER_PAGE);
    const totalLessonPages = Math.ceil(totalLessons / LESSONS_PER_PAGE);
    const resumeToFirst = () => { const idx = lessons.findIndex(l => !completedIds.includes(l._id?.toString())); setSelectedLessonIndex(idx >= 0 ? idx : 0); setShowLessonPlayerModal(true); };

    // ── States ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="w-5 h-5 text-[var(--theme-primary)] animate-pulse" /></div>
                </div>
                <p className="text-sm text-slate-400 font-medium">Loading course…</p>
            </div>
        </div>
    );

    if (!course) return (
        <div className="flex h-screen items-center justify-center bg-slate-50" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>
            <div className="text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><X className="w-8 h-8 text-red-400" /></div>
                <h2 className="text-lg font-black text-slate-800 mb-3">Course Not Found</h2>
                <button onClick={() => router.back()} className="px-4 py-2 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50">Go Back</button>
            </div>
        </div>
    );

    const tabs = ['overview', 'lessons', 'assignments', 'discussions', 'resources'];

    return (
        <div className="min-h-screen bg-[var(--theme-background)]" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* Instructor Preview Banner */}
            {isInstructor && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2.5 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider shadow-sm">
                    <Eye className="w-3.5 h-3.5 shrink-0" /> Preview Mode — Videos & content are fully unlocked for you.
                </div>
            )}

            {/* ── Sticky Header ─────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between gap-3 pt-3.5 pb-0">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-sm font-black text-slate-800 truncate">{course.title}</h1>
                            {enrollment?.batchId && (
                                <p className="text-[var(--theme-primary)] text-[11px] font-bold flex items-center gap-1 mt-0.5">
                                    <Users className="w-3 h-3" /> Cohort: {enrollment.batchId.name}
                                </p>
                            )}
                        </div>
                        {(isEnrolled || isInstructor) && (
                            <button onClick={resumeToFirst}
                                className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-white text-[11px] font-black rounded-2xl transition-all hover:opacity-90 shadow-sm"
                                style={darkGrad}>
                                <Play className="w-3 h-3 fill-white" /> Resume
                            </button>
                        )}
                    </div>
                    <div className="flex gap-0 overflow-x-auto mt-3 -mb-px">
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 text-[11px] font-black whitespace-nowrap border-b-2 uppercase tracking-[0.06em] transition-all
                                    ${activeTab === tab ? 'border-[var(--theme-primary)] text-[var(--theme-primary)]' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Suspended Banner */}
            {isCourseSuspended && isEnrolled && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-amber-800 font-black text-sm">Course Suspended</p>
                            <p className="text-amber-700 text-xs mt-0.5">This course is no longer publicly available. You retain full access as an enrolled student.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Grid ─────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
                <div className="grid lg:grid-cols-3 gap-5">

                    {/* LEFT: 2 cols */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* ══ OVERVIEW ════════════════════════════════════ */}
                        {activeTab === 'overview' && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                {/* Progress Hero */}
                                {(isEnrolled || isInstructor) && (
                                    <div className="p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-primary) 100%)' }}>
                                        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-14 h-14 shrink-0">
                                                    <svg width="56" height="56" viewBox="0 0 56 56">
                                                        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
                                                        <circle cx="28" cy="28" r="22" fill="none" stroke="white" strokeWidth="5" strokeDasharray={`${(pct / 100) * 138.2} 138.2`} strokeLinecap="round" transform="rotate(-90 28 28)" />
                                                    </svg>
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">{pct}%</span>
                                                </div>
                                                <div>
                                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.08em]">Current Lesson</p>
                                                    <p className="font-black text-white text-sm leading-tight mt-0.5">{currentLesson?.title || 'Start Learning'}</p>
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        <img src={course.tutorId?.userId?.profileImage || '/default-avatar.png'} className="w-5 h-5 rounded-full border border-white/30" alt="" />
                                                        <span className="text-white/60 text-[11px]">{course.tutorId?.userId?.name}</span>
                                                        <span className="text-white/40 text-[11px]">·</span>
                                                        <span className="text-white/60 text-[11px]">{completedCount}/{totalLessons} done</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={resumeToFirst} className="px-5 py-2.5 bg-white text-[var(--theme-primary)] rounded-2xl font-black text-xs hover:bg-[var(--theme-primary)]/20 shadow-md flex items-center gap-1.5">
                                                <Play className="w-3.5 h-3.5 fill-[var(--theme-primary)]" /> Resume Course
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 space-y-7">
                                    {/* What you'll learn */}
                                    {course.whatYouWillLearn?.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                                                <span className="p-1.5 bg-yellow-50 rounded-xl"><Zap className="w-4 h-4 text-yellow-500" /></span>
                                                What You'll Learn
                                            </h3>
                                            <div className="grid sm:grid-cols-2 gap-2">
                                                {course.whatYouWillLearn.map((item, i) => (
                                                    <div key={i} className="flex items-start gap-2.5 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                        <span className="text-sm text-slate-700 font-medium">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* About */}
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                                            <span className="p-1.5 bg-blue-50 rounded-xl"><Target className="w-4 h-4 text-blue-500" /></span>
                                            About This Course
                                        </h3>
                                        <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{course.description}</p>
                                    </div>
                                    {/* Requirements */}
                                    {course.requirements?.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 mb-3">Requirements</h3>
                                            <ul className="space-y-2">
                                                {course.requirements.map((req, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)] mt-1.5 shrink-0" />{req}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {/* AI Tools */}
                                    {isEnrolled && (
                                        <div className="pt-4 border-t border-slate-100">
                                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.06em] mb-3 flex items-center gap-2">
                                                <Brain className="w-4 h-4 text-[var(--theme-accent)]" /> AI Study Tools
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                <button onClick={handleAISummarize} disabled={aiLoading === 'summarize'}
                                                    className="flex items-center gap-2 px-4 py-2 text-white text-xs font-black rounded-2xl hover:opacity-90 disabled:opacity-60 transition-all"
                                                    style={{ background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-primary))' }}>
                                                    {aiLoading === 'summarize' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                    Summarize Course
                                                </button>
                                                <button onClick={handleAIRevisionNotes} disabled={aiLoading === 'revision'}
                                                    className="flex items-center gap-2 px-4 py-2 text-white text-xs font-black rounded-2xl hover:opacity-90 disabled:opacity-60 transition-all"
                                                    style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
                                                    {aiLoading === 'revision' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                                                    Generate Revision Notes
                                                </button>
                                            </div>
                                            {showAiPanel && (
                                                <div className="mt-4 bg-gradient-to-br from-[var(--theme-accent)] to-[var(--theme-primary)] rounded-2xl border border-[var(--theme-accent)]/30 p-5">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-black text-[var(--theme-accent)] text-xs flex items-center gap-2"><Brain className="w-3.5 h-3.5" />{aiResult?.type || 'Generating…'}</h4>
                                                        <button onClick={() => setShowAiPanel(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                                                    </div>
                                                    {aiLoading ? (
                                                        <div className="flex items-center gap-3 py-6 justify-center">
                                                            <Loader2 className="w-5 h-5 animate-spin text-[var(--theme-accent)]" />
                                                            <span className="text-[var(--theme-accent)] text-sm font-bold">AI is thinking…</span>
                                                        </div>
                                                    ) : (
                                                        <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap text-sm">{aiResult?.content}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ══ LESSONS ═════════════════════════════════════ */}
                        {activeTab === 'lessons' && (
                            <div className="space-y-4">
                                {(isEnrolled || isInstructor) && (
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 shrink-0">
                                                    <svg width="40" height="40" viewBox="0 0 48 48">
                                                        <circle cx="24" cy="24" r="19" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                                                        <circle cx="24" cy="24" r="19" fill="none" stroke="var(--theme-primary)" strokeWidth="4" strokeDasharray={`${(pct / 100) * 119.4} 119.4`} strokeLinecap="round" transform="rotate(-90 24 24)" />
                                                    </svg>
                                                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-[var(--theme-primary)]">{pct}%</span>
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm">{currentLesson?.title || 'No lesson selected'}</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{completedCount}/{totalLessons} Lessons Done</p>
                                                </div>
                                            </div>
                                            <button onClick={() => { setSelectedLessonIndex(selectedLessonIndex); setShowLessonPlayerModal(true); }}
                                                className="px-4 py-2.5 text-white rounded-2xl font-black text-xs flex items-center gap-1.5 hover:opacity-90 transition-all"
                                                style={darkGrad}>
                                                <Play className="w-3 h-3 fill-white" /> Resume
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
                                                                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all
                                                                        ${locked ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-100'
                                                                            : isAct ? 'bg-[var(--theme-primary)]/20/70 border-[var(--theme-primary)]/30 cursor-pointer'
                                                                                : 'bg-white border-slate-100 hover:border-[var(--theme-primary)]/30 hover:bg-[var(--theme-primary)]/20/30 cursor-pointer'}`}>
                                                                    {isAct && <div className="w-1 h-10 rounded-full shrink-0" style={{ background: 'linear-gradient(180deg,var(--theme-primary),var(--theme-accent))' }} />}
                                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-100' : isAct ? 'bg-[var(--theme-primary)]/20' : 'bg-slate-100'}`}>
                                                                        {isDone ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                                            : lesson.type === 'video' ? <PlayCircle className="w-4 h-4 text-[var(--theme-primary)]" />
                                                                                : lesson.type === 'quiz' ? <FileQuestion className="w-4 h-4 text-amber-500" />
                                                                                    : <FileText className="w-4 h-4 text-slate-400" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-sm font-bold truncate ${isAct ? 'text-[var(--theme-primary)]' : 'text-slate-800'}`}>{gIdx + 1}. {lesson.title}</p>
                                                                        {lesson.duration > 0 && (
                                                                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                                                                                <Clock className="w-3 h-3" />{Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="shrink-0 flex items-center gap-2">
                                                                        <StatusBadge status={status} />
                                                                        {!locked && (
                                                                            <button onClick={e => { e.stopPropagation(); handleLessonClick(lesson); }}
                                                                                className="px-3 py-1.5 text-white text-[10px] font-black rounded-xl hover:opacity-90 flex items-center gap-1 transition-all"
                                                                                style={darkGrad}>
                                                                                {isDone ? <><SkipForward className="w-3 h-3" />Resume</> : <><Play className="w-3 h-3 fill-white" />Play</>}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {totalLessonPages > 1 && (
                                                        <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-slate-100">
                                                            <button onClick={() => setLessonPage(p => Math.max(1, p - 1))} disabled={lessonPage === 1} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
                                                            {Array.from({ length: totalLessonPages }, (_, i) => i + 1).map(pg => (
                                                                <button key={pg} onClick={() => setLessonPage(pg)}
                                                                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${lessonPage === pg ? 'text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                                    style={lessonPage === pg ? darkGrad : {}}>
                                                                    {pg}
                                                                </button>
                                                            ))}
                                                            <button onClick={() => setLessonPage(p => Math.min(totalLessonPages, p + 1))} disabled={lessonPage === totalLessonPages} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
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
                                                            <div key={module._id} className="border-2 border-slate-100 rounded-2xl overflow-hidden">
                                                                <button onClick={() => toggleModule(module._id)}
                                                                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExp ? '' : '-rotate-90'}`} />
                                                                        <span className="font-black text-slate-800 text-sm">{module.title}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] text-slate-400 font-bold">{mDone}/{mLessons.length}</span>
                                                                        {mDone === mLessons.length && mLessons.length > 0 && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                                                    </div>
                                                                </button>
                                                                {isExp && (
                                                                    <div className="divide-y divide-slate-50">
                                                                        {mLessons.map(lesson => {
                                                                            const locked = isLessonLocked(lesson);
                                                                            const isDone = completedIds.includes(lesson._id?.toString());
                                                                            const isAct = lesson._id === currentLesson?._id;
                                                                            const status = locked ? 'locked' : isDone ? 'completed' : isAct ? 'in-progress' : 'pending';
                                                                            return (
                                                                                <div key={lesson._id} onClick={() => !locked && handleLessonClick(lesson)}
                                                                                    className={`flex items-center gap-3 px-5 py-3 transition-all ${locked ? 'opacity-60 cursor-not-allowed' : isAct ? 'bg-[var(--theme-primary)]/20 cursor-pointer' : 'hover:bg-slate-50 cursor-pointer'}`}>
                                                                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                                                                        {isDone ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                                                            : lesson.type === 'video' ? <PlayCircle className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                                                                                                : lesson.type === 'quiz' ? <FileQuestion className="w-3.5 h-3.5 text-amber-500" />
                                                                                                    : <FileText className="w-3.5 h-3.5 text-slate-400" />}
                                                                                    </div>
                                                                                    <span className={`text-sm flex-1 truncate font-medium ${isAct ? 'text-[var(--theme-primary)] font-bold' : 'text-slate-700'}`}>{lesson.title}</span>
                                                                                    <StatusBadge status={status} />
                                                                                    {!locked && (
                                                                                        <button onClick={e => { e.stopPropagation(); handleLessonClick(lesson); }}
                                                                                            className="px-3 py-1 text-white text-[10px] font-black rounded-xl hover:opacity-90 flex items-center gap-1"
                                                                                            style={darkGrad}>
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
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
                                                    <p className="text-white text-sm font-black truncate">{currentLesson.title}</p>
                                                    {completedIds.includes(currentLesson._id?.toString()) && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/90 text-white text-[10px] font-black rounded-full">
                                                            <CheckCircle className="w-3 h-3" /> Completed
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        ) : <span className="text-slate-400 text-sm">Select a lesson to preview</span>}
                                    </div>
                                    {nextLesson && (
                                        <div className="flex items-center gap-4 p-4 border-t border-slate-100">
                                            <div className="w-14 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                <PlayCircle className="w-5 h-5 text-slate-300" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Upcoming</p>
                                                <p className="font-black text-slate-800 text-sm truncate mt-0.5">{nextLesson.title}</p>
                                            </div>
                                            <button onClick={() => { setSelectedLessonIndex(lessons.findIndex(l => l._id === nextLesson._id)); setShowLessonPlayerModal(true); }}
                                                className="px-3 py-1.5 border-2 border-[var(--theme-primary)]/30 text-[var(--theme-primary)] rounded-xl text-[11px] font-black hover:bg-[var(--theme-primary)]/20 flex items-center gap-1 shrink-0">
                                                <Play className="w-3 h-3 fill-[var(--theme-primary)]" /> Play
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ══ ASSIGNMENTS ═════════════════════════════════ */}
                        {activeTab === 'assignments' && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                                <h3 className="text-sm font-black text-slate-800">Assignments</h3>
                                {(!isEnrolled && !isInstructor) ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <Lock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                        <p className="text-slate-600 font-bold text-sm mb-4">Enroll to access assignments</p>
                                        <DBtn onClick={handleEnroll} className="px-5 py-2.5 text-xs">Enroll Now</DBtn>
                                    </div>
                                ) : assignments.length > 0 ? assignments.map(assignment => {
                                    const sub = assignment.mySubmission;
                                    const isGraded = sub?.status === 'graded';
                                    const isSubmitted = sub?.status === 'submitted';
                                    return (
                                        <div key={assignment._id} onClick={() => router.push(`/student/courses/${id}/assignments/${assignment._id}`)}
                                            className="flex items-start gap-4 p-4 border-2 border-slate-100 rounded-2xl hover:border-[var(--theme-primary)]/30 hover:shadow-sm transition-all cursor-pointer group">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 ${isGraded ? 'bg-emerald-500' : isSubmitted ? 'bg-amber-500' : 'bg-[var(--theme-primary)]'}`}>
                                                <ClipboardList className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-black text-slate-800 text-sm group-hover:text-[var(--theme-primary)] transition-colors">{assignment.title}</h4>
                                                    {isGraded ? <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200">{sub.grade}/{assignment.totalMarks}</span>
                                                        : isSubmitted ? <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full border border-amber-200">Submitted</span>
                                                            : <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full">Pending</span>}
                                                </div>
                                                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                                                    {assignment.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due {new Date(assignment.dueDate).toLocaleDateString()}</span>}
                                                    <span className="flex items-center gap-1"><Award className="w-3 h-3 text-[var(--theme-primary)]/70" />{assignment.totalMarks} pts</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                        <p className="text-slate-400 text-sm font-medium">No assignments yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ DISCUSSIONS ═════════════════════════════════ */}
                        {activeTab === 'discussions' && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                                {/* Rating hero */}
                                <div className="flex items-start gap-6 p-5 rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-sidebar) 100%)' }}>
                                    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                    <div className="relative text-center shrink-0">
                                        <div className="text-5xl font-black text-white mb-1">{course.rating?.toFixed(1)}</div>
                                        <div className="flex gap-0.5 justify-center mb-1">
                                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(course.rating) ? 'text-amber-400 fill-amber-400' : 'text-white/25 fill-white/25'}`} />)}
                                        </div>
                                        <p className="text-[10px] text-[var(--theme-primary)]/70 font-bold">{course.reviewCount} reviews</p>
                                    </div>
                                    <div className="relative flex-1 space-y-2">
                                        {ratingDistribution.map(dist => (
                                            <div key={dist.rating} className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-[var(--theme-primary)]/70 w-5">{dist.rating}★</span>
                                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[var(--theme-primary)]/20 rounded-full" style={{ width: `${dist.percentage}%`, transition: 'width 0.6s ease' }} />
                                                </div>
                                                <span className="text-[10px] text-[var(--theme-primary)]/70 w-4 text-right font-medium">{dist.count}</span>
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
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.06em]">Sort:</span>
                                    {['recent', 'helpful', 'rating'].map(s => (
                                        <button key={s} onClick={() => setSortBy(s)}
                                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all capitalize ${sortBy === s ? 'text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            style={sortBy === s ? darkGrad : {}}>
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {reviews.length > 0 ? (
                                    <div className="space-y-3">
                                        {reviews.map(review => (
                                            <div key={review._id} className={`p-5 rounded-2xl border-2 transition-all ${review._id === myReview?._id ? 'border-[var(--theme-primary)]/30 bg-[var(--theme-primary)]/20/40' : 'border-slate-100 hover:shadow-sm'}`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <img src={review.student?.profileImage || '/default-avatar.png'} alt="" className="w-9 h-9 rounded-2xl border-2 border-white shadow-sm" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-black text-slate-800 text-sm">{review.student?.name}</p>
                                                                {review._id === myReview?._id && <span className="px-2 py-0.5 text-white text-[9px] font-black rounded-full" style={darkGrad}>You</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />)}
                                                                <span className="text-[10px] text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {review._id === myReview?._id && (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => { setReviewForm({ rating: review.rating, comment: review.comment }); setShowReviewModal(true); }} className="p-1.5 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/20 rounded-xl"><Edit3 className="w-3.5 h-3.5" /></button>
                                                            <button onClick={handleDeleteReview} className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                                                {review.tutorResponse && (
                                                    <div className="mt-3 p-3 bg-[var(--theme-primary)]/20 border-l-[3px] border-[var(--theme-primary)]/30 rounded-r-2xl">
                                                        <p className="text-[10px] font-black text-[var(--theme-primary)] mb-1 uppercase tracking-wider flex items-center gap-1"><Award className="w-3 h-3" />Instructor</p>
                                                        <p className="text-xs text-slate-700 font-medium">{review.tutorResponse.comment}</p>
                                                    </div>
                                                )}
                                                {review._id !== myReview?._id && (
                                                    <button onClick={() => toggleHelpful(review._id)} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-bold text-slate-600">
                                                        <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({review.helpfulCount || 0})
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {hasMoreReviews && (
                                            <button onClick={() => loadReviews(true)} disabled={loadingReviews}
                                                className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-[var(--theme-primary)]/30 hover:bg-[var(--theme-primary)]/20/50 text-slate-400 text-xs font-black rounded-2xl transition-all">
                                                {loadingReviews ? 'Loading…' : 'Load More Reviews'}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                                        <p className="text-slate-400 text-sm font-medium">No reviews yet. Be the first!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ RESOURCES ════════════════════════════════════ */}
                        {activeTab === 'resources' && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                                <h3 className="text-sm font-black text-slate-800">Course Resources</h3>
                                {(() => {
                                    // Aggregate all resources from all lessons
                                    const groupedResources = lessons.map(l => {
                                        const lessonRes = [];
                                        const c = typeof l.content === 'object' ? l.content : {};
                                        if (c.attachments?.length) lessonRes.push(...c.attachments);
                                        if (c.documents?.length) lessonRes.push(...c.documents);
                                        return { lessonId: l._id, title: l.title, resources: lessonRes };
                                    }).filter(g => g.resources.length > 0);

                                    if (groupedResources.length === 0) {
                                        return (
                                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                                <p className="text-slate-400 text-sm font-medium">No resources available for this course.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-6">
                                            {groupedResources.map((group, idx) => (
                                                <div key={group.lessonId} className="space-y-3">
                                                    <h4 className="font-bold border-b border-slate-100 pb-2 text-slate-800 flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-lg bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] flex items-center justify-center text-xs font-black">{idx + 1}</span>
                                                        {group.title}
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {group.resources.map((res, i) => (
                                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[var(--theme-primary)]/30 hover:shadow-sm transition-all group">
                                                                <div className="flex items-center gap-4 min-w-0">
                                                                    <div className="w-10 h-10 bg-[var(--theme-primary)]/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[var(--theme-primary)]/20 transition-colors">
                                                                        <FileText className="w-5 h-5 text-[var(--theme-primary)]" />
                                                                    </div>
                                                                    <div className="min-w-0 pr-4">
                                                                        <p className="font-bold text-slate-700 text-sm truncate group-hover:text-[var(--theme-primary)] transition-colors">{res.name || 'Document'}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.type?.split('/')[1] || 'File'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <a href={res.url} target="_blank" rel="noopener noreferrer"
                                                                    className="px-4 py-2 text-[11px] font-black text-[var(--theme-primary)] bg-[var(--theme-primary)]/5 border-2 border-[var(--theme-primary)]/20 rounded-xl hover:bg-[var(--theme-primary)]/20 hover:border-[var(--theme-primary)]/30 transition-all shrink-0">
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

                        {/* Progress + Info + Quiz (Lessons tab only) */}
                        {activeTab === 'lessons' && (isEnrolled || isInstructor) && (
                            <>
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-black text-slate-800 text-sm">Progress</h3>
                                        <span className="text-xs font-black text-[var(--theme-primary)]">{completedCount}/{totalLessons}</span>
                                    </div>
                                    <CircularProgress pct={pct} completed={completedCount} total={totalLessons} />
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                    <h3 className="font-black text-slate-800 text-sm mb-4">Course Info</h3>
                                    <div className="flex items-center gap-3 mb-3">
                                        <img src={course.tutorId?.userId?.profileImage || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-2xl border border-slate-100" />
                                        <p className="font-black text-slate-800 text-sm">{course.tutorId?.userId?.name || 'Instructor'}</p>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium">Updated: {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : '—'}</p>
                                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium"><Users className="w-3 h-3" /> {(course.enrolledCount || 0).toLocaleString()} Students</p>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 bg-[var(--theme-primary)]/20 rounded-lg flex items-center justify-center"><BarChart2 className="w-3.5 h-3.5 text-[var(--theme-primary)]" /></div>
                                        <h3 className="font-black text-slate-800 text-sm">Quiz Performance</h3>
                                    </div>
                                    <div className="space-y-3.5">
                                        {quizScores.map((q, i) => <QuizScoreRow key={i} title={q.title} score={q.score} />)}
                                        {quizScores.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No quiz attempts yet</p>}
                                    </div>
                                    <Link href={`/student/courses/${id}`} className="text-[11px] font-black text-[var(--theme-primary)] mt-4 inline-flex items-center gap-1">
                                        View All <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </>
                        )}

                        {/* Enrollment / Pricing Card */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="aspect-video relative overflow-hidden bg-slate-100 group">
                                <img src={course.thumbnail || 'https://via.placeholder.com/640x360'} alt={course.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30">
                                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                        <Play className="w-6 h-6 text-[var(--theme-primary)] fill-[var(--theme-primary)] ml-0.5" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-2xl font-black text-slate-800">{course.isFree ? 'Free' : `₹${course.price}`}</span>
                                    {course.oldPrice && !course.isFree && (
                                        <>
                                            <span className="text-base text-slate-400 line-through">₹{course.oldPrice}</span>
                                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
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
                                    <div className="w-full py-3 bg-emerald-500 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Enrolled
                                    </div>
                                )}
                                <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">30-Day Money-Back Guarantee</p>
                            </div>
                        </div>

                        {/* Course Includes */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <h3 className="font-black text-slate-800 text-sm mb-4">This Course Includes</h3>
                            <div className="space-y-2">
                                {[
                                    { icon: <PlayCircle className="w-4 h-4 text-[var(--theme-primary)]" />, label: `${totalLessons} video lessons`, bg: 'bg-[var(--theme-primary)]/20' },
                                    { icon: <Clock className="w-4 h-4 text-[var(--theme-accent)]" />, label: `${Math.round(totalDuration / 3600)}h on-demand`, bg: 'bg-[var(--theme-accent)]/20' },
                                    { icon: <Download className="w-4 h-4 text-emerald-600" />, label: 'Downloadable resources', bg: 'bg-emerald-50' },
                                    { icon: <Trophy className="w-4 h-4 text-amber-500" />, label: 'Certificate of completion', bg: 'bg-amber-50' },
                                    { icon: <Globe className="w-4 h-4 text-blue-500" />, label: 'Lifetime access', bg: 'bg-blue-50' },
                                ].map((item, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-2.5 ${item.bg} rounded-xl`}>
                                        {item.icon}
                                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Instructor */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <h3 className="font-black text-slate-800 text-sm mb-4 pb-3 border-b border-slate-100">Course Instructor</h3>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-100 mb-3">
                                    <img src={course.tutorId?.userId?.profileImage || '/default-avatar.png'} alt="" className="w-full h-full object-cover" />
                                </div>
                                <h4 className="font-black text-slate-800 text-sm">{course.tutorId?.userId?.name || 'Unknown'}</h4>
                                {course.tutorId?.experience && <p className="text-[11px] font-bold text-[var(--theme-primary)] mt-1">{course.tutorId.experience} Years Experience</p>}
                                {course.tutorId?.bio && <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{course.tutorId.bio}</p>}
                            </div>
                            <button onClick={() => router.push(`/tutor/${course.tutorId?._id}`)}
                                className="w-full mt-4 py-2 border-2 border-[var(--theme-primary)]/30 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/20 text-xs font-black rounded-2xl transition-colors">
                                View Full Profile
                            </button>
                        </div>
                    </div>
                </div >
            </div >

            {/* ══ MODALS ══════════════════════════════════════════════════ */}
            {
                showLessonPlayerModal && lessons[selectedLessonIndex] && (
                    <LessonPlayerModal lessons={lessons} modules={course.modules} reviews={reviews}
                        initialIndex={selectedLessonIndex} courseId={id}
                        onClose={() => setShowLessonPlayerModal(false)} onLessonComplete={handleLessonComplete} />
                )
            }
            {
                showExamHistoryModal && selectedExam && (
                    <ExamHistoryModal exam={selectedExam} onClose={() => setShowExamHistoryModal(false)}
                        onViewAttempt={data => { setSelectedResult(data); setShowExamHistoryModal(false); setShowResultModal(true); }}
                        onStartExam={handleStartExam} />
                )
            }
            {
                showResultModal && selectedResult && (
                    <ExamResultModal result={selectedResult} onClose={() => { setShowResultModal(false); setShowExamHistoryModal(true); }} />
                )
            }

            {/* Review Modal */}
            {
                showReviewModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-100 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                                <div className="relative flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-black text-white">{myReview ? 'Edit Review' : 'Write a Review'}</h3>
                                        <p className="text-[var(--theme-primary)]/70 text-xs mt-0.5 font-medium">{course.title}</p>
                                    </div>
                                    <button onClick={() => { setShowReviewModal(false); setReviewForm({ rating: 0, comment: '' }); }}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl"><X className="w-4 h-4 text-white" /></button>
                                </div>
                            </div>
                            <form onSubmit={handleSubmitReview} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.08em] mb-3">Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(r => (
                                            <button key={r} type="button" onClick={() => setReviewForm(prev => ({ ...prev, rating: r }))} className="transition-transform hover:scale-125">
                                                <Star className={`w-9 h-9 ${r <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                            </button>
                                        ))}
                                    </div>
                                    {reviewForm.rating > 0 && <p className="mt-2 text-[11px] font-black text-[var(--theme-primary)] uppercase tracking-wider">{['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating - 1]}</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.08em] mb-2">Your Review</label>
                                    <textarea value={reviewForm.comment} onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                        rows={5} maxLength={500}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent text-sm resize-none font-medium"
                                        placeholder="Share your experience…" />
                                    <p className="text-[11px] text-slate-400 mt-1 text-right">{reviewForm.comment.length}/500</p>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => { setShowReviewModal(false); setReviewForm({ rating: 0, comment: '' }); }}
                                        className="flex-1 py-2.5 border-2 border-slate-200 text-slate-700 font-black rounded-2xl text-sm hover:bg-slate-50">Cancel</button>
                                    <DBtn type="submit" disabled={submittingReview || reviewForm.rating === 0 || reviewForm.comment.trim().length < 10} className="flex-1 py-2.5 text-sm">
                                        {submittingReview ? 'Submitting…' : myReview ? 'Update Review' : 'Submit Review'}
                                    </DBtn>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {course && <ReportAbuseModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} targetId={course._id} targetType="Course" />}

            {/* ── Floating AI Button ────────────────────────────────────── */}
            <button onClick={() => setAiWidgetOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 text-white text-sm font-bold rounded-2xl shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                <div className="relative">
                    <Bot className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
               Sapience Course Assistant
            </button>

            {/* ── AI Drawer ─────────────────────────────────────────────── */}
            {
                aiWidgetOpen && (
                    <>
                        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setAiWidgetOpen(false)} />
                        <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-[85vh] sm:h-[600px] sm:bottom-6 sm:right-6 sm:rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
                            style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>
                            <div className="px-5 py-4 flex items-center justify-between relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-sidebar) 100%)' }}>
                                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                                <div className="relative flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center"><Bot className="w-4 h-4 text-[var(--theme-primary)]/70" /></div>
                                    <div>
                                        <p className="text-sm font-black text-white">Sapience Course Assistant</p>
                                        <p className="text-[11px] text-[var(--theme-primary)]/70 font-medium">Ask anything about this course</p>
                                    </div>
                                </div>
                                <button onClick={() => setAiWidgetOpen(false)} className="relative w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
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
                )
            }
        </div >
    );
}