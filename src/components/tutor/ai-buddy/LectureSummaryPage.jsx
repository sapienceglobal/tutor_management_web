'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    FileStack, Upload, Mic, Youtube, FileText,
    Sparkles, Loader2, ChevronDown, RotateCcw,
    BookOpen, Key, NotebookPen, Brain, Share2,
    Download, Copy, BarChart2, Clock, CheckCircle2,
    Lightbulb, Play, X, RefreshCw, Zap, Target,
    AlertCircle, PlusCircle, Trash2, MoreHorizontal,
    Link, Star, TrendingUp, Eye
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

// ─── Purple palette ───────────────────────────────────────────────────────────
const P = {
    primary:  '#7C3AED',
    light:    '#8B5CF6',
    soft:     'rgba(124,58,237,0.08)',
    border:   'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg:   '#F5F3FF',
};

// ─── Focus areas options ──────────────────────────────────────────────────────
const FOCUS_OPTIONS = ['Key Concepts', 'Important Formulas', 'Examples', 'Key Takeaways'];

// ─── Source type tabs ─────────────────────────────────────────────────────────
const SOURCE_TABS = [
    { id: 'file',    label: 'Upload Content', icon: Upload },
    { id: 'text',    label: 'Paste Text',     icon: FileText },
    { id: 'lesson',  label: 'From Lesson',    icon: BookOpen },
    { id: 'youtube', label: 'YouTube Link',   icon: Youtube },
];

// ─── Result tabs ──────────────────────────────────────────────────────────────
const RESULT_TABS = [
    { id: 'summary',    label: 'Overview',   icon: Eye },
    { id: 'keyPoints',  label: 'Key Points', icon: Key },
    { id: 'studyNotes', label: 'Notes',      icon: NotebookPen },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ h = 4, w = 'full', r = 'xl' }) {
    return <div className={`h-${h} w-${w} rounded-${r} animate-pulse`} style={{ backgroundColor: P.soft }} />;
}

// ─── Study notes renderer ─────────────────────────────────────────────────────
function NotesRenderer({ text }) {
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
                    const parts = line.replace(/^[•\-]\s/, '').split(/(\*\*.*?\*\*)/g);
                    return (
                        <div key={i} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: P.primary }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#4C1D95', lineHeight: 1.65 }}>
                                {parts.map((p, j) =>
                                    p.startsWith('**') && p.endsWith('**')
                                        ? <strong key={j} style={{ fontWeight: T.weight.bold }}>{p.slice(2, -2)}</strong>
                                        : p
                                )}
                            </p>
                        </div>
                    );
                }
                return <p key={i} style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#4C1D95', lineHeight: 1.65 }}>{line}</p>;
            })}
        </div>
    );
}

// ─── Recent document card ─────────────────────────────────────────────────────
function RecentDocCard({ record, isActive, onClick, onDelete }) {
    const typeColor = record.sourceType === 'file' ? '#EF4444'
        : record.sourceType === 'lesson' ? P.primary
        : record.sourceType === 'youtube' ? '#EF4444' : '#6366F1';
    const typeLabel = record.sourceType === 'file'
        ? (record.sourceFileName?.split('.').pop()?.toUpperCase() || 'FILE')
        : record.sourceType === 'youtube' ? 'YT'
        : record.sourceType === 'lesson'  ? 'LESSON' : 'TEXT';

    return (
        <div onClick={onClick}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group"
            style={{ backgroundColor: isActive ? P.soft : '#fff', border: isActive ? `1.5px solid ${P.primary}` : `1px solid ${P.border}`, boxShadow: S.card }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${typeColor}12`, border: `1px solid ${typeColor}20` }}>
                <FileText className="w-4 h-4" style={{ color: typeColor }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#1E293B' }}>
                    {record.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: typeColor, fontWeight: T.weight.bold }}>{typeLabel}</span>
                    {record.keyPointCount > 0 && <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{record.keyPointCount} key points</span>}
                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{record.timeAgo}</span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'rgba(16,185,129,0.10)', fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: '#10B981' }}>
                    Ready
                </span>
                <button onClick={e => { e.stopPropagation(); onDelete(record._id); }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center transition-opacity"
                    style={{ backgroundColor: 'rgba(244,63,94,0.10)' }}>
                    <Trash2 className="w-3 h-3" style={{ color: '#F43F5E' }} />
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LectureSummaryPage() {
    // ── Input state ────────────────────────────────────────────────
    const [sourceTab, setSourceTab]     = useState('file');
    const [pastedText, setPastedText]   = useState('');
    const [youtubeUrl, setYoutubeUrl]   = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [courseId, setCourseId]       = useState('');
    const [lessonId, setLessonId]       = useState('');
    const [summaryLength, setSummaryLength] = useState('medium');
    const [focusAreas, setFocusAreas]   = useState(['Key Concepts', 'Key Takeaways']);
    const [customTitle, setCustomTitle] = useState('');

    // ── Data ───────────────────────────────────────────────────────
    const [courses, setCourses]         = useState([]);
    const [lessons, setLessons]         = useState([]);
    const [recentDocs, setRecentDocs]   = useState([]);
    const [stats, setStats]             = useState(null);
    const [aiInsights, setAiInsights]   = useState([]);
    const [relatedLectures, setRelatedLectures] = useState([]);
    const [loadingInit, setLoadingInit] = useState(true);
    const [loadingLessons, setLoadingLessons] = useState(false);

    // ── Result state ───────────────────────────────────────────────
    const [generating, setGenerating]   = useState(false);
    const [result, setResult]           = useState(null);
    const [activeRecord, setActiveRecord] = useState(null);
    const [resultTab, setResultTab]     = useState('summary');

    const fileRef   = useRef(null);
    const resultRef = useRef(null);

    // ── Load initial data ──────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            setLoadingInit(true);
            try {
                const [courseRes, recentRes, statsRes] = await Promise.all([
                    api.get('/courses/my-courses'),
                    api.get('/ai/lecture-summaries?limit=6'),
                    api.get('/ai/lecture-summary-stats'),
                ]);
                if (courseRes.data?.success) setCourses((courseRes.data.courses || []).map(c => ({ _id: c._id, title: c.title })));
                if (recentRes.data?.success) setRecentDocs(recentRes.data.records || []);
                if (statsRes.data?.success)  { setStats(statsRes.data.stats); setAiInsights(statsRes.data.aiInsights || []); }
            } catch { toast.error('Failed to load Lecture Summary'); }
            finally { setLoadingInit(false); }
        };
        init();
    }, []);

    // ── Load lessons when course changes ──────────────────────────
    useEffect(() => {
        if (!courseId) { setLessons([]); setLessonId(''); return; }
        setLoadingLessons(true);
        api.get(`/lessons/course/${courseId}`)
            .then(r => { if (r.data?.success) setLessons(r.data.lessons || []); })
            .catch(() => {})
            .finally(() => setLoadingLessons(false));
    }, [courseId]);

    useEffect(() => {
        if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [result]);

    // ── File select ────────────────────────────────────────────────
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ['application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain'];
        if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|ppt|pptx|txt|mp3)$/i)) {
            return toast.error('Supported: PDF, DOCX, PPT, TXT');
        }
        setUploadedFile(file);
        setSourceTab('file');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) { handleFileSelect({ target: { files: [file] } }); }
    };

    // ── Toggle focus areas ────────────────────────────────────────
    const toggleFocus = (area) => {
        setFocusAreas(prev =>
            prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
        );
    };

    // ── Generate summary ───────────────────────────────────────────
    const handleGenerate = async () => {
        if (generating) return;

        // Validate
        if (sourceTab === 'file'    && !uploadedFile) return toast.error('Please upload a file');
        if (sourceTab === 'text'    && pastedText.trim().length < 20) return toast.error('Please paste at least 20 characters');
        if (sourceTab === 'youtube' && !youtubeUrl.trim()) return toast.error('Please enter a YouTube URL');
        if (sourceTab === 'lesson'  && !lessonId) return toast.error('Please select a lesson');

        setGenerating(true);
        setResult(null);
        setActiveRecord(null);
        setResultTab('summary');

        try {
            const formData = new FormData();
            if (sourceTab === 'file'    && uploadedFile) formData.append('file', uploadedFile);
            if (sourceTab === 'text')    formData.append('text', pastedText);
            if (sourceTab === 'youtube') formData.append('youtubeUrl', youtubeUrl);
            if (sourceTab === 'lesson')  formData.append('lessonId', lessonId);
            if (courseId)    formData.append('courseId', courseId);
            if (customTitle) formData.append('title', customTitle);
            formData.append('summaryLength', summaryLength);
            formData.append('focusAreas', JSON.stringify(focusAreas));

            const res = await api.post('/ai/lecture-summary/generate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data?.success) {
                setResult(res.data.record);
                setActiveRecord(res.data.record._id?.toString());

                // Refresh recent docs
                const recentRes = await api.get('/ai/lecture-summaries?limit=6');
                if (recentRes.data?.success) setRecentDocs(recentRes.data.records || []);

                // Refresh stats
                const statsRes = await api.get('/ai/lecture-summary-stats');
                if (statsRes.data?.success) { setStats(statsRes.data.stats); setAiInsights(statsRes.data.aiInsights || []); }

                // Related lectures
                if (res.data.record._id) {
                    api.get(`/ai/lecture-summaries/${res.data.record._id}/related`)
                        .then(r => { if (r.data?.success) setRelatedLectures(r.data.lessons || []); })
                        .catch(() => {});
                }
            } else {
                toast.error(res.data?.message || 'Generation failed');
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || 'AI failed. Please retry.');
        } finally {
            setGenerating(false);
        }
    };

    // ── Load past record ───────────────────────────────────────────
    const loadRecord = async (id) => {
        if (activeRecord === id?.toString()) return;
        try {
            const res = await api.get(`/ai/lecture-summaries/${id}`);
            if (res.data?.success) {
                setResult(res.data.record);
                setActiveRecord(id?.toString());
                setResultTab('summary');

                // Related
                api.get(`/ai/lecture-summaries/${id}/related`)
                    .then(r => { if (r.data?.success) setRelatedLectures(r.data.lessons || []); })
                    .catch(() => {});
            }
        } catch { toast.error('Failed to load summary'); }
    };

    // ── Delete record ──────────────────────────────────────────────
    const handleDelete = async (id) => {
        try {
            await api.delete(`/ai/lecture-summaries/${id}`);
            setRecentDocs(prev => prev.filter(r => r._id?.toString() !== id?.toString()));
            if (activeRecord === id?.toString()) { setResult(null); setActiveRecord(null); }
            toast.success('Deleted');
        } catch { toast.error('Failed to delete'); }
    };

    // ── Copy summary ───────────────────────────────────────────────
    const handleCopy = () => {
        if (!result) return;
        const text = resultTab === 'summary' ? result.summary
            : resultTab === 'keyPoints' ? result.keyPoints?.join('\n')
            : result.studyNotes;
        navigator.clipboard.writeText(text || '').then(() => toast.success('Copied!'));
    };

    const reset = () => { setResult(null); setActiveRecord(null); setPastedText(''); setUploadedFile(null); setYoutubeUrl(''); setCustomTitle(''); if (fileRef.current) fileRef.current.value = ''; };

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-4 h-full p-4" style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg }}>

            {/* ── LEFT: Upload + Recent ─────────────────────────────────── */}
            <div className="flex flex-col gap-3 w-[300px] flex-shrink-0 overflow-y-auto custom-scrollbar">

                {/* Page title */}
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: P.gradient }}>
                            <FileStack className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#3B0764' }}>
                                Lecture Summary Generator
                            </h1>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#7C3AED' }}>
                                Upload your lecture material &amp; get AI-powered summary
                            </p>
                        </div>
                    </div>
                </div>

                {/* Source tabs */}
                <div className="rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    {/* Tab bar */}
                    <div className="flex border-b" style={{ borderColor: P.border }}>
                        {SOURCE_TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = sourceTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setSourceTab(tab.id)}
                                    className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all"
                                    style={{
                                        borderBottom: isActive ? `2px solid ${P.primary}` : '2px solid transparent',
                                        backgroundColor: isActive ? P.soft : 'transparent',
                                    }}>
                                    <Icon className="w-3.5 h-3.5" style={{ color: isActive ? P.primary : '#94A3B8' }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: isActive ? T.weight.bold : T.weight.regular, color: isActive ? P.primary : '#94A3B8' }}>
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-4">
                        {/* Upload Content tab */}
                        {sourceTab === 'file' && (
                            <div
                                onDrop={handleDrop}
                                onDragOver={e => e.preventDefault()}
                                onClick={() => !uploadedFile && fileRef.current?.click()}
                                className="rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer transition-all"
                                style={{ border: `2px dashed ${P.border}`, backgroundColor: P.soft, minHeight: 160 }}>
                                {uploadedFile ? (
                                    <div className="w-full">
                                        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}` }}>
                                            <FileText className="w-8 h-8 flex-shrink-0" style={{ color: P.primary }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#3B0764' }}>{uploadedFile.name}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#7C3AED' }}>{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                                            </div>
                                            <button onClick={e => { e.stopPropagation(); setUploadedFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                                                className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(244,63,94,0.10)' }}>
                                                <X className="w-3.5 h-3.5" style={{ color: '#F43F5E' }} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: P.gradient }}>
                                            <Upload className="w-7 h-7 text-white" />
                                        </div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#3B0764', marginBottom: 4 }}>
                                            Drag &amp; Drop lecture files here
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8', textAlign: 'center', marginBottom: 12 }}>
                                            Supports: PDF, PPT, DOC, TXT (Max 50MB)
                                        </p>
                                        <button className="px-5 py-2 rounded-xl flex items-center gap-2"
                                            style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff', boxShadow: '0 4px 14px rgba(124,58,237,0.30)' }}>
                                            <Upload className="w-3.5 h-3.5" /> Browse Files
                                        </button>
                                    </>
                                )}
                                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" className="hidden" onChange={handleFileSelect} />
                            </div>
                        )}

                        {/* Paste Text tab */}
                        {sourceTab === 'text' && (
                            <textarea value={pastedText} onChange={e => setPastedText(e.target.value)}
                                placeholder="Paste your lecture notes or content here…"
                                rows={7} className="w-full resize-none outline-none"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#3B0764', backgroundColor: 'transparent', lineHeight: 1.65, border: `1px dashed ${P.border}`, borderRadius: 12, padding: 12 }} />
                        )}

                        {/* From Lesson tab */}
                        {sourceTab === 'lesson' && (
                            <div className="space-y-3">
                                <div>
                                    <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>Course</label>
                                    <div className="relative mt-1">
                                        <select value={courseId} onChange={e => setCourseId(e.target.value)}
                                            className="w-full appearance-none px-3 py-2.5 rounded-xl pr-7 outline-none"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                            <option value="">Select course…</option>
                                            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                                        </select>
                                        <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>Lesson</label>
                                    <div className="relative mt-1">
                                        {loadingLessons ? <Sk h={9} /> : (
                                            <>
                                                <select value={lessonId} onChange={e => setLessonId(e.target.value)}
                                                    disabled={!courseId || lessons.length === 0}
                                                    className="w-full appearance-none px-3 py-2.5 rounded-xl pr-7 outline-none disabled:opacity-50"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                                    <option value="">Select lesson…</option>
                                                    {lessons.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                                                </select>
                                                <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* YouTube tab */}
                        {sourceTab === 'youtube' && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                    <Youtube className="w-4 h-4 flex-shrink-0" style={{ color: '#EF4444' }} />
                                    <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
                                        placeholder="Paste YouTube URL here…"
                                        className="flex-1 bg-transparent outline-none"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#334155' }} />
                                </div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                                    AI will generate a summary based on the video title and context.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Summary Preferences */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>AI Summary Preferences</p>
                        <Zap className="w-4 h-4" style={{ color: P.primary }} />
                    </div>

                    {/* Summary Length */}
                    <div className="mb-3">
                        <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>Summary Length</label>
                        <div className="flex gap-1.5 mt-1.5">
                            {['short', 'medium', 'detailed'].map(len => (
                                <button key={len} onClick={() => setSummaryLength(len)}
                                    className="flex-1 py-1.5 rounded-xl capitalize transition-all"
                                    style={{
                                        fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold,
                                        background:   summaryLength === len ? P.gradient : 'transparent',
                                        color:        summaryLength === len ? '#fff' : '#94A3B8',
                                        border:       `1px solid ${summaryLength === len ? 'transparent' : P.border}`,
                                    }}>
                                    {len.charAt(0).toUpperCase() + len.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Focus Areas */}
                    <div>
                        <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>Focus Areas</label>
                        <div className="space-y-1.5 mt-1.5">
                            {FOCUS_OPTIONS.map(area => {
                                const checked = focusAreas.includes(area);
                                return (
                                    <button key={area} onClick={() => toggleFocus(area)}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all"
                                        style={{ backgroundColor: checked ? P.soft : 'transparent', border: `1px solid ${checked ? P.primary + '40' : P.border}` }}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: checked ? P.primary : 'transparent', border: `1.5px solid ${checked ? P.primary : '#CBD5E1'}` }}>
                                                {checked && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                                            </div>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: checked ? P.primary : '#64748B', fontWeight: checked ? T.weight.semibold : T.weight.regular }}>
                                                {area}
                                            </span>
                                        </div>
                                        <ChevronDown className="w-3 h-3" style={{ color: '#94A3B8' }} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Optional title */}
                    <input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                        placeholder="Custom title (optional)"
                        className="w-full mt-3 px-3 py-2 rounded-xl outline-none"
                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }} />

                    {/* Course context (if not lesson tab) */}
                    {sourceTab !== 'lesson' && (
                        <div className="relative mt-2">
                            <select value={courseId} onChange={e => setCourseId(e.target.value)}
                                className="w-full appearance-none px-3 py-2 rounded-xl pr-7 outline-none"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                <option value="">No course context</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                        </div>
                    )}
                </div>

                {/* Generate button */}
                <button onClick={handleGenerate} disabled={generating}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all hover:opacity-90 disabled:opacity-50 flex-shrink-0"
                    style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#fff', boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}>
                    {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {generating ? 'Generating Summary…' : 'Generate Summary'}
                </button>

                {/* Recent Documents */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Recent Documents</p>
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>View All →</span>
                    </div>
                    {loadingInit ? (
                        <div className="space-y-2">{[...Array(3)].map((_, i) => <Sk key={i} h={14} />)}</div>
                    ) : recentDocs.length === 0 ? (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1', textAlign: 'center', padding: '12px 0' }}>No summaries yet</p>
                    ) : (
                        <div className="space-y-2">
                            {recentDocs.map(r => (
                                <RecentDocCard key={r._id} record={r}
                                    isActive={activeRecord === r._id?.toString()}
                                    onClick={() => loadRecord(r._id)}
                                    onDelete={handleDelete} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── CENTER: Generated Summary ────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto custom-scrollbar">

                {generating ? (
                    <div className="flex-1 flex flex-col items-center justify-center rounded-2xl gap-4"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}` }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: P.gradient, boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                            <Sparkles className="w-8 h-8 text-white animate-pulse" />
                        </div>
                        <div className="text-center">
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 4 }}>
                                Generating lecture summary…
                            </p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>Analyzing content, extracting key points &amp; creating notes</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl" style={{ backgroundColor: P.soft }}>
                            {[0, 1, 2].map(i => (
                                <span key={i} className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: P.primary, animation: `ls-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                            ))}
                            <style>{`@keyframes ls-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}`}</style>
                        </div>
                    </div>
                ) : !result ? (
                    <div className="flex-1 flex items-center justify-center rounded-2xl"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}` }}>
                        <div className="text-center px-8">
                            <FileStack className="w-14 h-14 mx-auto mb-4" style={{ color: `${P.primary}35` }} />
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#3B0764', marginBottom: 8 }}>
                                Upload &amp; Generate Summary
                            </h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#7C3AED', lineHeight: 1.6 }}>
                                Upload a lecture file, paste text, or select a lesson. AI will generate structured summaries, key points, and study notes instantly.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div ref={resultRef} className="space-y-3">
                        {/* Generated Summary card */}
                        <div className="rounded-2xl overflow-hidden"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${P.border}` }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: P.gradient }}>
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>
                                            Generated Summary
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                                            {result.title}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                                        Generated just now
                                    </span>
                                    <button onClick={handleGenerate}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:opacity-80"
                                        style={{ backgroundColor: P.soft, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>
                                        <RefreshCw className="w-3 h-3" /> Regenerate
                                    </button>
                                </div>
                            </div>

                            {/* Lecture meta */}
                            <div className="flex items-center gap-4 px-5 py-2.5" style={{ backgroundColor: P.soft, borderBottom: `1px solid ${P.border}` }}>
                                <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: P.primary, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#fff' }}>Topic</span>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#3B0764' }}>{result.title}</span>
                                </div>
                                {result.estimatedDuration && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" style={{ color: '#94A3B8' }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>Duration: {result.estimatedDuration}</span>
                                    </div>
                                )}
                                {result.subject && (
                                    <div className="flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" style={{ color: '#94A3B8' }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>Subject: {result.subject}</span>
                                    </div>
                                )}
                                {result.difficulty && (
                                    <span className="px-2 py-0.5 rounded-full ml-auto"
                                        style={{ backgroundColor: 'rgba(16,185,129,0.10)', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#10B981' }}>
                                        {result.difficulty}
                                    </span>
                                )}
                            </div>

                            {/* Result tabs */}
                            <div className="flex border-b" style={{ borderColor: P.border }}>
                                {RESULT_TABS.map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = resultTab === tab.id;
                                    return (
                                        <button key={tab.id} onClick={() => setResultTab(tab.id)}
                                            className="flex items-center gap-2 px-5 py-3 transition-all"
                                            style={{
                                                borderBottom: isActive ? `2px solid ${P.primary}` : '2px solid transparent',
                                                backgroundColor: isActive ? P.soft : 'transparent',
                                                fontFamily: T.fontFamily, fontSize: T.size.xs,
                                                fontWeight: isActive ? T.weight.bold : T.weight.regular,
                                                color: isActive ? P.primary : '#94A3B8',
                                            }}>
                                            <Icon className="w-3.5 h-3.5" /> {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tab content */}
                            <div className="p-5">
                                {resultTab === 'summary' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Summary */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Sparkles className="w-4 h-4" style={{ color: P.primary }} />
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Summary</p>
                                            </div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569', lineHeight: 1.7 }}>
                                                {result.summary}
                                            </p>
                                        </div>
                                        {/* Key Takeaways */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Zap className="w-4 h-4" style={{ color: '#F59E0B' }} />
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Key Takeaways</p>
                                            </div>
                                            <div className="space-y-2">
                                                {(result.keyTakeaways || []).map((kt, i) => (
                                                    <div key={i} className="flex items-start gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#10B981' }} />
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.55 }}>{kt}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {resultTab === 'keyPoints' && (
                                    <div className="space-y-2">
                                        {(result.keyPoints || []).map((kp, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: P.soft }}>
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: P.gradient }}>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black, color: '#fff' }}>{i + 1}</span>
                                                </div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#4C1D95', lineHeight: 1.6 }}>{kp}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {resultTab === 'studyNotes' && (
                                    <NotesRenderer text={result.studyNotes} />
                                )}
                            </div>

                            {/* Actions bar */}
                            <div className="flex items-center gap-2 px-5 py-3.5 flex-wrap" style={{ borderTop: `1px solid ${P.border}` }}>
                                <button onClick={handleGenerate}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl"
                                    style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.30)' }}>
                                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate Summary
                                </button>
                                <button onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}>
                                    <Copy className="w-3.5 h-3.5" /> Copy Notes
                                </button>
                                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl"
                                    style={{ backgroundColor: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#059669' }}>
                                    <Share2 className="w-3.5 h-3.5" /> Share
                                </button>
                                <button onClick={reset}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl ml-auto"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}>
                                    <X className="w-3.5 h-3.5" /> New
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── RIGHT: Stats + Quick Actions + AI Insights ─────────────── */}
            <div className="flex flex-col gap-3 w-[230px] flex-shrink-0 overflow-y-auto custom-scrollbar">

                {/* Summary Stats */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-2 mb-3">
                        <BarChart2 className="w-4 h-4" style={{ color: P.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Summary Stats</p>
                    </div>
                    {loadingInit ? (
                        <div className="grid grid-cols-2 gap-2">{[...Array(4)].map((_, i) => <Sk key={i} h={14} />)}</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {[
                                    { label: 'Total Lectures',     value: stats?.totalLectures || '0',     sub: 'In Courses' },
                                    { label: 'Summaries Generated', value: stats?.summariesGenerated || '0', sub: 'This Week' },
                                ].map(st => (
                                    <div key={st.label} className="p-3 rounded-xl" style={{ backgroundColor: P.soft }}>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '22px', fontWeight: T.weight.black, color: '#3B0764', lineHeight: 1 }}>{st.value}</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#334155', marginTop: 2 }}>{st.label}</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{st.sub}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Avg. Time Saved', value: stats?.timeSaved || '0 mins', sub: 'This Month', color: '#F59E0B' },
                                    { label: 'Accuracy',         value: stats?.accuracy || '98%',     sub: 'AI Powered',  color: '#10B981' },
                                ].map(st => (
                                    <div key={st.label} className="p-3 rounded-xl" style={{ backgroundColor: P.soft }}>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '18px', fontWeight: T.weight.black, color: st.color, lineHeight: 1 }}>{st.value}</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#334155', marginTop: 2 }}>{st.label}</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{st.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 10 }}>Quick Actions</p>
                    {[
                        { label: 'Generate Summary',   icon: Sparkles,    onClick: handleGenerate },
                        { label: 'Extract Key Points', icon: Key,         onClick: () => result && setResultTab('keyPoints') },
                        { label: 'Create Study Notes', icon: NotebookPen, onClick: () => result && setResultTab('studyNotes') },
                    ].map(action => {
                        const Icon = action.icon;
                        return (
                            <button key={action.label} onClick={action.onClick}
                                className="w-full flex items-center gap-3 p-3 rounded-xl mb-2 last:mb-0 transition-all hover:opacity-80"
                                style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: P.gradient }}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#334155' }}>{action.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Related Lectures */}
                {relatedLectures.length > 0 && (
                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 10 }}>Related Lectures</p>
                        <div className="space-y-2">
                            {relatedLectures.map(l => (
                                <div key={l._id} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ backgroundColor: P.soft }}>
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: P.gradient }}>
                                        <Play className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#334155' }}>{l.title}</p>
                                    </div>
                                    {l.content?.duration && (
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', flexShrink: 0 }}>
                                            {Math.round(l.content.duration / 60)}m
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Insights — real from QuizAttempt data */}
                {aiInsights.length > 0 && (
                    <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(251,191,36,0.06))', border: '1px solid rgba(245,158,11,0.18)', boxShadow: S.card }}>
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4" style={{ color: '#F59E0B' }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>AI Insights</p>
                        </div>
                        {aiInsights.map((insight, i) => (
                            <div key={i} className="mb-2 last:mb-0">
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#92400E', lineHeight: 1.5 }}>
                                    • {insight.message}
                                </p>
                                <button
                                    onClick={() => { setLessonId(insight.lessonId); setSourceTab('lesson'); }}
                                    className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 rounded-xl"
                                    style={{ backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.20)', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#D97706' }}>
                                    <Sparkles className="w-3 h-3" /> Create Practice Quiz
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tips */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4" style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Pro Tip</p>
                        </div>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B', lineHeight: 1.6 }}>
                        📤 Upload complete lecture for best summary results! Clear, structured content gives more accurate key points.
                    </p>
                </div>
            </div>
        </div>
    );
}