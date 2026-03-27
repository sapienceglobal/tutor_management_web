'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize2, Minimize2,
    ChevronDown, ChevronRight, ChevronLeft, CheckCircle, Lock, FileText,
    FileQuestion, PlayCircle, X, MessageSquare, Brain, Sparkles, Loader2,
    Star, ThumbsUp, ThumbsDown, BookOpen, PenLine, Clock, ChevronUp,
    RotateCcw, Award, AlertCircle, Menu, Settings, Download, Share2,
    Target, Zap, ListChecks, Bookmark, BookmarkCheck, Users, Bot, Send, Trash2
} from 'lucide-react';
import api from '@/lib/axios';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { toast } from 'react-hot-toast';
import Hls from 'hls.js';

// ─── Dark gradient constant ──────────────────────────────────────────────────
const dg = { background: 'linear-gradient(135deg, #1e1b4b, #4338ca)' };

// ─── Mini components ─────────────────────────────────────────────────────────
function DBtn({ children, onClick, disabled, className = '', type = 'button' }) {
    return (
        <button type={type} onClick={onClick} disabled={disabled}
            className={`text-white font-black rounded-xl transition-all hover:opacity-90 disabled:opacity-50 ${className}`}
            style={dg}>
            {children}
        </button>
    );
}

function TabBtn({ active, onClick, children }) {
    return (
        <button onClick={onClick}
            className={`px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.06em] border-b-2 transition-all whitespace-nowrap
                ${active ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {children}
        </button>
    );
}

// ─── Main LessonPlayerModal ──────────────────────────────────────────────────
export default function LessonPlayerModal({
    lessons = [],
    modules = [],
    reviews = [],
    initialIndex = 0,
    courseId,
    onClose,
    onLessonComplete,
}) {
    const videoRef = useRef(null);
    const playerRef = useRef(null);

    // ── Player State ────────────────────────────────────────────────────────
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [completedIds, setCompletedIds] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedModules, setExpandedMods] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [controlsTimer, setControlsTimer] = useState(null);
    const [bookmarked, setBookmarked] = useState(false);

    // ── Notes State ─────────────────────────────────────────────────────────
    const [notes, setNotes] = useState('');
    const [savedNotes, setSavedNotes] = useState({});
    const [savingNote, setSavingNote] = useState(false);

    // ── Quiz State ──────────────────────────────────────────────────────────
    const [quiz, setQuiz] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizResult, setQuizResult] = useState(null);
    const [loadingQuiz, setLoadingQuiz] = useState(false);

    // ── AI State ────────────────────────────────────────────────────────────
    const [aiLoading, setAiLoading] = useState(null);
    const [aiContent, setAiContent] = useState(null);
    const [aiType, setAiType] = useState('');

    // ── Comment State ──────────────────────────────────────────────────────
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const { confirmDialog } = useConfirm();

    const getCommentStudent = (comment) => comment?.student || comment?.studentId || {};
    const getCommentStudentId = (comment) => {
        const student = getCommentStudent(comment);
        return student?._id || student?.id || comment?.studentId?._id || comment?.studentId || null;
    };
    const getCommentAvatar = (comment) => {
        const student = getCommentStudent(comment);
        return student?.profileImage || student?.avatar?.url || comment?.studentId?.avatar?.url || null;
    };
    const isOwnComment = (comment) => {
        const currentId = currentUser?._id || currentUser?.id;
        const ownerId = getCommentStudentId(comment);
        return Boolean(currentId && ownerId && String(currentId) === String(ownerId));
    };
    const getCommentAuthorName = (comment) => {
        const student = getCommentStudent(comment);
        return student?.name || 'Student';
    };

    const lesson = lessons[currentIndex];

    // ── Normalise lesson content ─────────────────────────────────────────────
    // content may be a nested object {videoUrl, duration, attachments, documents}
    // or the videoUrl may be at the top-level
    const contentObj = (lesson?.content && typeof lesson.content === 'object') ? lesson.content : {};
    const videoUrl = contentObj.videoUrl || lesson?.videoUrl || null;
    const attachments = contentObj.attachments || lesson?.attachments || [];
    const lessonDesc = typeof lesson?.description === 'string' ? lesson.description
        : typeof lesson?.content === 'string' ? lesson.content
            : null;

    const getYouTubeId = (url) => {
        if (!url) return null;
        const m = url.match(/(?:youtu\.be\/|v\/|watch\?v=|embed\/)([^#&?]{11})/);
        return m ? m[1] : null;
    };
    const ytId = getYouTubeId(videoUrl);
    const isVideo = lesson?.type === 'video' || !!videoUrl;
    const isQuiz = lesson?.type === 'quiz';
    const isPDF = lesson?.type === 'pdf';
    const isDocument = lesson?.type === 'document';

    // ── Load progress + user ─────────────────────────────────────────────────
    useEffect(() => {
        loadProgress();
        const mIds = modules?.map(m => m._id) || [];
        setExpandedMods(mIds);
        api.get('/auth/me').then(r => { if (r.data?.success) setCurrentUser(r.data.user); }).catch(() => { });
    }, [courseId]);

    const syncIntervalRef = useRef(null);

    useEffect(() => {
        const saved = savedNotes[lesson?._id] || '';
        setNotes(saved);
        setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false); setQuizResult(null); setAiContent(null);
        setComments([]); setCommentText('');
        if (isQuiz && lesson?._id) loadQuiz(lesson._id);
        if (videoRef.current) { videoRef.current.currentTime = 0; setProgress(0); setCurrTime(0); }
        // Clear sync interval on lesson change
        if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        return () => { if (syncIntervalRef.current) clearInterval(syncIntervalRef.current); };
    }, [currentIndex]);

    // HLS Support bindings
    useEffect(() => {
        if (!isVideo || !videoRef.current || !videoUrl) return;

        const handleTimeUpdate = () => {
            if (!videoRef.current) return;
            setCurrTime(videoRef.current.currentTime);
            setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100 || 0);
        };
        const handleLoadedMeta = () => {
            if (videoRef.current) setDuration(videoRef.current.duration);
        };
        const handlePlay = () => setPlaying(true);
        const handlePause = () => setPlaying(false);
        const handleEnded = () => { setPlaying(false); setProgress(100); markComplete(); };

        let hls;
        if (videoUrl.includes('.m3u8')) {
            if (Hls.isSupported()) {
                hls = new Hls({
                    startLevel: -1, capLevelToPlayerSize: true, debug: false,
                    maxBufferLength: 30, maxMaxBufferLength: 600
                });
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (videoRef.current) setDuration(videoRef.current.duration);
                });
                hls.loadSource(videoUrl);
                hls.attachMedia(videoRef.current);
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari native HLS
                videoRef.current.src = videoUrl;
            }
        }

        const v = videoRef.current;
        v.addEventListener('timeupdate', handleTimeUpdate);
        v.addEventListener('loadedmetadata', handleLoadedMeta);
        v.addEventListener('play', handlePlay);
        v.addEventListener('pause', handlePause);
        v.addEventListener('ended', handleEnded);

        return () => {
            if (hls) hls.destroy();
            if (v) {
                v.removeEventListener('timeupdate', handleTimeUpdate);
                v.removeEventListener('loadedmetadata', handleLoadedMeta);
                v.removeEventListener('play', handlePlay);
                v.removeEventListener('pause', handlePause);
                v.removeEventListener('ended', handleEnded);
            }
        };
    }, [videoUrl, isVideo]);

    useEffect(() => {
        if (activeTab === 'discussion' && lesson?._id) fetchComments();
    }, [activeTab, currentIndex]);

    // ── Auto-hide controls ───────────────────────────────────────────────────
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (controlsTimer) clearTimeout(controlsTimer);
        const t = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
        setControlsTimer(t);
    }, [playing, controlsTimer]);

    const loadProgress = async () => {
        try {
            const res = await api.get(`/progress/course/${courseId}`);
            if (res.data?.progress) {
                const ids = res.data.progress.filter(p => p.completed).map(p => p.lessonId?.toString());
                setCompletedIds(ids);
            }
        } catch (_) { }
    };

    const loadQuiz = async (lessonId) => {
        setLoadingQuiz(true);
        try {
            const res = await api.get(`/quiz/lesson/${lessonId}`);
            if (res.data?.quiz) setQuiz(res.data.quiz);
        } catch (_) { }
        finally { setLoadingQuiz(false); }
    };

    const markComplete = async () => {
        if (!lesson) return;
        try {
            const res = await api.post('/progress', {
                courseId,
                lessonId: lesson._id,
                lastWatchedPosition: videoRef.current?.currentTime || 0,
                timeSpent: videoRef.current?.currentTime || 0,
                completed: true,
            });
            if (res.data?.success) {
                setCompletedIds(prev => [...new Set([...prev, lesson._id.toString()])]);
                onLessonComplete?.();
                toast.success('Lesson marked complete! 🎉');
            } else {
                toast.error('Failed to update progress');
            }
        } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    };

    const syncProgress = async () => {
        if (!videoRef.current || !lesson || lesson.type !== 'video') return;
        try {
            await api.post('/progress', {
                courseId,
                lessonId: lesson._id,
                lastWatchedPosition: Math.floor(videoRef.current.currentTime),
                timeSpent: Math.floor(videoRef.current.currentTime),
                completed: false,
            });
        } catch (_) { }
    };

    const saveNote = async () => {
        if (!lesson || !notes.trim()) return;
        setSavingNote(true);
        try {
            await api.post('/notes', { courseId, lessonId: lesson._id, content: notes });
            setSavedNotes(prev => ({ ...prev, [lesson._id]: notes }));
            toast.success('Note saved!');
        } catch (_) { toast.error('Failed to save note'); }
        finally { setSavingNote(false); }
    };

    const fetchComments = async () => {
        if (!lesson?._id) return;
        setLoadingComments(true);
        try {
            const res = await api.get(`/comments/${lesson._id}`);
            if (res.data?.success) setComments(res.data.comments || []);
        } catch (_) { }
        finally { setLoadingComments(false); }
    };

    const handlePostComment = async (e) => {
        e?.preventDefault();
        if (!commentText.trim()) return;
        try {
            const res = await api.post(`/comments/${lesson._id}`, { text: commentText });
            if (res.data?.success) { setComments(prev => [res.data.comment, ...prev]); setCommentText(''); }
        } catch (_) { toast.error('Failed to post comment'); }
    };

    const handleDeleteComment = async (commentId) => {
        const ok = await confirmDialog('Delete Comment', 'Delete this comment?', { variant: 'destructive' });
        if (!ok) return;
        try { await api.delete(`/comments/${commentId}`); setComments(prev => prev.filter(c => c._id !== commentId)); }
        catch (_) { toast.error('Failed to delete'); }
    };

    const submitQuiz = async () => {
        if (!quiz) return;
        try {
            const answers = quiz.questions.map((q, i) => ({ questionId: q._id, answer: quizAnswers[i] ?? '' }));
            const res = await api.post(`/quiz/${quiz._id}/submit`, { answers });
            setQuizResult(res.data);
            setQuizSubmitted(true);
        } catch (e) { toast.error('Failed to submit quiz'); }
    };

    const handleAI = async (type) => {
        if (!lesson) return;
        setAiLoading(type); setAiContent(null); setAiType(type);
        try {
            if (type === 'summarize') {
                const res = await api.post('/ai/summarize-lesson', { courseId, lessonId: lesson._id, lessonTitle: lesson.title, content: lesson.content });
                setAiContent(res.data.summary || res.data.data);
            } else if (type === 'explain') {
                const res = await api.post('/ai/explain-concept', { courseId, lessonId: lesson._id, lessonTitle: lesson.title, content: lesson.content });
                setAiContent(res.data.explanation || res.data.data);
            } else if (type === 'practice') {
                const res = await api.post('/ai/practice-questions', { courseId, lessonId: lesson._id, lessonTitle: lesson.title });
                setAiContent(res.data.questions || res.data.data);
            } else if (type === 'revision') {
                const res = await api.post('/ai/revision-notes', { courseId, lessonId: lesson._id, lessonTitle: lesson.title, content: lesson.content });
                setAiContent(res.data.notes || res.data.data);
            }
        } catch (e) { toast.error(e.response?.data?.message || 'AI failed'); setAiContent(null); }
        finally { setAiLoading(null); }
    };

    // ── Video controls ───────────────────────────────────────────────────────
    const togglePlay = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!videoRef.current) return;

        if (playing) {
            videoRef.current.pause();
            syncProgress();
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
            setPlaying(false);
        } else {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setPlaying(true);
                }).catch(err => {
                    console.warn('Play interrupted:', err);
                    setPlaying(false);
                });
            } else {
                setPlaying(true);
            }
            syncIntervalRef.current = setInterval(syncProgress, 15000);
        }
    };
    const seek = (e) => {
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = pct * duration;
    };
    const changeVolume = (v) => {
        setVolume(v);
        if (videoRef.current) videoRef.current.volume = v;
        setMuted(v === 0);
    };
    const toggleMute = () => {
        if (videoRef.current) { videoRef.current.muted = !muted; }
        setMuted(!muted);
    };
    const skip = (sec, e) => { if (e && e.stopPropagation) e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime += sec; };
    const toggleFS = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!playerRef.current) return;
        if (!fullscreen) playerRef.current.requestFullscreen?.();
        else document.exitFullscreen?.();
        setFullscreen(!fullscreen);
    };
    const fmtTime = (s) => { const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`; };

    const goToLesson = (idx) => {
        if (idx < 0 || idx >= lessons.length) return;
        setCurrentIndex(idx); setPlaying(false);
    };

    const getLessonsByModule = (moduleId) =>
        lessons.filter(l => (l.moduleId?._id || l.moduleId)?.toString() === moduleId?.toString())
            .sort((a, b) => (a.order || 0) - (b.order || 0));

    const isLessonDone = (l) => completedIds.includes(l._id?.toString());
    const isDone = lesson && isLessonDone(lesson);

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
            if (e.code === 'ArrowRight') skip(10);
            if (e.code === 'ArrowLeft') skip(-10);
            if (e.code === 'KeyF') toggleFS();
            if (e.code === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [playing]);

    if (!lesson) return null;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif", background: '#0a0b14' }}>

            {/* ── Top Bar ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 shrink-0" style={{ background: '#11121e' }}>
                <button onClick={onClose} className="w-8 h-8 bg-white/8 hover:bg-white/15 rounded-xl flex items-center justify-center transition-colors">
                    <X className="w-4 h-4 text-slate-300" />
                </button>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.08em]">Now Playing</p>
                    <p className="text-sm font-black text-white truncate leading-tight">{lesson.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {/* Progress pill */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/8 rounded-xl">
                        <div className="w-24 h-1.5 bg-white/15 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${(completedIds.length / lessons.length) * 100}%` }} />
                        </div>
                        <span className="text-[11px] font-black text-slate-400">{completedIds.length}/{lessons.length}</span>
                    </div>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 hover:bg-white/15 rounded-xl text-[11px] font-black text-slate-300 transition-colors">
                        <Menu className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Lessons</span>
                    </button>
                </div>
            </div>

            {/* ── Main Area ───────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── LEFT: Video + Content ─────────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Video Player */}
                    <div ref={playerRef}
                        className="relative bg-black flex-shrink-0"
                        style={{ aspectRatio: '16/9', maxHeight: sidebarOpen ? '55vh' : '65vh' }}
                        onMouseMove={resetControlsTimer}
                        onClick={isVideo ? togglePlay : undefined}>

                        {isVideo ? (
                            ytId ? (
                                // YouTube embed
                                <iframe
                                    key={ytId}
                                    src={`https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0&modestbranding=1`}
                                    title={lesson.title}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : videoUrl ? (
                                <video ref={videoRef} src={videoUrl.includes('.m3u8') ? undefined : videoUrl} className="w-full h-full object-contain" />
                            ) : (
                                // No video URL
                                <div className="w-full h-full flex items-center justify-center bg-slate-950">
                                    <div className="text-center">
                                        <PlayCircle className="w-16 h-16 text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm font-medium">Video unavailable</p>
                                    </div>
                                </div>
                            )
                        ) : isDocument && (contentObj.documents?.length > 0 || attachments?.length > 0) ? (
                            // Document Lesson Viewer
                            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0a0b14 100%)' }}>
                                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                <div className="relative flex flex-col items-center gap-6 max-w-2xl px-8 z-10 w-full">
                                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.05))', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                                        <FileText className="w-8 h-8 text-amber-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-black text-xl mb-1">{lesson.title}</p>
                                        <p className="text-slate-400 text-sm font-medium">Download and review the documents below to complete this lesson.</p>
                                    </div>
                                    <div className="w-full space-y-3 mt-4">
                                        {(contentObj.documents || attachments).map((doc, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                                                        <FileText className="w-5 h-5 text-amber-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-white truncate">{doc.name || 'Document'}</p>
                                                        <p className="text-[11px] text-slate-400 font-medium uppercase">{doc.type?.split('/')[1] || 'File'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[11px] font-black uppercase tracking-wider rounded-xl transition-colors">
                                                        View / Download
                                                    </a>
                                                    {isDone ? (
                                                        <div className="px-3 py-2 bg-emerald-500/20 text-emerald-400 text-[11px] font-black rounded-xl flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /></div>
                                                    ) : (
                                                        <button onClick={markComplete} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-[11px] font-black rounded-xl transition-colors">Mark Done</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Non-video lesson placeholder
                            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0a0b14 100%)' }}>
                                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                <div className="relative flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={dg}>
                                        {isQuiz ? <FileQuestion className="w-10 h-10 text-white" />
                                            : isPDF ? <FileText className="w-10 h-10 text-white" />
                                                : <BookOpen className="w-10 h-10 text-white" />}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-black text-lg">{lesson.title}</p>
                                        <p className="text-slate-400 text-sm mt-1 font-medium capitalize">{lesson.type || 'Reading'} Lesson</p>
                                        {!isDone && !isQuiz && (
                                            <button onClick={markComplete} className="mt-5 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm rounded-xl transition-colors flex items-center gap-2 mx-auto">
                                                <CheckCircle className="w-4 h-4" /> Mark Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Video Controls Overlay */}
                        {isVideo && (
                            <div className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)' }}>

                                {/* Center Play/Pause big button */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <button onClick={togglePlay} className="pointer-events-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all hover:scale-110">
                                        {playing ? <Pause className="w-7 h-7 text-white fill-white" /> : <Play className="w-7 h-7 text-white fill-white ml-1" />}
                                    </button>
                                </div>

                                {/* Skip buttons */}
                                <div className="absolute inset-0 flex items-center justify-between px-16 pointer-events-none">
                                    <button onClick={(e) => skip(-10, e)} className="pointer-events-auto w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-all">
                                        <SkipBack className="w-5 h-5 text-white fill-white" />
                                    </button>
                                    <button onClick={(e) => skip(10, e)} className="pointer-events-auto w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-all">
                                        <SkipForward className="w-5 h-5 text-white fill-white" />
                                    </button>
                                </div>

                                {/* Bottom bar */}
                                <div className="px-4 pb-3 space-y-2" onClick={e => e.stopPropagation()}>
                                    {/* Seekbar */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-white/70 font-mono shrink-0">{fmtTime(currentTime)}</span>
                                        <div className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer relative group" onClick={seek}>
                                            <div className="h-full bg-indigo-500 rounded-full pointer-events-none" style={{ width: `${progress}%` }} />
                                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                                style={{ left: `${progress}%` }} />
                                        </div>
                                        <span className="text-[11px] text-white/70 font-mono shrink-0">{fmtTime(duration)}</span>
                                    </div>

                                    {/* Controls row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors">
                                                {playing ? <Pause className="w-4 h-4 text-white fill-white" /> : <Play className="w-4 h-4 text-white fill-white ml-0.5" />}
                                            </button>
                                            <button onClick={() => goToLesson(currentIndex - 1)} disabled={currentIndex === 0}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 disabled:opacity-30 transition-colors">
                                                <ChevronLeft className="w-4 h-4 text-white" />
                                            </button>
                                            <button onClick={() => goToLesson(currentIndex + 1)} disabled={currentIndex === lessons.length - 1}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 disabled:opacity-30 transition-colors">
                                                <ChevronRight className="w-4 h-4 text-white" />
                                            </button>
                                            {/* Volume */}
                                            <div className="flex items-center gap-1">
                                                <button onClick={toggleMute} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors">
                                                    {muted || volume === 0 ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                                                </button>
                                                <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                                                    onChange={e => changeVolume(parseFloat(e.target.value))}
                                                    className="w-16 h-1 accent-indigo-500 cursor-pointer" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={toggleFS} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors">
                                                {fullscreen ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-white" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Completed badge */}
                        {isDone && (
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full">
                                <CheckCircle className="w-3 h-3" /> Completed
                            </div>
                        )}
                    </div>

                    {/* ── Below Video: Tabs ──────────────────────────── */}
                    <div className="flex-1 overflow-y-auto" style={{ background: '#0d0e1c' }}>

                        {/* Quiz score bar */}
                        {quizResult && (
                            <div className={`mx-4 mt-3 px-4 py-3 rounded-2xl flex items-center gap-3 border ${quizResult.passed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                {quizResult.passed ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
                                <span className={`text-sm font-black ${quizResult.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {quizResult.passed ? '🎉' : '😓'} You scored {quizResult.score}% — {quizResult.passed ? 'Passed!' : 'Try again'}
                                </span>
                            </div>
                        )}

                        {/* Tab bar */}
                        <div className="flex border-b border-white/8 px-4 overflow-x-auto" style={{ background: '#11121e' }}>
                            <TabBtn active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabBtn>
                            <TabBtn active={activeTab === 'notes'} onClick={() => setActiveTab('notes')}>Notes</TabBtn>
                            {isQuiz && <TabBtn active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')}>Quiz</TabBtn>}
                            <TabBtn active={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>AI Tools</TabBtn>
                            <TabBtn active={activeTab === 'discussion'} onClick={() => setActiveTab('discussion')}>Discussion</TabBtn>
                            <TabBtn active={activeTab === 'resources'} onClick={() => setActiveTab('resources')}>Resources</TabBtn>
                        </div>

                        <div className="p-4 space-y-4">

                            {/* ── OVERVIEW ────────────────────────────── */}
                            {activeTab === 'overview' && (
                                <div className="space-y-5">
                                    {/* Lesson header */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider
                                                    ${isDone ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                        : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'}`}>
                                                    {isDone ? '✓ Completed' : 'In Progress'}
                                                </span>
                                                <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-slate-400 capitalize">
                                                    {lesson.type || 'video'}
                                                </span>
                                                {lesson.duration > 0 && (
                                                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                                        <Clock className="w-3 h-3" />
                                                        {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-base font-black text-white leading-snug">{lesson.title}</h2>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button onClick={() => setBookmarked(!bookmarked)}
                                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${bookmarked ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                                                {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                            </button>
                                            {!isDone && (
                                                <DBtn onClick={markComplete} className="px-3 py-2 text-[11px] flex items-center gap-1.5">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Mark Done
                                                </DBtn>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lesson description */}
                                    {lessonDesc && (
                                        <div className="p-4 bg-white/4 border border-white/8 rounded-2xl">
                                            <p className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-line">{lessonDesc}</p>
                                        </div>
                                    )}

                                    {/* Prev / Next navigation */}
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => goToLesson(currentIndex - 1)} disabled={currentIndex === 0}
                                            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black text-slate-300 disabled:opacity-30 flex items-center justify-center gap-1.5 transition-all">
                                            <ChevronLeft className="w-4 h-4" /> Previous
                                        </button>
                                        {!isDone ? (
                                            <DBtn onClick={markComplete} className="flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                                                <CheckCircle className="w-3.5 h-3.5" /> Complete & Next
                                            </DBtn>
                                        ) : (
                                            <button onClick={() => goToLesson(currentIndex + 1)} disabled={currentIndex === lessons.length - 1}
                                                className="flex-1 py-2.5 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-1.5 disabled:opacity-30 transition-all hover:opacity-90"
                                                style={dg}>
                                                Next Lesson <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── NOTES ───────────────────────────────── */}
                            {activeTab === 'notes' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <PenLine className="w-4 h-4 text-indigo-400" />
                                        <p className="text-sm font-black text-white">My Notes</p>
                                        <span className="text-[10px] text-slate-400 ml-auto">{lesson.title}</span>
                                    </div>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={8}
                                        placeholder="Write your notes here… (supports markdown)"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none font-medium transition-all"
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-slate-500 font-medium">{notes.length} chars</span>
                                        <DBtn onClick={saveNote} disabled={savingNote || !notes.trim()} className="px-4 py-2 text-xs flex items-center gap-1.5">
                                            {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                                            Save Note
                                        </DBtn>
                                    </div>
                                    {savedNotes[lesson._id] && (
                                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                            <p className="text-[11px] text-emerald-400 font-black flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Note saved for this lesson</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── QUIZ ────────────────────────────────── */}
                            {activeTab === 'quiz' && isQuiz && (
                                <div className="space-y-5">
                                    {loadingQuiz ? (
                                        <div className="flex items-center justify-center py-10">
                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                                        </div>
                                    ) : quiz ? (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-sm font-black text-white">{quiz.title || 'Lesson Quiz'}</h3>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{quiz.questions?.length} questions · {quiz.passingScore || 60}% to pass</p>
                                                </div>
                                                {quizSubmitted && (
                                                    <button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); setQuizResult(null); }}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-white/8 hover:bg-white/15 rounded-xl text-[11px] font-black text-slate-300">
                                                        <RotateCcw className="w-3 h-3" /> Retry
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                {quiz.questions?.map((q, qi) => (
                                                    <div key={qi} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                                                        <p className="text-sm font-bold text-white">{qi + 1}. {q.question}</p>
                                                        <div className="space-y-2">
                                                            {q.options?.map((opt, oi) => {
                                                                const isSelected = quizAnswers[qi] === oi;
                                                                const isCorrect = quizSubmitted && q.correct === oi;
                                                                const isWrong = quizSubmitted && isSelected && q.correct !== oi;
                                                                return (
                                                                    <button key={oi} disabled={quizSubmitted}
                                                                        onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                                                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all
                                                                            ${isCorrect ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                                                                                : isWrong ? 'bg-red-500/15 border-red-500/50 text-red-300'
                                                                                    : isSelected ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300'
                                                                                        : 'bg-white/4 border-white/10 text-slate-300 hover:bg-white/8 hover:border-white/20'}`}>
                                                                        <span className="inline-flex items-center gap-2">
                                                                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-black
                                                                                ${isCorrect ? 'border-emerald-400 bg-emerald-400 text-white'
                                                                                    : isWrong ? 'border-red-400 bg-red-400 text-white'
                                                                                        : isSelected ? 'border-indigo-400 bg-indigo-400 text-white'
                                                                                            : 'border-white/20'}`}>
                                                                                {String.fromCharCode(65 + oi)}
                                                                            </span>
                                                                            {opt}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        {quizSubmitted && q.explanation && (
                                                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mt-2">
                                                                <p className="text-[11px] text-indigo-300 font-medium"><span className="font-black">Explanation: </span>{q.explanation}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {!quizSubmitted && (
                                                <DBtn onClick={submitQuiz}
                                                    disabled={Object.keys(quizAnswers).length < (quiz.questions?.length || 0)}
                                                    className="w-full py-3 text-sm flex items-center justify-center gap-2">
                                                    <ListChecks className="w-4 h-4" /> Submit Quiz
                                                </DBtn>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-10">
                                            <FileQuestion className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                                            <p className="text-slate-400 text-sm font-medium">No quiz for this lesson</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── AI TOOLS ────────────────────────────── */}
                            {activeTab === 'ai' && (
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2.5 p-4 rounded-2xl relative overflow-hidden"
                                        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
                                        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                                        <div className="relative w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                                            <Brain className="w-5 h-5 text-indigo-200" />
                                        </div>
                                        <div className="relative">
                                            <p className="text-sm font-black text-white">AI Study Tools</p>
                                            <p className="text-[11px] text-indigo-300 font-medium">Powered by Sapience AI</p>
                                        </div>
                                    </div>

                                    {/* Tool buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { type: 'summarize', label: 'Summarize', desc: 'Quick summary', icon: Sparkles, color: '#7c3aed' },
                                            { type: 'explain', label: 'Explain', desc: 'Deep explanation', icon: Target, color: '#0891b2' },
                                            { type: 'practice', label: 'Practice', desc: 'MCQ questions', icon: ListChecks, color: '#059669' },
                                            { type: 'revision', label: 'Revision', desc: 'Revision notes', icon: FileText, color: '#d97706' },
                                        ].map(tool => (
                                            <button key={tool.type} onClick={() => handleAI(tool.type)} disabled={!!aiLoading}
                                                className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-left transition-all disabled:opacity-50 group">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: tool.color + '33' }}>
                                                    {aiLoading === tool.type
                                                        ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: tool.color }} />
                                                        : <tool.icon className="w-4 h-4" style={{ color: tool.color }} />}
                                                </div>
                                                <p className="text-xs font-black text-white">{tool.label}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{tool.desc}</p>
                                            </button>
                                        ))}
                                    </div>

                                    {/* AI Result */}
                                    {aiContent && (
                                        <div className="p-4 bg-indigo-500/8 border border-indigo-500/20 rounded-2xl space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.06em] flex items-center gap-1.5">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    {aiType === 'summarize' ? 'Summary' : aiType === 'explain' ? 'Explanation' : aiType === 'practice' ? 'Practice Qs' : 'Revision Notes'}
                                                </p>
                                                <button onClick={() => setAiContent(null)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
                                            </div>
                                            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">{typeof aiContent === 'string' ? aiContent : JSON.stringify(aiContent, null, 2)}</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── DISCUSSION ─────────────────────────── */}
                            {activeTab === 'discussion' && (
                                <div className="space-y-4">
                                    {/* Comment form */}
                                    <form onSubmit={handlePostComment} className="space-y-2">
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-black" style={dg}>
                                                {currentUser?.name?.[0] || 'U'}
                                            </div>
                                            <textarea
                                                value={commentText}
                                                onChange={e => setCommentText(e.target.value)}
                                                placeholder="Add a comment…"
                                                rows={2}
                                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none font-medium transition-all"
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <DBtn type="submit" disabled={!commentText.trim()} className="px-4 py-2 text-xs flex items-center gap-1.5">
                                                <Send className="w-3.5 h-3.5" /> Post
                                            </DBtn>
                                        </div>
                                    </form>

                                    {/* Comments list */}
                                    {loadingComments ? (
                                        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>
                                    ) : comments.length > 0 ? (
                                        <div className="space-y-3">
                                            {comments.map(c => {
                                                const avatarUrl = getCommentAvatar(c);
                                                const authorName = getCommentAuthorName(c);
                                                const moderationStatus = String(c.moderationStatus || 'visible').toLowerCase();
                                                const hasTutorReply = Boolean(c.tutorReply?.text && c.tutorReply.text.trim());
                                                const showDelete = isOwnComment(c);

                                                return (
                                                    <div key={c._id} className="flex gap-3 group p-3 bg-white/4 border border-white/8 rounded-2xl">
                                                        <div className="w-8 h-8 rounded-xl shrink-0 overflow-hidden border border-white/10">
                                                            {avatarUrl
                                                                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                                                : <div className="w-full h-full flex items-center justify-center text-xs font-black text-white bg-slate-700">{authorName[0] || '?'}</div>}
                                                        </div>
                                                        <div className="flex-1 min-w-0 space-y-2">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-black text-white">{authorName}</span>
                                                                <span className="text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleString()}</span>
                                                                {moderationStatus !== 'visible' && (
                                                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wide font-black border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                                                                        {moderationStatus}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">{c.text}</p>

                                                            {hasTutorReply && (
                                                                <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5">
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.06em] text-indigo-300">Tutor Reply</p>
                                                                    <p className="text-xs text-slate-200 font-medium mt-1 whitespace-pre-wrap">{c.tutorReply.text}</p>
                                                                    {c.tutorReply?.repliedAt && (
                                                                        <p className="text-[10px] text-slate-500 mt-1">{new Date(c.tutorReply.repliedAt).toLocaleString()}</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {showDelete && (
                                                            <button onClick={() => handleDeleteComment(c._id)}
                                                                className="opacity-0 group-hover:opacity-100 w-6 h-6 text-red-400 hover:bg-red-500/15 rounded-lg flex items-center justify-center transition-all shrink-0">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                            <p className="text-slate-500 text-sm font-medium">No comments yet. Start the discussion!</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── RESOURCES ───────────────────────────── */}
                            {activeTab === 'resources' && (
                                <div className="space-y-3">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.06em]">Lesson Resources</p>
                                    {attachments?.length > 0 ? attachments.map((r, i) => (
                                        <a key={i} href={r.url} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-3 p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                                            <div className="w-9 h-9 bg-indigo-500/15 rounded-xl flex items-center justify-center shrink-0">
                                                <FileText className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{r.name || r.url}</p>
                                                <p className="text-[10px] text-slate-400 font-medium capitalize">{r.type || 'PDF'}</p>
                                            </div>
                                            <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                        </a>
                                    )) : (
                                        <div className="text-center py-10">
                                            <Download className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                            <p className="text-slate-500 text-sm font-medium">No resources for this lesson</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Lesson Sidebar ─────────────────────────── */}
                {sidebarOpen && (
                    <div className="w-80 xl:w-96 flex flex-col border-l border-white/8 shrink-0" style={{ background: '#11121e' }}>

                        {/* Sidebar header */}
                        <div className="px-4 py-3.5 border-b border-white/8 shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-black text-white uppercase tracking-[0.06em]">Course Content</p>
                                <button onClick={() => setSidebarOpen(false)} className="w-6 h-6 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-slate-400 transition-colors">
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            {/* Overall progress bar */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 font-medium">{completedIds.length} of {lessons.length} completed</span>
                                    <span className="text-[10px] font-black text-indigo-400">{Math.round((completedIds.length / lessons.length) * 100)}%</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all"
                                        style={{ width: `${(completedIds.length / lessons.length) * 100}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Lesson list */}
                        <div className="flex-1 overflow-y-auto">
                            {modules && modules.length > 0 ? (
                                modules.map((mod, mi) => {
                                    const mLessons = getLessonsByModule(mod._id);
                                    const isExp = expandedModules.includes(mod._id);
                                    const mDone = mLessons.filter(l => isLessonDone(l)).length;
                                    return (
                                        <div key={mod._id}>
                                            {/* Module header */}
                                            <button onClick={() => setExpandedMods(prev => isExp ? prev.filter(id => id !== mod._id) : [...prev, mod._id])}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 border-b border-white/5 transition-colors">
                                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isExp ? '' : '-rotate-90'}`} />
                                                <div className="flex-1 min-w-0 text-left">
                                                    <p className="text-xs font-black text-white truncate">{mod.title}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{mDone}/{mLessons.length} done</p>
                                                </div>
                                                {mDone === mLessons.length && mLessons.length > 0 && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                                            </button>
                                            {/* Module lessons */}
                                            {isExp && mLessons.map((l, li) => {
                                                const isAct = l._id === lesson._id;
                                                const done = isLessonDone(l);
                                                return (
                                                    <button key={l._id} onClick={() => goToLesson(lessons.findIndex(x => x._id === l._id))}
                                                        className={`w-full flex items-start gap-3 px-4 py-3 border-b border-white/5 transition-all text-left
                                                            ${isAct ? 'bg-indigo-500/15 border-l-2 border-l-indigo-500' : 'hover:bg-white/5'}`}>
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${done ? 'bg-emerald-500/20' : isAct ? 'bg-indigo-500/20' : 'bg-white/8'}`}>
                                                            {done ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                                                : l.type === 'quiz' ? <FileQuestion className="w-3 h-3 text-amber-400" />
                                                                    : l.type === 'pdf' ? <FileText className="w-3 h-3 text-slate-400" />
                                                                        : isAct ? <Play className="w-3 h-3 text-indigo-400 fill-indigo-400 ml-0.5" />
                                                                            : <Play className="w-3 h-3 text-slate-500 fill-slate-500 ml-0.5" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-bold leading-snug truncate ${isAct ? 'text-indigo-300' : done ? 'text-slate-400' : 'text-slate-200'}`}>{l.title}</p>
                                                            {l.duration > 0 && <p className="text-[10px] text-slate-500 font-medium mt-0.5">{Math.floor(l.duration / 60)}:{String(l.duration % 60).padStart(2, '0')}</p>}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                            ) : (
                                // Flat list (no modules)
                                lessons.map((l, li) => {
                                    const isAct = l._id === lesson._id;
                                    const done = isLessonDone(l);
                                    return (
                                        <button key={l._id} onClick={() => goToLesson(li)}
                                            className={`w-full flex items-start gap-3 px-4 py-3 border-b border-white/5 transition-all text-left
                                                ${isAct ? 'bg-indigo-500/15 border-l-2 border-l-indigo-500' : 'hover:bg-white/5'}`}>
                                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5
                                                ${done ? 'bg-emerald-500/20 text-emerald-400' : isAct ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/8 text-slate-500'}`}>
                                                {done ? <CheckCircle className="w-3.5 h-3.5" /> : li + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-bold leading-snug ${isAct ? 'text-indigo-300' : done ? 'text-slate-400 line-through decoration-slate-600' : 'text-slate-200'}`}>{l.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[10px] font-medium capitalize ${l.type === 'quiz' ? 'text-amber-400' : l.type === 'pdf' ? 'text-blue-400' : 'text-slate-500'}`}>
                                                        {l.type || 'video'}
                                                    </span>
                                                    {l.duration > 0 && <span className="text-[10px] text-slate-600 font-medium">{Math.floor(l.duration / 60)}:{String(l.duration % 60).padStart(2, '0')}</span>}
                                                </div>
                                            </div>
                                            {isAct && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-2" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Keyboard hint */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 border-t border-white/5 shrink-0" style={{ background: '#0a0b14' }}>
                {[['Space', 'Play/Pause'], ['←/→', '±10s'], ['F', 'Fullscreen'], ['Esc', 'Close']].map(([k, v]) => (
                    <span key={k} className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                        <kbd className="px-1.5 py-0.5 bg-white/8 rounded-md font-black text-slate-400 text-[10px]">{k}</kbd>
                        {v}
                    </span>
                ))}
            </div>
        </div>
    );
}
