'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    PlayCircle,
    CheckCircle,
    Lock,
    Clock,
    Star,
    FileQuestion,
    Award,
    Users,
    Download,
    MessageSquare,
    ThumbsUp,
    Book,
    ChevronDown,
    Edit3,
    Trash2,
    TrendingUp,
    Zap,
    Target,
    Calendar,
    ArrowLeft,
    X,
    Video,
    Sparkles,
    Trophy,
    Globe
} from 'lucide-react';
import api from '@/lib/axios';
import LessonPlayerModal from '@/components/LessonPlayerModal';
import ExamHistoryModal from '@/components/ExamHistoryModal';

import ExamResultModal from '@/components/ExamResultModal';
import { ReportAbuseModal } from '@/components/shared/ReportAbuseModal';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';

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
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [curriculumTab, setCurriculumTab] = useState('curriculum');
    const [sortBy, setSortBy] = useState('recent');
    const [expandedModules, setExpandedModules] = useState([]);
    const [liveClasses, setLiveClasses] = useState([]);
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
    const { confirmDialog } = useConfirm();

    useEffect(() => {
        loadCourseData();
        checkWishlistStatus();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'reviews') {
            loadReviews();
        }
    }, [activeTab, sortBy]);

    const loadCourseData = async (background = false) => {
        try {
            if (!background) setLoading(true);
            const response = await api.get(`/courses/${id}`);

            if (response.data.success) {
                // ... (Sorting logic remains same) ...
                const courseData = response.data.course;
                let lessonsData = response.data.lessons || [];

                // Sort lessons: Group by module order, then by lesson order
                if (courseData.modules && courseData.modules.length > 0) {
                    let sortedLessons = [];
                    // Helper to safely get module ID string
                    const getModId = (l) => (l.moduleId?._id || l.moduleId || '').toString();

                    // Group lessons by module
                    const lessonsByModule = {};
                    lessonsData.forEach(lesson => {
                        const modId = getModId(lesson);
                        if (modId) {
                            if (!lessonsByModule[modId]) lessonsByModule[modId] = [];
                            lessonsByModule[modId].push(lesson);
                        } else {
                            // Collect orphans
                            if (!lessonsByModule['orphan']) lessonsByModule['orphan'] = [];
                            lessonsByModule['orphan'].push(lesson);
                        }
                    });

                    // Flatten based on module order
                    courseData.modules.forEach(module => {
                        const modId = module._id.toString();
                        if (lessonsByModule[modId]) {
                            const modLessons = lessonsByModule[modId].sort((a, b) => (a.order || 0) - (b.order || 0));
                            sortedLessons = [...sortedLessons, ...modLessons];
                            delete lessonsByModule[modId];
                        }
                    });

                    // Add remaining lessons (orphans or modules not in course.modules list?)
                    Object.keys(lessonsByModule).forEach(key => {
                        const list = lessonsByModule[key].sort((a, b) => (a.order || 0) - (b.order || 0));
                        sortedLessons = [...sortedLessons, ...list];
                    });

                    lessonsData = sortedLessons;
                } else {
                    lessonsData.sort((a, b) => (a.order || 0) - (b.order || 0));
                }

                setCourse(courseData);
                setLessons(lessonsData);
                setIsEnrolled(response.data.isEnrolled || false);
                const moduleIds = courseData.modules?.map(m => m._id) || [];
                // Only set expanded modules on first load or if empty
                setExpandedModules(prev => prev.length ? prev : moduleIds);
            }

            if (response.data.isEnrolled && !background) {
                const [examRes, liveClassRes] = await Promise.all([
                    api.get(`/exams/course/${id}`),
                    api.get(`/live-classes?courseId=${id}`)
                ]);

                if (examRes.data.success) {
                    setExams(examRes.data.exams || []);
                }
                if (liveClassRes.data.success) {
                    setLiveClasses(liveClassRes.data.liveClasses || []);
                }
            }
        } catch (error) {
            console.error('Error loading course:', error);
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
                    const myReviewRes = await api.get(`/reviews/my-review/${id}`);
                    if (myReviewRes.data.success && myReviewRes.data.review) {
                        setMyReview(myReviewRes.data.review);
                    }
                } catch (err) { }
            }

            const page = loadMore ? currentPage + 1 : 1;
            const response = await api.get(`/reviews/course/${id}`, {
                params: { page, limit: 10, sortBy }
            });

            if (response.data.success) {
                if (loadMore) {
                    setReviews(prev => [...prev, ...response.data.reviews]);
                } else {
                    setReviews(response.data.reviews);
                    setRatingDistribution(response.data.ratingDistribution || []);
                }

                setHasMoreReviews(response.data.pagination?.hasMore || false);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    const checkWishlistStatus = async () => {
        try {
            const { data } = await api.get(`/wishlist/${id}/status`);
            setIsWishlisted(data.inWishlist);
        } catch (error) {
            console.error('Failed to check wishlist status', error);
        }
    };

    const toggleWishlist = async () => {
        try {
            setWishlistLoading(true);
            if (isWishlisted) {
                await api.delete(`/wishlist/${id}`);
                setIsWishlisted(false);
                // toast.success('Removed from wishlist');
            } else {
                await api.post('/wishlist', { courseId: id });
                setIsWishlisted(true);
                // toast.success('Added to wishlist');
            }
        } catch (error) {
            console.error('Wishlist toggle failed', error);
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleEnroll = async () => {
        try {
            setEnrolling(true);
            const response = await api.post('/enrollments', { courseId: id });
            if (response.data.success) {
                setIsEnrolled(true);
                loadCourseData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to enroll');
        } finally {
            setEnrolling(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (reviewForm.rating === 0) {
            toast.error('Please select a rating');
            return;
        }
        if (reviewForm.comment.trim().length < 10) {
            toast.error('Review must be at least 10 characters');
            return;
        }

        try {
            setSubmittingReview(true);
            if (myReview) {
                await api.put(`/reviews/${myReview._id}`, {
                    rating: reviewForm.rating,
                    comment: reviewForm.comment
                });
            } else {
                await api.post('/reviews', {
                    courseId: id,
                    rating: reviewForm.rating,
                    comment: reviewForm.comment
                });
            }
            setShowReviewModal(false);
            setMyReview(null);
            loadReviews();
            setReviewForm({ rating: 0, comment: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteReview = async () => {
        const isConfirmed = await confirmDialog("Delete Review", "Delete your review?", { variant: 'destructive' });
        if (!isConfirmed) return;
        try {
            await api.delete(`/reviews/${myReview._id}`);
            setMyReview(null);
            loadReviews();
            toast.success("Review deleted");
        } catch (error) {
            toast.error('Failed to delete review');
        }
    };

    const toggleHelpful = async (reviewId) => {
        try {
            await api.post(`/reviews/${reviewId}/helpful`);
            loadReviews();
        } catch (error) {
            console.error('Error toggling helpful:', error);
        }
    };

    const toggleModule = (moduleId) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const getLessonsByModule = (moduleId) => {
        return lessons.filter(l => l.moduleId === moduleId).sort((a, b) => a.order - b.order);
    };

    const isLessonLocked = (lesson) => {
        return !isEnrolled && !lesson.isFree;
    };

    const handleLessonClick = (lesson) => {
        if (isLessonLocked(lesson)) {
            toast.error('Enroll to access this lesson');
            return;
        }
        const lessonIndex = lessons.findIndex(l => l._id === lesson._id);
        setSelectedLessonIndex(lessonIndex);
        setShowLessonPlayerModal(true);
    };

    const handleExamClick = (exam) => {
        setSelectedExam(exam);
        setShowExamHistoryModal(true);
    };

    const handleStartExam = () => {
        if (selectedExam) {
            setShowExamHistoryModal(false);
            router.push(`/student/exams/${selectedExam._id}`);
        }
    };



    const handleLessonComplete = async (lessonId) => {
        await loadCourseData(true);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading course...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Course Not Found</h2>
                    <Button onClick={() => router.back()} variant="outline" className="mt-4">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const totalLessons = lessons.length;
    const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Bizdire-style Deep Blue Banner */}
            <div className="bg-[#0F172A] text-white relative overflow-hidden">
                {/* Background pattern/overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1 space-y-4">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                            <span className="hover:text-white cursor-pointer">Home</span>
                            <span className="text-slate-600">/</span>
                            <span className="hover:text-white cursor-pointer">Courses</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-white font-medium">{course.category?.name || 'General'}</span>
                        </div>

                        {/* Title & Badges */}
                        <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                            {course.title}
                        </h1>

                        <div className="flex items-center gap-2 text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < Math.round(course.rating || 0) ? 'fill-current' : 'text-slate-600'}`}
                                />
                            ))}
                            <span className="text-white ml-2 text-sm font-medium">{course.rating?.toFixed(1)} ({course.reviewCount} reviews)</span>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-6">
                            <Button
                                onClick={toggleWishlist}
                                disabled={wishlistLoading}
                                className={`${isWishlisted ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#0EA5E9] hover:bg-[#0284C7]'} text-white border-none rounded-sm h-10 px-6 font-semibold uppercase text-xs tracking-wide transition-all`}
                            >
                                <Sparkles className={`w-4 h-4 mr-2 ${isWishlisted ? 'fill-white' : ''}`} />
                                {isWishlisted ? 'Wishlisted' : 'Add Wishlist'}
                            </Button>
                            <Button className="bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-sm h-10 px-6 font-semibold uppercase text-xs tracking-wide" onClick={() => setShowReviewModal(true)}>
                                <Star className="w-4 h-4 mr-2" />
                                Write Review
                            </Button>
                            <Button
                                className="bg-[#EF4444] hover:bg-[#DC2626] text-white border-none rounded-sm h-10 px-6 font-semibold uppercase text-xs tracking-wide"
                                onClick={() => setShowReportModal(true)}
                            >
                                <FileQuestion className="w-4 h-4 mr-2" />
                                Report Abuse
                            </Button>
                        </div>
                    </div>

                    {/* Price & Primary Action (Moved from sticky sidebar for mobile, kept for desktop layout but styled differently) */}
                    {/* We will keep the sticky sidebar logic for the Price/Enroll card below, but the banner is now focused on Title/Intro */}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                            <div className="flex border-b border-slate-200 overflow-x-auto">
                                {['overview', 'curriculum', 'live classes', 'reviews'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 min-w-[120px] py-4 px-6 font-semibold transition-all whitespace-nowrap ${activeTab === tab
                                            ? 'text-indigo-600 border-b-3 border-indigo-600 bg-indigo-50'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 lg:p-8">
                                {activeTab === 'overview' && (
                                    <div className="space-y-8">
                                        {course.whatYouWillLearn?.length > 0 && (
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                                    <div className="p-2 bg-yellow-100 rounded-xl">
                                                        <Zap className="w-6 h-6 text-yellow-600" />
                                                    </div>
                                                    What You'll Learn
                                                </h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {course.whatYouWillLearn.map((item, i) => (
                                                        <div key={i} className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                                            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                                            <span className="text-slate-700 font-medium">{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-xl">
                                                    <Target className="w-6 h-6 text-blue-600" />
                                                </div>
                                                About This Course
                                            </h3>
                                            <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-line">
                                                {course.description}
                                            </p>
                                        </div>

                                        {course.requirements?.length > 0 && (
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-900 mb-6">Requirements</h3>
                                                <ul className="space-y-3">
                                                    {course.requirements.map((req, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-slate-700 text-lg p-3 bg-slate-50 rounded-lg">
                                                            <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0"></div>
                                                            {req}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'curriculum' && (
                                    <div className="space-y-6">
                                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                            <button
                                                onClick={() => setCurriculumTab('curriculum')}
                                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${curriculumTab === 'curriculum'
                                                    ? 'bg-white text-indigo-600 shadow-md'
                                                    : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                            >
                                                <PlayCircle className="w-4 h-4 inline mr-2" />
                                                Lessons ({totalLessons})
                                            </button>
                                            <button
                                                onClick={() => setCurriculumTab('exams')}
                                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${curriculumTab === 'exams'
                                                    ? 'bg-white text-indigo-600 shadow-md'
                                                    : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                            >
                                                <FileQuestion className="w-4 h-4 inline mr-2" />
                                                Exams ({exams.length})
                                            </button>
                                        </div>

                                        {curriculumTab === 'curriculum' ? (
                                            course.modules?.length > 0 ? (
                                                <div className="space-y-4">
                                                    {course.modules.map((module, idx) => {
                                                        const moduleLessons = getLessonsByModule(module._id);
                                                        const isExpanded = expandedModules.includes(module._id);

                                                        return (
                                                            <div key={module._id} className="border-2 border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-300 transition-colors">
                                                                <button
                                                                    onClick={() => toggleModule(module._id)}
                                                                    className="w-full p-5 bg-gradient-to-r from-slate-50 to-indigo-50 hover:from-slate-100 hover:to-indigo-100 transition-all flex items-center justify-between"
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                                            {idx + 1}
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <h4 className="font-bold text-lg text-slate-900">{module.title}</h4>
                                                                            <p className="text-sm text-slate-600">{moduleLessons.length} lessons</p>
                                                                        </div>
                                                                    </div>
                                                                    <ChevronDown className={`w-6 h-6 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                                </button>

                                                                {isExpanded && (
                                                                    <div className="divide-y divide-slate-100 bg-white">
                                                                        {moduleLessons.map((lesson) => {
                                                                            const locked = isLessonLocked(lesson);
                                                                            return (
                                                                                <div
                                                                                    key={lesson._id}
                                                                                    onClick={() => handleLessonClick(lesson)}
                                                                                    className={`p-5 flex items-center gap-4 transition-all ${locked
                                                                                        ? 'opacity-60 cursor-not-allowed'
                                                                                        : 'hover:bg-indigo-50 cursor-pointer group'
                                                                                        }`}
                                                                                >
                                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${locked
                                                                                        ? 'bg-slate-200'
                                                                                        : 'bg-indigo-100 group-hover:bg-indigo-600 transition-colors'
                                                                                        }`}>
                                                                                        {locked ? (
                                                                                            <Lock className="w-5 h-5 text-slate-500" />
                                                                                        ) : (
                                                                                            <PlayCircle className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <p className="font-semibold text-slate-900">{lesson.title}</p>
                                                                                        <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                                                                                            <span className="flex items-center gap-1">
                                                                                                <Clock className="w-3.5 h-3.5" />
                                                                                                {Math.round((lesson.content?.duration || 0) / 60)} min
                                                                                            </span>
                                                                                            {lesson.isFree && (
                                                                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                                                                                    FREE
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-16 bg-slate-50 rounded-2xl">
                                                    <Book className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                                    <p className="text-slate-600 font-medium">No curriculum available yet</p>
                                                </div>
                                            )
                                        ) : (
                                            !isEnrolled ? (
                                                <div className="text-center py-16 bg-slate-50 rounded-2xl">
                                                    <Lock className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                                    <p className="text-slate-600 font-medium mb-4">Enroll to access exams</p>
                                                    <Button onClick={handleEnroll} className="bg-indigo-600 hover:bg-indigo-700">
                                                        Enroll Now
                                                    </Button>
                                                </div>
                                            ) : exams.length > 0 ? (
                                                <div className="space-y-4">
                                                    {exams.map(exam => (
                                                        <div
                                                            key={exam._id}
                                                            onClick={() => handleExamClick(exam)}
                                                            className="p-5 border-2 border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group"
                                                        >
                                                            <div className="flex items-start gap-4">
                                                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg ${exam.type === 'final' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                                                                    exam.type === 'midterm' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                                                                        'bg-gradient-to-br from-purple-500 to-purple-600'
                                                                    }`}>
                                                                    <FileQuestion className="w-7 h-7" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{exam.title}</h4>
                                                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="w-4 h-4" />
                                                                            {exam.duration} min
                                                                        </span>
                                                                        <span>{exam.totalQuestions} questions</span>
                                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${exam.type === 'final' ? 'bg-red-100 text-red-700' :
                                                                            exam.type === 'midterm' ? 'bg-orange-100 text-orange-700' :
                                                                                'bg-purple-100 text-purple-700'
                                                                            }`}>
                                                                            {exam.type.toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-16 bg-slate-50 rounded-2xl">
                                                    <FileQuestion className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                                    <p className="text-slate-600 font-medium">No exams available yet</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                {activeTab === 'live classes' && (
                                    <div className="space-y-4">
                                        {!isEnrolled ? (
                                            <div className="text-center py-16 bg-slate-50 rounded-2xl">
                                                <Lock className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                                <p className="text-slate-600 font-medium mb-4">Enroll to access live classes</p>
                                                <Button onClick={handleEnroll} className="bg-indigo-600 hover:bg-indigo-700">
                                                    Enroll Now
                                                </Button>
                                            </div>
                                        ) : liveClasses.length > 0 ? (
                                            liveClasses.map(liveClass => {
                                                const isLive = liveClass.status === 'live';
                                                const isPast = new Date(liveClass.dateTime) < new Date() && liveClass.status !== 'live';

                                                return (
                                                    <div key={liveClass._id} className={`p-5 rounded-2xl border-2 transition-all ${isLive
                                                        ? 'border-red-300 bg-red-50 shadow-lg shadow-red-200'
                                                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-lg'
                                                        }`}>
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start gap-4 flex-1">
                                                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg ${isLive
                                                                    ? 'bg-red-600 animate-pulse'
                                                                    : isPast ? 'bg-slate-400' : 'bg-indigo-600'
                                                                    }`}>
                                                                    <Video className="w-7 h-7" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <h4 className="font-bold text-lg text-slate-900">{liveClass.title}</h4>
                                                                        {isLive && (
                                                                            <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                                                                                ● LIVE
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-slate-600 mb-3">{liveClass.description}</p>
                                                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                                                        <span className="flex items-center gap-1.5">
                                                                            <Calendar className="w-4 h-4" />
                                                                            {new Date(liveClass.dateTime).toLocaleDateString()}
                                                                        </span>
                                                                        <span className="flex items-center gap-1.5">
                                                                            <Clock className="w-4 h-4" />
                                                                            {new Date(liveClass.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                        <span>{liveClass.duration} min</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                {isLive || (!isPast && liveClass.status === 'scheduled') ? (
                                                                    <a
                                                                        href={liveClass.meetingLink}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg flex items-center gap-2 ${isLive
                                                                            ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                                                                            : 'bg-indigo-600 hover:bg-indigo-700'
                                                                            }`}
                                                                    >
                                                                        <Video className="w-4 h-4" />
                                                                        {isLive ? 'Join Live' : 'Join Class'}
                                                                    </a>
                                                                ) : liveClass.recordingLink ? (
                                                                    <a
                                                                        href={liveClass.recordingLink}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="px-6 py-3 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border-2 border-indigo-300 transition-all flex items-center gap-2"
                                                                    >
                                                                        <PlayCircle className="w-4 h-4" />
                                                                        Recording
                                                                    </a>
                                                                ) : (
                                                                    <button disabled className="px-6 py-3 rounded-xl text-sm font-medium text-slate-400 bg-slate-100 cursor-not-allowed">
                                                                        Ended
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-16 bg-slate-50 rounded-2xl">
                                                <Video className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                                <p className="text-slate-600 font-medium">No live classes scheduled yet</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'reviews' && (
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-8 p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                                            <div className="text-center">
                                                <div className="text-6xl font-bold text-slate-900 mb-3">
                                                    {course.rating?.toFixed(1)}
                                                </div>
                                                <div className="flex gap-1 mb-3">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-6 h-6 ${i < Math.round(course.rating)
                                                                ? 'text-yellow-400 fill-yellow-400'
                                                                : 'text-slate-300'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-sm text-slate-600 font-medium">{course.reviewCount} reviews</p>
                                            </div>

                                            <div className="flex-1">
                                                {ratingDistribution.map(dist => (
                                                    <div key={dist.rating} className="flex items-center gap-4 mb-3">
                                                        <span className="text-sm font-semibold text-slate-700 w-10">{dist.rating}★</span>
                                                        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                                                                style={{ width: `${dist.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm text-slate-600 w-14 text-right font-medium">{dist.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {isEnrolled && (
                                            <Button
                                                onClick={() => {
                                                    if (myReview) {
                                                        setReviewForm({ rating: myReview.rating, comment: myReview.comment });
                                                    }
                                                    setShowReviewModal(true);
                                                }}
                                                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg"
                                            >
                                                <MessageSquare className="w-5 h-5 mr-2" />
                                                {myReview ? 'Edit Your Review' : 'Write a Review'}
                                            </Button>
                                        )}

                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold text-slate-700">Sort:</span>
                                            {['recent', 'helpful', 'rating'].map(sort => (
                                                <button
                                                    key={sort}
                                                    onClick={() => setSortBy(sort)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${sortBy === sort
                                                        ? 'bg-indigo-600 text-white shadow-md'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                                                </button>
                                            ))}
                                        </div>

                                        {reviews.length > 0 ? (
                                            <div className="space-y-4">
                                                {reviews.map(review => (
                                                    <div key={review._id} className={`p-6 rounded-2xl border-2 transition-all ${review._id === myReview?._id
                                                        ? 'border-indigo-300 bg-indigo-50 shadow-lg'
                                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                                        }`}>
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <img
                                                                    src={review.student?.profileImage || '/default-avatar.png'}
                                                                    alt={review.student?.name}
                                                                    className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                                                                />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-bold text-slate-900">{review.student?.name}</p>
                                                                        {review._id === myReview?._id && (
                                                                            <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-xs font-bold">
                                                                                You
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <div className="flex gap-0.5">
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <Star
                                                                                    key={i}
                                                                                    className={`w-4 h-4 ${i < review.rating
                                                                                        ? 'text-yellow-400 fill-yellow-400'
                                                                                        : 'text-slate-300'
                                                                                        }`}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                        <span className="text-sm text-slate-500">
                                                                            {new Date(review.createdAt).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {review._id === myReview?._id && (
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setReviewForm({ rating: review.rating, comment: review.comment });
                                                                            setShowReviewModal(true);
                                                                        }}
                                                                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                                                    >
                                                                        <Edit3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={handleDeleteReview}
                                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <p className="text-slate-700 leading-relaxed">{review.comment}</p>

                                                        {review.tutorResponse && (
                                                            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Award className="w-4 h-4 text-blue-600" />
                                                                    <span className="font-semibold text-blue-900">Instructor Response</span>
                                                                </div>
                                                                <p className="text-slate-700 text-sm">{review.tutorResponse.comment}</p>
                                                            </div>
                                                        )}

                                                        {review._id !== myReview?._id && (
                                                            <button
                                                                onClick={() => toggleHelpful(review._id)}
                                                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium"
                                                            >
                                                                <ThumbsUp className="w-4 h-4" />
                                                                Helpful ({review.helpfulCount || 0})
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}

                                                {hasMoreReviews && (
                                                    <Button
                                                        onClick={() => loadReviews(true)}
                                                        disabled={loadingReviews}
                                                        variant="outline"
                                                        className="w-full h-12 border-2 border-dashed hover:border-indigo-500 hover:bg-indigo-50"
                                                    >
                                                        {loadingReviews ? 'Loading...' : 'Load More Reviews'}
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-16 bg-slate-50 rounded-2xl">
                                                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                                <p className="text-slate-600 font-medium">No reviews yet. Be the first!</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Pricing/Enrollment Card */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
                            <div className="aspect-video bg-slate-100 relative group overflow-hidden">
                                {/* Thumbnail */}
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors cursor-pointer">
                                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                        <PlayCircle className="w-8 h-8 text-indigo-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-3xl font-bold text-slate-800">
                                        {course.isFree ? 'Free' : `₹${course.price}`}
                                    </span>
                                    {course.oldPrice && !course.isFree && (
                                        <span className="text-lg text-slate-400 line-through">
                                            ₹{course.oldPrice}
                                        </span>
                                    )}
                                </div>

                                {!isEnrolled ? (
                                    <Button
                                        onClick={handleEnroll}
                                        disabled={enrolling}
                                        variant="default" // Using global primary color (Orange)
                                        className="w-full h-12 text-base font-bold rounded shadow-sm hover:shadow transition-all"
                                    >
                                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                    </Button>
                                ) : (
                                    <div className="w-full h-12 bg-emerald-500 text-white font-bold rounded flex items-center justify-center gap-2 shadow-sm">
                                        <CheckCircle className="w-5 h-5" />
                                        Enrolled
                                    </div>
                                )}

                                <p className="text-center text-xs text-slate-500 mt-3">
                                    30-Day Money-Back Guarantee
                                </p>
                            </div>
                        </div>

                        {/* Listing Owner / Instructor Card */}
                        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                                Listing Owner
                            </h3>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full p-1 border border-slate-200 mb-3">
                                    <img
                                        src={course.tutorId?.userId?.profileImage || '/default-avatar.png'}
                                        alt={course.tutorId?.userId?.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900">{course.tutorId?.userId?.name || 'Unknown'}</h4>
                                <p className="text-xs text-slate-500 mb-4">Member Since 2024</p>

                                <div className="flex gap-2 w-full">
                                    <Button variant="outline" className="flex-1 text-xs border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                                        Contact
                                    </Button>
                                    <Button variant="outline" className="flex-1 text-xs border-slate-300 text-slate-600 hover:bg-slate-50">
                                        Timings
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                        <Globe className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <span className="truncate">New York, NY 10012</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                        <Video className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <span className="truncate">info@example.com</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                        <Zap className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <span className="truncate text-orange-500 font-medium">0-235-657-24587</span>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                                <Button className="flex-1 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs h-9">
                                    Chat
                                </Button>
                                <Button variant="default" className="flex-1 text-white text-xs h-9">
                                    Contact Me
                                </Button>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sticky top-6">
                            <h3 className="font-bold text-xl mb-6 text-slate-900">This Course Includes</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-3 bg-indigo-50 rounded-xl">
                                    <div className="p-2 bg-indigo-600 rounded-lg">
                                        <PlayCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-medium text-slate-700">{totalLessons} video lessons</span>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-xl">
                                    <div className="p-2 bg-purple-600 rounded-lg">
                                        <Clock className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-medium text-slate-700">{Math.round(totalDuration / 3600)}h on-demand video</span>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-emerald-50 rounded-xl">
                                    <div className="p-2 bg-emerald-600 rounded-lg">
                                        <Download className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-medium text-slate-700">Downloadable resources</span>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl">
                                    <div className="p-2 bg-amber-600 rounded-lg">
                                        <Trophy className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-medium text-slate-700">Certificate of completion</span>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        <Globe className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-medium text-slate-700">Lifetime access</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showLessonPlayerModal && lessons[selectedLessonIndex] && (
                <LessonPlayerModal
                    lessons={lessons}
                    modules={course.modules}
                    reviews={reviews}
                    initialIndex={selectedLessonIndex}
                    courseId={id}
                    onClose={() => setShowLessonPlayerModal(false)}
                    onLessonComplete={handleLessonComplete}
                />
            )}

            {showExamHistoryModal && selectedExam && (
                <ExamHistoryModal
                    exam={selectedExam}
                    onClose={() => setShowExamHistoryModal(false)}
                    onViewAttempt={(data) => {
                        setSelectedResult(data);
                        setShowExamHistoryModal(false);
                        setShowResultModal(true);
                    }}
                    onStartExam={handleStartExam}
                />
            )}



            {showResultModal && selectedResult && (
                <ExamResultModal
                    result={selectedResult}
                    onClose={() => {
                        setShowResultModal(false);
                        setShowExamHistoryModal(true);
                    }}
                />
            )}

            {showReviewModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-8 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-3xl font-bold text-slate-900">
                                        {myReview ? 'Edit Review' : 'Write a Review'}
                                    </h3>
                                    <p className="text-slate-600 mt-2">{course.title}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowReviewModal(false);
                                        setReviewForm({ rating: 0, comment: '' });
                                    }}
                                    className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-600" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitReview} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-4">
                                    Rating
                                </label>
                                <div className="flex gap-3">
                                    {[1, 2, 3, 4, 5].map(rating => (
                                        <button
                                            key={rating}
                                            type="button"
                                            onClick={() => setReviewForm(prev => ({ ...prev, rating }))}
                                            className="transition-transform hover:scale-125 active:scale-110"
                                        >
                                            <Star
                                                className={`w-12 h-12 ${rating <= reviewForm.rating
                                                    ? 'text-yellow-400 fill-yellow-400'
                                                    : 'text-slate-300'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                {reviewForm.rating > 0 && (
                                    <p className="mt-3 text-sm font-bold text-indigo-600">
                                        {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating - 1]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">
                                    Your Review
                                </label>
                                <textarea
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                    rows={6}
                                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="Share your experience with this course..."
                                    maxLength={500}
                                />
                                <p className="text-sm text-slate-500 mt-2">
                                    {reviewForm.comment.length}/500 characters
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setShowReviewModal(false);
                                        setReviewForm({ rating: 0, comment: '' });
                                    }}
                                    variant="outline"
                                    className="flex-1 h-12 border-2"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submittingReview || reviewForm.rating === 0 || reviewForm.comment.trim().length < 10}
                                    className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                >
                                    {submittingReview ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {course && (
                <ReportAbuseModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    targetId={course._id}
                    targetType="Course"
                />
            )}
        </div>
    );
}