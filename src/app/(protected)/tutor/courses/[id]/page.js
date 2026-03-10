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

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pending:   'bg-cyan-50 text-cyan-700 border-cyan-200',
        rejected:  'bg-red-50 text-red-600 border-red-200',
    };
    const label = {
        published: '● Published',
        pending:   '● Pending Approval',
        rejected:  '● Rejected',
    }[status] || '● Draft';
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${map[status] || 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {label}
        </span>
    );
}

// ─── Section heading for modals ───────────────────────────────────────────────
function ModalSectionLabel({ children }) {
    return <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{children}</label>;
}

export default function ManageCoursePage({ params }) {
    const router = useRouter();
    const { id } = use(params);

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [courseExams, setCourseExams] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModuleModalOpen, setIsModuleModalOpen]   = useState(false);
    const [isLessonModalOpen, setIsLessonModalOpen]   = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState('curriculum');
    const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' });

    const [settingsForm, setSettingsForm] = useState({
        title: '', description: '', visibility: 'institute', price: 0,
        level: 'beginner', language: 'English',
        whatYouWillLearn: [''], requirements: ['']
    });

    const [currentModuleId, setCurrentModuleId]       = useState(null);
    const [moduleTitle, setModuleTitle]               = useState('');
    const [lessonForm, setLessonForm]                 = useState({
        title: '', description: '', videoUrl: '', duration: '', isFree: false,
        type: 'video', attachments: [], documents: [],
        quiz: { passingScore: 70, timeLimit: '', questions: [] }
    });

    const [submitting, setSubmitting]                 = useState(false);
    const [editingModuleId, setEditingModuleId]       = useState(null);
    const [editingModuleTitle, setEditingModuleTitle] = useState('');
    const [editingLessonId, setEditingLessonId]       = useState(null);
    const [publishing, setPublishing]                 = useState(false);
    const [isUploadingVideo, setIsUploadingVideo]     = useState(false);
    const { confirmDialog }                           = useConfirm();

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
            } catch { /* no exams — fine */ }
        } catch (error) {
            console.error('Error loading course:', error);
            if ([403, 404].includes(error.response?.status)) router.push('/tutor/courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCourseData(); }, [id]);

    // ── Publish ──────────────────────────────────────────────────────────────
    const handlePublishToggle = async () => {
        const ok = await confirmDialog("Change Publish Status",
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
            title: course.title || '',
            description: course.description || '',
            visibility: course.visibility || 'institute',
            price: course.price || 0,
            level: course.level || 'beginner',
            language: course.language || 'English',
            whatYouWillLearn: course.whatYouWillLearn?.length ? [...course.whatYouWillLearn] : [''],
            requirements: course.requirements?.length ? [...course.requirements] : ['']
        });
        setIsSettingsModalOpen(true);
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.patch(`/courses/${id}`, {
                title: settingsForm.title,
                description: settingsForm.description,
                visibility: settingsForm.visibility,
                price: Number(settingsForm.price),
                level: settingsForm.level,
                language: settingsForm.language,
                whatYouWillLearn: settingsForm.whatYouWillLearn.filter(i => i.trim()),
                requirements: settingsForm.requirements.filter(i => i.trim())
            });
            if (res.data.success) {
                setCourse(res.data.course);
                toast.success('Course settings updated');
                setIsSettingsModalOpen(false);
            }
        } catch { toast.error('Failed to update settings'); }
        finally { setSubmitting(false); }
    };

    // ── Modules ──────────────────────────────────────────────────────────────
    const handleCreateModule = async (e) => {
        e.preventDefault();
        if (!moduleTitle.trim()) return;
        setSubmitting(true);
        try {
            const updatedModules = [...(course.modules || []), { title: moduleTitle }];
            await api.patch(`/courses/${id}`, { modules: updatedModules });
            const res = await api.get(`/courses/${id}`);
            if (res.data.success) setCourse(res.data.course);
            setIsModuleModalOpen(false);
            setModuleTitle('');
            toast.success("Module created");
        } catch { toast.error('Failed to create module'); }
        finally { setSubmitting(false); }
    };

    const saveModuleEdit = async () => {
        try {
            const updatedModules = course.modules.map(m =>
                m._id === editingModuleId ? { ...m, title: editingModuleTitle } : m);
            await api.patch(`/courses/${id}`, { modules: updatedModules });
            const res = await api.get(`/courses/${id}`);
            if (res.data.success) setCourse(res.data.course);
            setEditingModuleId(null);
            toast.success("Module updated");
        } catch { toast.error('Failed to update module'); }
    };

    const deleteModule = async (moduleId) => {
        const ok = await confirmDialog("Delete Module", "Delete this module? Lessons will be unlinked.", { variant: 'destructive' });
        if (!ok) return;
        try {
            await api.patch(`/courses/${id}`, { modules: course.modules.filter(m => m._id !== moduleId) });
            const res = await api.get(`/courses/${id}`);
            if (res.data.success) setCourse(res.data.course);
            toast.success("Module deleted");
        } catch { toast.error('Failed to delete module'); }
    };

    // ── Announcements ─────────────────────────────────────────────────────────
    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        if (!announcementForm.title.trim() || !announcementForm.message.trim())
            return toast.error("Please provide both title and message");
        setSubmitting(true);
        try {
            const res = await api.post(`/courses/${id}/announcements`, announcementForm);
            if (res.data.success) {
                setCourse(prev => ({ ...prev, announcements: res.data.announcements }));
                setAnnouncementForm({ title: '', message: '' });
                toast.success('Announcement posted successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to post announcement');
        } finally { setSubmitting(false); }
    };

    // ── Lessons ───────────────────────────────────────────────────────────────
    const openLessonModal = (moduleId, lesson = null) => {
        setCurrentModuleId(moduleId);
        if (lesson) {
            setEditingLessonId(lesson._id);
            setLessonForm({
                type: lesson.type || 'video',
                title: lesson.title,
                description: lesson.description || '',
                videoUrl: lesson.content?.videoUrl || '',
                duration: Math.round((lesson.content?.duration || 0) / 60).toString(),
                documents: lesson.content?.documents || [],
                quiz: lesson.content?.quiz || { passingScore: 70, timeLimit: '', questions: [] },
                isFree: lesson.isFree,
                attachments: lesson.content?.attachments || []
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
            if (lessonForm.type === 'video') {
                content.videoUrl = lessonForm.videoUrl;
                content.duration = Number(lessonForm.duration) * 60;
            } else if (lessonForm.type === 'document') {
                content.documents = lessonForm.documents;
                content.duration = Number(lessonForm.duration) * 60 || 0;
            } else if (lessonForm.type === 'quiz') {
                content.quiz = { ...lessonForm.quiz, timeLimit: lessonForm.quiz.timeLimit ? Number(lessonForm.quiz.timeLimit) : null };
                content.duration = Number(lessonForm.duration) * 60 || 0;
            }

            if (editingLessonId) {
                await api.patch(`/lessons/${editingLessonId}`, {
                    title: lessonForm.title, description: lessonForm.description,
                    type: lessonForm.type, content, isFree: lessonForm.isFree
                });
            } else {
                await api.post('/lessons', {
                    courseId: id, moduleId: currentModuleId,
                    title: lessonForm.title, description: lessonForm.description,
                    type: lessonForm.type, content, isFree: lessonForm.isFree
                });
            }
            const res = await api.get(`/lessons/course/${id}`);
            if (res.data.success) setLessons(res.data.lessons);
            setIsLessonModalOpen(false);
            setEditingLessonId(null);
            toast.success(editingLessonId ? "Lesson updated" : "Lesson added");
        } catch { toast.error('Failed to save lesson'); }
        finally { setSubmitting(false); }
    };

    const deleteLesson = async (lessonId) => {
        const ok = await confirmDialog("Delete Lesson", "Delete this lesson? This action cannot be undone.", { variant: 'destructive' });
        if (!ok) return;
        try {
            await api.delete(`/lessons/${lessonId}`);
            setLessons(prev => prev.filter(l => l._id !== lessonId));
            toast.success("Lesson deleted");
        } catch { toast.error('Failed to delete lesson'); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const fd = new FormData(); fd.append('file', file);
        try {
            const res = await api.post('/upload/file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) {
                setLessonForm(prev => ({ ...prev, attachments: [...prev.attachments, { name: res.data.name, url: res.data.fileUrl, type: res.data.type }] }));
                toast.success("File uploaded");
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
            if (res.data.success) {
                setLessonForm(prev => ({ ...prev, videoUrl: resolveUrl(res.data.estimatedPlaylistUrl) }));
                toast.success("Video uploaded and is processing for HLS!");
            }
        } catch (error) {
            const msg = error.response?.data?.message || '';
            if (error.response?.status === 403 && /(hls|feature|subscription)/i.test(msg)) {
                try {
                    const fd2 = new FormData(); fd2.append('file', file);
                    const fb = await api.post('/upload/file', fd2, { headers: { 'Content-Type': 'multipart/form-data' } });
                    if (fb.data.success) {
                        setLessonForm(prev => ({ ...prev, videoUrl: fb.data.fileUrl }));
                        toast.success('Video uploaded (standard mode — HLS disabled on current plan).');
                        return;
                    }
                } catch { /* ignore */ }
            }
            toast.error(msg || 'Failed to upload video');
        } finally { setIsUploadingVideo(false); }
    };

    // ── Shared input classes ─────────────────────────────────────────────────
    const inp = "w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-colors";

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm text-slate-400">Loading course...</p>
            </div>
        );
    }
    if (!course) return null;

    const totalLessons  = lessons.length;
    const totalDuration = lessons.reduce((a, l) => a + (l.duration || 0), 0);

    // ── Tab config ────────────────────────────────────────────────────────────
    const TABS = [
        { key: 'curriculum',    icon: FileText,     label: 'Curriculum' },
        { key: 'exams',         icon: Award,        label: `Exams (${courseExams.length})` },
        { key: 'announcements', icon: Megaphone,    label: 'Announcements' },
    ];

    return (
        <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Page Header ───────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
                <div className="flex items-start gap-3">
                    <button onClick={() => router.push('/tutor/courses')}
                        className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0">
                        <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                            <h1 className="text-lg font-bold text-slate-900 truncate">{course.title}</h1>
                            <StatusBadge status={course.status} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5" /> {totalLessons} lessons</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.round(totalDuration / 3600)} hrs</span>
                            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {course.modules?.length || 0} modules</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap flex-shrink-0">
                        <button onClick={handlePublishToggle} disabled={publishing}
                            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors
                                ${course.status === 'published' || course.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : course.status === 'published' || course.status === 'pending'
                                    ? <EyeOff className="w-3.5 h-3.5" />
                                    : <Globe className="w-3.5 h-3.5" />}
                            {course.status === 'published' || course.status === 'pending'
                                ? 'Unpublish'
                                : course.status === 'rejected' ? 'Resubmit' : 'Publish'}
                        </button>
                        <button onClick={() => router.push(`/tutor/courses/${id}/assignments`)}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                            <ClipboardList className="w-3.5 h-3.5" /> Assignments
                        </button>
                        <button onClick={openSettingsModal}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                            <Settings className="w-3.5 h-3.5" /> Settings
                        </button>
                        <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white transition-opacity"
                            style={{ backgroundColor: 'var(--theme-primary)' }}>
                            <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────────── */}
            <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2">
                {TABS.map(({ key, icon: Icon, label }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className="flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors"
                        style={activeTab === key
                            ? { borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' }
                            : { borderColor: 'transparent', color: '#94a3b8' }}>
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </div>

            {/* ── Curriculum Tab ────────────────────────────────────────────── */}
            {activeTab === 'curriculum' && (
                <div className="bg-white rounded-b-xl rounded-tr-xl border border-slate-100 overflow-hidden -mt-px">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                Course Curriculum
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">Organize your lessons into modules</p>
                        </div>
                        <button onClick={() => setIsModuleModalOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-opacity"
                            style={{ backgroundColor: 'var(--theme-primary)' }}>
                            <Plus className="w-4 h-4" /> Add Module
                        </button>
                    </div>

                    <div className="p-6">
                        {course.modules?.length > 0 ? (
                            <div className="space-y-4">
                                {course.modules.map((module, index) => {
                                    const moduleLessons = lessons.filter(l => l.moduleId === module._id);
                                    const moduleDuration = moduleLessons.reduce((a, l) => a + (l.content?.duration || 0), 0);
                                    const isEditing = editingModuleId === module._id;

                                    return (
                                        <div key={module._id}
                                            className="group border border-slate-100 rounded-xl hover:shadow-sm transition-all duration-200">
                                            {/* Module Header */}
                                            <div className="px-5 py-4 bg-slate-50/60 rounded-t-xl border-b border-slate-100">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <button className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                            <GripVertical className="w-4 h-4 text-slate-300" />
                                                        </button>
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <input type="text" value={editingModuleTitle}
                                                                    onChange={(e) => setEditingModuleTitle(e.target.value)}
                                                                    className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--theme-primary)] bg-white transition-colors"
                                                                    autoFocus />
                                                                <button onClick={saveModuleEdit}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 transition-colors">
                                                                    <Check className="w-4 h-4 text-emerald-600" />
                                                                </button>
                                                                <button onClick={() => setEditingModuleId(null)}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                                                                    <X className="w-4 h-4 text-slate-400" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center flex-shrink-0"
                                                                        style={{ backgroundColor: 'var(--theme-primary)' }}>
                                                                        {index + 1}
                                                                    </span>
                                                                    <span className="text-sm font-bold text-slate-800 truncate">{module.title}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-0.5 pl-7 text-[11px] text-slate-400">
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
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
                                                                style={{ color: 'var(--theme-primary)', borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, white)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 6%, white)' }}>
                                                                <Plus className="w-3 h-3" /> Lesson
                                                            </button>
                                                            {/* Module menu */}
                                                            <div className="relative group/menu">
                                                                <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                                                                    <MoreVertical className="w-4 h-4 text-slate-400" />
                                                                </button>
                                                                <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                                                                    <button
                                                                        onClick={() => { setEditingModuleId(module._id); setEditingModuleTitle(module.title); }}
                                                                        className="w-full px-3.5 py-2 text-sm text-left text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                                                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                                                    </button>
                                                                    <button onClick={() => deleteModule(module._id)}
                                                                        className="w-full px-3.5 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2">
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
                                                                className="group/lesson flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/60 transition-all">
                                                                {/* Number badge */}
                                                                <div className="w-8 h-8 rounded-lg text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                                    style={{ backgroundColor: 'var(--theme-sidebar)' }}>
                                                                    {idx + 1}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <p className="text-sm font-semibold text-slate-800 truncate">{lesson.title}</p>
                                                                        {lesson.isFree && (
                                                                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide flex-shrink-0">
                                                                                FREE
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                                        {lesson.type === 'document' ? <FileText className="w-3 h-3 text-amber-500" />
                                                                            : lesson.type === 'quiz'  ? <AlertCircle className="w-3 h-3" style={{ color: 'var(--theme-primary)' }} />
                                                                            : <Video className="w-3 h-3 text-blue-400" />}
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
                                                                        <button
                                                                            onClick={() => router.push(`/tutor/courses/${id}/modules/${module._id}/lessons/${lesson._id}/quiz`)}
                                                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors border"
                                                                            style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, white)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, white)' }}
                                                                            title="Manage Quiz Questions">
                                                                            <FileText className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => openLessonModal(module._id, lesson)}
                                                                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                                                                        <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                                                    </button>
                                                                    <button onClick={() => deleteLesson(lesson._id)}
                                                                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                                                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, white)' }}>
                                                            <Video className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-600 mb-1">No lessons yet</p>
                                                        <p className="text-xs text-slate-400 mb-3">Add your first lesson to this module</p>
                                                        <button onClick={() => openLessonModal(module._id)}
                                                            className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
                                                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', color: 'var(--theme-primary)' }}>
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
                                <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                                    <FileText className="w-7 h-7" style={{ color: 'var(--theme-primary)' }} />
                                </div>
                                <h3 className="text-base font-bold text-slate-800 mb-1">Start Building Your Course</h3>
                                <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                                    Create your first module to organize your lessons and build an amazing learning experience.
                                </p>
                                <button onClick={() => setIsModuleModalOpen(true)}
                                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl inline-flex items-center gap-2"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                                    <Plus className="w-4 h-4" /> Create First Module
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Announcements Tab ─────────────────────────────────────────── */}
            {activeTab === 'announcements' && (
                <div className="space-y-4 -mt-px">
                    {/* Create form */}
                    <div className="bg-white rounded-xl border border-slate-100 p-6 max-w-2xl">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)' }}>
                                <BellRing className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            Create Announcement
                        </h3>
                        <form onSubmit={handlePostAnnouncement} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">Title</label>
                                <input type="text" value={announcementForm.title}
                                    onChange={(e) => setAnnouncementForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="e.g. 'Midterm Exam Materials Uploaded'"
                                    className={inp} required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">Message</label>
                                <textarea value={announcementForm.message}
                                    onChange={(e) => setAnnouncementForm(p => ({ ...p, message: e.target.value }))}
                                    placeholder="Write your announcement message here..."
                                    rows={4}
                                    className={`${inp} resize-none`} required />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={submitting}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-60"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                                    Post Announcement
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* History */}
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden max-w-2xl">
                        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                            <h3 className="text-sm font-bold text-slate-700">Previous Announcements</h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {course.announcements?.length > 0
                                ? [...course.announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((ann, idx) => (
                                    <div key={idx} className="p-5 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start justify-between gap-3 mb-1.5">
                                            <h4 className="text-sm font-semibold text-slate-800">{ann.title}</h4>
                                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0">
                                                {new Date(ann.createdAt).toLocaleDateString()} {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 whitespace-pre-wrap">{ann.message}</p>
                                    </div>
                                ))
                                : (
                                    <div className="p-12 text-center">
                                        <Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">No announcements yet.</p>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Exams Tab ─────────────────────────────────────────────────── */}
            {activeTab === 'exams' && (
                <div className="bg-white rounded-b-xl border border-slate-100 overflow-hidden -mt-px">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Award className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                Course Exams
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">Exams linked to this course</p>
                        </div>
                        <Link href={`/tutor/quizzes/create?courseId=${id}&courseTitle=${encodeURIComponent(course.title)}`}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl"
                            style={{ backgroundColor: 'var(--theme-primary)' }}>
                            <Plus className="w-4 h-4" /> Create Exam
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {courseExams.length > 0 ? courseExams.map(exam => (
                            <div key={exam._id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)' }}>
                                        <FileText className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-800">{exam.title}</h3>
                                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                            <span>{exam.totalQuestions || exam.questions?.length || 0} Questions</span>
                                            <span>·</span>
                                            <span>{exam.duration || 30} min</span>
                                            {exam.type && <><span>·</span><span className="capitalize">{exam.type}</span></>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border
                                        ${exam.status === 'published'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                        {exam.status === 'published' ? 'Published' : 'Draft'}
                                    </span>
                                    {exam.examAttempts?.length > 0 && (
                                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                            <Users className="w-3 h-3" /> {exam.examAttempts.length}
                                        </span>
                                    )}
                                    <Link href={`/tutor/quizzes/${exam._id}/edit`}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                                        <Edit3 className="w-4 h-4 text-slate-400" />
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="p-16 text-center">
                                <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                                    <Award className="w-7 h-7" style={{ color: 'var(--theme-primary)' }} />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-1">No Exams Yet</h3>
                                <p className="text-xs text-slate-400 mb-5">Create an exam for this course to assess student knowledge.</p>
                                <Link href={`/tutor/quizzes/create?courseId=${id}&courseTitle=${encodeURIComponent(course.title)}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                                    <Plus className="w-4 h-4" /> Create First Exam
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                MODALS
            ════════════════════════════════════════════════════════════════ */}

            {/* ── Module Modal ──────────────────────────────────────────────── */}
            {isModuleModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                                    <Plus className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">Create New Module</h3>
                            </div>
                            <button onClick={() => setIsModuleModalOpen(false)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateModule} className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">Module Title</label>
                                <input type="text" value={moduleTitle}
                                    onChange={(e) => setModuleTitle(e.target.value)}
                                    placeholder="e.g. Introduction to React Hooks"
                                    className={inp} autoFocus />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setIsModuleModalOpen(false)}
                                    className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting || !moduleTitle}
                                    className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                                    {submitting ? 'Creating...' : 'Create Module'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Lesson Modal ──────────────────────────────────────────────── */}
            {isLessonModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                                    <Video className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">{editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}</h3>
                                    <p className="text-xs text-slate-400">Add content to your module</p>
                                </div>
                            </div>
                            <button onClick={() => setIsLessonModalOpen(false)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveLesson} className="flex flex-col flex-1 min-h-0">
                            <div className="p-5 space-y-5 overflow-y-auto flex-1">

                                {/* Lesson Type */}
                                <div className="space-y-1.5">
                                    <ModalSectionLabel>Lesson Type</ModalSectionLabel>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['video', 'document', 'quiz'].map(type => (
                                            <button key={type} type="button"
                                                onClick={() => setLessonForm(prev => ({ ...prev, type }))}
                                                className="py-2.5 rounded-xl border-2 text-xs font-bold capitalize transition-all"
                                                style={lessonForm.type === type
                                                    ? { borderColor: 'var(--theme-primary)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, white)', color: 'var(--theme-primary)' }
                                                    : { borderColor: '#e2e8f0', color: '#64748b' }}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-1.5">
                                    <ModalSectionLabel>Lesson Title</ModalSectionLabel>
                                    <input type="text" value={lessonForm.title}
                                        onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Understanding useState Hook"
                                        className={inp} />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <ModalSectionLabel>Lesson Overview</ModalSectionLabel>
                                    <textarea value={lessonForm.description}
                                        onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Briefly describe what students will learn..."
                                        rows={3} className={`${inp} resize-none`} />
                                </div>

                                {/* Attachments */}
                                <div className="space-y-2">
                                    <ModalSectionLabel>Resources & Attachments</ModalSectionLabel>
                                    {lessonForm.attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)' }}>
                                                    <FileText className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-slate-700 truncate">{file.name}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase">{file.type?.split('/')[1] || 'File'}</p>
                                                </div>
                                            </div>
                                            <button type="button"
                                                onClick={() => setLessonForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))}
                                                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                                <X className="w-3.5 h-3.5 text-red-400" />
                                            </button>
                                        </div>
                                    ))}
                                    <input type="file" onChange={handleFileUpload} className="hidden" id="resource-upload" />
                                    <label htmlFor="resource-upload"
                                        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl text-xs font-semibold cursor-pointer transition-all"
                                        style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, white)', color: 'var(--theme-primary)' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-primary) 5%, white)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <Plus className="w-3.5 h-3.5" /> Upload Resource
                                    </label>
                                </div>

                                {/* Video specific */}
                                {lessonForm.type === 'video' && (
                                    <div className="space-y-3">
                                        <ModalSectionLabel>Video Content</ModalSectionLabel>
                                        <input type="file" onChange={handleVideoUpload}
                                            accept="video/mp4,video/x-m4v,video/*"
                                            className="hidden" id="video-upload" disabled={isUploadingVideo} />
                                        <label htmlFor="video-upload"
                                            className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-dashed text-sm font-semibold transition-all ${isUploadingVideo ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                            style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, white)', color: 'var(--theme-primary)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, white)' }}>
                                            {isUploadingVideo
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading & Processing...</>
                                                : <><Video className="w-4 h-4" /> Upload Video (Auto HLS)</>}
                                        </label>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider before:h-px before:flex-1 before:bg-slate-100 after:h-px after:flex-1 after:bg-slate-100">
                                            or paste URL
                                        </div>
                                        <input type="url" value={lessonForm.videoUrl}
                                            onChange={(e) => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                                            placeholder="https://example.com/video.mp4"
                                            className={inp} />
                                        <p className="text-[11px] text-slate-400">Direct video link or YouTube URL</p>
                                    </div>
                                )}

                                {/* Document specific */}
                                {lessonForm.type === 'document' && (
                                    <div className="space-y-2">
                                        <ModalSectionLabel>Upload Documents (PDF, Word, PPT)</ModalSectionLabel>
                                        {lessonForm.documents?.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-700 truncate">{file.name}</p>
                                                </div>
                                                <button type="button"
                                                    onClick={() => setLessonForm(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== idx) }))}
                                                    className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                                    <X className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            </div>
                                        ))}
                                        <input type="file" onChange={handleDocumentUpload} className="hidden" id="document-upload" accept=".pdf,.doc,.docx,.ppt,.pptx" />
                                        <label htmlFor="document-upload"
                                            className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-dashed border-amber-200 bg-amber-50/40 rounded-xl text-amber-700 text-sm font-semibold cursor-pointer hover:bg-amber-50 transition-all">
                                            <Upload className="w-4 h-4" /> Upload Document
                                        </label>
                                    </div>
                                )}

                                {/* Quiz specific */}
                                {lessonForm.type === 'quiz' && (
                                    <div className="p-4 rounded-xl border text-center"
                                        style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, white)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, white)' }}>
                                        <AlertCircle className="w-7 h-7 mx-auto mb-2" style={{ color: 'var(--theme-primary)' }} />
                                        <h4 className="text-sm font-bold text-slate-800">Quiz Builder</h4>
                                        <p className="text-xs text-slate-500 mt-1 mb-4">Questions are managed in the Quiz Builder after creation. Set basic config here.</p>
                                        <div className="grid grid-cols-2 gap-3 text-left">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500">Passing Score (%)</label>
                                                <input type="number"
                                                    value={lessonForm.quiz?.passingScore || 70}
                                                    onChange={(e) => setLessonForm(p => ({ ...p, quiz: { ...p.quiz, passingScore: e.target.value } }))}
                                                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--theme-primary)] bg-white transition-colors" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500">Time Limit (mins)</label>
                                                <input type="number" placeholder="No limit"
                                                    value={lessonForm.quiz?.timeLimit || ''}
                                                    onChange={(e) => setLessonForm(p => ({ ...p, quiz: { ...p.quiz, timeLimit: e.target.value } }))}
                                                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--theme-primary)] bg-white transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Duration + Free toggle */}
                                {lessonForm.type !== 'quiz' && (
                                    <>
                                        <div className="space-y-1.5">
                                            <ModalSectionLabel>Duration (minutes)</ModalSectionLabel>
                                            <input type="number" value={lessonForm.duration}
                                                onChange={(e) => setLessonForm(prev => ({ ...prev, duration: e.target.value }))}
                                                placeholder="15" className={inp} />
                                        </div>
                                        <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl cursor-pointer group">
                                            <input type="checkbox" id="isFree" checked={lessonForm.isFree}
                                                onChange={(e) => setLessonForm(prev => ({ ...prev, isFree: e.target.checked }))}
                                                className="w-4 h-4 rounded border-slate-300"
                                                style={{ accentColor: 'var(--theme-primary)' }} />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">Free preview lesson</p>
                                                <p className="text-xs text-slate-400">Students can watch this without enrolling</p>
                                            </div>
                                        </label>
                                    </>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0 flex gap-3">
                                <button type="button" onClick={() => setIsLessonModalOpen(false)}
                                    className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting || !lessonForm.title}
                                    className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                                    {submitting ? 'Saving...' : editingLessonId ? 'Update Lesson' : 'Add Lesson'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Settings Modal ────────────────────────────────────────────── */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                                    <Settings className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">Course Settings</h3>
                                    <p className="text-xs text-slate-400">Update all course details</p>
                                </div>
                            </div>
                            <button onClick={() => setIsSettingsModalOpen(false)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSettings} className="flex flex-col flex-1 min-h-0">
                            <div className="p-5 space-y-4 overflow-y-auto flex-1">
                                <div className="space-y-1.5">
                                    <ModalSectionLabel>Course Title</ModalSectionLabel>
                                    <input type="text" value={settingsForm.title}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, title: e.target.value }))}
                                        className={inp} required />
                                </div>
                                <div className="space-y-1.5">
                                    <ModalSectionLabel>Description</ModalSectionLabel>
                                    <textarea value={settingsForm.description}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3} className={`${inp} resize-none`} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <ModalSectionLabel>Price (₹)</ModalSectionLabel>
                                        <input type="number" min="0" value={settingsForm.price}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, price: e.target.value }))}
                                            className={inp} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <ModalSectionLabel>Level</ModalSectionLabel>
                                        <select value={settingsForm.level}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, level: e.target.value }))}
                                            className={inp}>
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <ModalSectionLabel>Language</ModalSectionLabel>
                                    <input type="text" value={settingsForm.language}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, language: e.target.value }))}
                                        className={inp} />
                                </div>

                                {/* Visibility */}
                                <div className="space-y-2">
                                    <ModalSectionLabel>Course Visibility</ModalSectionLabel>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'institute', icon: Lock, label: 'Institute', sub: 'Your students only' },
                                            { value: 'public', icon: Globe, label: 'Global', sub: 'Visible to everyone' },
                                        ].map(({ value, icon: Icon, label, sub }) => (
                                            <label key={value}
                                                className="flex items-center gap-2.5 p-3 border-2 rounded-xl cursor-pointer transition-all"
                                                style={settingsForm.visibility === value
                                                    ? { borderColor: 'var(--theme-primary)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 6%, white)' }
                                                    : { borderColor: '#e2e8f0' }}>
                                                <input type="radio" name="visibility" value={value}
                                                    checked={settingsForm.visibility === value}
                                                    onChange={(e) => setSettingsForm(prev => ({ ...prev, visibility: e.target.value }))}
                                                    className="sr-only" />
                                                <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                                <div>
                                                    <span className="block text-xs font-bold text-slate-700">{label}</span>
                                                    <span className="block text-[10px] text-slate-400">{sub}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* What you'll learn */}
                                <div className="space-y-2">
                                    <ModalSectionLabel>What Students Will Learn</ModalSectionLabel>
                                    {settingsForm.whatYouWillLearn.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input type="text" value={item}
                                                onChange={(e) => {
                                                    const updated = [...settingsForm.whatYouWillLearn];
                                                    updated[idx] = e.target.value;
                                                    setSettingsForm(prev => ({ ...prev, whatYouWillLearn: updated }));
                                                }}
                                                placeholder={`Learning outcome ${idx + 1}`}
                                                className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--theme-primary)] transition-colors" />
                                            {settingsForm.whatYouWillLearn.length > 1 && (
                                                <button type="button"
                                                    onClick={() => setSettingsForm(prev => ({ ...prev, whatYouWillLearn: prev.whatYouWillLearn.filter((_, i) => i !== idx) }))}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                                    <X className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button"
                                        onClick={() => setSettingsForm(prev => ({ ...prev, whatYouWillLearn: [...prev.whatYouWillLearn, ''] }))}
                                        className="text-xs font-semibold flex items-center gap-1 transition-opacity"
                                        style={{ color: 'var(--theme-primary)' }}>
                                        <Plus className="w-3.5 h-3.5" /> Add item
                                    </button>
                                </div>

                                {/* Requirements */}
                                <div className="space-y-2">
                                    <ModalSectionLabel>Prerequisites & Requirements</ModalSectionLabel>
                                    {settingsForm.requirements.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input type="text" value={item}
                                                onChange={(e) => {
                                                    const updated = [...settingsForm.requirements];
                                                    updated[idx] = e.target.value;
                                                    setSettingsForm(prev => ({ ...prev, requirements: updated }));
                                                }}
                                                placeholder={`Requirement ${idx + 1}`}
                                                className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--theme-primary)] transition-colors" />
                                            {settingsForm.requirements.length > 1 && (
                                                <button type="button"
                                                    onClick={() => setSettingsForm(prev => ({ ...prev, requirements: prev.requirements.filter((_, i) => i !== idx) }))}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                                    <X className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button"
                                        onClick={() => setSettingsForm(prev => ({ ...prev, requirements: [...prev.requirements, ''] }))}
                                        className="text-xs font-semibold flex items-center gap-1"
                                        style={{ color: 'var(--theme-primary)' }}>
                                        <Plus className="w-3.5 h-3.5" /> Add item
                                    </button>
                                </div>
                            </div>

                            {/* Settings Footer */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0 flex gap-3">
                                <button type="button" onClick={() => setIsSettingsModalOpen(false)}
                                    className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}>
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