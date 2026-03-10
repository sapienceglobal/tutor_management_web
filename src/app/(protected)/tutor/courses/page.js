'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Edit, Trash2, Eye, TrendingUp,
    Users, PlayCircle, BookOpen, Settings, Grid, List,
    Star, Loader2, Flame
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        published:  { label: 'Published',  dot: '#10b981', bg: 'rgba(16,185,129,0.1)',  text: '#059669' },
        pending:    { label: 'In Review',  dot: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  text: '#d97706' },
        rejected:   { label: 'Rejected',   dot: '#ef4444', bg: 'rgba(239,68,68,0.1)',   text: '#dc2626' },
        suspended:  { label: 'Suspended',  dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)', text: '#64748b' },
    };
    const s = map[status] || { label: 'Draft', dot: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', text: '#7c3aed' };
    return (
        <span style={{ backgroundColor: s.bg, color: s.text }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
            {s.label}
        </span>
    );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, trend, accentColor }) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                style={{ backgroundColor: accentColor }} />
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}18` }}>
                    <Icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                {trend !== undefined && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                        +{trend}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-black text-slate-900 mb-0.5 tabular-nums">{value}</p>
            <p className="text-xs font-medium text-slate-400">{label}</p>
        </div>
    );
}

// ─── Course Grid Card ──────────────────────────────────────────────────────────
function CourseGridCard({ course, onDelete }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group flex flex-col">
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-slate-100 flex-shrink-0">
                <img
                    src={course.thumbnail || 'https://via.placeholder.com/640x360'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Status top-left */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    <StatusBadge status={course.status} />
                    {course.enrolledCount > 50 && (
                        <span className="flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
                            <Flame className="w-2.5 h-2.5" /> Hot
                        </span>
                    )}
                </div>

                {/* Price + rating bottom */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                        <p className="text-white/60 text-[10px] font-medium leading-none mb-0.5">Price</p>
                        <p className="text-white text-xl font-black leading-none">
                            {course.price ? `₹${course.price.toLocaleString()}` : 'Free'}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-xs font-bold">{course.rating?.toFixed(1) || '—'}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug mb-3 flex-1">
                    {course.title}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-2.5 mb-4 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{(course.enrolledCount || 0).toLocaleString()} students</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5" />{course.lessons?.length || 0} lessons</span>
                </div>

                {/* Completion bar */}
                {course.enrolledCount > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                            <span>Avg. completion</span>
                            <span className="font-bold text-slate-600">{course.completionRate || 68}%</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full"
                                style={{ width: `${course.completionRate || 68}%`, backgroundColor: 'var(--theme-primary)' }} />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-1">
                    <Link href={`/tutor/courses/${course._id}`} className="flex-1">
                        <button className="w-full h-9 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all"
                            style={{ backgroundColor: 'var(--theme-primary)' }}>
                            <Edit className="w-3.5 h-3.5" /> Manage
                        </button>
                    </Link>
                    <Link href={`/student/courses/${course._id}`}>
                        <button className="h-9 px-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
                            <Eye className="w-3.5 h-3.5" />
                        </button>
                    </Link>
                    <button onClick={() => onDelete(course._id)}
                        className="h-9 px-3 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Course List Row ───────────────────────────────────────────────────────────
function CourseListRow({ course, onDelete }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-4 hover:shadow-md hover:border-slate-200 transition-all group">
            <div className="relative w-40 h-[90px] flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
                <img src={course.thumbnail || 'https://via.placeholder.com/320x180'} alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <p className="absolute bottom-2 left-2.5 text-white text-sm font-black leading-none">
                    {course.price ? `₹${course.price.toLocaleString()}` : 'Free'}
                </p>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-slate-900 flex-1 line-clamp-1">{course.title}</h3>
                    <StatusBadge status={course.status} />
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 mb-2.5">{course.description}</p>
                <div className="flex items-center gap-3.5 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{course.rating?.toFixed(1) || '0.0'}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(course.enrolledCount || 0).toLocaleString()} students</span>
                    <span className="flex items-center gap-1"><PlayCircle className="w-3 h-3" />{course.lessons?.length || 0} lessons</span>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 self-center">
                <Link href={`/tutor/courses/${course._id}`}>
                    <button className="h-9 px-4 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-all"
                        style={{ backgroundColor: 'var(--theme-primary)' }}>
                        <Edit className="w-3.5 h-3.5" /> Manage
                    </button>
                </Link>
                <Link href={`/student/courses/${course._id}`}>
                    <button className="h-9 px-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                </Link>
                <button onClick={() => onDelete(course._id)}
                    className="h-9 px-3 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const { confirmDialog } = useConfirm();

    useEffect(() => { fetchMyCourses(); }, []);

    const fetchMyCourses = async () => {
        try {
            const res = await api.get('/courses/my-courses');
            if (res.data.success) setCourses(res.data.courses);
        } catch (err) {
            console.error('Error fetching courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        const ok = await confirmDialog(
            "Delete Course",
            "Are you sure you want to delete this course? This action cannot be undone.",
            { variant: 'destructive' }
        );
        if (!ok) return;
        try {
            await api.delete(`/courses/${courseId}`);
            setCourses(prev => prev.filter(c => c._id !== courseId));
            toast.success("Course deleted successfully");
        } catch {
            toast.error('Failed to delete course');
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'published' && course.status === 'published') ||
            (filterStatus === 'pending'   && course.status === 'pending') ||
            (filterStatus === 'draft'     && !['published', 'pending'].includes(course.status));
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total:         courses.length,
        published:     courses.filter(c => c.status === 'published').length,
        pending:       courses.filter(c => c.status === 'pending').length,
        draft:         courses.filter(c => !['published', 'pending'].includes(c.status)).length,
        totalStudents: courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0),
    };

    const filterTabs = [
        { key: 'all',       label: 'All',       count: stats.total },
        { key: 'published', label: 'Published', count: stats.published },
        { key: 'pending',   label: 'In Review', count: stats.pending },
        { key: 'draft',     label: 'Drafts',    count: stats.draft },
    ];

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)' }}>
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <p className="text-sm font-medium text-slate-400">Loading your courses…</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Courses</h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        {stats.total} courses · {stats.totalStudents.toLocaleString()} total students enrolled
                    </p>
                </div>
                <Link href="/tutor/courses/create">
                    <button
                        className="h-10 px-5 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                        style={{
                            backgroundColor: 'var(--theme-primary)',
                            boxShadow: '0 4px 14px color-mix(in srgb, var(--theme-primary) 35%, transparent)'
                        }}>
                        <Plus className="w-4 h-4" /> New Course
                    </button>
                </Link>
            </div>

            {/* ── Stats ───────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Total Courses"   value={stats.total}                          icon={BookOpen}   accentColor="var(--theme-primary)" />
                <StatCard label="Published"       value={stats.published}                      icon={TrendingUp}  accentColor="#10b981" trend={12} />
                <StatCard label="Drafts"          value={stats.draft}                          icon={Settings}    accentColor="#f59e0b" />
                <StatCard label="Total Students"  value={stats.totalStudents.toLocaleString()} icon={Users}       accentColor="#6366f1" trend={8} />
            </div>

            {/* ── Filters + Search ────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                {/* Filter tabs */}
                <div className="flex gap-1 overflow-x-auto flex-shrink-0">
                    {filterTabs.map(({ key, label, count }) => (
                        <button key={key} onClick={() => setFilterStatus(key)}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                            style={filterStatus === key
                                ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', color: 'var(--theme-primary)' }
                                : { color: '#94a3b8' }}>
                            {label}
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black transition-all"
                                style={filterStatus === key
                                    ? { backgroundColor: 'white', color: 'var(--theme-primary)' }
                                    : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 flex gap-2 items-center">
                    <div className="hidden lg:block w-px h-6 bg-slate-100 mx-1" />

                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search courses…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all"
                        />
                    </div>

                    {/* View toggle */}
                    <div className="hidden sm:flex bg-slate-50 border border-slate-100 rounded-xl p-1 gap-0.5">
                        {[['grid', Grid], ['list', List]].map(([mode, Icon]) => (
                            <button key={mode} onClick={() => setViewMode(mode)}
                                className="w-8 h-7 rounded-lg flex items-center justify-center transition-all"
                                style={viewMode === mode
                                    ? { backgroundColor: 'white', color: 'var(--theme-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                                    : { color: '#cbd5e1' }}>
                                <Icon className="w-3.5 h-3.5" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search results label */}
            {searchQuery && (
                <p className="text-xs text-slate-400 font-medium -mt-2 px-1">
                    {filteredCourses.length} result{filteredCourses.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                </p>
            )}

            {/* ── Course Display ───────────────────────────────────────────── */}
            {filteredCourses.length === 0 ? (

                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-16 flex flex-col items-center text-center px-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{
                            backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, white)',
                            border: '1px solid color-mix(in srgb, var(--theme-primary) 15%, white)'
                        }}>
                        <BookOpen className="w-7 h-7" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">
                        {searchQuery ? 'No courses match your search' : 'No courses yet'}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-xs mb-6">
                        {searchQuery
                            ? `No results for "${searchQuery}". Try different keywords.`
                            : 'Create your first course and start sharing your expertise with students worldwide.'}
                    </p>
                    {!searchQuery && (
                        <Link href="/tutor/courses/create">
                            <button className="h-10 px-6 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all"
                                style={{ backgroundColor: 'var(--theme-primary)' }}>
                                <Plus className="w-4 h-4" /> Create Your First Course
                            </button>
                        </Link>
                    )}
                </div>

            ) : viewMode === 'grid' ? (

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredCourses.map(course => (
                        <CourseGridCard key={course._id} course={course} onDelete={handleDeleteCourse} />
                    ))}
                </div>

            ) : (

                <div className="space-y-2.5">
                    {filteredCourses.map(course => (
                        <CourseListRow key={course._id} course={course} onDelete={handleDeleteCourse} />
                    ))}
                </div>
            )}
        </div>
    );
}