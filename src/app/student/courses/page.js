'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';

const COURSES_PER_PAGE = 8;

export default function MyCoursesPage() {
    const [enrollments, setEnrollments] = useState([]);
    const [upcomingExamsCount, setUpcomingExamsCount] = useState(0);
    const [liveClassesCount, setLiveClassesCount] = useState(0);
    const [batches, setBatches] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [aiRecommendationsOpen, setAiRecommendationsOpen] = useState(true);
    const [announcementsOpen, setAnnouncementsOpen] = useState(true);
    const [batchDetailsOpen, setBatchDetailsOpen] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [enrollRes, examsRes, liveRes, batchesRes] = await Promise.all([
                api.get('/enrollments/my-enrollments'),
                api.get('/student/exams/all').catch(() => ({ data: { exams: [] } })),
                api.get('/live-classes').catch(() => ({ data: { liveClasses: [] } })),
                api.get('/batches/my').catch(() => ({ data: { batches: [] } })),
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

            // Placeholder announcements (from batch announcements if API exists later)
            setAnnouncements([
                { id: '1', title: 'Physics Mock Test scheduled on April 25th - Review the materials.', icon: FileText },
                { id: '2', title: 'New Biology Quiz added to your course - Prepare for the upcoming test.', icon: FileText },
            ]);
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

    const aiRecommendations = [
        { id: '1', title: 'Algebra Practice Session', icon: FileText },
        { id: '2', title: 'Biology Test Flashcards', icon: FileText },
    ];

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
                    {/* My Courses header + summary cards */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
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
                            <Link href="/student/upcoming-exams" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                View All <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search courses, tests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>

                    {/* Performance Overview */}
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
                                                className={`w-9 h-9 rounded-lg font-medium text-sm transition-colors ${
                                                    currentPage === p
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
                                {aiRecommendations.map((rec) => (
                                    <div
                                        key={rec.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                                    >
                                        <rec.icon className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span className="text-sm font-medium text-slate-700">{rec.title}</span>
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
                                {announcements.map((a) => (
                                    <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
                                        <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-700">{a.title}</span>
                                    </div>
                                ))}
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
