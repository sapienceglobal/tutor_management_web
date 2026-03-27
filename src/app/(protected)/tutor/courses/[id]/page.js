'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Plus, Loader2, Video, FileText, MoreVertical, GripVertical,
    Eye, Settings, Trash2, Edit3, Clock, PlayCircle, Lock, Check, X, Save,
    Sparkles, Globe, EyeOff, ClipboardList, Megaphone, BellRing, Award,
    ExternalLink, Users, Upload, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R, FX, cx, pageStyle } from '@/constants/tutorTokens';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        published: { label: '● Published',        bg: C.successBg,  color: C.success, border: C.successBorder },
        pending:   { label: '● Pending Approval',  bg: C.warningBg,  color: C.warning, border: C.warningBorder },
        rejected:  { label: '● Rejected',          bg: C.dangerBg,   color: C.danger,  border: C.dangerBorder },
    };
    const s = map[status] || { label: '● Draft', bg: FX.primary12, color: C.btnPrimary, border: FX.primary20 };
    return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border"
            style={{ backgroundColor: s.bg, color: s.color, borderColor: s.border, fontFamily: T.fontFamily }}>
            {s.label}
        </span>
    );
}

// ─── Modal section label ───────────────────────────────────────────────────────
function ModalLabel({ children }) {
    return (
        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>
            {children}
        </label>
    );
}

export default function ManageCoursePage({ params }) {
    const router = useRouter();
    const { id }  = use(params);

    const [course, setCourse]           = useState(null);
    const [lessons, setLessons]         = useState([]);
    const [courseExams, setCourseExams] = useState([]);
    const [loading, setLoading]         = useState(true);

    const [isModuleModalOpen,   setIsModuleModalOpen]   = useState(false);
    const [isLessonModalOpen,   setIsLessonModalOpen]   = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const [activeTab, setActiveTab]         = useState('curriculum');
    const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' });

    const [settingsForm, setSettingsForm] = useState({
        title: '', description: '', visibility: 'institute', price: 0,
        level: 'beginner', language: 'English',
        whatYouWillLearn: [''], requirements: ['']
    });

    const [currentModuleId,      setCurrentModuleId]      = useState(null);
    const [moduleTitle,          setModuleTitle]          = useState('');
    const [lessonForm, setLessonForm] = useState({
        title: '', description: '', videoUrl: '', duration: '', isFree: false,
        type: 'video', attachments: [], documents: [],
        quiz: { passingScore: 70, timeLimit: '', questions: [] }
    });

    const [submitting,          setSubmitting]          = useState(false);
    const [editingModuleId,     setEditingModuleId]     = useState(null);
    const [editingModuleTitle,  setEditingModuleTitle]  = useState('');
    const [editingLessonId,     setEditingLessonId]     = useState(null);
    const [publishing,          setPublishing]          = useState(false);
    const [isUploadingVideo,    setIsUploadingVideo]    = useState(false);
    const { confirmDialog }                             = useConfirm();

    // ── Shared modal input style ────────────────────────────────────────────
    const inp = { ...cx.input(), width: '100%', padding: '10px 14px' };
    const inpFocus = cx.inputFocus;

    const applyFocus = (e) => Object.assign(e.target.style, inpFocus);
    const removeFocus = (e) => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; };

    // ── Data ────────────────────────────────────────────────────────────────
    const loadCourseData = async () => {
        try {
            setLoading(true);
            const [courseRes, lessonsRes] = await Promise.all([
                api.get(`/courses/${id}`),
                api.get(`/lessons/course/${id}`)
            ]);
            if (courseRes.data.success)  setCourse(courseRes.data.course);
            if (lessonsRes.data.success) setLessons(lessonsRes.data.lessons);
            try {
                const examsRes = await api.get(`/exams/course/${id}`);
                if (examsRes.data.success) setCourseExams(examsRes.data.exams || []);
            } catch { /* no exams */ }
        } catch (error) {
            console.error('Error loading course:', error);
            if ([403, 404].includes(error.response?.status)) router.push('/tutor/courses');
        } finally { setLoading(false); }
    };

    useEffect(() => { loadCourseData(); }, [id]);

    // ── Publish ──────────────────────────────────────────────────────────────
    const handlePublishToggle = async () => {
        const ok = await confirmDialog('Change Publish Status',
            `Are you sure you want to ${course.status === 'published' ? 'unpublish' : 'publish'} this course?`);
        if (!ok) return;
        setPublishing(true);
        try {
            const newStatus = course.status === 'published' ? 'draft' : 'published';
            const res = await api.patch(`/courses/${id}`, { status: newStatus });
            const updated = res.data.course.status;
            setCourse(prev => ({ ...prev, status: updated }));
            toast.success(updated === 'pending' ? 'Course submitted for Admin Approval' : `Course ${updated} successfully`);
        } catch { toast.error('Failed to update course status'); }
        finally { setPublishing(false); }
    };

    // ── Settings ─────────────────────────────────────────────────────────────
    const openSettingsModal = () => {
        setSettingsForm({
            title: course.title || '', description: course.description || '',
            visibility: course.visibility || 'institute', price: course.price || 0,
            level: course.level || 'beginner', language: course.language || 'English',
            whatYouWillLearn: course.whatYouWillLearn?.length ? [...course.whatYouWillLearn] : [''],
            requirements: course.requirements?.length ? [...course.requirements] : ['']
        });
        setIsSettingsModalOpen(true);
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault(); setSubmitting(true);
        try {
            const res = await api.patch(`/courses/${id}`, {
                title: settingsForm.title, description: settingsForm.description,
                visibility: settingsForm.visibility, price: Number(settingsForm.price),
                level: settingsForm.level, language: settingsForm.language,
                whatYouWillLearn: settingsForm.whatYouWillLearn.filter(i => i.trim()),
                requirements: settingsForm.requirements.filter(i => i.trim())
            });
            if (res.data.success) { setCourse(res.data.course); toast.success('Course settings updated'); setIsSettingsModalOpen(false); }
        } catch { toast.error('Failed to update settings'); }
        finally { setSubmitting(false); }
    };

    // ── Modules ──────────────────────────────────────────────────────────────
    const handleCreateModule = async (e) => {
        e.preventDefault(); if (!moduleTitle.trim()) return;
        setSubmitting(true);
        try {
            const updatedModules = [...(course.modules || []), { title: moduleTitle }];
            await api.patch(`/courses/${id}`, { modules: updatedModules });
            const res = await api.get(`/courses/${id}`);
            if (res.data.success) setCourse(res.data.course);
            setIsModuleModalOpen(false); setModuleTitle('');
            toast.success('Module created');
        } catch { toast.error('Failed to create module'); }
        finally { setSubmitting(false); }
    };

    const saveModuleEdit = async () => {
        try {
            const updatedModules = course.modules.map(m => m._id === editingModuleId ? { ...m, title: editingModuleTitle } : m);
            await api.patch(`/courses/${id}`, { modules: updatedModules });
            const res = await api.get(`/courses/${id}`);
            if (res.data.success) setCourse(res.data.course);
            setEditingModuleId(null); toast.success('Module updated');
        } catch { toast.error('Failed to update module'); }
    };

    const deleteModule = async (moduleId) => {
        const ok = await confirmDialog('Delete Module', 'Delete this module? Lessons will be unlinked.', { variant: 'destructive' });
        if (!ok) return;
        try {
            await api.patch(`/courses/${id}`, { modules: course.modules.filter(m => m._id !== moduleId) });
            const res = await api.get(`/courses/${id}`);
            if (res.data.success) setCourse(res.data.course);
            toast.success('Module deleted');
        } catch { toast.error('Failed to delete module'); }
    };

    // ── Announcements ─────────────────────────────────────────────────────────
    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        if (!announcementForm.title.trim() || !announcementForm.message.trim()) return toast.error('Please provide both title and message');
        setSubmitting(true);
        try {
            const res = await api.post(`/courses/${id}/announcements`, announcementForm);
            if (res.data.success) {
                setCourse(prev => ({ ...prev, announcements: res.data.announcements }));
                setAnnouncementForm({ title: '', message: '' });
                toast.success('Announcement posted successfully');
            }
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to post announcement'); }
        finally { setSubmitting(false); }
    };

    // ── Lessons ───────────────────────────────────────────────────────────────
    const openLessonModal = (moduleId, lesson = null) => {
        setCurrentModuleId(moduleId);
        if (lesson) {
            setEditingLessonId(lesson._id);
            setLessonForm({
                type: lesson.type || 'video', title: lesson.title, description: lesson.description || '',
                videoUrl: lesson.content?.videoUrl || '',
                duration: Math.round((lesson.content?.duration || 0) / 60).toString(),
                documents: lesson.content?.documents || [],
                quiz: lesson.content?.quiz || { passingScore: 70, timeLimit: '', questions: [] },
                isFree: lesson.isFree, attachments: lesson.content?.attachments || []
            });
        } else {
            setEditingLessonId(null);
            setLessonForm({ type: 'video', title: '', description: '', videoUrl: '', duration: '',
                documents: [], quiz: { passingScore: 70, timeLimit: '', questions: [] }, isFree: false, attachments: [] });
        }
        setIsLessonModalOpen(true);
    };

    const handleSaveLesson = async (e) => {
        e.preventDefault();
        if (!lessonForm.title || !currentModuleId) return;
        setSubmitting(true);
        try {
            let attachments = Array.isArray(lessonForm.attachments) ? lessonForm.attachments : [];
            const content = { attachments };
            if (lessonForm.type === 'video') { content.videoUrl = lessonForm.videoUrl; content.duration = Number(lessonForm.duration) * 60; }
            else if (lessonForm.type === 'document') { content.documents = lessonForm.documents; content.duration = Number(lessonForm.duration) * 60 || 0; }
            else if (lessonForm.type === 'quiz') { content.quiz = { ...lessonForm.quiz, timeLimit: lessonForm.quiz.timeLimit ? Number(lessonForm.quiz.timeLimit) : null }; content.duration = Number(lessonForm.duration) * 60 || 0; }

            if (editingLessonId) {
                await api.patch(`/lessons/${editingLessonId}`, { title: lessonForm.title, description: lessonForm.description, type: lessonForm.type, content, isFree: lessonForm.isFree });
            } else {
                await api.post('/lessons', { courseId: id, moduleId: currentModuleId, title: lessonForm.title, description: lessonForm.description, type: lessonForm.type, content, isFree: lessonForm.isFree });
            }
            const res = await api.get(`/lessons/course/${id}`);
            if (res.data.success) setLessons(res.data.lessons);
            setIsLessonModalOpen(false); setEditingLessonId(null);
            toast.success(editingLessonId ? 'Lesson updated' : 'Lesson added');
        } catch { toast.error('Failed to save lesson'); }
        finally { setSubmitting(false); }
    };

    const deleteLesson = async (lessonId) => {
        const ok = await confirmDialog('Delete Lesson', 'Delete this lesson? This action cannot be undone.', { variant: 'destructive' });
        if (!ok) return;
        try {
            await api.delete(`/lessons/${lessonId}`);
            setLessons(prev => prev.filter(l => l._id !== lessonId));
            toast.success('Lesson deleted');
        } catch { toast.error('Failed to delete lesson'); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const fd = new FormData(); fd.append('file', file);
        try {
            const res = await api.post('/upload/file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) {
                setLessonForm(prev => ({ ...prev, attachments: [...prev.attachments, { name: res.data.name, url: res.data.fileUrl, type: res.data.type }] }));
                toast.success('File uploaded');
            }
        } catch { toast.error('Failed to upload file'); }
    };

    const handleDocumentUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const fd = new FormData(); fd.append('file', file);
        try {
            const res = await api.post('/upload/file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) {
                setLessonForm(prev => ({ ...prev, documents: [...prev.documents, { name: res.data.name, url: res.data.fileUrl, type: res.data.type }] }));
                toast.success('Document uploaded');
            }
        } catch { toast.error('Failed to upload document'); }
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const resolveUrl = (raw) => {
            if (!raw) return '';
            if (/^https?:\/\//i.test(raw)) return raw;
            const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/api\/?$/, '').replace(/\/+$/, '');
            return base ? `${base}${raw.startsWith('/') ? '' : '/'}${raw}` : raw;
        };
        const fd = new FormData(); fd.append('video', file);
        setIsUploadingVideo(true);
        try {
            const res = await api.post('/upload/video-hls', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) { setLessonForm(prev => ({ ...prev, videoUrl: resolveUrl(res.data.estimatedPlaylistUrl) })); toast.success('Video uploaded and is processing for HLS!'); }
        } catch (error) {
            const msg = error.response?.data?.message || '';
            if (error.response?.status === 403 && /(hls|feature|subscription)/i.test(msg)) {
                try {
                    const fd2 = new FormData(); fd2.append('file', file);
                    const fb = await api.post('/upload/file', fd2, { headers: { 'Content-Type': 'multipart/form-data' } });
                    if (fb.data.success) { setLessonForm(prev => ({ ...prev, videoUrl: fb.data.fileUrl })); toast.success('Video uploaded (standard mode).'); return; }
                } catch { /* ignore */ }
            }
            toast.error(msg || 'Failed to upload video');
        } finally { setIsUploadingVideo(false); }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                style={{ borderColor: FX.primary25Transparent, borderTopColor: C.btnPrimary }} />
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>Loading course…</p>
        </div>
    );
    if (!course) return null;

    const totalLessons  = lessons.length;
    const totalDuration = lessons.reduce((a, l) => a + (l.duration || 0), 0);

    const TABS = [
        { key: 'curriculum',    icon: FileText,  label: 'Curriculum' },
        { key: 'exams',         icon: Award,     label: `Exams (${courseExams.length})` },
        { key: 'announcements', icon: Megaphone, label: 'Announcements' },
    ];

    // ── Reusable modal cancel button ─────────────────────────────────────────
    const CancelBtn = ({ onClick }) => (
        <button type="button" onClick={onClick}
            className="flex-1 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
            style={cx.btnSecondary()}>
            Cancel
        </button>
    );

    return (
        <div className="space-y-5" style={pageStyle}>

            {/* ── Page Header ───────────────────────────────────────────── */}
            <div className="rounded-2xl p-5"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-start gap-3">
                    <button onClick={() => router.push('/tutor/courses')}
                        className="mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                        style={{ backgroundColor: C.innerBg, color: C.textMuted }}>
                        <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                            <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }} className="truncate">
                                {course.title}
                            </h1>
                            <StatusBadge status={course.status} />
                        </div>
                        <div className="flex items-center gap-4 flex-wrap"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            <span className="flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5" /> {totalLessons} lessons</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.round(totalDuration / 3600)} hrs</span>
                            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {course.modules?.length || 0} modules</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap flex-shrink-0">
                        <button onClick={handlePublishToggle} disabled={publishing}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all hover:opacity-80"
                            style={course.status === 'published' || course.status === 'pending'
                                ? { backgroundColor: C.warningBg, color: C.warning, borderColor: C.warningBorder }
                                : { backgroundColor: C.successBg, color: C.success, borderColor: C.successBorder }}>
                            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : course.status === 'published' || course.status === 'pending'
                                    ? <EyeOff className="w-3.5 h-3.5" />
                                    : <Globe className="w-3.5 h-3.5" />}
                            {course.status === 'published' || course.status === 'pending' ? 'Unpublish' : course.status === 'rejected' ? 'Resubmit' : 'Publish'}
                        </button>
                        <button onClick={() => router.push(`/tutor/courses/${id}/assignments`)}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all hover:opacity-80"
                            style={cx.btnSecondary()}>
                            <ClipboardList className="w-3.5 h-3.5" /> Assignments
                        </button>
                        <button onClick={openSettingsModal}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all hover:opacity-80"
                            style={cx.btnSecondary()}>
                            <Settings className="w-3.5 h-3.5" /> Settings
                        </button>
                        <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white transition-all hover:opacity-90"
                            style={{ backgroundColor: C.btnPrimary }}>
                            <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <div className="flex px-2 rounded-t-2xl"
                style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.surfaceWhite }}>
                {TABS.map(({ key, icon: Icon, label }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className="flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all"
                        style={activeTab === key
                            ? { borderBottomColor: C.btnPrimary, color: C.btnPrimary, fontFamily: T.fontFamily }
                            : { borderBottomColor: 'transparent', color: C.textMuted, fontFamily: T.fontFamily }}>
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </div>

            {/* ── Curriculum Tab ────────────────────────────────────────── */}
            {activeTab === 'curriculum' && (
                <div className="rounded-b-2xl rounded-tr-2xl overflow-hidden -mt-px"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>

                    {/* Curriculum header */}
                    <div className="px-6 py-4 flex items-center justify-between"
                        style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: FX.primary05 }}>
                        <div>
                            <h2 className="flex items-center gap-2"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                <Sparkles className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                Course Curriculum
                            </h2>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 2 }}>
                                Organize your lessons into modules
                            </p>
                        </div>
                        <button onClick={() => setIsModuleModalOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-all hover:opacity-90"
                            style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily }}>
                            <Plus className="w-4 h-4" /> Add Module
                        </button>
                    </div>

                    <div className="p-6">
                        {course.modules?.length > 0 ? (
                            <div className="space-y-4">
                                {course.modules.map((module, index) => {
                                    const moduleLessons  = lessons.filter(l => l.moduleId === module._id);
                                    const moduleDuration = moduleLessons.reduce((a, l) => a + (l.content?.duration || 0), 0);
                                    const isEditing      = editingModuleId === module._id;

                                    return (
                                        <div key={module._id}
                                            className="group rounded-2xl transition-all duration-200 hover:shadow-md"
                                            style={{ border: `1px solid ${C.cardBorder}` }}>

                                            {/* Module header */}
                                            <div className="px-5 py-4 rounded-t-2xl"
                                                style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <button className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                            <GripVertical className="w-4 h-4" style={{ color: C.textMuted }} />
                                                        </button>
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <input type="text" value={editingModuleTitle}
                                                                    onChange={e => setEditingModuleTitle(e.target.value)}
                                                                    style={{ ...inp, height: 36, flex: 1 }}
                                                                    onFocus={applyFocus} onBlur={removeFocus}
                                                                    autoFocus />
                                                                <button onClick={saveModuleEdit}
                                                                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                                                    style={{ backgroundColor: C.successBg }}>
                                                                    <Check className="w-4 h-4" style={{ color: C.success }} />
                                                                </button>
                                                                <button onClick={() => setEditingModuleId(null)}
                                                                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                                                    style={{ backgroundColor: C.innerBg }}>
                                                                    <X className="w-4 h-4" style={{ color: C.textMuted }} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0"
                                                                        style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite }}>
                                                                        {index + 1}
                                                                    </span>
                                                                    <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                                        {module.title}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-0.5 pl-7"
                                                                    style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted }}>
                                                                    <span>{moduleLessons.length} lessons</span>
                                                                    <span>·</span>
                                                                    <span>{Math.round(moduleDuration / 60)} mins</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!isEditing && (
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <button onClick={() => openLessonModal(module._id)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all hover:opacity-80"
                                                                style={{ color: C.btnPrimary, borderColor: FX.primary25, backgroundColor: FX.primary08 }}>
                                                                <Plus className="w-3 h-3" /> Lesson
                                                            </button>
                                                            {/* Module menu */}
                                                            <div className="relative group/menu">
                                                                <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                                                    style={{ backgroundColor: C.innerBg }}>
                                                                    <MoreVertical className="w-4 h-4" style={{ color: C.textMuted }} />
                                                                </button>
                                                                <div className="absolute right-0 mt-1 w-40 rounded-2xl shadow-lg py-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10"
                                                                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                                                                    <button onClick={() => { setEditingModuleId(module._id); setEditingModuleTitle(module.title); }}
                                                                        className="w-full px-3.5 py-2 text-sm text-left flex items-center gap-2 hover:opacity-70 transition-all"
                                                                        style={{ fontFamily: T.fontFamily, color: C.text }}>
                                                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                                                    </button>
                                                                    <button onClick={() => deleteModule(module._id)}
                                                                        className="w-full px-3.5 py-2 text-sm text-left flex items-center gap-2 hover:opacity-70 transition-all"
                                                                        style={{ fontFamily: T.fontFamily, color: C.danger }}>
                                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Lessons */}
                                            <div className="p-4">
                                                {moduleLessons.length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {moduleLessons.map((lesson, idx) => (
                                                            <div key={lesson._id}
                                                                className="group/lesson flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent transition-all"
                                                                onMouseEnter={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.backgroundColor = C.innerBg; }}
                                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                                <div className="w-8 h-8 rounded-xl text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                                    style={{ background: C.gradientBtn }}>
                                                                    {idx + 1}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }}>
                                                                            {lesson.title}
                                                                        </p>
                                                                        {lesson.isFree && (
                                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wide flex-shrink-0"
                                                                                style={{ backgroundColor: C.successBg, color: C.success, borderColor: C.successBorder, fontFamily: T.fontFamily }}>
                                                                                FREE
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2"
                                                                        style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted }}>
                                                                        {lesson.type === 'document' ? <FileText className="w-3 h-3" style={{ color: C.warning }} />
                                                                            : lesson.type === 'quiz' ? <AlertCircle className="w-3 h-3" style={{ color: C.btnPrimary }} />
                                                                            : <Video className="w-3 h-3" style={{ color: C.chartLine }} />}
                                                                        <span className="capitalize">{lesson.type || 'video'}</span>
                                                                        <span>·</span>
                                                                        <Clock className="w-3 h-3" />
                                                                        <span>{lesson.type === 'quiz'
                                                                            ? (lesson.content?.quiz?.timeLimit ? `${lesson.content.quiz.timeLimit} mins` : 'No Limit')
                                                                            : `${Math.round((lesson.content?.duration || 0) / 60)} mins`}</span>
                                                                    </div>
                                                                </div>
                                                                {/* Lesson actions */}
                                                                <div className="flex items-center gap-1 opacity-0 group-hover/lesson:opacity-100 transition-opacity flex-shrink-0">
                                                                    {lesson.type === 'quiz' && (
                                                                        <button onClick={() => router.push(`/tutor/courses/${id}/modules/${module._id}/lessons/${lesson._id}/quiz`)}
                                                                            className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                                                            style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary25}` }}
                                                                            title="Manage Quiz Questions">
                                                                            <FileText className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => openLessonModal(module._id, lesson)}
                                                                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                                                        style={{ backgroundColor: C.innerBg }}>
                                                                        <Edit3 className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
                                                                    </button>
                                                                    <button onClick={() => deleteLesson(lesson._id)}
                                                                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                                                        style={{ backgroundColor: C.dangerBg }}>
                                                                        <Trash2 className="w-3.5 h-3.5" style={{ color: C.danger }} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-10 rounded-2xl border-2 border-dashed"
                                                        style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                                                            style={{ backgroundColor: FX.primary10 }}>
                                                            <Video className="w-5 h-5" style={{ color: C.btnPrimary }} />
                                                        </div>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, marginBottom: 4 }}>
                                                            No lessons yet
                                                        </p>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginBottom: 12 }}>
                                                            Add your first lesson to this module
                                                        </p>
                                                        <button onClick={() => openLessonModal(module._id)}
                                                            className="px-4 py-2 text-xs font-semibold rounded-xl transition-all hover:opacity-80"
                                                            style={{ backgroundColor: FX.primary12, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                                                            <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Lesson
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                    style={{ backgroundColor: FX.primary10, border: `1px solid ${FX.primary20}` }}>
                                    <FileText className="w-7 h-7" style={{ color: C.btnPrimary }} />
                                </div>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, marginBottom: 4 }}>
                                    Start Building Your Course
                                </h3>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, maxWidth: 320, margin: '0 auto 20px' }}>
                                    Create your first module to organize your lessons.
                                </p>
                                <button onClick={() => setIsModuleModalOpen(true)}
                                    className="px-5 py-2.5 text-sm font-semibold rounded-xl inline-flex items-center gap-2 hover:opacity-90"
                                    style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily }}>
                                    <Plus className="w-4 h-4" /> Create First Module
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Announcements Tab ─────────────────────────────────────── */}
            {activeTab === 'announcements' && (
                <div className="space-y-4 -mt-px">
                    <div className="rounded-2xl p-6 max-w-2xl"
                        style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h3 className="flex items-center gap-2 mb-4"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                            <div className="w-6 h-6 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: FX.primary12 }}>
                                <BellRing className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                            </div>
                            Create Announcement
                        </h3>
                        <form onSubmit={handlePostAnnouncement} className="space-y-4">
                            <div>
                                <ModalLabel>Title</ModalLabel>
                                <input type="text" value={announcementForm.title} required
                                    onChange={e => setAnnouncementForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="e.g. 'Midterm Exam Materials Uploaded'"
                                    style={inp} onFocus={applyFocus} onBlur={removeFocus} />
                            </div>
                            <div>
                                <ModalLabel>Message</ModalLabel>
                                <textarea value={announcementForm.message} required rows={4}
                                    onChange={e => setAnnouncementForm(p => ({ ...p, message: e.target.value }))}
                                    placeholder="Write your announcement message here..."
                                    style={{ ...inp, resize: 'none' }}
                                    onFocus={applyFocus} onBlur={removeFocus} />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={submitting}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-60 hover:opacity-90"
                                    style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily }}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                                    Post Announcement
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* History */}
                    <div className="rounded-2xl overflow-hidden max-w-2xl"
                        style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                Previous Announcements
                            </h3>
                        </div>
                        <div>
                            {course.announcements?.length > 0
                                ? [...course.announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((ann, idx) => (
                                    <div key={idx} className="p-5 transition-all"
                                        style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        <div className="flex items-start justify-between gap-3 mb-1.5">
                                            <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }}>
                                                {ann.title}
                                            </h4>
                                            <span className="text-[10px] px-2 py-1 rounded-xl whitespace-nowrap flex-shrink-0"
                                                style={{ fontFamily: T.fontFamily, color: C.textMuted, backgroundColor: C.innerBg }}>
                                                {new Date(ann.createdAt).toLocaleDateString()} {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, whiteSpace: 'pre-wrap' }}>
                                            {ann.message}
                                        </p>
                                    </div>
                                ))
                                : (
                                    <div className="p-12 text-center">
                                        <Megaphone className="w-10 h-10 mx-auto mb-2" style={{ color: C.cardBorder }} />
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                                            No announcements yet.
                                        </p>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Exams Tab ─────────────────────────────────────────────── */}
            {activeTab === 'exams' && (
                <div className="rounded-b-2xl overflow-hidden -mt-px"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                    <div className="px-6 py-4 flex items-center justify-between"
                        style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: FX.primary05 }}>
                        <div>
                            <h2 className="flex items-center gap-2"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                <Award className="w-4 h-4" style={{ color: C.btnPrimary }} /> Course Exams
                            </h2>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 2 }}>
                                Exams linked to this course
                            </p>
                        </div>
                        <Link href={`/tutor/quizzes/create?courseId=${id}&courseTitle=${encodeURIComponent(course.title)}`}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
                            style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily }}>
                            <Plus className="w-4 h-4" /> Create Exam
                        </Link>
                    </div>
                    <div>
                        {courseExams.length > 0 ? courseExams.map(exam => (
                            <div key={exam._id} className="px-5 py-4 flex items-center justify-between transition-all"
                                style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: FX.primary12 }}>
                                        <FileText className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }}>
                                            {exam.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-0.5"
                                            style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted }}>
                                            <span>{exam.totalQuestions || exam.questions?.length || 0} Questions</span>
                                            <span>·</span>
                                            <span>{exam.duration || 30} min</span>
                                            {exam.type && <><span>·</span><span className="capitalize">{exam.type}</span></>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold border"
                                        style={exam.status === 'published'
                                            ? { backgroundColor: C.successBg, color: C.success, borderColor: C.successBorder, fontFamily: T.fontFamily }
                                            : { backgroundColor: C.warningBg, color: C.warning, borderColor: C.warningBorder, fontFamily: T.fontFamily }}>
                                        {exam.status === 'published' ? 'Published' : 'Draft'}
                                    </span>
                                    {exam.examAttempts?.length > 0 && (
                                        <span className="flex items-center gap-1"
                                            style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted }}>
                                            <Users className="w-3 h-3" /> {exam.examAttempts.length}
                                        </span>
                                    )}
                                    <Link href={`/tutor/quizzes/${exam._id}/edit`}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                        style={{ backgroundColor: C.innerBg }}>
                                        <Edit3 className="w-4 h-4" style={{ color: C.textMuted }} />
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="p-16 text-center">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                    style={{ backgroundColor: FX.primary10, border: `1px solid ${FX.primary20}` }}>
                                    <Award className="w-7 h-7" style={{ color: C.btnPrimary }} />
                                </div>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading, marginBottom: 4 }}>
                                    No Exams Yet
                                </h3>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginBottom: 20 }}>
                                    Create an exam for this course to assess student knowledge.
                                </p>
                                <Link href={`/tutor/quizzes/create?courseId=${id}&courseTitle=${encodeURIComponent(course.title)}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl hover:opacity-90"
                                    style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily }}>
                                    <Plus className="w-4 h-4" /> Create First Exam
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                MODALS
            ════════════════════════════════════════════════════════════ */}

            {/* ── Module Modal ──────────────────────────────────────────── */}
            {isModuleModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        style={{ backgroundColor: C.surfaceWhite }}>
                        <div className="p-5 flex items-center justify-between"
                            style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: FX.primary15, border: `1px solid ${FX.primary25}` }}>
                                    <Plus className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                </div>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                    Create New Module
                                </h3>
                            </div>
                            <button onClick={() => setIsModuleModalOpen(false)}
                                className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
                                style={{ backgroundColor: C.innerBg }}>
                                <X className="w-4 h-4" style={{ color: C.textMuted }} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateModule} className="p-5 space-y-4">
                            <div>
                                <ModalLabel>Module Title</ModalLabel>
                                <input type="text" value={moduleTitle}
                                    onChange={e => setModuleTitle(e.target.value)}
                                    placeholder="e.g. Introduction to React Hooks"
                                    style={inp} onFocus={applyFocus} onBlur={removeFocus} autoFocus />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <CancelBtn onClick={() => setIsModuleModalOpen(false)} />
                                <button type="submit" disabled={submitting || !moduleTitle}
                                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 hover:opacity-90"
                                    style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily }}>
                                    {submitting ? 'Creating…' : 'Create Module'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Lesson Modal ──────────────────────────────────────────── */}
            {isLessonModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden"
                        style={{ backgroundColor: C.surfaceWhite }}>
                        <div className="p-5 flex items-center justify-between flex-shrink-0"
                            style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: FX.primary15, border: `1px solid ${FX.primary25}` }}>
                                    <Video className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                </div>
                                <div>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                        {editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}
                                    </h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                        Add content to your module
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsLessonModalOpen(false)}
                                className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
                                style={{ backgroundColor: C.innerBg }}>
                                <X className="w-4 h-4" style={{ color: C.textMuted }} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveLesson} className="flex flex-col flex-1 min-h-0">
                            <div className="p-5 space-y-5 overflow-y-auto flex-1">

                                {/* Lesson Type */}
                                <div>
                                    <ModalLabel>Lesson Type</ModalLabel>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['video', 'document', 'quiz'].map(type => (
                                            <button key={type} type="button"
                                                onClick={() => setLessonForm(prev => ({ ...prev, type }))}
                                                className="py-2.5 rounded-xl border-2 text-xs font-bold capitalize transition-all"
                                                style={lessonForm.type === type
                                                    ? { borderColor: C.btnPrimary, backgroundColor: FX.primary08, color: C.btnPrimary, fontFamily: T.fontFamily }
                                                    : { borderColor: C.cardBorder, color: C.textMuted, fontFamily: T.fontFamily }}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <ModalLabel>Lesson Title</ModalLabel>
                                    <input type="text" value={lessonForm.title}
                                        onChange={e => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Understanding useState Hook"
                                        style={inp} onFocus={applyFocus} onBlur={removeFocus} />
                                </div>

                                {/* Description */}
                                <div>
                                    <ModalLabel>Lesson Overview</ModalLabel>
                                    <textarea value={lessonForm.description}
                                        onChange={e => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Briefly describe what students will learn..."
                                        rows={3} style={{ ...inp, resize: 'none' }}
                                        onFocus={applyFocus} onBlur={removeFocus} />
                                </div>

                                {/* Attachments */}
                                <div className="space-y-2">
                                    <ModalLabel>Resources & Attachments</ModalLabel>
                                    {lessonForm.attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl"
                                            style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: FX.primary12 }}>
                                                    <FileText className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>
                                                        {file.name}
                                                    </p>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, textTransform: 'uppercase' }}>
                                                        {file.type?.split('/')[1] || 'File'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button type="button"
                                                onClick={() => setLessonForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))}
                                                className="w-6 h-6 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                                style={{ backgroundColor: C.dangerBg }}>
                                                <X className="w-3.5 h-3.5" style={{ color: C.danger }} />
                                            </button>
                                        </div>
                                    ))}
                                    <input type="file" onChange={handleFileUpload} className="hidden" id="resource-upload" />
                                    <label htmlFor="resource-upload"
                                        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl text-xs font-semibold cursor-pointer transition-all"
                                        style={{ borderColor: FX.primary25, color: C.btnPrimary, fontFamily: T.fontFamily }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = FX.primary06; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        <Plus className="w-3.5 h-3.5" /> Upload Resource
                                    </label>
                                </div>

                                {/* Video specific */}
                                {lessonForm.type === 'video' && (
                                    <div className="space-y-3">
                                        <ModalLabel>Video Content</ModalLabel>
                                        <input type="file" onChange={handleVideoUpload} accept="video/mp4,video/x-m4v,video/*"
                                            className="hidden" id="video-upload" disabled={isUploadingVideo} />
                                        <label htmlFor="video-upload"
                                            className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-dashed text-sm font-semibold transition-all ${isUploadingVideo ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                            style={{ borderColor: FX.primary40, color: C.btnPrimary, backgroundColor: FX.primary06, fontFamily: T.fontFamily }}>
                                            {isUploadingVideo
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading & Processing…</>
                                                : <><Video className="w-4 h-4" /> Upload Video (Auto HLS)</>}
                                        </label>
                                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider before:h-px before:flex-1 after:h-px after:flex-1"
                                            style={{ color: C.textMuted, '--before-bg': C.cardBorder, '--after-bg': C.cardBorder }}>
                                            or paste URL
                                        </div>
                                        <input type="url" value={lessonForm.videoUrl}
                                            onChange={e => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                                            placeholder="https://example.com/video.mp4"
                                            style={inp} onFocus={applyFocus} onBlur={removeFocus} />
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted }}>
                                            Direct video link or YouTube URL
                                        </p>
                                    </div>
                                )}

                                {/* Document specific */}
                                {lessonForm.type === 'document' && (
                                    <div className="space-y-2">
                                        <ModalLabel>Upload Documents (PDF, Word, PPT)</ModalLabel>
                                        {lessonForm.documents?.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl"
                                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: C.warningBg }}>
                                                        <FileText className="w-3.5 h-3.5" style={{ color: C.warning }} />
                                                    </div>
                                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>
                                                        {file.name}
                                                    </p>
                                                </div>
                                                <button type="button"
                                                    onClick={() => setLessonForm(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== idx) }))}
                                                    className="w-6 h-6 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                                    style={{ backgroundColor: C.dangerBg }}>
                                                    <X className="w-3.5 h-3.5" style={{ color: C.danger }} />
                                                </button>
                                            </div>
                                        ))}
                                        <input type="file" onChange={handleDocumentUpload} className="hidden" id="document-upload" accept=".pdf,.doc,.docx,.ppt,.pptx" />
                                        <label htmlFor="document-upload"
                                            className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-dashed rounded-xl text-sm font-semibold cursor-pointer hover:opacity-80 transition-all"
                                            style={{ borderColor: C.warningBorder, backgroundColor: C.warningBg, color: C.warning, fontFamily: T.fontFamily }}>
                                            <Upload className="w-4 h-4" /> Upload Document
                                        </label>
                                    </div>
                                )}

                                {/* Quiz specific */}
                                {lessonForm.type === 'quiz' && (
                                    <div className="p-4 rounded-2xl border text-center"
                                        style={{ borderColor: FX.primary25, backgroundColor: FX.primary06 }}>
                                        <AlertCircle className="w-7 h-7 mx-auto mb-2" style={{ color: C.btnPrimary }} />
                                        <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Quiz Builder</h4>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, margin: '4px 0 16px' }}>
                                            Questions are managed in the Quiz Builder after creation.
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 text-left">
                                            {[
                                                { label: 'Passing Score (%)', key: 'passingScore', placeholder: '70' },
                                                { label: 'Time Limit (mins)', key: 'timeLimit',    placeholder: 'No limit' },
                                            ].map(({ label, key, placeholder }) => (
                                                <div key={key}>
                                                    <ModalLabel>{label}</ModalLabel>
                                                    <input type="number" placeholder={placeholder}
                                                        value={lessonForm.quiz?.[key] || ''}
                                                        onChange={e => setLessonForm(p => ({ ...p, quiz: { ...p.quiz, [key]: e.target.value } }))}
                                                        style={{ ...inp, height: 36 }}
                                                        onFocus={applyFocus} onBlur={removeFocus} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Duration + Free */}
                                {lessonForm.type !== 'quiz' && (
                                    <>
                                        <div>
                                            <ModalLabel>Duration (minutes)</ModalLabel>
                                            <input type="number" value={lessonForm.duration}
                                                onChange={e => setLessonForm(prev => ({ ...prev, duration: e.target.value }))}
                                                placeholder="15" style={inp}
                                                onFocus={applyFocus} onBlur={removeFocus} />
                                        </div>
                                        <label className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer"
                                            style={{ backgroundColor: C.innerBg }}>
                                            <input type="checkbox" id="isFree" checked={lessonForm.isFree}
                                                onChange={e => setLessonForm(prev => ({ ...prev, isFree: e.target.checked }))}
                                                className="w-4 h-4 rounded"
                                                style={{ accentColor: C.btnPrimary }} />
                                            <div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }}>
                                                    Free preview lesson
                                                </p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                                    Students can watch this without enrolling
                                                </p>
                                            </div>
                                        </label>
                                    </>
                                )}
                            </div>

                            {/* Modal footer */}
                            <div className="p-4 flex gap-3 flex-shrink-0"
                                style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                <CancelBtn onClick={() => setIsLessonModalOpen(false)} />
                                <button type="submit" disabled={submitting || !lessonForm.title}
                                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 hover:opacity-90"
                                    style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily }}>
                                    {submitting ? 'Saving…' : editingLessonId ? 'Update Lesson' : 'Add Lesson'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Settings Modal ────────────────────────────────────────── */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden"
                        style={{ backgroundColor: C.surfaceWhite }}>
                        <div className="p-5 flex items-center justify-between flex-shrink-0"
                            style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: FX.primary15, border: `1px solid ${FX.primary25}` }}>
                                    <Settings className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                </div>
                                <div>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                        Course Settings
                                    </h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                        Update all course details
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsSettingsModalOpen(false)}
                                className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
                                style={{ backgroundColor: C.innerBg }}>
                                <X className="w-4 h-4" style={{ color: C.textMuted }} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSettings} className="flex flex-col flex-1 min-h-0">
                            <div className="p-5 space-y-4 overflow-y-auto flex-1">
                                {[
                                    { label: 'Course Title', key: 'title', type: 'text', required: true },
                                ].map(({ label, key, type, required }) => (
                                    <div key={key}>
                                        <ModalLabel>{label}</ModalLabel>
                                        <input type={type} value={settingsForm[key]} required={required}
                                            onChange={e => setSettingsForm(prev => ({ ...prev, [key]: e.target.value }))}
                                            style={inp} onFocus={applyFocus} onBlur={removeFocus} />
                                    </div>
                                ))}
                                <div>
                                    <ModalLabel>Description</ModalLabel>
                                    <textarea value={settingsForm.description} rows={3}
                                        onChange={e => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                                        style={{ ...inp, resize: 'none' }}
                                        onFocus={applyFocus} onBlur={removeFocus} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <ModalLabel>Price (₹)</ModalLabel>
                                        <input type="number" min="0" value={settingsForm.price}
                                            onChange={e => setSettingsForm(prev => ({ ...prev, price: e.target.value }))}
                                            style={inp} onFocus={applyFocus} onBlur={removeFocus} />
                                    </div>
                                    <div>
                                        <ModalLabel>Level</ModalLabel>
                                        <select value={settingsForm.level}
                                            onChange={e => setSettingsForm(prev => ({ ...prev, level: e.target.value }))}
                                            style={{ ...inp, cursor: 'pointer', appearance: 'none' }}>
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <ModalLabel>Language</ModalLabel>
                                    <input type="text" value={settingsForm.language}
                                        onChange={e => setSettingsForm(prev => ({ ...prev, language: e.target.value }))}
                                        style={inp} onFocus={applyFocus} onBlur={removeFocus} />
                                </div>

                                {/* Visibility */}
                                <div>
                                    <ModalLabel>Course Visibility</ModalLabel>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'institute', icon: Lock, label: 'Institute', sub: 'Your students only' },
                                            { value: 'public',    icon: Globe, label: 'Global',    sub: 'Visible to everyone' },
                                        ].map(({ value, icon: Icon, label, sub }) => (
                                            <label key={value}
                                                className="flex items-center gap-2.5 p-3 border-2 rounded-xl cursor-pointer transition-all"
                                                style={settingsForm.visibility === value
                                                    ? { borderColor: C.btnPrimary, backgroundColor: FX.primary06 }
                                                    : { borderColor: C.cardBorder }}>
                                                <input type="radio" name="visibility" value={value}
                                                    checked={settingsForm.visibility === value}
                                                    onChange={e => setSettingsForm(prev => ({ ...prev, visibility: e.target.value }))}
                                                    className="sr-only" />
                                                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: C.textMuted }} />
                                                <div>
                                                    <span className="block" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {label}
                                                    </span>
                                                    <span className="block" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>
                                                        {sub}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* What you'll learn */}
                                {[
                                    { title: 'What Students Will Learn', key: 'whatYouWillLearn', placeholder: 'Learning outcome' },
                                    { title: 'Prerequisites & Requirements', key: 'requirements', placeholder: 'Requirement' },
                                ].map(({ title, key, placeholder }) => (
                                    <div key={key} className="space-y-2">
                                        <ModalLabel>{title}</ModalLabel>
                                        {settingsForm[key].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input type="text" value={item}
                                                    onChange={e => {
                                                        const updated = [...settingsForm[key]];
                                                        updated[idx] = e.target.value;
                                                        setSettingsForm(prev => ({ ...prev, [key]: updated }));
                                                    }}
                                                    placeholder={`${placeholder} ${idx + 1}`}
                                                    style={{ ...inp, height: 36, flex: 1 }}
                                                    onFocus={applyFocus} onBlur={removeFocus} />
                                                {settingsForm[key].length > 1 && (
                                                    <button type="button"
                                                        onClick={() => setSettingsForm(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }))}
                                                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                                        style={{ backgroundColor: C.dangerBg }}>
                                                        <X className="w-3.5 h-3.5" style={{ color: C.danger }} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button"
                                            onClick={() => setSettingsForm(prev => ({ ...prev, [key]: [...prev[key], ''] }))}
                                            className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
                                            style={{ color: C.btnPrimary, fontFamily: T.fontFamily }}>
                                            <Plus className="w-3.5 h-3.5" /> Add item
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Settings footer */}
                            <div className="p-4 flex gap-3 flex-shrink-0"
                                style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                <CancelBtn onClick={() => setIsSettingsModalOpen(false)} />
                                <button type="submit" disabled={submitting}
                                    className="flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-60 hover:opacity-90"
                                    style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily }}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
