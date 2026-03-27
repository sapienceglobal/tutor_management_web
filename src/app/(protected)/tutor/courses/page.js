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
import { C, T, S, R, FX, cx, pageStyle } from '@/constants/tutorTokens';

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        published:  { label: 'Published', dot: C.success, bg: C.successBg, text: C.success },
        pending:    { label: 'In Review', dot: C.warning, bg: C.warningBg, text: C.warning },
        rejected:   { label: 'Rejected', dot: C.danger, bg: C.dangerBg, text: C.danger },
        suspended:  { label: 'Suspended', dot: C.textMuted, bg: C.innerBg, text: C.textMuted },
    };
    const s = map[status] || { label: 'Draft', dot: C.btnPrimary, bg: FX.primary12, text: C.btnPrimary };
    return (
        <span style={{ backgroundColor: s.bg, color: s.text, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, letterSpacing: T.tracking.wide, textTransform: 'uppercase' }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
            {s.label}
        </span>
    );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, trend, accentColor }) {
    return (
        <div className="rounded-2xl p-5 relative overflow-hidden group hover:shadow-md transition-all duration-200"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity"
                style={{ backgroundColor: accentColor }} />
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}18` }}>
                    <Icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                {trend !== undefined && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: C.successBg, color: C.success, fontFamily: T.fontFamily }}>
                        +{trend}%
                    </span>
                )}
            </div>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.statValue }} className="mb-0.5 tabular-nums">
                {value}
            </p>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted }}>
                {label}
            </p>
        </div>
    );
}

// ─── Course Grid Card ──────────────────────────────────────────────────────────
function CourseGridCard({ course, onDelete }) {
    return (
        <div className="rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group flex flex-col"
            style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden flex-shrink-0" style={{ backgroundColor: C.innerBg }}>
                <img src={course.thumbnail || 'https://via.placeholder.com/640x360'} alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    <StatusBadge status={course.status} />
                    {course.enrolledCount > 50 && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full shadow-sm"
                            style={{ backgroundColor: C.danger, color: C.surfaceWhite, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold }}>
                            <Flame className="w-2.5 h-2.5" /> Hot
                        </span>
                    )}
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                        <p style={{ color: C.surfaceWhite, opacity: 0.6, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.medium, lineHeight: 1, marginBottom: 2 }}>Price</p>
                        <p style={{ color: C.surfaceWhite, fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, lineHeight: 1 }}>
                            {course.price ? `₹${course.price.toLocaleString()}` : 'Free'}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
                        <Star className="w-3 h-3" style={{ color: C.warning, fill: C.warning }} />
                        <span style={{ color: C.surfaceWhite, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>{course.rating?.toFixed(1) || '—'}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <h3 className="line-clamp-2 leading-snug mb-3 flex-1"
                    style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                    {course.title}
                </h3>

                <div className="flex items-center gap-2.5 mb-4"
                    style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted, fontWeight: T.weight.medium }}>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{(course.enrolledCount || 0).toLocaleString()} students</span>
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: C.cardBorder }} />
                    <span className="flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5" />{course.lessons?.length || 0} lessons</span>
                </div>

                {course.enrolledCount > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5"
                            style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>
                            <span>Avg. completion</span>
                            <span style={{ fontWeight: T.weight.bold, color: C.text }}>{course.completionRate || 68}%</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: C.innerBg }}>
                            <div className="h-full rounded-full" style={{ width: `${course.completionRate || 68}%`, backgroundColor: C.btnPrimary }} />
                        </div>
                    </div>
                )}

                <div className="flex gap-2 mt-auto pt-1">
                    <Link href={`/tutor/courses/${course._id}`} className="flex-1">
                        <button className="w-full h-9 rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all"
                            style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                            <Edit className="w-3.5 h-3.5" /> Manage
                        </button>
                    </Link>
                    <Link href={`/student/courses/${course._id}`}>
                        <button className="h-9 px-3 rounded-xl border transition-all hover:opacity-80"
                            style={{ borderColor: C.cardBorder, color: C.textMuted, backgroundColor: C.innerBg }}>
                            <Eye className="w-3.5 h-3.5" />
                        </button>
                    </Link>
                    <button onClick={() => onDelete(course._id)}
                        className="h-9 px-3 rounded-xl border transition-all hover:opacity-80"
                        style={{ borderColor: C.dangerBorder, color: C.danger, backgroundColor: C.dangerBg }}>
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
            <div className="rounded-2xl p-4 flex gap-4 hover:shadow-md transition-all group"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = FX.primary25; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; }}>
            <div className="relative w-40 h-[90px] flex-shrink-0 rounded-xl overflow-hidden" style={{ backgroundColor: C.innerBg }}>
                <img src={course.thumbnail || 'https://via.placeholder.com/320x180'} alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-2 left-2.5 leading-none" style={{ color: C.surfaceWhite, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black }}>
                    {course.price ? `₹${course.price.toLocaleString()}` : 'Free'}
                </p>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1.5">
                    <h3 className="flex-1 line-clamp-1"
                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                        {course.title}
                    </h3>
                    <StatusBadge status={course.status} />
                </div>
                <p className="line-clamp-1 mb-2.5"
                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                    {course.description}
                </p>
                <div className="flex items-center gap-3.5"
                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.medium }}>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" style={{ color: C.warning, fill: C.warning }} />{course.rating?.toFixed(1) || '0.0'}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(course.enrolledCount || 0).toLocaleString()} students</span>
                    <span className="flex items-center gap-1"><PlayCircle className="w-3 h-3" />{course.lessons?.length || 0} lessons</span>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 self-center">
                <Link href={`/tutor/courses/${course._id}`}>
                    <button className="h-9 px-4 rounded-xl flex items-center gap-1.5 hover:opacity-90 transition-all"
                        style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                        <Edit className="w-3.5 h-3.5" /> Manage
                    </button>
                </Link>
                <Link href={`/student/courses/${course._id}`}>
                    <button className="h-9 px-3 rounded-xl border transition-all hover:opacity-80"
                        style={{ borderColor: C.cardBorder, color: C.textMuted, backgroundColor: C.innerBg }}>
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                </Link>
                <button onClick={() => onDelete(course._id)}
                    className="h-9 px-3 rounded-xl border transition-all hover:opacity-80"
                    style={{ borderColor: C.dangerBorder, color: C.danger, backgroundColor: C.dangerBg }}>
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyCoursesPage() {
    const [courses, setCourses]         = useState([]);
    const [loading, setLoading]         = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode]       = useState('grid');
    const { confirmDialog }             = useConfirm();

    useEffect(() => { fetchMyCourses(); }, []);

    const fetchMyCourses = async () => {
        try {
            const res = await api.get('/courses/my-courses');
            if (res.data.success) setCourses(res.data.courses);
        } catch (err) { console.error('Error fetching courses:', err); }
        finally { setLoading(false); }
    };

    const handleDeleteCourse = async (courseId) => {
        const ok = await confirmDialog('Delete Course', 'Are you sure you want to delete this course? This action cannot be undone.', { variant: 'destructive' });
        if (!ok) return;
        try {
            await api.delete(`/courses/${courseId}`);
            setCourses(prev => prev.filter(c => c._id !== courseId));
            toast.success('Course deleted successfully');
        } catch { toast.error('Failed to delete course'); }
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
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: C.iconBg }}>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: C.iconColor }} />
            </div>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                Loading your courses…
            </p>
        </div>
    );

    return (
        <div className="space-y-5 pb-8" style={pageStyle}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                        My Courses
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, marginTop: 2 }}>
                        {stats.total} courses · {stats.totalStudents.toLocaleString()} total students enrolled
                    </p>
                </div>
                <Link href="/tutor/courses/create">
                    <button className="h-10 px-5 rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                        style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                        <Plus className="w-4 h-4" /> New Course
                    </button>
                </Link>
            </div>

            {/* ── Stats ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Total Courses"   value={stats.total}                          icon={BookOpen}   accentColor={C.btnPrimary} />
                <StatCard label="Published"       value={stats.published}                      icon={TrendingUp}  accentColor={C.success} trend={12} />
                <StatCard label="Drafts"          value={stats.draft}                          icon={Settings}    accentColor={C.warning} />
                <StatCard label="Total Students"  value={stats.totalStudents.toLocaleString()} icon={Users}       accentColor={C.chartLine} trend={8} />
            </div>

            {/* ── Filters + Search ──────────────────────────────────────── */}
            <div className="p-3 rounded-2xl flex flex-col lg:flex-row gap-3 items-stretch lg:items-center"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>

                {/* Filter tabs */}
                <div className="flex gap-1 overflow-x-auto flex-shrink-0">
                    {filterTabs.map(({ key, label, count }) => (
                        <button key={key} onClick={() => setFilterStatus(key)}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all"
                            style={filterStatus === key
                                ? { backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, whiteSpace: 'nowrap', boxShadow: S.active }
                                : { color: C.textMuted, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, whiteSpace: 'nowrap' }}>
                            {label}
                            <span className="px-1.5 py-0.5 rounded-md"
                                style={filterStatus === key
                                    ? { backgroundColor: C.surfaceWhite, color: C.btnPrimary, fontSize: '10px', fontWeight: T.weight.black }
                                    : { backgroundColor: C.innerBg, color: C.textMuted, fontSize: '10px', fontWeight: T.weight.black }}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 flex gap-2 items-center">
                    <div className="hidden lg:block w-px h-6 mx-1" style={{ backgroundColor: C.cardBorder }} />

                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: C.textMuted }} />
                        <input type="text" placeholder="Search courses…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ ...cx.input(), width: '100%', height: 36, paddingLeft: 36, paddingRight: 12 }}
                            onFocus={e => Object.assign(e.target.style, cx.inputFocus)}
                            onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                        />
                    </div>

                    {/* View toggle */}
                    <div className="hidden sm:flex p-1 rounded-xl gap-0.5"
                        style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                        {[['grid', Grid], ['list', List]].map(([mode, Icon]) => (
                            <button key={mode} onClick={() => setViewMode(mode)}
                                className="w-8 h-7 rounded-lg flex items-center justify-center transition-all"
                                style={viewMode === mode
                                    ? { backgroundColor: C.surfaceWhite, color: C.btnPrimary, boxShadow: S.active }
                                    : { color: C.textMuted }}>
                                <Icon className="w-3.5 h-3.5" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search result count */}
            {searchQuery && (
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: -8, paddingLeft: 4 }}>
                    {filteredCourses.length} result{filteredCourses.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                </p>
            )}

            {/* ── Course Display ────────────────────────────────────────── */}
            {filteredCourses.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed py-16 flex flex-col items-center text-center px-6"
                    style={{ borderColor: C.cardBorder, backgroundColor: C.cardBg }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: C.iconBg, border: `1px solid ${C.cardBorder}` }}>
                        <BookOpen className="w-7 h-7" style={{ color: C.iconColor }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, marginBottom: 4 }}>
                        {searchQuery ? 'No courses match your search' : 'No courses yet'}
                    </h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, maxWidth: 280, marginBottom: 20 }}>
                        {searchQuery
                            ? `No results for "${searchQuery}". Try different keywords.`
                            : 'Create your first course and start sharing your expertise with students worldwide.'}
                    </p>
                    {!searchQuery && (
                        <Link href="/tutor/courses/create">
                            <button className="h-10 px-6 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all"
                                style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
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
