'use client';

import { useState, useEffect } from 'react';
import {
    ScrollText, FileText, Sparkles, ChevronDown, Clock,
    BookOpen, GraduationCap, Loader2, BarChart2,
    CheckCircle2, Eye, User, Lightbulb, List, Zap
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, cx } from '@/constants/studentTokens';

const P = {
    primary: '#7C3AED', light: '#8B5CF6',
    soft: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg: '#F5F3FF', cardBg: '#FFFFFF',
    textPrimary: '#1E1B4B', textSecondary: '#6B7280', textMuted: '#9CA3AF',
};

// ─── Summary content renderer ────────────────────────────────────────────────
function SummaryContent({ record }) {
    if (!record) return null;

    const summary = record.summary || '';
    const lines = summary.split('\n');

    return (
        <div className="space-y-4">
            {/* Summary text */}
            <div className="space-y-1.5">
                {lines.map((line, i) => {
                    if (!line.trim()) return <div key={i} className="h-1" />;
                    if (line.startsWith('## ')) {
                        return <p key={i} style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: P.textPrimary, marginTop: 10, marginBottom: 2 }}>{line.replace('## ', '')}</p>;
                    }
                    if (line.startsWith('• ') || line.startsWith('- ')) {
                        return (
                            <div key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: P.primary }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569', lineHeight: 1.65 }}>{line.replace(/^[•\-]\s/, '')}</p>
                            </div>
                        );
                    }
                    return <p key={i} style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569', lineHeight: 1.65 }}>{line}</p>;
                })}
            </div>

            {/* Key Points */}
            {record.keyPoints?.length > 0 && (
                <div className="rounded-xl p-4" style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4" style={{ color: P.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>Key Points</p>
                    </div>
                    <div className="space-y-1.5">
                        {record.keyPoints.map((point, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#10B981' }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569' }}>{point}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Insights */}
            {record.insights?.length > 0 && (
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4" style={{ color: '#F59E0B' }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>Insights</p>
                    </div>
                    <div className="space-y-1.5">
                        {record.insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#F59E0B' }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569' }}>{insight}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Study Notes */}
            {record.studyNotes && (
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4" style={{ color: '#10B981' }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>Study Notes</p>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{record.studyNotes}</p>
                </div>
            )}
        </div>
    );
}

export default function StudentLectureSummariesPage() {
    const [records, setRecords]             = useState([]);
    const [courses, setCourses]             = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [loading, setLoading]             = useState(true);
    const [total, setTotal]                 = useState(0);
    const [expandedRecord, setExpandedRecord] = useState(null);
    const [expandedData, setExpandedData]   = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const [enrollRes, summRes] = await Promise.all([
                    api.get('/enrollments/my-enrollments'),
                    api.get('/ai/student/lecture-summaries?limit=20'),
                ]);

                if (enrollRes.data?.enrollments) {
                    setCourses(enrollRes.data.enrollments.filter(e => e.courseId).map(e => ({
                        _id: e.courseId._id || e.courseId,
                        title: e.courseId.title || 'Untitled',
                    })));
                }
                if (summRes.data?.success) {
                    setRecords(summRes.data.records || []);
                    setTotal(summRes.data.total || 0);
                }
            } catch { } finally { setLoading(false); }
        };
        init();
    }, []);

    const fetchRecords = async (courseId) => {
        setLoading(true);
        try {
            const q = courseId ? `?courseId=${courseId}&limit=20` : '?limit=20';
            const res = await api.get(`/ai/student/lecture-summaries${q}`);
            if (res.data?.success) {
                setRecords(res.data.records || []);
                setTotal(res.data.total || 0);
            }
        } catch { } finally { setLoading(false); }
    };

    const handleCourseFilter = (courseId) => {
        setSelectedCourse(courseId);
        setExpandedRecord(null);
        setExpandedData(null);
        fetchRecords(courseId);
    };

    const toggleExpand = async (recordId) => {
        if (expandedRecord === recordId) {
            setExpandedRecord(null);
            setExpandedData(null);
            return;
        }
        setExpandedRecord(recordId);
        setLoadingDetail(true);
        try {
            const res = await api.get(`/ai/student/lecture-summaries/${recordId}`);
            if (res.data?.success) setExpandedData(res.data.record);
        } catch {
            toast.error('Failed to load summary');
        } finally { setLoadingDetail(false); }
    };

    return (
        <div style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg, minHeight: '100%' }}>

            {/* Header */}
            <div className="rounded-2xl p-5 mb-5 flex items-center gap-4"
                style={{ background: P.gradient, boxShadow: '0 8px 32px rgba(124,58,237,0.25)', position: 'relative', overflow: 'hidden' }}>
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute rounded-full"
                        style={{ width: 2, height: 2, backgroundColor: 'rgba(255,255,255,0.55)', left: `${8 + i * 12}%`, top: `${18 + (i % 3) * 32}%` }} />
                ))}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                    <ScrollText className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: '#fff', marginBottom: 2 }}>
                        Lecture Summaries 📖
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'rgba(255,255,255,0.78)' }}>
                        AI-generated summaries from your course lectures · {total} available
                    </p>
                </div>
            </div>

            {/* Course filter */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filter:</span>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleCourseFilter('')}
                        className="px-3 py-1.5 rounded-xl transition-all"
                        style={{ backgroundColor: !selectedCourse ? P.primary : P.soft, color: !selectedCourse ? '#fff' : P.primary, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, border: `1px solid ${P.border}` }}>
                        All Courses
                    </button>
                    {courses.map(c => (
                        <button key={c._id} onClick={() => handleCourseFilter(c._id)}
                            className="px-3 py-1.5 rounded-xl transition-all"
                            style={{ backgroundColor: selectedCourse === c._id ? P.primary : P.soft, color: selectedCourse === c._id ? '#fff' : P.primary, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, border: `1px solid ${P.border}` }}>
                            {c.title.length > 25 ? c.title.slice(0, 23) + '…' : c.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Records */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: P.primary }} />
                </div>
            ) : records.length === 0 ? (
                <div className="text-center py-20 rounded-2xl" style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}` }}>
                    <ScrollText className="w-12 h-12 mx-auto mb-3" style={{ color: `${P.primary}35` }} />
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: P.textPrimary, marginBottom: 4 }}>No Lecture Summaries Yet</p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: P.textMuted }}>When your tutors generate lecture summaries, they'll appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {records.map(record => (
                        <div key={record._id} className="rounded-2xl overflow-hidden transition-all"
                            style={{ backgroundColor: P.cardBg, border: expandedRecord === record._id ? `2px solid ${P.primary}30` : `1px solid ${P.border}`, boxShadow: S.card }}>

                            {/* Record header */}
                            <div className="p-5 cursor-pointer" onClick={() => toggleExpand(record._id)}>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: P.gradient }}>
                                        <ScrollText className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: P.textPrimary, marginBottom: 4 }}>
                                            {record.title}
                                        </p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {record.course && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                                    <GraduationCap className="w-3 h-3" style={{ color: P.primary }} />
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>{record.course}</span>
                                                </span>
                                            )}
                                            {record.lesson && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.14)' }}>
                                                    <BookOpen className="w-3 h-3" style={{ color: '#6366F1' }} />
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#6366F1' }}>{record.lesson}</span>
                                                </span>
                                            )}
                                            {record.sourceType && (
                                                <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.08)', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#F59E0B' }}>
                                                    {record.sourceType}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted }}>
                                                <User className="w-3 h-3" /> {record.tutorName}
                                            </span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted }}>{record.timeAgo}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {record.readTime && (
                                            <div className="text-center">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: P.primary }}>{record.readTime}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: P.textMuted }}>min read</p>
                                            </div>
                                        )}
                                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${expandedRecord === record._id ? 'rotate-180' : ''}`}
                                            style={{ color: P.textMuted }} />
                                    </div>
                                </div>
                            </div>

                            {/* Expanded detail */}
                            {expandedRecord === record._id && (
                                <div className="px-5 pb-5 pt-0">
                                    <div className="h-px mb-4" style={{ backgroundColor: P.border }} />
                                    {loadingDetail ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin" style={{ color: P.primary }} />
                                        </div>
                                    ) : expandedData ? (
                                        <SummaryContent record={expandedData} />
                                    ) : (
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: P.textMuted, textAlign: 'center', padding: 20 }}>Failed to load summary.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
