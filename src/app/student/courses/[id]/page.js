'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    PlayCircle,
    CheckCircle,
    Lock,
    Clock,
    Star,
    Share2,
    MoreHorizontal,
    FileQuestion,
    Award,
    Users,
    Download,
    Bookmark,
    MessageSquare,
    ThumbsUp,
    Book,
    FileText,
    ChevronDown,
    Plus,
    Edit3,
    Trash2,
    TrendingUp,
    Zap,
    Target,
    CheckCheck,
    Calendar,
    GripVertical,
    ArrowLeft,
    Settings,
    X,
    Video
} from 'lucide-react';
import api from '@/lib/axios';
import LessonPlayerModal from '@/components/LessonPlayerModal';
import ExamHistoryModal from '@/components/ExamHistoryModal';
import ExamTakingScreen from '@/components/ExamTakingScreen';
import ExamResultModal from '@/components/ExamResultModal';

export default function CourseDetailPage({ params }) {
    const router = useRouter();
    const { id } = use(params); // ✅ React.use() se unwrap kiya

    // State Management
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

    // Modals for Exam & Lesson
    const [showExamModal, setShowExamModal] = useState(false);
    const [showExamHistoryModal, setShowExamHistoryModal] = useState(false);
    const [showLessonPlayerModal, setShowLessonPlayerModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);

    useEffect(() => {
        loadCourseData();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'reviews') {
            loadReviews();
        }
    }, [activeTab, sortBy]);

    const loadCourseData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/courses/${id}`);

            if (response.data.success) {
                setCourse(response.data.course);
                setLessons(response.data.lessons || []);
                setIsEnrolled(response.data.isEnrolled || false);

                // Auto-expand all modules
                const moduleIds = response.data.course.modules?.map(m => m._id) || [];
                setExpandedModules(moduleIds);
            }

            // Load exams if enrolled
            if (response.data.isEnrolled) {
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
            setLoading(false);
        }
    };

    const loadReviews = async (loadMore = false) => {
        if (loadingReviews) return;

        try {
            setLoadingReviews(true);

            // Load my review first
            if (!myReview && isEnrolled) {
                try {
                    const myReviewRes = await api.get(`/reviews/my-review/${id}`);
                    if (myReviewRes.data.success && myReviewRes.data.review) {
                        setMyReview(myReviewRes.data.review);
                    }
                } catch (err) {
                    console.log('No existing review');
                }
            }

            // Load course reviews
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

    const handleEnroll = async () => {
        try {
            setEnrolling(true);
            const response = await api.post('/enrollments', { courseId: id });

            if (response.data.success) {
                setIsEnrolled(true);
                loadCourseData();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to enroll');
        } finally {
            setEnrolling(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (reviewForm.rating === 0) {
            alert('Please select a rating');
            return;
        }

        if (reviewForm.comment.trim().length < 10) {
            alert('Review must be at least 10 characters');
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
            alert(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteReview = async () => {
        if (!confirm('Delete your review?')) return;

        try {
            await api.delete(`/reviews/${myReview._id}`);
            setMyReview(null);
            loadReviews();
        } catch (error) {
            alert('Failed to delete review');
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
        return lessons.filter(l => l.moduleId === moduleId)
            .sort((a, b) => a.order - b.order);
    };

    const isLessonLocked = (lesson) => {
        return !isEnrolled && !lesson.isFree;
    };

    const handleLessonClick = (lesson) => {
        if (isLessonLocked(lesson)) {
            alert('Enroll to access this lesson');
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
        setShowExamHistoryModal(false);
        setShowExamModal(true);
    };

    const handleExamComplete = (attemptData) => {
        setShowExamModal(false);
        loadCourseData(); // Refresh to update exam stats

        // Transform data for ExamResultModal
        if (attemptData.answers) {
            const detailedResults = attemptData.answers.map(ans => ({
                question: ans.questionData?.question || 'Question',
                options: ans.questionData?.options?.map(o => o.text) || [],
                correctIndex: ans.questionData?.correctOption,
                selectedIndex: ans.selectedOption,
                isCorrect: ans.isCorrect,
                explanation: ans.questionData?.explanation,
                pointsEarned: ans.pointsEarned,
                pointsPossible: ans.questionData?.points || 1
            }));

            setSelectedResult({
                attempt: attemptData,
                detailedResults
            });
            setShowResultModal(true);
        } else {
            alert(`Exam completed! Score: ${attemptData.score}%`);
        }
    };

    const handleLessonComplete = async (lessonId) => {
        // Refresh course data to update progress
        await loadCourseData();
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading course...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Course Not Found</h2>
                </div>
            </div>
        );
    }

    const totalLessons = lessons.length;
    const totalDuration = lessons.reduce((acc, l) => acc + (l.content?.duration || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

                <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                    <button
                        onClick={() => router.back()}
                        className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-4 py-1.5 bg-blue-500/20 backdrop-blur-sm text-blue-200 rounded-full text-sm font-semibold border border-blue-400/30">
                                    {course.category?.name}
                                </span>
                                <span className="px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-semibold border border-white/20">
                                    {course.level}
                                </span>
                            </div>

                            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                                {course.title}
                            </h1>

                            <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                                {course.description?.substring(0, 150)}...
                            </p>

                            <div className="flex flex-wrap items-center gap-6 text-white/90">
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    <span className="font-bold">{course.rating?.toFixed(1)}</span>
                                    <span className="text-slate-400">({course.reviewCount} reviews)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    <span>{course.enrolledCount?.toLocaleString()} students</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{Math.round(totalDuration / 3600)}h content</span>
                                </div>
                            </div>

                            {/* Instructor */}
                            <div className="mt-8 flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                                <img
                                    src={course.tutor?.user?.profileImage || '/default-avatar.png'}
                                    alt={course.tutor?.user?.name}
                                    className="w-14 h-14 rounded-full border-2 border-white/30"
                                />
                                <div>
                                    <p className="text-sm text-slate-400">Created by</p>
                                    <p className="font-bold text-white text-lg">{course.tutor?.user?.name}</p>
                                    <p className="text-sm text-slate-300">{course.tutor?.experience} years experience</p>
                                </div>
                            </div>
                        </div>

                        {/* Preview Card */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden sticky top-6">
                                <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative group">
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <button className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                                            <PlayCircle className="w-8 h-8 text-blue-600" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="mb-6">
                                        <div className="flex items-end gap-3 mb-2">
                                            <span className="text-4xl font-bold text-slate-900">
                                                ₹{course.price}
                                            </span>
                                            {course.oldPrice && (
                                                <span className="text-lg text-slate-500 line-through mb-1">
                                                    ₹{course.oldPrice}
                                                </span>
                                            )}
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                                            <TrendingUp className="w-4 h-4" />
                                            80% OFF
                                        </div>
                                    </div>

                                    {!isEnrolled ? (
                                        <button
                                            onClick={handleEnroll}
                                            disabled={enrolling}
                                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                                        >
                                            {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-4 bg-emerald-100 text-emerald-700 font-bold rounded-xl flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Enrolled
                                        </button>
                                    )}

                                    <p className="text-center text-xs text-slate-500 mt-4">
                                        30-Day Money-Back Guarantee
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Content */}
                    <div className="lg:col-span-2">
                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
                            <div className="flex border-b border-slate-200">
                                {['overview', 'curriculum', 'live classes', 'reviews'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-4 px-6 font-semibold transition-all ${activeTab === tab
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        {/* What You'll Learn */}
                                        {course.whatYouWillLearn?.length > 0 && (
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                    <Zap className="w-6 h-6 text-yellow-500" />
                                                    What You'll Learn
                                                </h3>
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    {course.whatYouWillLearn.map((item, i) => (
                                                        <div key={i} className="flex items-start gap-3">
                                                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                            <span className="text-slate-700">{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Description */}
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <Target className="w-6 h-6 text-blue-600" />
                                                About This Course
                                            </h3>
                                            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                                                {course.description}
                                            </p>
                                        </div>

                                        {/* Requirements */}
                                        {course.requirements?.length > 0 && (
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-4">Requirements</h3>
                                                <ul className="space-y-2">
                                                    {course.requirements.map((req, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-slate-700">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2"></div>
                                                            {req}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'curriculum' && (
                                    <div className="space-y-4">
                                        {/* Curriculum/Exams Toggle */}
                                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                            <button
                                                onClick={() => setCurriculumTab('curriculum')}
                                                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${curriculumTab === 'curriculum'
                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                            >
                                                <PlayCircle className="w-4 h-4 inline mr-2" />
                                                Lessons ({totalLessons})
                                            </button>
                                            <button
                                                onClick={() => setCurriculumTab('exams')}
                                                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${curriculumTab === 'exams'
                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                            >
                                                <FileQuestion className="w-4 h-4 inline mr-2" />
                                                Exams ({exams.length})
                                            </button>
                                        </div>

                                        {curriculumTab === 'curriculum' ? (
                                            course.modules?.length > 0 ? (
                                                course.modules.map((module, idx) => {
                                                    const moduleLessons = getLessonsByModule(module._id);
                                                    const isExpanded = expandedModules.includes(module._id);

                                                    return (
                                                        <div key={module._id} className="border border-slate-200 rounded-xl overflow-hidden">
                                                            <button
                                                                onClick={() => toggleModule(module._id)}
                                                                className="w-full p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <h4 className="font-bold text-slate-900">{module.title}</h4>
                                                                        <p className="text-sm text-slate-600">{moduleLessons.length} lessons</p>
                                                                    </div>
                                                                </div>
                                                                <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </button>

                                                            {isExpanded && (
                                                                <div className="divide-y divide-slate-100">
                                                                    {moduleLessons.map((lesson, lessonIdx) => {
                                                                        const locked = isLessonLocked(lesson);
                                                                        return (
                                                                            <div
                                                                                key={lesson._id}
                                                                                onClick={() => handleLessonClick(lesson)}
                                                                                className={`p-4 flex items-center gap-4 ${locked ? 'opacity-60' : 'hover:bg-slate-50 cursor-pointer'}`}
                                                                            >
                                                                                <div className={`w-8 h-8 rounded-lg ${locked ? 'bg-slate-200' : 'bg-blue-100'} flex items-center justify-center`}>
                                                                                    {locked ? (
                                                                                        <Lock className="w-4 h-4 text-slate-500" />
                                                                                    ) : (
                                                                                        <PlayCircle className="w-4 h-4 text-blue-600" />
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <p className="font-medium text-slate-900">{lesson.title}</p>
                                                                                    <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                                                                                        <span>{Math.round((lesson.content?.duration || 0) / 60)} min</span>
                                                                                        {lesson.isFree && (
                                                                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
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
                                                })
                                            ) : (
                                                <div className="text-center py-12 text-slate-500">
                                                    <Book className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                                    <p>No curriculum available yet</p>
                                                </div>
                                            )
                                        ) : (
                                            !isEnrolled ? (
                                                <div className="text-center py-12">
                                                    <Lock className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                                    <p className="text-slate-600 font-medium">Enroll to access exams</p>
                                                </div>
                                            ) : exams.length > 0 ? (
                                                <div className="space-y-4">
                                                    {exams.map(exam => (
                                                        <div
                                                            key={exam._id}
                                                            onClick={() => handleExamClick(exam)}
                                                            className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer"
                                                        >
                                                            <div className="flex items-start gap-4">
                                                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${exam.type === 'final' ? 'from-red-500 to-red-600' :
                                                                    exam.type === 'midterm' ? 'from-orange-500 to-orange-600' :
                                                                        'from-purple-500 to-purple-600'
                                                                    } flex items-center justify-center text-white`}>
                                                                    <FileQuestion className="w-6 h-6" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="font-bold text-slate-900">{exam.title}</h4>
                                                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="w-4 h-4" />
                                                                            {exam.duration} min
                                                                        </span>
                                                                        <span>{exam.totalQuestions} questions</span>
                                                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${exam.type === 'final' ? 'bg-red-100 text-red-700' :
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
                                                <div className="text-center py-12 text-slate-500">
                                                    <FileQuestion className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                                    <p>No exams available yet</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                {activeTab === 'live classes' && (
                                    <div className="space-y-4">
                                        {!isEnrolled ? (
                                            <div className="text-center py-12">
                                                <Lock className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                                <p className="text-slate-600 font-medium">Enroll to access live classes</p>
                                            </div>
                                        ) : liveClasses.length > 0 ? (
                                            <div className="grid gap-4">
                                                {liveClasses.map(liveClass => {
                                                    const isLive = liveClass.status === 'live';
                                                    const isPast = new Date(liveClass.dateTime) < new Date() && liveClass.status !== 'live';

                                                    return (
                                                        <div key={liveClass._id} className={`p-4 rounded-xl border ${isLive ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white hover:border-blue-300 transition-colors'}`}>
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start gap-4">
                                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${isLive ? 'bg-red-600 animate-pulse' : isPast ? 'bg-slate-400' : 'bg-blue-600'}`}>
                                                                        <Video className="w-6 h-6" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className="font-bold text-slate-900">{liveClass.title}</h4>
                                                                            {isLive && (
                                                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
                                                                                    LIVE NOW
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-slate-600 mb-2">{liveClass.description}</p>
                                                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                                                            <span className="flex items-center gap-1">
                                                                                <Calendar className="w-4 h-4" />
                                                                                {new Date(liveClass.dateTime).toLocaleDateString()}
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <Clock className="w-4 h-4" />
                                                                                {new Date(liveClass.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <Clock className="w-4 h-4" />
                                                                                {liveClass.duration} min
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    {isLive || (!isPast && liveClass.status === 'scheduled') ? (
                                                                        <a
                                                                            href={liveClass.meetingLink}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-sm flex items-center gap-2 ${isLive
                                                                                ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                                                                                : 'bg-blue-600 hover:bg-blue-700'
                                                                                }`}
                                                                        >
                                                                            <Video className="w-4 h-4" />
                                                                            {isLive ? 'Join Now' : 'Join Class'}
                                                                        </a>
                                                                    ) : liveClass.recordingLink ? (
                                                                        <a
                                                                            href={liveClass.recordingLink}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="px-4 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all flex items-center gap-2"
                                                                        >
                                                                            <PlayCircle className="w-4 h-4" />
                                                                            Watch Recording
                                                                        </a>
                                                                    ) : (
                                                                        <button disabled className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 bg-slate-100 cursor-not-allowed">
                                                                            Completed
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-slate-500">
                                                <Video className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                                <p>No live classes scheduled for this course yet</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'reviews' && (
                                    <div className="space-y-6">
                                        {/* Rating Overview */}
                                        <div className="flex items-start gap-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                                            <div className="text-center">
                                                <div className="text-5xl font-bold text-slate-900 mb-2">
                                                    {course.rating?.toFixed(1)}
                                                </div>
                                                <div className="flex gap-1 mb-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-5 h-5 ${i < Math.round(course.rating)
                                                                ? 'text-yellow-400 fill-yellow-400'
                                                                : 'text-slate-300'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-sm text-slate-600">{course.reviewCount} reviews</p>
                                            </div>

                                            <div className="flex-1">
                                                {ratingDistribution.map(dist => (
                                                    <div key={dist.rating} className="flex items-center gap-3 mb-2">
                                                        <span className="text-sm font-medium text-slate-700 w-8">{dist.rating}★</span>
                                                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-600 rounded-full"
                                                                style={{ width: `${dist.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm text-slate-600 w-12">{dist.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Write Review Button */}
                                        {isEnrolled && (
                                            <button
                                                onClick={() => {
                                                    if (myReview) {
                                                        setReviewForm({ rating: myReview.rating, comment: myReview.comment });
                                                    }
                                                    setShowReviewModal(true);
                                                }}
                                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <MessageSquare className="w-5 h-5" />
                                                {myReview ? 'Edit Your Review' : 'Write a Review'}
                                            </button>
                                        )}

                                        {/* Sort Options */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-700">Sort by:</span>
                                            {['recent', 'helpful', 'rating'].map(sort => (
                                                <button
                                                    key={sort}
                                                    onClick={() => setSortBy(sort)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sortBy === sort
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Reviews List */}
                                        {reviews.length > 0 ? (
                                            <div className="space-y-4">
                                                {reviews.map(review => (
                                                    <div key={review._id} className={`p-6 rounded-xl border ${review._id === myReview?._id
                                                        ? 'border-blue-300 bg-blue-50'
                                                        : 'border-slate-200 bg-white'
                                                        }`}>
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <img
                                                                    src={review.student?.profileImage || '/default-avatar.png'}
                                                                    alt={review.student?.name}
                                                                    className="w-10 h-10 rounded-full"
                                                                />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-semibold text-slate-900">{review.student?.name}</p>
                                                                        {review._id === myReview?._id && (
                                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
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
                                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
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
                                                                className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm"
                                                            >
                                                                <ThumbsUp className="w-4 h-4" />
                                                                Helpful ({review.helpfulCount || 0})
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}

                                                {hasMoreReviews && (
                                                    <button
                                                        onClick={() => loadReviews(true)}
                                                        disabled={loadingReviews}
                                                        className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-blue-500 text-slate-600 hover:text-blue-600 rounded-lg transition-colors font-medium"
                                                    >
                                                        {loadingReviews ? 'Loading...' : 'Load More Reviews'}
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-slate-500">
                                                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                                <p>No reviews yet. Be the first to review!</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
                            <h3 className="font-bold text-lg mb-4">Course Includes</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <PlayCircle className="w-5 h-5 text-blue-600" />
                                    <span>{totalLessons} video lessons</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <span>{Math.round(totalDuration / 3600)} hours content</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <Download className="w-5 h-5 text-blue-600" />
                                    <span>Downloadable resources</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <Award className="w-5 h-5 text-blue-600" />
                                    <span>Certificate of completion</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lesson Player Modal */}
            {showLessonPlayerModal && lessons[selectedLessonIndex] && (
                <LessonPlayerModal
                    lessons={lessons}
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
                        setShowExamHistoryModal(false); // Close history to show result
                        setShowResultModal(true);
                    }}
                    onStartExam={handleStartExam}
                />
            )}

            {/* Exam Taking Modal */}
            {showExamModal && selectedExam && (
                <ExamTakingScreen
                    exam={selectedExam}
                    courseId={id}
                    onClose={() => setShowExamModal(false)}
                    onComplete={handleExamComplete}
                />
            )}

            {/* Exam Result Modal */}
            {showResultModal && selectedResult && (
                <ExamResultModal
                    result={selectedResult}
                    onClose={() => {
                        setShowResultModal(false);
                        setShowExamHistoryModal(true); // Re-open history when closing result
                    }}
                />
            )}

            {/* Review Modal */}
            {showReviewModal && (
                // ...
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {myReview ? 'Edit Review' : 'Write a Review'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowReviewModal(false);
                                        setReviewForm({ rating: 0, comment: '' });
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-600" />
                                </button>
                            </div>
                            <p className="text-slate-600 mt-2">{course.title}</p>
                        </div>

                        <form onSubmit={handleSubmitReview} className="p-6 space-y-6">
                            {/* Rating */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3">
                                    Rating
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(rating => (
                                        <button
                                            key={rating}
                                            type="button"
                                            onClick={() => setReviewForm(prev => ({ ...prev, rating }))}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-10 h-10 ${rating <= reviewForm.rating
                                                    ? 'text-yellow-400 fill-yellow-400'
                                                    : 'text-slate-300'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                {reviewForm.rating > 0 && (
                                    <p className="mt-2 text-sm font-medium text-blue-600">
                                        {reviewForm.rating === 1 && 'Poor'}
                                        {reviewForm.rating === 2 && 'Fair'}
                                        {reviewForm.rating === 3 && 'Good'}
                                        {reviewForm.rating === 4 && 'Very Good'}
                                        {reviewForm.rating === 5 && 'Excellent'}
                                    </p>
                                )}
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3">
                                    Your Review
                                </label>
                                <textarea
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Share your experience with this course..."
                                    maxLength={500}
                                />
                                <p className="text-sm text-slate-500 mt-2">
                                    {reviewForm.comment.length}/500 characters
                                </p>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReviewModal(false);
                                        setReviewForm({ rating: 0, comment: '' });
                                    }}
                                    className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview || reviewForm.rating === 0 || reviewForm.comment.trim().length < 10}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submittingReview ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}