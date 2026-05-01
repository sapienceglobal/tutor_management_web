'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    MdAdd,
    MdSearch,
    MdEdit,
    MdDelete,
    MdVisibility,
    MdTrendingUp,
    MdPeople,
    MdPlayCircle,
    MdMenuBook,
    MdSettings,
    MdGridView,
    MdList,
    MdStar,
    MdStarBorder,
    MdHourglassEmpty,
    MdLocalFireDepartment,
    MdAutoAwesome,
    MdFilterList,
    MdMoreHoriz,
    MdChevronLeft,
    MdChevronRight,
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R, FX, cx, pageStyle } from '@/constants/studentTokens';

const ITEMS_PER_PAGE = 6;

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        published: { label: 'Published', bg: C.successBg,  text: C.success,  border: C.successBorder },
        pending:   { label: 'In Review', bg: C.warningBg,  text: C.warning,  border: C.warningBorder },
        rejected:  { label: 'Rejected',  bg: C.dangerBg,   text: C.danger,   border: C.dangerBorder  },
        suspended: { label: 'Suspended', bg: C.innerBg,    text: C.text,     border: C.cardBorder    },
    };
    const s = map[status] || { label: 'Draft', bg: C.warningBg, text: C.warning, border: C.warningBorder };
    return (
        <span style={{
            backgroundColor: s.bg,
            color: s.text,
            border: `1px solid ${s.border}`,
            fontFamily: T.fontFamily,
            fontSize: T.size.xs,
            fontWeight: T.weight.bold,
            padding: '3px 10px',
            borderRadius: '10px',
            whiteSpace: 'nowrap',
        }}>
            {s.label}
        </span>
    );
}

// ─── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating = 0 }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                i <= Math.round(rating)
                    ? <MdStar     key={i} style={{ width: 14, height: 14, color: C.warning }} />
                    : <MdStarBorder key={i} style={{ width: 14, height: 14, color: C.warning }} />
            ))}
        </div>
    );
}

// ─── Course Grid Card ──────────────────────────────────────────────────────────
function CourseGridCard({ course, onDelete }) {
    const isDraft = !['published', 'pending', 'rejected', 'suspended'].includes(course.status);

    return (
        <div
            className="flex flex-col group transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            style={{
                backgroundColor: C.cardBg,
                border: `1px solid ${C.cardBorder}`,
                boxShadow: S.card,
                borderRadius: R['2xl'],
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = S.cardHover}
            onMouseLeave={e => e.currentTarget.style.boxShadow = S.card}
        >
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
                        backgroundColor: C.cardBg,
                        color: C.heading,
                        fontFamily: T.fontFamily,
                        fontSize: T.size.xs,
                        fontWeight: T.weight.bold,
                        padding: '4px 10px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}>
                        {course.price ? `₹${course.price.toLocaleString()}` : 'Free'}
                    </span>
                </div>

                {/* Draft label — top left */}
                {isDraft && (
                    <div className="absolute top-3 left-3">
                        <span style={{
                            backgroundColor: C.warningBg,
                            color: C.warning,
                            border: `1px solid ${C.warningBorder}`,
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            padding: '3px 10px',
                            borderRadius: '10px',
                        }}>Draft</span>
                    </div>
                )}

                {/* AI + Hot badges — bottom left of thumbnail */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    {course.isAIGenerated && (
                        <span style={{
                            backgroundColor: 'rgba(124,58,237,0.85)',
                            color: '#fff',
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            padding: '3px 8px',
                            borderRadius: '10px',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}>
                            <MdAutoAwesome style={{ width: 10, height: 10 }} /> AI
                        </span>
                    )}
                    {course.enrolledCount > 50 && (
                        <span style={{
                            backgroundColor: C.danger,
                            color: '#fff',
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            padding: '3px 8px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}>
                            <MdLocalFireDepartment style={{ width: 10, height: 10 }} /> Hot
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
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                    <span style={{ fontWeight: T.weight.bold }}>{(course.enrolledCount || 0).toLocaleString()}</span> Students
                </p>

                {/* Rating + completion + status */}
                <div className="flex items-center gap-2 flex-wrap">
                    <StarRating rating={course.rating || 0} />
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.medium }}>
                        {course.rating?.toFixed(1) || '0.0'}
                    </span>
                    {course.enrolledCount > 0 && (
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.medium }}>
                            · {course.completionRate || 0}%
                        </span>
                    )}
                    <div className="ml-auto">
                        <StatusBadge status={course.status} />
                    </div>
                </div>

                {/* Completion bar */}
                {course.enrolledCount > 0 && (
                    <div className="overflow-hidden" style={{ height: 6, borderRadius: '10px', backgroundColor: C.innerBg }}>
                        <div className="h-full transition-all"
                            style={{ width: `${course.completionRate || 0}%`, background: C.gradientBtn, borderRadius: '10px' }} />
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex gap-2 mt-auto pt-1">
                    <Link href={`/student/courses/${course._id}`} className="flex-1">
                        <button
                            className="w-full flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                            style={{
                                height: 36,
                                backgroundColor: C.btnViewAllBg,
                                color: C.btnViewAllText,
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                border: `1px solid ${C.cardBorder}`,
                                borderRadius: '10px',
                            }}>
                            <MdVisibility style={{ width: 14, height: 14 }} /> View
                        </button>
                    </Link>

                    {!isDraft ? (
                        <Link href={`/tutor/courses/${course._id}`} className="flex-1">
                            <button
                                className="w-full flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                                style={{
                                    height: 36,
                                    backgroundColor: C.btnViewAllBg,
                                    color: C.btnViewAllText,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.bold,
                                    border: `1px solid ${C.cardBorder}`,
                                    borderRadius: '10px',
                                }}>
                                <MdEdit style={{ width: 14, height: 14 }} /> Edit
                            </button>
                        </Link>
                    ) : (
                        <button
                            onClick={() => onDelete(course._id)}
                            className="flex-1 flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
                            style={{
                                height: 36,
                                backgroundColor: C.dangerBg,
                                color: C.danger,
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                border: `1px solid ${C.dangerBorder}`,
                                borderRadius: '10px',
                                cursor: 'pointer',
                            }}>
                            <MdDelete style={{ width: 14, height: 14 }} /> Delete
                        </button>
                    )}

                    <button
                        className="flex items-center justify-center transition-all hover:opacity-80"
                        style={{
                            width: 36,
                            height: 36,
                            backgroundColor: C.btnViewAllBg,
                            color: C.btnViewAllText,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: '10px',
                            cursor: 'pointer',
                        }}>
                        <MdMoreHoriz style={{ width: 14, height: 14 }} />
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
        <div
            className="flex gap-4 hover:shadow-md transition-all group"
            style={{
                backgroundColor: C.cardBg,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: '10px',
                padding: 16,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.boxShadow = S.cardHover; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}
        >
            {/* Thumbnail */}
            <div
                className="relative flex-shrink-0 overflow-hidden"
                style={{ width: 160, height: 90, borderRadius: '10px', backgroundColor: C.innerBg }}
            >
                <img
                    src={course.thumbnail || 'https://via.placeholder.com/320x180'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p
                    className="absolute bottom-2 left-2.5 leading-none"
                    style={{ color: '#ffffff', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                >
                    {course.price ? `₹${course.price.toLocaleString()}` : 'Free'}
                </p>
                {course.isAIGenerated && (
                    <div className="absolute top-2 right-2">
                        <span
                            className="flex items-center gap-1"
                            style={{
                                backgroundColor: 'rgba(124,58,237,0.85)',
                                color: '#fff',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                padding: '2px 6px',
                                borderRadius: '10px',
                            }}>
                            <MdAutoAwesome style={{ width: 10, height: 10 }} /> AI
                        </span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3
                        className="flex-1 line-clamp-1 min-w-0"
                        style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}
                    >
                        {course.title}
                    </h3>
                    <StatusBadge status={course.status} />
                </div>
                <p
                    className="line-clamp-1 mb-2.5"
                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}
                >
                    {course.description}
                </p>
                <div
                    className="flex items-center gap-3.5"
                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.medium }}
                >
                    <div className="flex items-center gap-1">
                        <StarRating rating={course.rating || 0} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>
                            {course.rating?.toFixed(1) || '0.0'}
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <MdPeople style={{ width: 12, height: 12 }} />
                        {(course.enrolledCount || 0).toLocaleString()} students
                    </span>
                    <span className="flex items-center gap-1">
                        <MdMenuBook style={{ width: 12, height: 12 }} />
                        {course.modules?.length || 0} modules
                    </span>
                    {course.enrolledCount > 0 && (
                        <span>{course.completionRate || 0}% completion</span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 self-center">
                <Link href={`/student/courses/${course._id}`}>
                    <button
                        className="flex items-center gap-1.5 transition-all hover:opacity-80"
                        style={{
                            height: 36,
                            padding: '0 16px',
                            backgroundColor: C.btnViewAllBg,
                            color: C.btnViewAllText,
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: '10px',
                            cursor: 'pointer',
                        }}>
                        <MdVisibility style={{ width: 14, height: 14 }} /> View
                    </button>
                </Link>
                <Link href={`/tutor/courses/${course._id}`}>
                    <button
                        className="flex items-center gap-1.5 transition-all hover:opacity-90"
                        style={{
                            height: 36,
                            padding: '0 16px',
                            background: C.gradientBtn,
                            color: '#ffffff',
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            border: 'none',
                            borderRadius: '10px',
                            boxShadow: S.btn,
                            cursor: 'pointer',
                        }}>
                        <MdEdit style={{ width: 14, height: 14 }} /> Edit
                    </button>
                </Link>
                <button
                    onClick={() => onDelete(course._id)}
                    className="flex items-center justify-center transition-all hover:opacity-80"
                    style={{
                        height: 36,
                        width: 36,
                        borderRadius: '10px',
                        border: `1px solid ${C.dangerBorder}`,
                        color: C.danger,
                        backgroundColor: C.dangerBg,
                        cursor: 'pointer',
                    }}>
                    <MdDelete style={{ width: 14, height: 14 }} />
                </button>
                <button
                    className="flex items-center justify-center transition-all hover:opacity-80"
                    style={{
                        height: 36,
                        width: 36,
                        borderRadius: '10px',
                        border: `1px solid ${C.cardBorder}`,
                        color: C.text,
                        backgroundColor: C.innerBg,
                        cursor: 'pointer',
                    }}>
                    <MdMoreHoriz style={{ width: 14, height: 14 }} />
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
    const [currentPage, setCurrentPage]   = useState(1);
    const { confirmDialog }               = useConfirm();

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

    const stats = {
        total:         courses.length,
        published:     courses.filter(c => c.status === 'published').length,
        pending:       courses.filter(c => c.status === 'pending').length,
        draft:         courses.filter(c => !['published', 'pending'].includes(c.status)).length,
        aiGenerated:   courses.filter(c => c.isAIGenerated).length,
        totalStudents: courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0),
    };

    const filterTabs = [
        { key: 'all',       label: 'All',          count: stats.total       },
        { key: 'draft',     label: 'Draft',        count: stats.draft       },
        { key: 'published', label: 'Published',    count: stats.published   },
        { key: 'pending',   label: 'In Review',    count: stats.pending     },
        { key: 'ai',        label: 'AI Generated', count: stats.aiGenerated, icon: MdAutoAwesome },
    ];

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

    const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));
    const paginatedCourses = filteredCourses.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const startItem = filteredCourses.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem   = Math.min(currentPage * ITEMS_PER_PAGE, filteredCourses.length);

    useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]" style={{ backgroundColor: C.pageBg }}>
            <div className="flex flex-col items-center gap-3">
                <div
                    className="rounded-full border-[3px] animate-spin"
                    style={{ width: 48, height: 48, borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                    Loading your courses…
                </p>
            </div>
        </div>
    );

    return (
        <div
            className="space-y-5 pb-8"
            style={{ ...pageStyle, backgroundColor: C.pageBg, minHeight: '100vh', padding: 24 }}
        >

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size['2xl'],
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        lineHeight: T.leading.tight,
                    }}>
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
                        <button
                            className="flex items-center gap-2 transition-all hover:opacity-90"
                            style={{
                                height: 44,
                                padding: '0 16px',
                                backgroundColor: 'rgba(124,58,237,0.10)',
                                color: '#7C3AED',
                                border: '1px solid rgba(124,58,237,0.20)',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                borderRadius: '10px',
                                cursor: 'pointer',
                            }}>
                            <MdAutoAwesome style={{ width: 14, height: 14 }} /> AI Builder
                        </button>
                    </Link>

                    {/* Create Course */}
                    <Link href="/tutor/courses/create">
                        <button
                            className="flex items-center gap-2 transition-all hover:opacity-90 active:scale-95"
                            style={{
                                height: 44,
                                padding: '0 24px',
                                background: C.gradientBtn,
                                color: '#ffffff',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                border: 'none',
                                borderRadius: '10px',
                                boxShadow: S.btn,
                                cursor: 'pointer',
                            }}>
                            <div
                                className="flex items-center justify-center"
                                style={{ width: 24, height: 24, borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.20)' }}>
                                <MdAdd style={{ width: 14, height: 14 }} />
                            </div>
                            Create Course
                        </button>
                    </Link>
                </div>
            </div>

            {/* ── Filter + Search Bar ── */}
            <div
                className="flex items-center gap-2 flex-wrap"
                style={{
                    backgroundColor: C.cardBg,
                    border: `1px solid ${C.cardBorder}`,
                    boxShadow: S.card,
                    borderRadius: '10px',
                    padding: '10px 12px',
                }}
            >
                {/* Filter tabs */}
                <div className="flex gap-1 overflow-x-auto flex-shrink-0">
                    {filterTabs.map(({ key, label, count, icon: Icon }) => {
                        const isActive = filterStatus === key;
                        const isAI = key === 'ai';
                        return (
                            <button
                                key={key}
                                onClick={() => setFilterStatus(key)}
                                className="flex items-center gap-1.5 transition-all"
                                style={isActive
                                    ? {
                                        background: isAI ? '#7C3AED' : C.gradientBtn,
                                        color: '#ffffff',
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                        whiteSpace: 'nowrap',
                                        boxShadow: S.active,
                                        padding: '8px 14px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }
                                    : {
                                        color: C.text,
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                        whiteSpace: 'nowrap',
                                        padding: '8px 14px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: 'transparent',
                                    }}>
                                {Icon && <Icon style={{ width: 12, height: 12 }} />}
                                {label}
                                <span style={isActive
                                    ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#ffffff', fontSize: T.size.xs, fontWeight: T.weight.bold, padding: '2px 6px', borderRadius: '10px' }
                                    : { backgroundColor: C.innerBg, color: C.text, fontSize: T.size.xs, fontWeight: T.weight.bold, padding: '2px 6px', borderRadius: '10px' }}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="hidden lg:block w-px h-6 mx-1 flex-shrink-0" style={{ backgroundColor: C.cardBorder }} />

                {/* Search */}
                <div className="relative flex-1" style={{ minWidth: 180 }}>
                    <MdSearch
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ width: 14, height: 14, color: C.text }}
                    />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            backgroundColor: C.cardBg,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: '10px',
                            color: C.heading,
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.semibold,
                            outline: 'none',
                            width: '100%',
                            height: 36,
                            paddingLeft: 34,
                            paddingRight: 12,
                            transition: 'all 0.2s ease',
                        }}
                        onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                    />
                </div>

                {/* Filter icon */}
                <button
                    className="flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                    style={{
                        width: 36,
                        height: 36,
                        backgroundColor: C.btnViewAllBg,
                        color: C.btnViewAllText,
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                    }}>
                    <MdFilterList style={{ width: 14, height: 14 }} />
                </button>

                {/* View toggle */}
                <div
                    className="hidden sm:flex gap-0.5 flex-shrink-0"
                    style={{
                        backgroundColor: C.innerBg,
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: '10px',
                        padding: 4,
                    }}>
                    {[['grid', MdGridView], ['list', MdList]].map(([mode, Icon]) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className="flex items-center justify-center transition-all"
                            style={viewMode === mode
                                ? {
                                    width: 32,
                                    height: 28,
                                    backgroundColor: C.cardBg,
                                    color: C.btnPrimary,
                                    borderRadius: '10px',
                                    boxShadow: S.active,
                                    border: 'none',
                                    cursor: 'pointer',
                                }
                                : {
                                    width: 32,
                                    height: 28,
                                    color: C.text,
                                    borderRadius: '10px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: 'transparent',
                                }}>
                            <Icon style={{ width: 14, height: 14 }} />
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Course Display ── */}
            {filteredCourses.length === 0 ? (
                <div
                    className="border-2 border-dashed flex flex-col items-center text-center"
                    style={{
                        borderColor: C.cardBorder,
                        backgroundColor: C.cardBg,
                        borderRadius: R['2xl'],
                        padding: '64px 24px',
                    }}
                >
                    <div
                        className="flex items-center justify-center mb-4"
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.iconBg }}
                    >
                        {filterStatus === 'ai'
                            ? <MdAutoAwesome style={{ width: 28, height: 28, color: '#7C3AED' }} />
                            : <MdMenuBook    style={{ width: 28, height: 28, color: C.iconColor }} />}
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, marginBottom: 4 }}>
                        {searchQuery ? 'No courses match your search'
                            : filterStatus === 'ai' ? 'No AI generated courses yet'
                            : 'No courses yet'}
                    </h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, maxWidth: 300, marginBottom: 20 }}>
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
                                    <button
                                        className="flex items-center gap-2 hover:opacity-90 transition-all"
                                        style={{
                                            height: 40,
                                            padding: '0 20px',
                                            backgroundColor: '#7C3AED',
                                            color: '#ffffff',
                                            fontFamily: T.fontFamily,
                                            fontSize: T.size.base,
                                            fontWeight: T.weight.bold,
                                            border: 'none',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                        }}>
                                        <MdAutoAwesome style={{ width: 16, height: 16 }} /> Try AI Builder
                                    </button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/tutor/courses/create">
                                        <button
                                            className="flex items-center gap-2 hover:opacity-90 transition-all"
                                            style={{
                                                height: 40,
                                                padding: '0 20px',
                                                background: C.gradientBtn,
                                                color: '#ffffff',
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.base,
                                                fontWeight: T.weight.bold,
                                                border: 'none',
                                                borderRadius: '10px',
                                                boxShadow: S.btn,
                                                cursor: 'pointer',
                                            }}>
                                            <MdAdd style={{ width: 16, height: 16 }} /> Create Manually
                                        </button>
                                    </Link>
                                    <Link href="/tutor/ai-buddy/course-builder">
                                        <button
                                            className="flex items-center gap-2 hover:opacity-90 transition-all"
                                            style={{
                                                height: 40,
                                                padding: '0 20px',
                                                backgroundColor: 'rgba(124,58,237,0.10)',
                                                color: '#7C3AED',
                                                border: '1px solid rgba(124,58,237,0.20)',
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.base,
                                                fontWeight: T.weight.bold,
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                            }}>
                                            <MdAutoAwesome style={{ width: 16, height: 16 }} /> Use AI Builder
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

            {/* ── Pagination ── */}
            {filteredCourses.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.medium }}>
                        Showing {startItem} to {endItem} of {filteredCourses.length}
                    </p>

                    <div className="flex items-center gap-1.5">
                        {/* Prev */}
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-40"
                            style={{
                                width: 36,
                                height: 36,
                                backgroundColor: C.btnViewAllBg,
                                color: C.btnViewAllText,
                                border: `1px solid ${C.cardBorder}`,
                                borderRadius: '10px',
                                cursor: 'pointer',
                            }}>
                            <MdChevronLeft style={{ width: 16, height: 16 }} />
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className="flex items-center justify-center transition-all"
                                style={currentPage === page
                                    ? {
                                        width: 36,
                                        height: 36,
                                        background: C.gradientBtn,
                                        color: '#ffffff',
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                        borderRadius: '10px',
                                        border: 'none',
                                        boxShadow: S.btn,
                                        cursor: 'pointer',
                                    }
                                    : {
                                        width: 36,
                                        height: 36,
                                        backgroundColor: C.btnViewAllBg,
                                        color: C.btnViewAllText,
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                        border: `1px solid ${C.cardBorder}`,
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                    }}>
                                {page}
                            </button>
                        ))}

                        {/* Next */}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-40"
                            style={{
                                width: 36,
                                height: 36,
                                backgroundColor: C.btnViewAllBg,
                                color: C.btnViewAllText,
                                border: `1px solid ${C.cardBorder}`,
                                borderRadius: '10px',
                                cursor: 'pointer',
                            }}>
                            <MdChevronRight style={{ width: 16, height: 16 }} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}