'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Search,
    FolderOpen,
    FileCheck,
    Video,
    ChevronRight,
    ChevronDown,
    FileText,
    Sparkles,
    Megaphone,
    Users,
    PlayCircle,
    Pencil,
    Trash2,
    Star,
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import useInstitute from '@/hooks/useInstitute';

const COURSES_PER_PAGE = 8;

export default function MyCoursesPage() {
    const [enrollments, setEnrollments] = useState([]);
    const [upcomingExamsCount, setUpcomingExamsCount] = useState(0);
    const [liveClassesCount, setLiveClassesCount] = useState(0);
    const [batches, setBatches] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [aiRecommendationsOpen, setAiRecommendationsOpen] = useState(true);
    const [announcementsOpen, setAnnouncementsOpen] = useState(true);
    const [batchDetailsOpen, setBatchDetailsOpen] = useState(true);

    // New states for Discover view
    const [mainTab, setMainTab] = useState('enrollments'); // 'enrollments' | 'discover'
    const [scopeTab, setScopeTab] = useState('institute'); // 'institute' | 'global'
    const [discoverCourses, setDiscoverCourses] = useState([]);
    const [loadingDiscover, setLoadingDiscover] = useState(false);
    const [myInstitutes, setMyInstitutes] = useState([]);
    const [currentInstitute, setCurrentInstitute] = useState(null);

    useEffect(() => {
        fetchData();
        fetchMembership();
    }, []);

    // Support ?tab=discover from sidebar
    const searchParams = useSearchParams();
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'discover') setMainTab('discover');
    }, [searchParams]);

    const fetchMembership = async () => {
        try {
            const institutesRes = await api.get('/membership/my-institutes');
            if (institutesRes.data?.success) {
                setMyInstitutes(institutesRes.data.institutes || []);
                setCurrentInstitute(institutesRes.data.currentInstitute);
                if (!institutesRes.data.currentInstitute) {
                    setScopeTab('global');
                }
            }
        } catch (err) {
            console.warn('No institutes found, showing global view');
            setScopeTab('global');
        }
    };

    useEffect(() => {
        if (mainTab === 'discover') {
            fetchDiscoverCourses();
        }
    }, [mainTab, scopeTab]);

    const fetchDiscoverCourses = async () => {
        setLoadingDiscover(true);
        try {
            const params = new URLSearchParams();
            if (scopeTab) params.set('scope', scopeTab);
            const res = await api.get(`/courses?${params.toString()}`);
            if (res.data.success) {
                setDiscoverCourses(res.data.courses || []);
            }
        } catch (error) {
            console.error('Error fetching discover courses:', error);
            setDiscoverCourses([]);
        } finally {
            setLoadingDiscover(false);
        }
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

            if (enrollRes.data.success && enrollRes.data.enrollments) {
                setEnrollments(enrollRes.data.enrollments);
            }

            if (examsRes.data?.exams) {
                const upcoming = examsRes.data.exams.filter(
                    (e) => e.endDate && new Date(e.endDate) >= new Date() && !e.isCompleted
                );
                setUpcomingExamsCount(upcoming.length);
            }

            if (liveRes.data?.liveClasses) {
                const upcoming = liveRes.data.liveClasses.filter(
                    (c) => c.dateTime && new Date(c.dateTime) >= new Date()
                );
                setLiveClassesCount(upcoming.length);
            }

            if (batchesRes.data?.batches) {
                setBatches(batchesRes.data.batches);
            }

            if (annRes.data?.announcements) {
                setAnnouncements(annRes.data.announcements);
            }

            if (aiRes.data?.recommendations) {
                setAiRecommendations(aiRes.data.recommendations);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEnrollments = enrollments.filter((e) => {
        const course = e.courseId;
        if (!course) return false;
        const matchSearch =
            !searchQuery ||
            course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.tutorId?.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchSearch;
    });

    const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / COURSES_PER_PAGE));
    const startIdx = (currentPage - 1) * COURSES_PER_PAGE;
    const paginatedEnrollments = filteredEnrollments.slice(startIdx, startIdx + COURSES_PER_PAGE);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading your courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f2f8]">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main content */}
                <div className="flex-1 min-w-0 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h1 className="text-2xl font-bold text-slate-900">Courses</h1>

                        {/* Main Tabs */}
                        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200/60 p-1">
                            <button
                                onClick={() => setMainTab('enrollments')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mainTab === 'enrollments'
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                My Enrollments
                            </button>
                            <button
                                onClick={() => setMainTab('discover')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${mainTab === 'discover'
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Sparkles className="w-4 h-4" />
                                Discover Courses
                            </button>
                        </div>
                    </div>

                    {mainTab === 'enrollments' && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 min-w-[140px]">
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <FolderOpen className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Enrolled Courses</p>
                                    <p className="text-xl font-bold text-slate-900">{enrollments.length}</p>
                                </div>
                            </div>
                            <Link href="/student/upcoming-exams" className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 min-w-[140px] hover:border-indigo-200 transition-colors">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <FileCheck className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Upcoming Exams</p>
                                    <p className="text-xl font-bold text-slate-900">{upcomingExamsCount}</p>
                                </div>
                            </Link>
                            <Link href="/student/live-classes" className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 min-w-[140px] hover:border-indigo-200 transition-colors">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <Video className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Live Classes</p>
                                    <p className="text-xl font-bold text-slate-900">{liveClassesCount}</p>
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* Search */}
                    {mainTab === 'enrollments' && (
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search my courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400"
                            />
                        </div>
                    )}

                    {/* Content Area */}
                    {mainTab === 'enrollments' ? (
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Performance Overview</h2>
                            {filteredEnrollments.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {paginatedEnrollments.map((enrollment) => {
                                            const course = enrollment.courseId;
                                            if (!course) return null;
                                            const progress = enrollment.progress?.percentage ?? 0;
                                            const instructorName = course.tutorId?.userId?.name || 'Instructor';
                                            const isNew = enrollment.enrolledAt && (Date.now() - new Date(enrollment.enrolledAt).getTime()) < 14 * 24 * 60 * 60 * 1000;
                                            const isCertified = progress >= 100;

                                            return (
                                                <div
                                                    key={enrollment._id}
                                                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                                                >
                                                    <div className="relative aspect-video bg-slate-100">
                                                        <img
                                                            src={course.thumbnail || 'https://images.unsplash.com/photo-1546374823-74e2d36d4bd2?auto=format&fit=crop&q=80&w=600'}
                                                            alt={course.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {isNew && (
                                                            <span className="absolute top-3 left-3 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                                NEW
                                                            </span>
                                                        )}
                                                        {isCertified && (
                                                            <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                                CERTIFIED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="p-4">
                                                        <p className="font-semibold text-slate-900 line-clamp-1 mb-1">{course.title}</p>
                                                        <p className="text-sm text-slate-500 mb-3">{instructorName}</p>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-indigo-500 rounded-full transition-all"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">{progress}% Complete</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <Link href={`/student/courses/${course._id}`}>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                                                                >
                                                                    Resume
                                                                </Button>
                                                            </Link>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                                    aria-label="Edit"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    aria-label="Remove"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>


                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 mt-8">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                className="rounded-lg"
                                            >
                                                Previous
                                            </Button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => setCurrentPage(p)}
                                                    className={`w-9 h-9 rounded-lg font-medium text-sm transition-colors ${currentPage === p
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                className="rounded-lg"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                                    <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No enrolled courses</h3>
                                    <p className="text-slate-500 mb-4">Enroll in courses to see them here.</p>
                                    <Link href="/student/dashboard">
                                        <Button className="bg-indigo-600 hover:bg-indigo-700">Go to Dashboard</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Discover Options Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="text-lg font-bold text-slate-900">Explore Courses</h2>

                                {/* Institute Switcher for Discover */}
                                {myInstitutes.length > 0 && (
                                    <div className="flex bg-white rounded-lg border border-slate-200 p-1 shrink-0">
                                        <button
                                            onClick={() => setScopeTab('institute')}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${scopeTab === 'institute'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                                }`}
                                        >
                                            My Institute
                                        </button>
                                        <button
                                            onClick={() => setScopeTab('global')}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${scopeTab === 'global'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                                }`}
                                        >
                                            Global
                                        </button>
                                    </div>
                                )}
                            </div>

                            {loadingDiscover ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : discoverCourses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {discoverCourses.map((course) => {
                                        const instructorName = course.tutorId?.userId?.name || 'Instructor';

                                        return (
                                            <div
                                                key={course._id}
                                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                                            >
                                                <div className="relative aspect-video bg-slate-100">
                                                    <img
                                                        src={course.thumbnail || 'https://images.unsplash.com/photo-1546374823-74e2d36d4bd2?auto=format&fit=crop&q=80&w=600'}
                                                        alt={course.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {!course.price || course.price === 0 ? (
                                                        <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
                                                            FREE
                                                        </div>
                                                    ) : (
                                                        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
                                                            ₹{course.price}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 flex-1 flex flex-col">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-900 line-clamp-2 mb-1">{course.title}</p>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-sm text-slate-500">{instructorName}</p>
                                                            {course.rating > 0 && (
                                                                <span className="flex items-center gap-1 text-xs">
                                                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                                    <span className="font-semibold text-slate-700">{course.rating?.toFixed(1)}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {course.visibility === 'institute' && (
                                                                <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-purple-100">
                                                                    Institute Course
                                                                </span>
                                                            )}
                                                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-slate-200">
                                                                {course.lessons?.length || 0} Lessons
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                                        <Link href={`/student/courses/${course._id}`} className="block w-full">
                                                            <Button className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium">
                                                                View Details
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No courses found</h3>
                                    <p className="text-slate-500">Check back later for new {scopeTab === 'institute' ? 'institute' : 'global'} courses.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right sidebar */}
                <div className="w-full lg:w-80 shrink-0 space-y-4">
                    {/* AI Recommendations */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setAiRecommendationsOpen(!aiRecommendationsOpen)}
                            className="w-full flex items-center justify-between p-4 text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                        >
                            AI Recommendations
                            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${aiRecommendationsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {aiRecommendationsOpen && (
                            <div className="px-4 pb-4 space-y-2">
                                {aiRecommendations.map((rec, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 transition-colors"
                                    >
                                        <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <span className="text-sm font-medium text-slate-700 leading-snug">{rec}</span>
                                    </div>
                                ))}
                                <Link href="/student/ai-analytics" className="block mt-3">
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Start AI Study Plan
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Instructor Announcements */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setAnnouncementsOpen(!announcementsOpen)}
                            className="w-full flex items-center justify-between p-4 text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                        >
                            Instructor Announcements
                            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${announcementsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {announcementsOpen && (
                            <div className="px-4 pb-4 space-y-2">
                                {announcements.length > 0 ? (
                                    announcements.map((a) => (
                                        <div key={a.id} className="flex flex-col gap-1 p-3 rounded-lg bg-amber-50/50 hover:bg-amber-50 border border-amber-100 transition-colors">
                                            <div className="flex items-start gap-2">
                                                <Megaphone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                <span className="text-sm font-bold text-slate-800 leading-tight">{a.courseTitle}: {a.title}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 pl-6 leading-relaxed line-clamp-2">{a.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 p-2 text-center">No recent announcements.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Batch Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setBatchDetailsOpen(!batchDetailsOpen)}
                            className="w-full flex items-center justify-between p-4 text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                        >
                            Batch Details
                            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${batchDetailsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {batchDetailsOpen && (
                            <div className="px-4 pb-4 space-y-3">
                                {batches.length > 0 ? (
                                    batches.slice(0, 5).map((batch) => {
                                        const courseId = batch.courseId?._id || batch.courseId;
                                        const courseName = batch.courseId?.title || batch.name || 'Course';
                                        const instructorName = batch.tutorId?.userId?.name || 'Instructor';
                                        const enrollmentForBatch = enrollments.find(
                                            (e) => (e.courseId?._id ?? e.courseId)?.toString() === courseId?.toString()
                                        );
                                        const pct = enrollmentForBatch?.progress?.percentage ?? 0;
                                        return (
                                            <Link key={batch._id} href={courseId ? `/student/courses/${courseId}` : '#'} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                                                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-semibold text-sm">
                                                    {instructorName.charAt(0)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-800 truncate">{courseName}</p>
                                                    <p className="text-xs text-slate-500">{pct}% • {instructorName}</p>
                                                </div>
                                            </Link>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-slate-500 py-2">No batches yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
