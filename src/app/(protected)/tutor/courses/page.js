'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Edit, Trash2, Eye, TrendingUp,
    Users, PlayCircle, BookOpen, Settings, Grid, List,
    Star, Loader2, Flame, Sparkles, Hammer, Filter, MoreHorizontal, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R, FX, cx, pageStyle } from '@/constants/tutorTokens';

const ITEMS_PER_PAGE = 6;

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        published: { label: 'Published', bg: C.success,    text: '#fff' },
        pending:   { label: 'In Review', bg: C.warning,    text: '#fff' },
        rejected:  { label: 'Rejected',  bg: C.danger,     text: '#fff' },
        suspended: { label: 'Suspended', bg: C.textMuted,  text: '#fff' },
    };
    const s = map[status] || { label: 'Draft', bg: '#F59E0B', text: '#fff' };
    return (
        <span style={{
            backgroundColor: s.bg,
            color: s.text,
            fontFamily: T.fontFamily,
            fontSize: '11px',
            fontWeight: T.weight.bold,
            padding: '3px 10px',
            borderRadius: R.full,
        }}>
            {s.label}
        </span>
    );
}

// ─── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating = 0 }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-3.5 h-3.5"
                    style={{ color: C.warning, fill: i <= Math.round(rating) ? C.warning : 'transparent' }} />
            ))}
        </div>
    );
}

// ─── Course Card (Image Layout) ────────────────────────────────────────────────
function CourseGridCard({ course, onDelete }) {
    const isDraft = !['published', 'pending', 'rejected', 'suspended'].includes(course.status);

    return (
        <div className="rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1"
            style={{
                backgroundColor: C.surfaceWhite,
                border: `1px solid ${C.cardBorder}`,
                boxShadow: S.card,
            }}>

            {/* ── Thumbnail ── */}
            <div className="relative overflow-hidden flex-shrink-0" style={{ aspectRatio: '16/9', backgroundColor: C.innerBg }}>
                <img
                    src={course.thumbnail || 'https://via.placeholder.com/640x360'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Price — top right */}
                <div className="absolute top-3 right-3">
                    <span style={{
                        backgroundColor: C.surfaceWhite,
                        color: C.heading,
                        fontFamily: T.fontFamily,
                        fontSize: T.size.sm,
                        fontWeight: T.weight.black,
                        padding: '4px 10px',
                        borderRadius: R.full,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}>
                        {course.price ? `₹${course.price.toLocaleString()}` : 'Free'}
                    </span>
                </div>

                {/* Draft label — top left */}
                {isDraft && (
                    <div className="absolute top-3 left-3">
                        <span style={{
                            backgroundColor: '#F59E0B',
                            color: '#fff',
                            fontFamily: T.fontFamily,
                            fontSize: '11px',
                            fontWeight: T.weight.bold,
                            padding: '3px 10px',
                            borderRadius: R.full,
                        }}>Draft</span>
                    </div>
                )}

                {/* AI + Hot badges — bottom right of thumbnail */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    {course.isAIGenerated && (
                        <span style={{
                            backgroundColor: 'rgba(124,58,237,0.85)',
                            color: '#fff',
                            fontFamily: T.fontFamily,
                            fontSize: '10px',
                            fontWeight: T.weight.bold,
                            padding: '3px 8px',
                            borderRadius: R.full,
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}>
                            <Sparkles className="w-2.5 h-2.5" /> AI
                        </span>
                    )}
                    {course.enrolledCount > 50 && (
                        <span style={{
                            backgroundColor: C.danger,
                            color: '#fff',
                            fontFamily: T.fontFamily,
                            fontSize: '10px',
                            fontWeight: T.weight.bold,
                            padding: '3px 8px',
                            borderRadius: R.full,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}>
                            <Flame className="w-2.5 h-2.5" /> Hot
                        </span>
                    )}
                </div>
            </div>

            {/* ── Card Body ── */}
            <div className="p-4 flex flex-col flex-1 gap-2">

                {/* Title */}
                <h3 className="line-clamp-1" style={{
                    fontFamily: T.fontFamily,
                    fontSize: T.size.md,
                    fontWeight: T.weight.bold,
                    color: C.heading,
                    lineHeight: T.leading.snug,
                }}>
                    {course.title}
                </h3>

                {/* Students count */}
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text }}>
                    <span style={{ fontWeight: T.weight.black }}>{(course.enrolledCount || 0).toLocaleString()}</span> Students
                </p>

                {/* Rating row + completion % + status */}
                <div className="flex items-center gap-2 flex-wrap">
                    <StarRating rating={course.rating || 0} />
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.medium }}>
                        {course.rating?.toFixed(1) || '0.0'}
                    </span>
                    {course.enrolledCount > 0 && (
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.medium }}>
                            · {course.completionRate || 0}%
                        </span>
                    )}
                    <div className="ml-auto">
                        <StatusBadge status={course.status} />
                    </div>
                </div>

                {/* Completion bar */}
                {course.enrolledCount > 0 && (
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.innerBg }}>
                        <div className="h-full rounded-full transition-all"
                            style={{ width: `${course.completionRate || 0}%`, background: C.gradientBtn }} />
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex gap-2 mt-auto pt-1">
                    <Link href={`/student/courses/${course._id}`} className="flex-1">
                        <button className="w-full h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                            style={{
                                backgroundColor: C.btnViewAllBg,
                                color: C.btnViewAllText,
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                border: `1px solid ${C.cardBorder}`,
                            }}>
                            <Eye className="w-3.5 h-3.5" /> View
                        </button>
                    </Link>

                    {!isDraft ? (
                        <Link href={`/tutor/courses/${course._id}`} className="flex-1">
                            <button className="w-full h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                                style={{
                                    backgroundColor: C.btnViewAllBg,
                                    color: C.btnViewAllText,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.bold,
                                    border: `1px solid ${C.cardBorder}`,
                                }}>
                                <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                        </Link>
                    ) : (
                        <button onClick={() => onDelete(course._id)}
                            className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
                            style={{
                                backgroundColor: C.dangerBg,
                                color: C.danger,
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                border: `1px solid ${C.dangerBorder}`,
                            }}>
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    )}

                    <button className="h-9 px-3 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                        style={{
                            backgroundColor: C.btnViewAllBg,
                            color: C.btnViewAllText,
                            border: `1px solid ${C.cardBorder}`,
                        }}>
                        <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Course List Row ───────────────────────────────────────────────────────────
function CourseListRow({ course, onDelete }) {
    const isDraft = !['published', 'pending', 'rejected', 'suspended'].includes(course.status);
    return (
        <div className="rounded-2xl p-4 flex gap-4 hover:shadow-md transition-all group"
            style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = FX.primary25; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; }}>

            {/* Thumbnail */}
            <div className="relative w-40 h-[90px] flex-shrink-0 rounded-xl overflow-hidden" style={{ backgroundColor: C.innerBg }}>
                <img src={course.thumbnail || 'https://via.placeholder.com/320x180'} alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-2 left-2.5 leading-none"
                    style={{ color: C.surfaceWhite, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black }}>
                    {course.price ? `₹${course.price.toLocaleString()}` : 'Free'}
                </p>
                {course.isAIGenerated && (
                    <div className="absolute top-2 right-2">
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(124,58,237,0.85)', color: '#fff', fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold }}>
                            <Sparkles className="w-2 h-2" /> AI
                        </span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="flex-1 line-clamp-1 min-w-0"
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
                    <div className="flex items-center gap-1">
                        <StarRating rating={course.rating || 0} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>{course.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />{(course.enrolledCount || 0).toLocaleString()} students
                    </span>
                    <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />{course.modules?.length || 0} modules
                    </span>
                    {course.enrolledCount > 0 && (
                        <span>{course.completionRate || 0}% completion</span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 self-center">
                <Link href={`/student/courses/${course._id}`}>
                    <button className="h-9 px-4 rounded-xl flex items-center gap-1.5 transition-all hover:opacity-80"
                        style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, border: `1px solid ${C.cardBorder}` }}>
                        <Eye className="w-3.5 h-3.5" /> View
                    </button>
                </Link>
                <Link href={`/tutor/courses/${course._id}`}>
                    <button className="h-9 px-4 rounded-xl flex items-center gap-1.5 transition-all hover:opacity-90"
                        style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                        <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                </Link>
                <button onClick={() => onDelete(course._id)}
                    className="h-9 px-3 rounded-xl border transition-all hover:opacity-80"
                    style={{ borderColor: C.dangerBorder, color: C.danger, backgroundColor: C.dangerBg }}>
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button className="h-9 px-3 rounded-xl border transition-all hover:opacity-80"
                    style={{ borderColor: C.cardBorder, color: C.textMuted, backgroundColor: C.innerBg }}>
                    <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyCoursesPage() {
    const [courses, setCourses]           = useState([]);
    const [loading, setLoading]           = useState(true);
    const [searchQuery, setSearchQuery]   = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode]         = useState('grid');
    const [currentPage, setCurrentPage]  = useState(1);
    const { confirmDialog }              = useConfirm();

    useEffect(() => { fetchMyCourses(); }, []);

    const fetchMyCourses = async () => {
        try {
            const res = await api.get('/courses/my-courses');
            if (res.data.success) setCourses(res.data.courses);
        } catch (err) { console.error('Error fetching courses:', err); }
        finally { setLoading(false); }
    };

    const handleDeleteCourse = async (courseId) => {
        const ok = await confirmDialog(
            'Delete Course',
            'Are you sure you want to delete this course? This action cannot be undone.',
            { variant: 'destructive' }
        );
        if (!ok) return;
        try {
            await api.delete(`/courses/${courseId}`);
            setCourses(prev => prev.filter(c => c._id !== courseId));
            toast.success('Course deleted successfully');
        } catch { toast.error('Failed to delete course'); }
    };

    // ── Derived stats ──────────────────────────────────────────────────
    const stats = {
        total:         courses.length,
        published:     courses.filter(c => c.status === 'published').length,
        pending:       courses.filter(c => c.status === 'pending').length,
        draft:         courses.filter(c => !['published', 'pending'].includes(c.status)).length,
        aiGenerated:   courses.filter(c => c.isAIGenerated).length,
        totalStudents: courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0),
    };

    // ── Filter tabs ────────────────────────────────────────────────────
    const filterTabs = [
        { key: 'all',       label: 'All',          count: stats.total       },
        { key: 'draft',     label: 'Draft',        count: stats.draft       },
        { key: 'published', label: 'Published',    count: stats.published   },
        { key: 'pending',   label: 'In Review',    count: stats.pending     },
        { key: 'ai',        label: 'AI Generated', count: stats.aiGenerated, icon: Sparkles },
    ];

    // ── Filtering logic ────────────────────────────────────────────────
    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            filterStatus === 'all'       ? true :
            filterStatus === 'published' ? course.status === 'published' :
            filterStatus === 'pending'   ? course.status === 'pending' :
            filterStatus === 'draft'     ? !['published', 'pending'].includes(course.status) :
            filterStatus === 'ai'        ? course.isAIGenerated === true :
            true;
        return matchesSearch && matchesStatus;
    });

    // ── Pagination ─────────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));
    const paginatedCourses = filteredCourses.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const startItem = filteredCourses.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem   = Math.min(currentPage * ITEMS_PER_PAGE, filteredCourses.length);

    // Reset page on filter/search change
    useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery]);

    // ── Loading ────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: C.iconBg }}>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: C.iconColor }} />
            </div>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                Loading your courses…
            </p>
        </div>
    );

    return (
        <div className="space-y-5 pb-8" style={{ ...pageStyle, backgroundColor: C.pageBg, minHeight: '100vh', padding: '24px' }}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, lineHeight: T.leading.tight }}>
                        Course List
                    </h1>
                    {stats.aiGenerated > 0 && (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#7C3AED', fontWeight: T.weight.semibold, marginTop: 2 }}>
                            {stats.aiGenerated} AI generated · {stats.totalStudents.toLocaleString()} students enrolled
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* AI Builder shortcut */}
                    <Link href="/tutor/ai-buddy/course-builder">
                        <button className="h-11 px-4 rounded-xl flex items-center gap-2 transition-all hover:opacity-90"
                            style={{
                                backgroundColor: 'rgba(124,58,237,0.10)',
                                color: '#7C3AED',
                                border: '1px solid rgba(124,58,237,0.20)',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                            }}>
                            <Sparkles className="w-3.5 h-3.5" /> AI Builder
                        </button>
                    </Link>

                    {/* Create Course */}
                    <Link href="/tutor/courses/create">
                        <button className="h-11 px-6 rounded-xl flex items-center gap-2 transition-all hover:opacity-90 active:scale-95"
                            style={{
                                background: C.gradientBtn,
                                color: '#fff',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.sm,
                                fontWeight: T.weight.bold,
                                boxShadow: S.btn,
                            }}>
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(255,255,255,0.20)' }}>
                                <Plus className="w-3.5 h-3.5" />
                            </div>
                            Create Course
                        </button>
                    </Link>
                </div>
            </div>

            {/* ── Filter + Search Bar ───────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap"
                style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, padding: '10px 12px', border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>

                {/* Filter tabs */}
                <div className="flex gap-1 overflow-x-auto flex-shrink-0">
                    {filterTabs.map(({ key, label, count, icon: Icon }) => {
                        const isActive = filterStatus === key;
                        const isAI = key === 'ai';
                        return (
                            <button key={key} onClick={() => setFilterStatus(key)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all"
                                style={isActive
                                    ? {
                                        background: isAI ? '#7C3AED' : C.gradientBtn,
                                        color: '#fff',
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                        whiteSpace: 'nowrap',
                                        boxShadow: S.active,
                                    }
                                    : {
                                        color: C.textMuted,
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                        whiteSpace: 'nowrap',
                                    }}>
                                {Icon && <Icon className="w-3 h-3" />}
                                {label}
                                <span className="px-1.5 py-0.5 rounded-md"
                                    style={isActive
                                        ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: '10px', fontWeight: T.weight.black }
                                        : { backgroundColor: C.innerBg, color: C.textMuted, fontSize: '10px', fontWeight: T.weight.black }}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="hidden lg:block w-px h-6 mx-1 flex-shrink-0" style={{ backgroundColor: C.cardBorder }} />

                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: C.textMuted }} />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ ...cx.input(), width: '100%', height: 36, paddingLeft: 34, paddingRight: 12 }}
                        onFocus={e => Object.assign(e.target.style, cx.inputFocus)}
                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                    />
                </div>

                {/* Filter icon */}
                <button className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                    style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, border: `1px solid ${C.cardBorder}` }}>
                    <Filter className="w-3.5 h-3.5" />
                </button>

                {/* View toggle */}
                <div className="hidden sm:flex p-1 rounded-xl gap-0.5 flex-shrink-0"
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

            {/* ── Course Display ────────────────────────────────────────── */}
            {filteredCourses.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed py-16 flex flex-col items-center text-center px-6"
                    style={{ borderColor: C.cardBorder, backgroundColor: C.cardBg }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: C.iconBg }}>
                        {filterStatus === 'ai'
                            ? <Sparkles className="w-7 h-7" style={{ color: '#7C3AED' }} />
                            : <BookOpen className="w-7 h-7" style={{ color: C.iconColor }} />}
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, marginBottom: 4 }}>
                        {searchQuery ? 'No courses match your search'
                            : filterStatus === 'ai' ? 'No AI generated courses yet'
                            : 'No courses yet'}
                    </h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, maxWidth: 300, marginBottom: 20 }}>
                        {searchQuery
                            ? `No results for "${searchQuery}". Try different keywords.`
                            : filterStatus === 'ai'
                                ? 'Use AI Course Builder to generate a complete course automatically.'
                                : 'Create your first course and start sharing your expertise.'}
                    </p>
                    {!searchQuery && (
                        <div className="flex items-center gap-3">
                            {filterStatus === 'ai' ? (
                                <Link href="/tutor/ai-buddy/course-builder">
                                    <button className="h-10 px-5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all"
                                        style={{ backgroundColor: '#7C3AED', color: '#fff', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                        <Sparkles className="w-4 h-4" /> Try AI Builder
                                    </button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/tutor/courses/create">
                                        <button className="h-10 px-5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all"
                                            style={{ background: C.gradientBtn, color: '#fff', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                            <Plus className="w-4 h-4" /> Create Manually
                                        </button>
                                    </Link>
                                    <Link href="/tutor/ai-buddy/course-builder">
                                        <button className="h-10 px-5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all"
                                            style={{ backgroundColor: 'rgba(124,58,237,0.10)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.20)', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                            <Sparkles className="w-4 h-4" /> Use AI Builder
                                        </button>
                                    </Link>
                                </>
                            )}
                        </div>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {paginatedCourses.map(course => (
                        <CourseGridCard key={course._id} course={course} onDelete={handleDeleteCourse} />
                    ))}
                </div>
            ) : (
                <div className="space-y-2.5">
                    {paginatedCourses.map(course => (
                        <CourseListRow key={course._id} course={course} onDelete={handleDeleteCourse} />
                    ))}
                </div>
            )}

            {/* ── Pagination ────────────────────────────────────────────── */}
            {filteredCourses.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.medium }}>
                        Showing {startItem} to {endItem} of {filteredCourses.length}
                    </p>

                    <div className="flex items-center gap-1.5">
                        {/* Prev */}
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-40"
                            style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, border: `1px solid ${C.cardBorder}` }}>
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => setCurrentPage(page)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                style={currentPage === page
                                    ? { background: C.gradientBtn, color: '#fff', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, boxShadow: S.btn }
                                    : { backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, border: `1px solid ${C.cardBorder}` }}>
                                {page}
                            </button>
                        ))}

                        {/* Next */}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-40"
                            style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, border: `1px solid ${C.cardBorder}` }}>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}