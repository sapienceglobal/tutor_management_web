'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    PlayCircle, CheckCircle, Lock, Clock, Star, FileQuestion, Award, Users,
    Download, MessageSquare, ThumbsUp, ChevronDown, Edit3, Trash2,
    Zap, Target, Calendar, X, Video, Sparkles, Trophy, Globe,
    ShieldAlert, Eye, ClipboardList, Brain, FileText, Loader2,
    ChevronLeft, ChevronRight, BookOpen, BarChart2, Layers,
    AlertCircle, Play, SkipForward, Volume2, Maximize2
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

// ─── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const cfg = {
        completed: { label: 'Completed', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        'in-progress': { label: 'In Progress', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
        locked: { label: 'Locked', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
        pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    };
    const c = cfg[status] || cfg.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.cls}`}>
            {status === 'completed' && <CheckCircle className="w-3 h-3" />}
            {status === 'in-progress' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />}
            {status === 'locked' && <Lock className="w-3 h-3" />}
            {c.label}
        </span>
    );
}

// ─── Circular Progress ───────────────────────────────────────────────────────
function CircularProgress({ pct, completed, total, size = 120 }) {
    const r = 48;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                        cx="60" cy="60" r={r} fill="none"
                        stroke="url(#prog-grad)" strokeWidth="8"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        style={{ transition: 'stroke-dasharray 0.6s ease' }}
                    />
                    <defs>
                        <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-800">{pct}%</span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Lessons</span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">{completed}/{total}</p>
                <p className="text-xs text-slate-500">Lessons Completed</p>
            </div>
        </div>
    );
}

// ─── Quiz Score Row ──────────────────────────────────────────────────────────
function QuizScoreRow({ title, score }) {
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <FileQuestion className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{title}</p>
                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, backgroundColor: color }} />
                </div>
            </div>
            <span className="text-xs font-bold text-slate-700 shrink-0">{score}%</span>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
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
    const LESSONS_PER_PAGE = 6;
    const { confirmDialog } = useConfirm();

    // AI state
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
                    lessonsData.forEach(l => {
                        const mid = getModId(l);
                        if (!byModule[mid]) byModule[mid] = [];
                        byModule[mid].push(l);
                    });
                    courseData.modules.forEach(m => {
                        const mid = m._id.toString();
                        if (byModule[mid]) {
                            sorted = [...sorted, ...byModule[mid].sort((a, b) => (a.order || 0) - (b.order || 0))];
                            delete byModule[mid];
                        }
                    });
                    Object.keys(byModule).forEach(k => {
                        sorted = [...sorted, ...byModule[k].sort((a, b) => (a.order || 0) - (b.order || 0))];
                    });
                    lessonsData = sorted;
                } else {
                    lessonsData.sort((a, b) => (a.order || 0) - (b.order || 0));
                }
                setCourse(courseData);
                setLessons(lessonsData);
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
                toast.error(error.response.data.message);
                router.push('/tutor/dashboard');
            }
        } finally {
            if (!background) setLoading(false);
        }
    };

    const loadReviews = async (loadMore = false) => {
        if (loadingReviews) return;
        try {
            setLoadingReviews(true);
            if (!myReview && isEnrolled) {
                try {
                    const r = await api.get(`/reviews/my-review/${id}`);
                    if (r.data.success && r.data.review) setMyReview(r.data.review);
                } catch (_) {}
            }
            const page = loadMore ? currentPage + 1 : 1;
            const response = await api.get(`/reviews/course/${id}`, { params: { page, limit: 10, sortBy } });
            if (response.data.success) {
                if (loadMore) setReviews(prev => [...prev, ...response.data.reviews]);
                else { setReviews(response.data.reviews); setRatingDistribution(response.data.ratingDistribution || []); }
                setHasMoreReviews(response.data.pagination?.hasMore || false);
                setCurrentPage(page);
            }
        } catch (e) { console.error(e); }
        finally { setLoadingReviews(false); }
    };

    const checkWishlistStatus = async () => {
        try { const { data } = await api.get(`/wishlist/${id}/status`); setIsWishlisted(data.inWishlist); }
        catch (_) {}
    };

    const toggleWishlist = async () => {
        try {
            setWishlistLoading(true);
            if (isWishlisted) { await api.delete(`/wishlist/${id}`); setIsWishlisted(false); }
            else { await api.post('/wishlist', { courseId: id }); setIsWishlisted(true); }
        } catch (_) {} finally { setWishlistLoading(false); }
    };

    const handleEnroll = async () => {
        const isPaidCourse = Boolean(course && !course.isFree && Number(course.price || 0) > 0);
        if (isPaidCourse) {
            router.push(`/student/checkout/${id}`);
            return;
        }

        try {
            setEnrolling(true);
            const response = await api.post('/enrollments', { courseId: id });
            if (response.data.success) { setIsEnrolled(true); loadCourseData(); }
        } catch (e) {
            const requiresPayment = e.response?.status === 402 || e.response?.data?.requiresPayment;
            if (requiresPayment) {
                toast('This is a paid course. Redirecting to secure checkout...', { icon: '💳' });
                router.push(`/student/checkout/${id}`);
                return;
            }
            toast.error(e.response?.data?.message || 'Failed to enroll');
        }
        finally { setEnrolling(false); }
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

    const toggleHelpful = async (reviewId) => {
        try { await api.post(`/reviews/${reviewId}/helpful`); loadReviews(); } catch (_) {}
    };

    const toggleModule = (moduleId) => {
        setExpandedModules(prev => prev.includes(moduleId) ? prev.filter(i => i !== moduleId) : [...prev, moduleId]);
    };

    const getLessonsByModule = (moduleId) =>
        lessons.filter(l => (l.moduleId?._id || l.moduleId)?.toString() === moduleId?.toString())
            .sort((a, b) => (a.order || 0) - (b.order || 0));

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
        if (!course) return;
        setAiLoading('summarize'); setShowAiPanel(true);
        try {
            const res = await api.post('/ai/summarize-lesson', { courseId: course._id, lessonTitle: course.title, content: course.description });
            setAiResult({ type: 'AI Summary', content: res.data.summary || res.data.data });
        } catch (e) { toast.error(e.response?.data?.message || 'Failed'); setShowAiPanel(false); }
        finally { setAiLoading(null); }
    };

    const handleAIRevisionNotes = async () => {
        if (!course) return;
        setAiLoading('revision'); setShowAiPanel(true);
        try {
            const res = await api.post('/ai/revision-notes', { courseId: course._id, lessonTitle: course.title, content: course.description });
            setAiResult({ type: 'Revision Notes', content: res.data.notes || res.data.data });
        } catch (e) { toast.error(e.response?.data?.message || 'Failed'); setShowAiPanel(false); }
        finally { setAiLoading(null); }
    };

    // ── Derived values ─────────────────────────────────────────────────────
    const completedIds = (courseProgress?.progress || []).filter(p => p.completed).map(p => p.lessonId?.toString());
    const completedCount = completedIds.length;
    const totalLessons = lessons.length;
    const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
    const pct = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
    const currentLesson = lessons[selectedLessonIndex] || lessons[0];
    const nextLesson = lessons[(selectedLessonIndex + 1 < totalLessons) ? selectedLessonIndex + 1 : -1];
    const isTutorVerified = course?.tutorId?.isVerified;
    const isTutorBlocked = course?.tutorId?.userId?.isBlocked;
    const isCourseSuspended = course && (course.status !== 'published' || !isTutorVerified || isTutorBlocked);

    // Paginated lessons
    const pagedLessons = lessons.slice((lessonPage - 1) * LESSONS_PER_PAGE, lessonPage * LESSONS_PER_PAGE);
    const totalLessonPages = Math.ceil(totalLessons / LESSONS_PER_PAGE);

    // ── Loading ────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
            <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
                </div>
                <p className="text-slate-600 font-medium">Loading course...</p>
            </div>
        </div>
    );

    if (!course) return (
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
            <div className="text-center">
                <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <X className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Course Not Found</h2>
                <Button onClick={() => router.back()} variant="outline" className="mt-4">Go Back</Button>
            </div>
        </div>
    );

    const tabs = ['overview', 'lessons', 'assignments', 'discussions', 'resources'];

    // ── RENDER ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#f4f5fa]" style={{ fontFamily: "'DM Sans', 'Outfit', sans-serif" }}>

            {/* Instructor Preview Banner */}
            {isInstructor && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold shadow-sm">
                    <Eye className="w-4 h-4 shrink-0" />
                    Preview Mode — Videos & content are fully unlocked for you.
                </div>
            )}

            {/* ── Header Bar ─────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 pb-0">
                        {/* Title */}
                        <div className="min-w-0">
                            <h1 className="text-xl font-bold text-slate-900 truncate">{course.title}</h1>
                            {enrollment?.batchId && (
                                <div className="flex items-center gap-1.5 mt-0.5 text-indigo-600 text-xs font-medium">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>Cohort: {enrollment.batchId.name}</span>
                                </div>
                            )}
                        </div>
                        {/* Resume Button */}
                        {(isEnrolled || isInstructor) && (
                            <button
                                onClick={() => {
                                    const idx = lessons.findIndex(l => !completedIds.includes(l._id?.toString()));
                                    setSelectedLessonIndex(idx >= 0 ? idx : 0);
                                    setShowLessonPlayerModal(true);
                                }}
                                className="shrink-0 flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                            >
                                <Play className="w-4 h-4 fill-white" />
                                Resume Course
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-0 overflow-x-auto mt-3 -mb-px">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${activeTab === tab
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Suspended Banner */}
            {isCourseSuspended && isEnrolled && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-amber-800 font-semibold text-sm">Course Suspended</p>
                            <p className="text-amber-700 text-xs mt-0.5">This course is no longer publicly available. You retain full access as an enrolled student.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Grid ──────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* ── Left / Center (2 cols) ──────────────────────── */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* ══ OVERVIEW TAB ══════════════════════════════ */}
                        {activeTab === 'overview' && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                {/* Course Progress Header Card */}
                                {(isEnrolled || isInstructor) && (
                                    <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-14 h-14 shrink-0">
                                                    <svg width="56" height="56" viewBox="0 0 56 56">
                                                        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="5"/>
                                                        <circle cx="28" cy="28" r="22" fill="none" stroke="white" strokeWidth="5"
                                                            strokeDasharray={`${(pct/100)*138.2} 138.2`} strokeLinecap="round" transform="rotate(-90 28 28)"/>
                                                    </svg>
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{pct}%</span>
                                                </div>
                                                <div>
                                                    <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Current Lesson</p>
                                                    <p className="font-bold text-white text-base leading-tight mt-0.5">{currentLesson?.title || 'Start Learning'}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <img src={course.tutorId?.userId?.profileImage || '/default-avatar.png'} className="w-5 h-5 rounded-full border border-white/50" alt="" />
                                                        <span className="text-white/80 text-xs">{course.tutorId?.userId?.name}</span>
                                                        <span className="text-white/60 text-xs">•</span>
                                                        <span className="text-white/80 text-xs">{completedCount}/{totalLessons} Completed</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedLessonIndex(lessons.findIndex(l => !completedIds.includes(l._id?.toString())) >= 0 ? lessons.findIndex(l => !completedIds.includes(l._id?.toString())) : 0); setShowLessonPlayerModal(true); }}
                                                className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-md flex items-center gap-2"
                                            >
                                                <Play className="w-4 h-4 fill-indigo-600" /> Resume Course
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 space-y-8">
                                    {/* What You'll Learn */}
                                    {course.whatYouWillLearn?.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <span className="p-1.5 bg-yellow-100 rounded-lg"><Zap className="w-4 h-4 text-yellow-600" /></span>
                                                What You'll Learn
                                            </h3>
                                            <div className="grid sm:grid-cols-2 gap-3">
                                                {course.whatYouWillLearn.map((item, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                        <span className="text-sm text-slate-700 font-medium">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* About */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <span className="p-1.5 bg-blue-100 rounded-lg"><Target className="w-4 h-4 text-blue-600" /></span>
                                            About This Course
                                        </h3>
                                        <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{course.description}</p>
                                    </div>

                                    {/* Requirements */}
                                    {course.requirements?.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-3">Requirements</h3>
                                            <ul className="space-y-2">
                                                {course.requirements.map((req, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                                        {req}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* AI Tools */}
                                    {isEnrolled && (
                                        <div className="pt-4 border-t border-slate-100">
                                            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                                                <Brain className="w-4 h-4 text-purple-600" />
                                                AI Study Tools
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    onClick={handleAISummarize}
                                                    disabled={aiLoading === 'summarize'}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                                                >
                                                    {aiLoading === 'summarize' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                    Summarize Course
                                                </button>
                                                <button
                                                    onClick={handleAIRevisionNotes}
                                                    disabled={aiLoading === 'revision'}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                                                >
                                                    {aiLoading === 'revision' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                                    Generate Revision Notes
                                                </button>
                                            </div>
                                            {showAiPanel && (
                                                <div className="mt-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-5">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-bold text-purple-900 text-sm flex items-center gap-2">
                                                            <Brain className="w-4 h-4" />
                                                            {aiResult?.type || 'Generating...'}
                                                        </h4>
                                                        <button onClick={() => setShowAiPanel(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                                                    </div>
                                                    {aiLoading ? (
                                                        <div className="flex items-center gap-3 py-6 justify-center">
                                                            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                                                            <span className="text-purple-600 text-sm font-medium">AI is thinking...</span>
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

                        {/* ══ LESSONS TAB ═══════════════════════════════ */}
                        {activeTab === 'lessons' && (
                            <div className="space-y-5">
                                {/* Progress Header */}
                                {(isEnrolled || isInstructor) && (
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 shrink-0">
                                                    <svg width="48" height="48" viewBox="0 0 48 48">
                                                        <circle cx="24" cy="24" r="19" fill="none" stroke="#e2e8f0" strokeWidth="4"/>
                                                        <circle cx="24" cy="24" r="19" fill="none" stroke="#6366f1" strokeWidth="4"
                                                            strokeDasharray={`${(pct/100)*119.4} 119.4`} strokeLinecap="round" transform="rotate(-90 24 24)"/>
                                                    </svg>
                                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-indigo-600">{pct}%</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{currentLesson?.title || 'No lesson selected'}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <img src={course.tutorId?.userId?.profileImage || '/default-avatar.png'} className="w-5 h-5 rounded-full" alt="" />
                                                        <span className="text-slate-500 text-xs">{course.tutorId?.userId?.name}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">{pct}% Complete &nbsp;|&nbsp; {completedCount}/{totalLessons} Lessons</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedLessonIndex(selectedLessonIndex); setShowLessonPlayerModal(true); }}
                                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors"
                                            >
                                                <Play className="w-4 h-4 fill-white" /> Resume Course
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Lessons Panel */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* Sub tabs */}
                                    <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3">
                                        {['lessons', 'discussions', 'resources'].map(t => (
                                            <button key={t}
                                                onClick={() => setCurriculumTab(t)}
                                                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all capitalize ${curriculumTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                            >
                                                {t.charAt(0).toUpperCase() + t.slice(1)}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-5">
                                        {curriculumTab === 'lessons' && (() => {
                                            const modules = course.modules || [];
                                            if (modules.length === 0) {
                                                // Flat lesson list with pagination
                                                return (
                                                    <>
                                                        <div className="space-y-2">
                                                            {pagedLessons.map((lesson, idx) => {
                                                                const globalIdx = (lessonPage - 1) * LESSONS_PER_PAGE + idx;
                                                                const locked = isLessonLocked(lesson);
                                                                const isCompleted = completedIds.includes(lesson._id?.toString());
                                                                const isActive = lesson._id === currentLesson?._id;
                                                                const status = locked ? 'locked' : isCompleted ? 'completed' : isActive ? 'in-progress' : 'pending';
                                                                return (
                                                                    <div
                                                                        key={lesson._id}
                                                                        onClick={() => !locked && handleLessonClick(lesson)}
                                                                        className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${locked ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200' : isActive ? 'bg-indigo-50 border-indigo-200 cursor-pointer' : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer'}`}
                                                                    >
                                                                        {/* Left accent */}
                                                                        {isActive && <div className="w-1 h-10 bg-indigo-600 rounded-full shrink-0" />}

                                                                        {/* Icon */}
                                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isCompleted ? 'bg-emerald-100' : isActive ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                                                                            {isCompleted ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                                                : lesson.type === 'video' ? <PlayCircle className="w-4 h-4 text-indigo-600" />
                                                                                : lesson.type === 'quiz' ? <FileQuestion className="w-4 h-4 text-amber-600" />
                                                                                : <FileText className="w-4 h-4 text-slate-500" />}
                                                                        </div>

                                                                        {/* Text */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>
                                                                                Lesson {globalIdx + 1}. {lesson.title}
                                                                            </p>
                                                                            {lesson.duration > 0 && (
                                                                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                                                    <Clock className="w-3 h-3" />
                                                                                    {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        {/* Status */}
                                                                        <div className="shrink-0 flex items-center gap-2">
                                                                            <StatusBadge status={status} />
                                                                            {!locked && (
                                                                                <button
                                                                                    onClick={e => { e.stopPropagation(); handleLessonClick(lesson); }}
                                                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                                                                                >
                                                                                    {isCompleted ? <><SkipForward className="w-3 h-3" /> Resume</> : <><Play className="w-3 h-3 fill-white" /> Play</>}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        {/* Pagination */}
                                                        {totalLessonPages > 1 && (
                                                            <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-slate-100">
                                                                <button onClick={() => setLessonPage(p => Math.max(1, p - 1))} disabled={lessonPage === 1}
                                                                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                                                                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                                                                </button>
                                                                {Array.from({ length: totalLessonPages }, (_, i) => i + 1).map(pg => (
                                                                    <button key={pg} onClick={() => setLessonPage(pg)}
                                                                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${lessonPage === pg ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                                                        {pg}
                                                                    </button>
                                                                ))}
                                                                <button onClick={() => setLessonPage(p => Math.min(totalLessonPages, p + 1))} disabled={lessonPage === totalLessonPages}
                                                                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                                                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            }
                                            // Modular lesson list
                                            return (
                                                <div className="space-y-3">
                                                    {modules.map(module => {
                                                        const moduleLessons = getLessonsByModule(module._id);
                                                        const modCompleted = moduleLessons.filter(l => completedIds.includes(l._id?.toString())).length;
                                                        const isExpanded = expandedModules.includes(module._id);
                                                        return (
                                                            <div key={module._id} className="border border-slate-200 rounded-xl overflow-hidden">
                                                                <button
                                                                    onClick={() => toggleModule(module._id)}
                                                                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                                                        <span className="font-semibold text-slate-800 text-sm">{module.title}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-slate-500">{modCompleted}/{moduleLessons.length} lessons</span>
                                                                        {modCompleted === moduleLessons.length && moduleLessons.length > 0 && (
                                                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                                        )}
                                                                    </div>
                                                                </button>
                                                                {isExpanded && (
                                                                    <div className="divide-y divide-slate-100">
                                                                        {moduleLessons.map((lesson) => {
                                                                            const locked = isLessonLocked(lesson);
                                                                            const isCompleted = completedIds.includes(lesson._id?.toString());
                                                                            const isActive = lesson._id === currentLesson?._id;
                                                                            const status = locked ? 'locked' : isCompleted ? 'completed' : isActive ? 'in-progress' : 'pending';
                                                                            return (
                                                                                <div
                                                                                    key={lesson._id}
                                                                                    onClick={() => !locked && handleLessonClick(lesson)}
                                                                                    className={`flex items-center gap-3 px-5 py-3 transition-all ${locked ? 'opacity-60 cursor-not-allowed' : isActive ? 'bg-indigo-50 cursor-pointer' : 'hover:bg-slate-50 cursor-pointer'}`}
                                                                                >
                                                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isCompleted ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                                                                        {isCompleted ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                                                            : lesson.type === 'video' ? <PlayCircle className="w-3.5 h-3.5 text-indigo-500" />
                                                                                            : lesson.type === 'quiz' ? <FileQuestion className="w-3.5 h-3.5 text-amber-500" />
                                                                                            : <FileText className="w-3.5 h-3.5 text-slate-400" />}
                                                                                    </div>
                                                                                    <span className={`text-sm flex-1 truncate ${isActive ? 'text-indigo-700 font-semibold' : 'text-slate-700'}`}>{lesson.title}</span>
                                                                                    <StatusBadge status={status} />
                                                                                    {!locked && (
                                                                                        <button onClick={e => { e.stopPropagation(); handleLessonClick(lesson); }}
                                                                                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1">
                                                                                            <Play className="w-3 h-3 fill-white" /> Resume
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
                                        {curriculumTab === 'discussions' && <p className="text-sm text-slate-500 py-6 text-center">Use the Discussions tab to see course discussions.</p>}
                                        {curriculumTab === 'resources' && <p className="text-sm text-slate-500 py-6 text-center">Resources and downloads will appear here.</p>}
                                    </div>
                                </div>

                                {/* Video Preview / Next Lesson */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* Video Thumbnail */}
                                    <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                                        {currentLesson ? (
                                            <>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <button
                                                    onClick={() => { setShowLessonPlayerModal(true); }}
                                                    className="relative z-10 w-18 h-18 flex items-center justify-center"
                                                >
                                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50 hover:scale-110 transition-transform">
                                                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                                                    </div>
                                                </button>
                                                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-10">
                                                    <p className="text-white text-sm font-semibold truncate">{currentLesson.title}</p>
                                                    {completedIds.includes(currentLesson._id?.toString()) && (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                                                            <CheckCircle className="w-3 h-3" /> Completed
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-slate-400 text-sm">Select a lesson to preview</span>
                                        )}
                                    </div>

                                    {/* Next Lesson Card */}
                                    {nextLesson && (
                                        <div className="flex items-center gap-4 p-4 border-t border-slate-100">
                                            <div className="w-16 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                                <PlayCircle className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Upcoming Lesson</p>
                                                <p className="font-semibold text-slate-900 text-sm truncate mt-0.5">{nextLesson.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <img src={course.tutorId?.userId?.profileImage || '/default-avatar.png'} className="w-4 h-4 rounded-full" alt="" />
                                                    <span className="text-xs text-slate-500">{course.tutorId?.userId?.name}</span>
                                                    {nextLesson && completedIds.includes(nextLesson._id?.toString()) && (
                                                        <><CheckCircle className="w-3 h-3 text-emerald-500" /><span className="text-xs text-emerald-600">Completed</span></>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedLessonIndex(lessons.findIndex(l => l._id === nextLesson._id)); setShowLessonPlayerModal(true); }}
                                                className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-1.5 shrink-0"
                                            >
                                                <Play className="w-3 h-3 fill-indigo-600" /> Resume
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ══ ASSIGNMENTS TAB ═══════════════════════════ */}
                        {activeTab === 'assignments' && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900">Assignments</h3>
                                {(!isEnrolled && !isInstructor) ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl">
                                        <Lock className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                        <p className="text-slate-600 font-medium text-sm mb-4">Enroll to access assignments</p>
                                        <button onClick={handleEnroll} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm">Enroll Now</button>
                                    </div>
                                ) : assignments.length > 0 ? assignments.map(assignment => {
                                    const sub = assignment.mySubmission;
                                    const isGraded = sub?.status === 'graded';
                                    const isSubmitted = sub?.status === 'submitted';
                                    return (
                                        <div key={assignment._id} onClick={() => router.push(`/student/courses/${id}/assignments/${assignment._id}`)}
                                            className="flex items-start gap-4 p-4 border-2 border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${isGraded ? 'bg-emerald-500' : isSubmitted ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                                                <ClipboardList className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{assignment.title}</h4>
                                                    {isGraded ? (
                                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">{sub.grade}/{assignment.totalMarks} Graded</span>
                                                    ) : isSubmitted ? (
                                                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Submitted</span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Pending</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                                    {assignment.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>}
                                                    <span className="flex items-center gap-1"><Award className="w-3 h-3 text-indigo-400" /> {assignment.totalMarks} Points</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl">
                                        <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                        <p className="text-slate-600 text-sm">No assignments available yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ DISCUSSIONS / REVIEWS TAB ═════════════════ */}
                        {activeTab === 'discussions' && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                                {/* Rating Overview */}
                                <div className="flex items-start gap-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                                    <div className="text-center shrink-0">
                                        <div className="text-5xl font-bold text-slate-900 mb-2">{course.rating?.toFixed(1)}</div>
                                        <div className="flex gap-0.5 justify-center mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-5 h-5 ${i < Math.round(course.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">{course.reviewCount} reviews</p>
                                    </div>
                                    <div className="flex-1 space-y-2.5">
                                        {ratingDistribution.map(dist => (
                                            <div key={dist.rating} className="flex items-center gap-3">
                                                <span className="text-xs font-semibold text-slate-600 w-8">{dist.rating}★</span>
                                                <div className="flex-1 h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${dist.percentage}%`, transition: 'width 0.6s ease' }} />
                                                </div>
                                                <span className="text-xs text-slate-500 w-6 text-right">{dist.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {isEnrolled && (
                                    <button onClick={() => { if (myReview) setReviewForm({ rating: myReview.rating, comment: myReview.comment }); setShowReviewModal(true); }}
                                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity text-sm">
                                        <MessageSquare className="w-4 h-4" />
                                        {myReview ? 'Edit Your Review' : 'Write a Review'}
                                    </button>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-600">Sort by:</span>
                                    {['recent', 'helpful', 'rating'].map(s => (
                                        <button key={s} onClick={() => setSortBy(s)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sortBy === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                {reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {reviews.map(review => (
                                            <div key={review._id} className={`p-5 rounded-2xl border-2 transition-all ${review._id === myReview?._id ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 bg-white hover:shadow-sm'}`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <img src={review.student?.profileImage || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-slate-900 text-sm">{review.student?.name}</p>
                                                                {review._id === myReview?._id && <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">You</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <div className="flex gap-0.5">
                                                                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />)}
                                                                </div>
                                                                <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {review._id === myReview?._id && (
                                                        <div className="flex gap-1.5">
                                                            <button onClick={() => { setReviewForm({ rating: review.rating, comment: review.comment }); setShowReviewModal(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                                                            <button onClick={handleDeleteReview} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-slate-700 text-sm leading-relaxed">{review.comment}</p>
                                                {review.tutorResponse && (
                                                    <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                                                        <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1"><Award className="w-3 h-3" /> Instructor Response</p>
                                                        <p className="text-xs text-slate-700">{review.tutorResponse.comment}</p>
                                                    </div>
                                                )}
                                                {review._id !== myReview?._id && (
                                                    <button onClick={() => toggleHelpful(review._id)} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors text-slate-600">
                                                        <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({review.helpfulCount || 0})
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {hasMoreReviews && (
                                            <button onClick={() => loadReviews(true)} disabled={loadingReviews}
                                                className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 text-sm font-medium rounded-xl transition-all">
                                                {loadingReviews ? 'Loading...' : 'Load More Reviews'}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p className="text-slate-500 text-sm">No reviews yet. Be the first!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ RESOURCES TAB ═════════════════════════════ */}
                        {activeTab === 'resources' && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900">Course Resources</h3>
                                <p className="text-slate-500 text-sm">Downloadable resources and materials. Check individual lessons for attachments.</p>
                                <div className="space-y-2">
                                    {lessons.slice(0, 5).map(l => (
                                        <div key={l._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-indigo-500" />
                                                <span className="font-medium text-slate-800 text-sm">{l.title}</span>
                                            </div>
                                            <button className="px-3 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors">View</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right Sidebar ───────────────────────────────── */}
                    <div className="lg:col-span-1 space-y-5">

                        {/* Progress + Course Info + Quiz (Lessons tab) */}
                        {activeTab === 'lessons' && (isEnrolled || isInstructor) && (
                            <>
                                {/* Lessons Progress */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-900 text-sm">Lessons Progress</h3>
                                        <span className="text-xs font-bold text-indigo-600">{completedCount}/{totalLessons}</span>
                                    </div>
                                    <CircularProgress pct={pct} completed={completedCount} total={totalLessons} />
                                </div>

                                {/* Course Info */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-900 text-sm">Course Info</h3>
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <img src={course.tutorId?.userId?.profileImage || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full border border-slate-200" />
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{course.tutorId?.userId?.name || 'Instructor'}</p>
                                            <p className="text-xs text-slate-500">{course.tutorId?.userId?.name}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Last Activity: {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : '—'}</p>
                                    <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" /> {(course.enrolledCount || 0).toLocaleString()} Students Enrolled
                                    </p>
                                </div>

                                {/* Quiz Performance */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                            <BarChart2 className="w-4 h-4 text-indigo-500" />
                                            Quiz Performance
                                        </h3>
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="space-y-3.5">
                                        {quizScores.map((q, i) => <QuizScoreRow key={i} title={q.title} score={q.score} />)}
                                        {quizScores.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No quiz attempts yet</p>}
                                    </div>
                                    <Link href={`/student/courses/${id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-4 inline-flex items-center gap-1">
                                        View All Scores <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </>
                        )}

                        {/* ── Enrollment / Pricing Card ───────────────── */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Thumbnail */}
                            <div className="aspect-video relative overflow-hidden bg-slate-100 group">
                                <img
                                    src={course.thumbnail || 'https://via.placeholder.com/640x360?text=Course'}
                                    alt={course.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                        <Play className="w-6 h-6 text-indigo-600 fill-indigo-600 ml-0.5" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-2xl font-bold text-slate-900">{course.isFree ? 'Free' : `₹${course.price}`}</span>
                                    {course.oldPrice && !course.isFree && (
                                        <span className="text-base text-slate-400 line-through">₹{course.oldPrice}</span>
                                    )}
                                    {course.oldPrice && !course.isFree && (
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                            {Math.round((1 - course.price / course.oldPrice) * 100)}% OFF
                                        </span>
                                    )}
                                </div>

                                {isInstructor ? (
                                    <button onClick={() => router.push(`/tutor/courses/${id}`)}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                                        <Edit3 className="w-4 h-4" /> Edit Course
                                    </button>
                                ) : !isEnrolled ? (
                                    <button onClick={handleEnroll} disabled={enrolling}
                                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl text-sm transition-opacity disabled:opacity-70">
                                        {enrolling ? 'Processing...' : (course.isFree ? 'Enroll Now' : 'Buy Now')}
                                    </button>
                                ) : (
                                    <div className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Enrolled
                                    </div>
                                )}
                                <p className="text-center text-xs text-slate-400 mt-3">30-Day Money-Back Guarantee</p>
                            </div>
                        </div>

                        {/* ── Course Includes ─────────────────────────── */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                            <h3 className="font-bold text-slate-900 text-sm mb-4">This Course Includes</h3>
                            <div className="space-y-3">
                                {[
                                    { icon: <PlayCircle className="w-4 h-4 text-indigo-600" />, label: `${totalLessons} video lessons`, bg: 'bg-indigo-50' },
                                    { icon: <Clock className="w-4 h-4 text-purple-600" />, label: `${Math.round(totalDuration / 3600)}h on-demand video`, bg: 'bg-purple-50' },
                                    { icon: <Download className="w-4 h-4 text-emerald-600" />, label: 'Downloadable resources', bg: 'bg-emerald-50' },
                                    { icon: <Trophy className="w-4 h-4 text-amber-600" />, label: 'Certificate of completion', bg: 'bg-amber-50' },
                                    { icon: <Globe className="w-4 h-4 text-blue-600" />, label: 'Lifetime access', bg: 'bg-blue-50' },
                                ].map((item, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-3 ${item.bg} rounded-xl`}>
                                        <span>{item.icon}</span>
                                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Instructor Card ─────────────────────────── */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                            <h3 className="font-bold text-slate-900 text-sm mb-4 pb-2 border-b border-slate-100">Course Instructor</h3>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 mb-3">
                                    <img src={course.tutorId?.userId?.profileImage || '/default-avatar.png'} alt="" className="w-full h-full object-cover" />
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm">{course.tutorId?.userId?.name || 'Unknown'}</h4>
                                {course.tutorId?.experience && (
                                    <p className="text-xs font-semibold text-indigo-600 mt-1">{course.tutorId.experience} Years Experience</p>
                                )}
                                {course.tutorId?.bio && (
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{course.tutorId.bio}</p>
                                )}
                            </div>
                            <button onClick={() => router.push(`/tutor/${course.tutorId?._id}`)}
                                className="w-full mt-4 py-2 border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold rounded-xl transition-colors">
                                View Full Profile
                            </button>
                        </div>

                        {/* ── AI Tutor Widget ─────────────────────────── */}
                        <AiTutorWidget
                            title="Course Assistant"
                            subtitle="Curious about this course? Ask away!"
                            context={{ pageType: 'course_details', courseId: course._id }}
                            recommendedTopics={[
                                'What are the prerequisites?',
                                'What are the main learning outcomes?',
                                'Is this suitable for beginners?'
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* ══ MODALS ══════════════════════════════════════════════════ */}
            {showLessonPlayerModal && lessons[selectedLessonIndex] && (
                <LessonPlayerModal
                    lessons={lessons} modules={course.modules} reviews={reviews}
                    initialIndex={selectedLessonIndex} courseId={id}
                    onClose={() => setShowLessonPlayerModal(false)}
                    onLessonComplete={handleLessonComplete}
                />
            )}

            {showExamHistoryModal && selectedExam && (
                <ExamHistoryModal
                    exam={selectedExam}
                    onClose={() => setShowExamHistoryModal(false)}
                    onViewAttempt={data => { setSelectedResult(data); setShowExamHistoryModal(false); setShowResultModal(true); }}
                    onStartExam={handleStartExam}
                />
            )}

            {showResultModal && selectedResult && (
                <ExamResultModal result={selectedResult} onClose={() => { setShowResultModal(false); setShowExamHistoryModal(true); }} />
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{myReview ? 'Edit Review' : 'Write a Review'}</h3>
                                    <p className="text-slate-500 text-sm mt-0.5">{course.title}</p>
                                </div>
                                <button onClick={() => { setShowReviewModal(false); setReviewForm({ rating: 0, comment: '' }); }}
                                    className="p-2 hover:bg-white/70 rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmitReview} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Rating</label>
                                <div className="flex gap-2">
                                    {[1,2,3,4,5].map(r => (
                                        <button key={r} type="button" onClick={() => setReviewForm(prev => ({ ...prev, rating: r }))}
                                            className="transition-transform hover:scale-125 active:scale-110">
                                            <Star className={`w-10 h-10 ${r <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                                        </button>
                                    ))}
                                </div>
                                {reviewForm.rating > 0 && (
                                    <p className="mt-2 text-xs font-bold text-indigo-600">{['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating - 1]}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Your Review</label>
                                <textarea
                                    value={reviewForm.comment}
                                    onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                    rows={5} maxLength={500}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all text-sm resize-none"
                                    placeholder="Share your experience..."
                                />
                                <p className="text-xs text-slate-400 mt-1 text-right">{reviewForm.comment.length}/500</p>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setShowReviewModal(false); setReviewForm({ rating: 0, comment: '' }); }}
                                    className="flex-1 py-2.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submittingReview || reviewForm.rating === 0 || reviewForm.comment.trim().length < 10}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-opacity">
                                    {submittingReview ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {course && (
                <ReportAbuseModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} targetId={course._id} targetType="Course" />
            )}
        </div>
    );
}
