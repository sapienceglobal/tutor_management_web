'use client';

import { useState, useEffect } from 'react';
import {
    BookMarked, FileText, Sparkles, ChevronDown, Clock,
    BookOpen, GraduationCap, Loader2, BarChart2,
    CheckCircle2, AlertCircle, User
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

// ─── Note content renderer ───────────────────────────────────────────────────
function NoteContent({ text }) {
    if (!text) return null;
    const lines = text.split('\n');
    return (
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
    );
}

export default function StudentSharedNotesPage() {
    const [notes, setNotes]               = useState([]);
    const [courses, setCourses]            = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [loading, setLoading]            = useState(true);
    const [total, setTotal]                = useState(0);
    const [expandedNote, setExpandedNote] = useState(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const [enrollRes, notesRes] = await Promise.all([
                    api.get('/enrollments/my-enrollments'),
                    api.get('/ai/student/shared-notes?limit=20'),
                ]);

                if (enrollRes.data?.enrollments) {
                    setCourses(enrollRes.data.enrollments.filter(e => e.courseId).map(e => ({
                        _id: e.courseId._id || e.courseId,
                        title: e.courseId.title || 'Untitled',
                    })));
                }
                if (notesRes.data?.success) {
                    setNotes(notesRes.data.notes || []);
                    setTotal(notesRes.data.total || 0);
                }
            } catch { /* handled */ } finally { setLoading(false); }
        };
        init();
    }, []);

    // Filter by course
    const fetchNotes = async (courseId) => {
        setLoading(true);
        try {
            const q = courseId ? `?courseId=${courseId}&limit=20` : '?limit=20';
            const res = await api.get(`/ai/student/shared-notes${q}`);
            if (res.data?.success) {
                setNotes(res.data.notes || []);
                setTotal(res.data.total || 0);
            }
        } catch { } finally { setLoading(false); }
    };

    const handleCourseFilter = (courseId) => {
        setSelectedCourse(courseId);
        setExpandedNote(null);
        fetchNotes(courseId);
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
                    <BookMarked className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: '#fff', marginBottom: 2 }}>
                        Shared Notes 📝
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'rgba(255,255,255,0.78)' }}>
                        AI-simplified notes shared by your tutors · {total} notes available
                    </p>
                </div>
            </div>

            {/* Course filter */}
            <div className="flex items-center gap-3 mb-4">
                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filter by Course:</span>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleCourseFilter('')}
                        className="px-3 py-1.5 rounded-xl transition-all"
                        style={{
                            backgroundColor: !selectedCourse ? P.primary : P.soft,
                            color: !selectedCourse ? '#fff' : P.primary,
                            fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold,
                            border: `1px solid ${P.border}`,
                        }}>
                        All
                    </button>
                    {courses.map(c => (
                        <button key={c._id} onClick={() => handleCourseFilter(c._id)}
                            className="px-3 py-1.5 rounded-xl transition-all"
                            style={{
                                backgroundColor: selectedCourse === c._id ? P.primary : P.soft,
                                color: selectedCourse === c._id ? '#fff' : P.primary,
                                fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold,
                                border: `1px solid ${P.border}`,
                            }}>
                            {c.title.length > 25 ? c.title.slice(0, 23) + '…' : c.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notes list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: P.primary }} />
                </div>
            ) : notes.length === 0 ? (
                <div className="text-center py-20 rounded-2xl" style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}` }}>
                    <BookMarked className="w-12 h-12 mx-auto mb-3" style={{ color: `${P.primary}35` }} />
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: P.textPrimary, marginBottom: 4 }}>No Shared Notes Yet</p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: P.textMuted }}>When your tutors share simplified notes, they'll appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {notes.map(note => (
                        <div key={note._id} className="rounded-2xl overflow-hidden transition-all"
                            style={{ backgroundColor: P.cardBg, border: expandedNote === note._id ? `2px solid ${P.primary}30` : `1px solid ${P.border}`, boxShadow: S.card }}>

                            {/* Note header */}
                            <div className="p-5 cursor-pointer" onClick={() => setExpandedNote(expandedNote === note._id ? null : note._id)}>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: P.gradient }}>
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: P.textPrimary, marginBottom: 4 }}>
                                            {note.title}
                                        </p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {note.course && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                                    <GraduationCap className="w-3 h-3" style={{ color: P.primary }} />
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>{note.course}</span>
                                                </span>
                                            )}
                                            {note.gradeLevel && (
                                                <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.08)', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#10B981' }}>
                                                    {note.gradeLevel}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted }}>
                                                <User className="w-3 h-3" /> {note.tutorName}
                                            </span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted }}>
                                                {note.timeAgo}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        {/* Stats pills */}
                                        <div className="text-center">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: P.primary }}>{note.infoRetained}%</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: P.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Info Retained</p>
                                        </div>
                                        <div className="text-center">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#10B981' }}>{note.wordsReduced}</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: P.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Words Saved</p>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${expandedNote === note._id ? 'rotate-180' : ''}`}
                                            style={{ color: P.textMuted }} />
                                    </div>
                                </div>
                            </div>

                            {/* Expanded content */}
                            {expandedNote === note._id && (
                                <div className="px-5 pb-5 pt-0">
                                    <div className="h-px mb-4" style={{ backgroundColor: P.border }} />
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: P.pageBg, border: `1px solid ${P.border}` }}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles className="w-4 h-4" style={{ color: P.primary }} />
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>Simplified Notes</p>
                                            <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.10)' }}>
                                                <CheckCircle2 className="w-3 h-3" style={{ color: '#10B981' }} />
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#10B981' }}>AI Simplified</span>
                                            </span>
                                        </div>
                                        <NoteContent text={note.simplifiedText} />
                                    </div>
                                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                                        <span className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: P.soft, fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.primary, fontWeight: T.weight.semibold }}>
                                            Original: {note.originalWordCount} words
                                        </span>
                                        <span className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.08)', fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#10B981', fontWeight: T.weight.semibold }}>
                                            Simplified: {note.simplifiedWordCount} words
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
