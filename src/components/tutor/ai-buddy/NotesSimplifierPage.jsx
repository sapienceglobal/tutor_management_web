'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    NotebookPen, Upload, Mic, PenLine, CheckCircle2,
    Sparkles, Loader2, FileText, BookOpen, ChevronDown,
    BarChart2, Share2, Bookmark, ClipboardList, X,
    Clock, Tag, Lightbulb, MoreHorizontal, Trash2,
    Users, RefreshCw, Download, Info, AlertCircle
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, cx } from '@/constants/tutorTokens';

// ─── Purple palette (matching image) ─────────────────────────────────────────
const P = {
    primary:   '#7C3AED',
    light:     '#8B5CF6',
    soft:      'rgba(124,58,237,0.08)',
    border:    'rgba(124,58,237,0.14)',
    gradient:  'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    gradLight: 'linear-gradient(135deg,#EDE9FE,#F5F3FF)',
    pageBg:    '#F5F3FF',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ h = 4, w = 'full', r = 'lg' }) {
    return <div className={`h-${h} w-${w} rounded-${r} animate-pulse`} style={{ backgroundColor: P.soft }} />;
}

// ─── Simplified text renderer ─────────────────────────────────────────────────
function SimplifiedRenderer({ text }) {
    if (!text) return null;
    return (
        <div className="space-y-1.5">
            {text.split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-1" />;
                if (line.startsWith('## ')) return (
                    <p key={i} style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#3B0764', marginTop: 8 }}>
                        {line.replace('## ', '')}
                    </p>
                );
                if (line.startsWith('• ') || line.startsWith('- ')) {
                    const content = line.replace(/^[•\-]\s/, '');
                    const parts   = content.split(/(\*\*.*?\*\*)/g);
                    return (
                        <div key={i} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: P.primary }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#4C1D95', lineHeight: 1.65 }}>
                                {parts.map((p, j) =>
                                    p.startsWith('**') && p.endsWith('**')
                                        ? <strong key={j} style={{ fontWeight: T.weight.bold, color: '#3B0764' }}>{p.slice(2, -2)}</strong>
                                        : p
                                )}
                            </p>
                        </div>
                    );
                }
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                    <p key={i} style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#4C1D95', lineHeight: 1.65 }}>
                        {parts.map((p, j) =>
                            p.startsWith('**') && p.endsWith('**')
                                ? <strong key={j} style={{ fontWeight: T.weight.bold, color: '#3B0764' }}>{p.slice(2, -2)}</strong>
                                : p
                        )}
                    </p>
                );
            })}
        </div>
    );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color = P.primary }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: '0 1px 4px rgba(124,58,237,0.08)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <div>
                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>{label}</p>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>{value ?? '—'}</p>
            </div>
        </div>
    );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────
function ShareModal({ noteId, courses, onClose, onShared }) {
    const [selectedCourse, setSelectedCourse] = useState('');
    const [lessons, setLessons]               = useState([]);
    const [selectedLesson, setSelectedLesson] = useState('');
    const [sharing, setSharing]               = useState(false);
    const [loadingLessons, setLoadingLessons] = useState(false);

    useEffect(() => {
        if (!selectedCourse) { setLessons([]); setSelectedLesson(''); return; }
        setLoadingLessons(true);
        api.get(`/lessons?courseId=${selectedCourse}`)
            .then(r => { if (r.data?.success) setLessons(r.data.lessons || []); })
            .catch(() => {})
            .finally(() => setLoadingLessons(false));
    }, [selectedCourse]);

    const handleShare = async () => {
        if (!selectedCourse) return toast.error('Select a course first');
        setSharing(true);
        try {
            const res = await api.post(`/ai/simplified-notes/${noteId}/share`, {
                courseId: selectedCourse,
                lessonId: selectedLesson || undefined,
            });
            if (res.data?.success) {
                toast.success(res.data.message || 'Shared successfully!');
                onShared?.();
                onClose();
            } else {
                toast.error(res.data?.message || 'Share failed');
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Share failed');
        } finally {
            setSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
            <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ backgroundColor: '#fff' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: P.gradient }}>
                            <Share2 className="w-4 h-4 text-white" />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#1E293B' }}>Share to Course</p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <div className="space-y-3">
                    {/* Course select */}
                    <div>
                        <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B', fontWeight: T.weight.semibold }}>Select Course *</label>
                        <div className="relative mt-1">
                            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                                className="w-full appearance-none px-3 py-2.5 rounded-xl pr-8 outline-none"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                <option value="">Choose course…</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                        </div>
                    </div>

                    {/* Lesson select (optional) */}
                    <div>
                        <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B', fontWeight: T.weight.semibold }}>
                            Attach to Lesson <span style={{ color: '#94A3B8' }}>(optional)</span>
                        </label>
                        <div className="relative mt-1">
                            {loadingLessons ? (
                                <div className="px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                    <Sk h={4} />
                                </div>
                            ) : (
                                <>
                                    <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)}
                                        disabled={!selectedCourse || lessons.length === 0}
                                        className="w-full appearance-none px-3 py-2.5 rounded-xl pr-8 outline-none disabled:opacity-50"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                        <option value="">No specific lesson</option>
                                        {lessons.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#F59E0B' }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#92400E', lineHeight: 1.5 }}>
                            Simplified note will be uploaded as a text attachment to the selected course/lesson.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 mt-5">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl"
                        style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: P.primary }}>
                        Cancel
                    </button>
                    <button onClick={handleShare} disabled={!selectedCourse || sharing}
                        className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#fff', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
                        {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                        {sharing ? 'Sharing…' : 'Share'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── History item ─────────────────────────────────────────────────────────────
function HistoryItem({ note, isActive, onClick }) {
    return (
        <div onClick={onClick}
            className="p-3 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
            style={{
                backgroundColor: isActive ? P.soft : '#fff',
                border: isActive ? `1px solid ${P.primary}40` : `1px solid ${P.border}`,
                boxShadow: isActive ? `0 0 0 2px ${P.primary}15` : '0 1px 4px rgba(124,58,237,0.06)',
            }}>
            <div className="flex items-start gap-2">
                <NotebookPen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: P.primary }} />
                <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#334155' }}>
                        {note.title || 'Untitled Note'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {note.wordsReduced > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: P.soft, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>
                                -{note.wordsReduced}w
                            </span>
                        )}
                        {note.gradeLevel && (
                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{note.gradeLevel}</span>
                        )}
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', marginLeft: 'auto' }}>{note.timeAgo}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotesSimplifierPage() {
    // ── Input ──────────────────────────────────────────────────────
    const [rawText, setRawText]           = useState('');
    const [activeTab, setActiveTab]       = useState('text'); // 'text' | 'file'
    const [uploadedFile, setUploadedFile] = useState(null);
    const [courseId, setCourseId]         = useState('');
    const [noteTitle, setNoteTitle]       = useState('');

    // ── API data ───────────────────────────────────────────────────
    const [courses, setCourses]           = useState([]);
    const [history, setHistory]           = useState([]);
    const [knowledgeBank, setKnowledgeBank] = useState({ trending: [], recentTitles: [], taxonomyTopics: [] });
    const [loadingInit, setLoadingInit]   = useState(true);

    // ── Result ─────────────────────────────────────────────────────
    const [simplifying, setSimplifying]   = useState(false);
    const [result, setResult]             = useState(null); // { _id, title, simplifiedText, gradeLevel, originalWordCount, simplifiedWordCount, wordsReduced, infoRetained }
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);

    const fileRef   = useRef(null);
    const resultRef = useRef(null);

    // ── Load initial data ──────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            setLoadingInit(true);
            try {
                const [courseRes, histRes, kbRes] = await Promise.all([
                    api.get('/courses/my-courses'),
                    api.get('/ai/simplified-notes?limit=8'),
                    api.get('/ai/notes-knowledge-bank'),
                ]);
                if (courseRes.data?.success) setCourses((courseRes.data.courses || []).map(c => ({ _id: c._id, title: c.title })));
                if (histRes.data?.success)   setHistory(histRes.data.notes || []);
                if (kbRes.data?.success)     setKnowledgeBank(kbRes.data);
            } catch { toast.error('Failed to load Notes Simplifier'); }
            finally { setLoadingInit(false); }
        };
        init();
    }, []);

    useEffect(() => {
        if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [result]);

    // ── File select ────────────────────────────────────────────────
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        if (!allowed.includes(file.type)) return toast.error('Only PDF or DOCX files allowed');
        setUploadedFile(file);
        setActiveTab('file');
    };

    const removeFile = () => { setUploadedFile(null); setActiveTab('text'); if (fileRef.current) fileRef.current.value = ''; };

    // ── Simplify ───────────────────────────────────────────────────
    const handleSimplify = async () => {
        if (simplifying) return;
        if (activeTab === 'text' && rawText.trim().length < 20) return toast.error('Please enter at least 20 characters');
        if (activeTab === 'file' && !uploadedFile) return toast.error('Please upload a file');

        setSimplifying(true);
        setResult(null);
        setActiveNoteId(null);

        try {
            const formData = new FormData();
            if (activeTab === 'file' && uploadedFile) {
                formData.append('file', uploadedFile);
            } else {
                formData.append('text', rawText);
            }
            if (courseId)   formData.append('courseId', courseId);
            if (noteTitle)  formData.append('title', noteTitle);

            const res = await api.post('/ai/simplify-notes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data?.success) {
                setResult(res.data.note);
                setActiveNoteId(res.data.note._id?.toString());
                // Refresh history
                const histRes = await api.get('/ai/simplified-notes?limit=8');
                if (histRes.data?.success) setHistory(histRes.data.notes || []);
                // Refresh knowledge bank
                const kbRes = await api.get('/ai/notes-knowledge-bank');
                if (kbRes.data?.success) setKnowledgeBank(kbRes.data);
            } else {
                toast.error(res.data?.message || 'Simplification failed');
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || 'AI failed to respond. Try again.');
        } finally {
            setSimplifying(false);
        }
    };

    // ── Load past note ─────────────────────────────────────────────
    const loadHistoryNote = async (noteId) => {
        if (activeNoteId === noteId?.toString()) return;
        try {
            const res = await api.get(`/ai/simplified-notes/${noteId}`);
            if (res.data?.success) {
                const n = res.data.note;
                setResult({
                    _id:                n._id,
                    title:              n.title,
                    simplifiedText:     n.simplifiedText,
                    gradeLevel:         n.gradeLevel,
                    originalWordCount:  n.originalWordCount,
                    simplifiedWordCount: n.simplifiedWordCount,
                    wordsReduced:       n.wordsReduced,
                    infoRetained:       n.infoRetained,
                });
                setActiveNoteId(n._id?.toString());
            }
        } catch { toast.error('Failed to load note'); }
    };

    // ── Delete note ────────────────────────────────────────────────
    const handleDelete = async (noteId, e) => {
        e.stopPropagation();
        if (!confirm('Delete this note?')) return;
        try {
            await api.delete(`/ai/simplified-notes/${noteId}`);
            setHistory(prev => prev.filter(n => n._id?.toString() !== noteId?.toString()));
            if (activeNoteId === noteId?.toString()) { setResult(null); setActiveNoteId(null); }
            toast.success('Note deleted');
        } catch { toast.error('Failed to delete'); }
    };

    // ── Copy simplified text ───────────────────────────────────────
    const handleCopy = () => {
        if (!result?.simplifiedText) return;
        navigator.clipboard.writeText(result.simplifiedText).then(() => toast.success('Copied to clipboard!'));
    };

    const reset = () => { setResult(null); setRawText(''); setActiveNoteId(null); setNoteTitle(''); removeFile(); };

    // ─── All topics merged ─────────────────────────────────────────
    const allTopics = [...new Set([
        ...(knowledgeBank.trending || []),
        ...(knowledgeBank.taxonomyTopics || []),
    ])].slice(0, 10);

    // ──────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-4 h-full p-4" style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg }}>

            {/* ── LEFT+CENTER: Main area ──────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto custom-scrollbar">

                {/* Page header */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: P.gradient, boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
                        <NotebookPen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: '#3B0764' }}>Notes Simplifier</h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#7C3AED' }}>Paste your notes to get AI-powered simplification</p>
                    </div>
                </div>

                {/* ── Input card ─────────────────────────────────────────── */}
                <div className="rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: '0 4px 24px rgba(124,58,237,0.10)' }}>

                    {/* Tab bar */}
                    <div className="flex items-center gap-1 px-4 pt-3 pb-0">
                        {/* Detailed Notes tab */}
                        <button onClick={() => setActiveTab('text')}
                            className="flex items-center gap-2 px-4 py-2 rounded-t-xl transition-all"
                            style={{
                                background:  activeTab === 'text' ? P.gradient : 'transparent',
                                fontFamily:  T.fontFamily, fontSize: T.size.xs,
                                fontWeight:  T.weight.bold,
                                color:       activeTab === 'text' ? '#fff' : '#94A3B8',
                            }}>
                            <NotebookPen className="w-3.5 h-3.5" />
                            Detailed Notes
                        </button>

                        {/* Divider */}
                        <div className="flex-1" />

                        {/* Action buttons */}
                        {[
                            { icon: Upload, label: 'Upload DOCX', onClick: () => fileRef.current?.click() },
                            { icon: Mic,    label: 'Voice Input', onClick: () => toast('Voice input coming soon!') },
                            { icon: PenLine,label: 'Whiteboard',  onClick: () => toast('Whiteboard coming soon!') },
                        ].map(btn => {
                            const Icon = btn.icon;
                            return (
                                <button key={btn.label} onClick={btn.onClick}
                                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                                    style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>
                                    <Icon className="w-4 h-4" />
                                    {btn.label.split(' ')[0]}<br />{btn.label.split(' ').slice(1).join(' ')}
                                </button>
                            );
                        })}
                        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />
                    </div>

                    <div className="h-px mx-4" style={{ backgroundColor: P.border }} />

                    {/* Text/File input */}
                    {activeTab === 'file' && uploadedFile ? (
                        <div className="mx-4 my-3 p-4 rounded-xl flex items-center gap-3"
                            style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                            <FileText className="w-8 h-8 flex-shrink-0" style={{ color: P.primary }} />
                            <div className="flex-1 min-w-0">
                                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#3B0764' }}>{uploadedFile.name}</p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#7C3AED' }}>
                                    {(uploadedFile.size / 1024).toFixed(1)} KB · {uploadedFile.type.includes('pdf') ? 'PDF' : 'DOCX'}
                                </p>
                            </div>
                            <button onClick={removeFile} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50">
                                <X className="w-4 h-4" style={{ color: '#F43F5E' }} />
                            </button>
                        </div>
                    ) : (
                        <textarea
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            placeholder="Paste your detailed notes here…"
                            className="w-full resize-none outline-none px-4 py-3"
                            rows={6}
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#3B0764', backgroundColor: 'transparent', lineHeight: 1.65, borderBottom: `1px solid ${P.border}` }}
                        />
                    )}

                    {/* Bottom bar */}
                    <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
                        {/* Optional title */}
                        <input
                            value={noteTitle}
                            onChange={e => setNoteTitle(e.target.value)}
                            placeholder="Note title (optional)"
                            className="outline-none px-3 py-1.5 rounded-xl flex-1 min-w-0"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }}
                        />

                        {/* Course context */}
                        <div className="relative">
                            <select value={courseId} onChange={e => setCourseId(e.target.value)}
                                className="appearance-none pl-3 pr-7 py-1.5 rounded-xl outline-none"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft, minWidth: 140 }}>
                                <option value="">No course context</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                        </div>

                        {/* Simplify button */}
                        <button onClick={handleSimplify}
                            disabled={simplifying || (activeTab === 'text' ? rawText.trim().length < 20 : !uploadedFile)}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl transition-all disabled:opacity-40 hover:opacity-90"
                            style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#fff', boxShadow: '0 4px 14px rgba(124,58,237,0.35)', whiteSpace: 'nowrap' }}>
                            {simplifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {simplifying ? 'Simplifying…' : 'Simplify Notes'}
                        </button>
                    </div>
                </div>

                {/* ── Result area ─────────────────────────────────────────── */}
                {(simplifying || result) && (
                    <div ref={resultRef} className="flex gap-3 flex-shrink-0">

                        {/* Simplified Notes */}
                        <div className="flex-1 rounded-2xl overflow-hidden"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: '0 4px 24px rgba(124,58,237,0.10)' }}>

                            {/* Header */}
                            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${P.border}` }}>
                                {simplifying
                                    ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: P.primary }} />
                                    : <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />}
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#3B0764' }}>
                                    {simplifying ? 'Simplifying…' : 'Simplified Notes'}
                                </p>
                                {result && !simplifying && (
                                    <div className="ml-auto flex items-center gap-2">
                                        <button onClick={handleCopy}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:opacity-80"
                                            style={{ backgroundColor: P.soft, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>
                                            <Download className="w-3 h-3" /> Copy
                                        </button>
                                        <button onClick={() => setShowShareModal(true)}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:opacity-80"
                                            style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#fff' }}>
                                            <Share2 className="w-3 h-3" /> Share
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 min-h-[200px]">
                                {simplifying ? (
                                    <div className="space-y-2">
                                        {[...Array(6)].map((_, i) => <Sk key={i} h={4} w={i % 3 === 2 ? '3/4' : 'full'} />)}
                                    </div>
                                ) : (
                                    <SimplifiedRenderer text={result?.simplifiedText} />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Stats & Actions bottom bar ──────────────────────────── */}
                {result && !simplifying && (
                    <div className="rounded-2xl p-4 flex-shrink-0"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: '0 2px 12px rgba(124,58,237,0.08)' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <BarChart2 className="w-4 h-4" style={{ color: P.primary }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#3B0764' }}>Stats &amp; Actions</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                            <StatPill icon={FileText}     label="Words Reduced"   value={result.wordsReduced}       color="#7C3AED" />
                            <StatPill icon={NotebookPen}  label="Summary Length"  value={`${result.simplifiedWordCount}w`} color="#8B5CF6" />
                            <StatPill icon={CheckCircle2} label="Info Retained"   value={`${result.infoRetained}%`} color="#10B981" />
                            <StatPill icon={BookOpen}     label="Grade Level"     value={result.gradeLevel}         color="#F59E0B" />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={() => setShowShareModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all hover:opacity-90"
                                style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff', boxShadow: '0 4px 14px rgba(124,58,237,0.30)' }}>
                                <Bookmark className="w-3.5 h-3.5" /> Save to Course
                            </button>
                            <button onClick={() => setShowShareModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg,#059669,#10B981)', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
                                <Users className="w-3.5 h-3.5" /> Share to Students
                            </button>
                            <button onClick={reset}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all hover:opacity-80"
                                style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}>
                                <RefreshCw className="w-3.5 h-3.5" /> New Note
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Empty state ─────────────────────────────────────────── */}
                {!simplifying && !result && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-sm">
                            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                                style={{ background: P.gradient, boxShadow: '0 8px 24px rgba(124,58,237,0.30)' }}>
                                <NotebookPen className="w-8 h-8 text-white" />
                            </div>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#3B0764', marginBottom: 8 }}>
                                Paste notes above to simplify
                            </h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#7C3AED', lineHeight: 1.6 }}>
                                AI will simplify your notes, retain key concepts, and determine the grade level — all in seconds.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 w-[240px] flex-shrink-0 overflow-y-auto custom-scrollbar">

                {/* Upload DOCX/PDF */}
                <button onClick={() => fileRef.current?.click()}
                    className="w-full rounded-2xl p-4 flex items-center gap-3 transition-all hover:opacity-90"
                    style={{ background: P.gradient, boxShadow: '0 4px 16px rgba(124,58,237,0.30)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.20)' }}>
                        <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#fff' }}>Upload DOCX / PDF</p>
                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: 'rgba(255,255,255,0.75)' }}>Click to upload a file</p>
                    </div>
                </button>

                {/* Stats & Actions sidebar */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Stats &amp; Actions</p>
                        <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                    </div>
                    {loadingInit ? (
                        <div className="space-y-2"><Sk h={14} /><Sk h={14} /><Sk h={14} /><Sk h={14} /></div>
                    ) : result ? (
                        <div className="space-y-2">
                            {[
                                { icon: FileText,     label: 'Words Reduced',  value: result.wordsReduced,              color: P.primary },
                                { icon: NotebookPen,  label: 'New Summary',    value: `${result.simplifiedWordCount} Words`, color: '#F59E0B' },
                                { icon: CheckCircle2, label: 'Info Retained',  value: `${result.infoRetained}%`,        color: '#10B981' },
                                { icon: BookOpen,     label: 'Grade Level',    value: result.gradeLevel || '—',         color: '#6366F1' },
                            ].map(st => (
                                <div key={st.label} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ backgroundColor: P.soft }}>
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${st.color}15` }}>
                                        <st.icon className="w-4 h-4" style={{ color: st.color }} />
                                    </div>
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{st.label}</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>{st.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {['Words Reduced', 'New Summary', 'Info Retained', 'Grade Level'].map(l => (
                                <div key={l} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ backgroundColor: P.soft, opacity: 0.5 }}>
                                    <div className="w-8 h-8 rounded-xl" style={{ backgroundColor: `${P.primary}15` }} />
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{l}</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#CBD5E1' }}>—</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Knowledge Bank — real data */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Knowledge Bank</p>
                        <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-3">
                        {['Trending', 'Recently Simplified'].map((tab, i) => (
                            <button key={tab}
                                className="flex-1 py-1 rounded-lg text-center transition-all"
                                style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold,
                                    backgroundColor: i === 0 ? P.primary : 'transparent',
                                    color: i === 0 ? '#fff' : '#94A3B8' }}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    {loadingInit ? (
                        <div className="space-y-2"><Sk h={5} /><Sk h={5} /><Sk h={5} /></div>
                    ) : allTopics.length > 0 ? (
                        <div className="space-y-1.5">
                            {allTopics.slice(0, 5).map((topic, i) => (
                                <div key={topic} onClick={() => { setRawText(prev => prev ? prev : `Notes about ${topic}`); }}
                                    className="flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:opacity-80 transition-all"
                                    style={{ backgroundColor: P.soft }}>
                                    <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: P.gradient }}>
                                        <BookOpen className="w-3 h-3 text-white" />
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#3B0764' }}>{topic}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1', textAlign: 'center', padding: '12px 0' }}>
                            No topics yet. Simplify notes to build your bank.
                        </p>
                    )}
                </div>

                {/* Note History — real from DB */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4" style={{ color: P.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>History</p>
                        {history.length > 0 && <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', marginLeft: 'auto' }}>{history.length}</span>}
                    </div>
                    {loadingInit ? (
                        <div className="space-y-2"><Sk h={16} /><Sk h={16} /><Sk h={16} /></div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-4">
                            <NotebookPen className="w-8 h-8 mx-auto mb-2" style={{ color: `${P.primary}30` }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1' }}>No simplified notes yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.map(note => (
                                <div key={note._id} className="relative group">
                                    <HistoryItem
                                        note={note}
                                        isActive={activeNoteId === note._id?.toString()}
                                        onClick={() => loadHistoryNote(note._id)}
                                    />
                                    <button
                                        onClick={e => handleDelete(note._id, e)}
                                        className="absolute top-2 right-2 w-5 h-5 rounded-md items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                                        style={{ backgroundColor: 'rgba(244,63,94,0.10)' }}>
                                        <Trash2 className="w-3 h-3" style={{ color: '#F43F5E' }} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tips — static UI only */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" style={{ color: '#F59E0B' }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Tips</p>
                        </div>
                        <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                    </div>
                    {[
                        'Clear & structured notes lead to better simplification!',
                        'Add a course context for curriculum-aware simplification.',
                        'Upload DOCX/PDF for bulk note processing.',
                    ].map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                            <span style={{ fontFamily: T.fontFamily, fontSize: '14px' }}>
                                {i === 0 ? '📝' : i === 1 ? '📚' : '📄'}
                            </span>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B', lineHeight: 1.5 }}>{tip}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && result && (
                <ShareModal
                    noteId={result._id}
                    courses={courses}
                    onClose={() => setShowShareModal(false)}
                    onShared={async () => {
                        const histRes = await api.get('/ai/simplified-notes?limit=8');
                        if (histRes.data?.success) setHistory(histRes.data.notes || []);
                    }}
                />
            )}
        </div>
    );
}