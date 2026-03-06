'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Plus,
    Loader2,
    Video,
    FileText,
    MoreVertical,
    GripVertical,
    Eye,
    Settings,
    Trash2,
    Edit3,
    Clock,
    PlayCircle,
    Lock,
    Check,
    X,
    Save,
    Sparkles,
    Globe,
    EyeOff,
    ClipboardList,
    Megaphone,
    BellRing,
    Award,
    ExternalLink,
    Users,
    Upload,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { Button } from '@/components/ui/button';

export default function ManageCoursePage({ params }) {
    const router = useRouter();
    const { id } = use(params);

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [courseExams, setCourseExams] = useState([]);

    const [loading, setLoading] = useState(true);
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState('curriculum');
    const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' });

    const [settingsForm, setSettingsForm] = useState({
        title: '',
        description: '',
        visibility: 'institute',
        price: 0,
        level: 'beginner',
        language: 'English',
        whatYouWillLearn: [''],
        requirements: ['']
    });

    const [currentModuleId, setCurrentModuleId] = useState(null);
    const [moduleTitle, setModuleTitle] = useState('');

    const [lessonForm, setLessonForm] = useState({
        title: '',
        description: '',
        videoUrl: '',
        duration: '',
        isFree: false,
        attachments: []
    });

    const [submitting, setSubmitting] = useState(false);
    const [editingModuleId, setEditingModuleId] = useState(null);
    const [editingModuleTitle, setEditingModuleTitle] = useState('');
    const [editingLessonId, setEditingLessonId] = useState(null);
    const [publishing, setPublishing] = useState(false);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const { confirmDialog } = useConfirm();

    // Fetch Data
    const loadCourseData = async () => {
        try {
            setLoading(true);
            const [courseRes, lessonsRes] = await Promise.all([
                api.get(`/courses/${id}`),
                api.get(`/lessons/course/${id}`)
            ]);

            if (courseRes.data.success) {
                setCourse(courseRes.data.course);
            }
            if (lessonsRes.data.success) {
                setLessons(lessonsRes.data.lessons);
            }

            // Fetch course exams
            try {
                const examsRes = await api.get(`/exams/course/${id}`);
                if (examsRes.data.success) {
                    setCourseExams(examsRes.data.exams || []);
                }
            } catch (err) { console.warn('No exams found for course'); }
        } catch (error) {
            console.error('Error loading course:', error);
            // Handle error (e.g., redirect if 404 or 403)
            if (error.response?.status === 403 || error.response?.status === 404) {
                router.push('/tutor/courses');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourseData();
    }, [id]);

    // --- Course Publishing ---
    const handlePublishToggle = async () => {
        const isConfirmed = await confirmDialog("Change Publish Status", `Are you sure you want to ${course.status === 'published' ? 'unpublish' : 'publish'} this course?`);
        if (!isConfirmed) return;

        setPublishing(true);
        try {
            const newStatus = course.status === 'published' ? 'draft' : 'published';
            const res = await api.patch(`/courses/${id}`, { status: newStatus });
            const updatedStatus = res.data.course.status;

            setCourse(prev => ({ ...prev, status: updatedStatus }));

            if (updatedStatus === 'pending') {
                toast.success('Course submitted for Admin Approval');
            } else {
                toast.success(`Course ${updatedStatus} successfully`);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update course status');
        } finally {
            setPublishing(false);
        }
    };

    // --- Course Settings ---
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
        } catch (error) {
            console.error(error);
            toast.error('Failed to update settings');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Module Management ---

    const handleCreateModule = async (e) => {
        e.preventDefault();
        if (!moduleTitle.trim()) return;

        setSubmitting(true);
        try {
            const updatedModules = [...(course.modules || []), { title: moduleTitle }];
            await api.patch(`/courses/${id}`, { modules: updatedModules });

            // Refresh to get new module IDs
            const res = await api.get(`/courses/${id}`);
            if (res.data.success) setCourse(res.data.course);

            setIsModuleModalOpen(false);
            setModuleTitle('');
            toast.success("Module created");
        } catch (error) {
            toast.error('Failed to create module');
        } finally {
            setSubmitting(false);
        }
    };

    const startEditingModule = (module) => {
        setEditingModuleId(module._id);
        setEditingModuleTitle(module.title);
    };

    const saveModuleEdit = async () => {
        try {
            const updatedModules = course.modules.map(m =>
                m._id === editingModuleId ? { ...m, title: editingModuleTitle } : m
            );

            await api.patch(`/courses/${id}`, { modules: updatedModules });

            // Refresh
            const res = await api.get(`/courses/${id}`);
            if (res.data.success) setCourse(res.data.course);

            setEditingModuleId(null);
            toast.success("Module updated");
        } catch (error) {
            toast.error('Failed to update module');
        }
    };

    const cancelModuleEdit = () => {
        setEditingModuleId(null);
        setEditingModuleTitle('');
    };

    const deleteModule = async (moduleId) => {
        const isConfirmed = await confirmDialog("Delete Module", "Delete this module? Associated lessons will be unlinked (or you should delete them first).", { variant: 'destructive' });
        if (!isConfirmed) return;

        try {
            const updatedModules = course.modules.filter(m => m._id !== moduleId);
            await api.patch(`/courses/${id}`, { modules: updatedModules });

            const res = await api.get(`/courses/${id}`);
            if (res.data.success) setCourse(res.data.course);
            toast.success("Module deleted");
        } catch (error) {
            toast.error('Failed to delete module');
        }
    };

    // --- Announcement Management ---

    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
            return toast.error("Please provide both title and message");
        }

        setSubmitting(true);
        try {
            const res = await api.post(`/courses/${id}/announcements`, announcementForm);
            if (res.data.success) {
                setCourse(prev => ({
                    ...prev,
                    announcements: res.data.announcements
                }));
                setAnnouncementForm({ title: '', message: '' });
                toast.success('Announcement posted successfully');
            }
        } catch (error) {
            console.error('Post announcement error:', error);
            toast.error(error.response?.data?.message || 'Failed to post announcement');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Lesson Management ---

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
            setLessonForm({
                type: 'video',
                title: '',
                description: '',
                videoUrl: '',
                duration: '',
                documents: [],
                quiz: { passingScore: 70, timeLimit: '', questions: [] },
                isFree: false,
                attachments: []
            });
        }
        setIsLessonModalOpen(true);
    };

    const handleSaveLesson = async (e) => {
        e.preventDefault();
        if (!lessonForm.title || !currentModuleId) return;

        setSubmitting(true);
        try {
            // Ensure attachments is always an array
            let attachments = lessonForm.attachments || [];
            if (typeof attachments === 'string') {
                try {
                    attachments = JSON.parse(attachments);
                } catch (e) {
                    attachments = [];
                }
            }

            const content = {
                attachments: Array.isArray(attachments) ? attachments : []
            };

            if (lessonForm.type === 'video') {
                content.videoUrl = lessonForm.videoUrl;
                content.duration = Number(lessonForm.duration) * 60; // Convert to seconds
            } else if (lessonForm.type === 'document') {
                content.documents = lessonForm.documents;
                content.duration = Number(lessonForm.duration) * 60 || 0;
            } else if (lessonForm.type === 'quiz') {
                content.quiz = {
                    ...lessonForm.quiz,
                    timeLimit: lessonForm.quiz.timeLimit ? Number(lessonForm.quiz.timeLimit) : null
                };
                content.duration = Number(lessonForm.duration) * 60 || 0;
            }

            if (editingLessonId) {
                // Update existing lesson
                await api.patch(`/lessons/${editingLessonId}`, {
                    title: lessonForm.title,
                    description: lessonForm.description,
                    type: lessonForm.type,
                    content,
                    isFree: lessonForm.isFree,
                });
            } else {
                // Create new lesson
                await api.post('/lessons', {
                    courseId: id,
                    moduleId: currentModuleId,
                    title: lessonForm.title,
                    description: lessonForm.description,
                    type: lessonForm.type,
                    content,
                    isFree: lessonForm.isFree,
                });
            }

            // Refresh lessons
            const res = await api.get(`/lessons/course/${id}`);
            if (res.data.success) setLessons(res.data.lessons);

            setIsLessonModalOpen(false);
            setEditingLessonId(null);
            toast.success(editingLessonId ? "Lesson updated" : "Lesson added");
        } catch (error) {
            console.error(error);
            toast.error('Failed to save lesson');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteLesson = async (lessonId) => {
        const isConfirmed = await confirmDialog("Delete Lesson", "Delete this lesson? This action cannot be undone.", { variant: 'destructive' });
        if (!isConfirmed) return;

        try {
            await api.delete(`/lessons/${lessonId}`);
            setLessons(prev => prev.filter(l => l._id !== lessonId));
            toast.success("Lesson deleted");
        } catch (error) {
            toast.error('Failed to delete lesson');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/upload/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setLessonForm(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, {
                        name: res.data.name,
                        url: res.data.fileUrl,
                        type: res.data.type
                    }]
                }));
                toast.success("File uploaded");
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload file');
        }
    };

    const handleDocumentUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/upload/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setLessonForm(prev => ({
                    ...prev,
                    documents: [...prev.documents, {
                        name: res.data.name,
                        url: res.data.fileUrl,
                        type: res.data.type
                    }]
                }));
                toast.success('Document uploaded');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload document');
        }
    };

    const removeDocument = (index) => {
        setLessonForm(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index)
        }));
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const resolveMediaUrl = (rawUrl) => {
            if (!rawUrl) return '';
            if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
            const backendBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '')
                .replace(/\/api\/?$/, '')
                .replace(/\/+$/, '');
            if (backendBase) {
                return `${backendBase}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
            }
            return rawUrl;
        };

        const formData = new FormData();
        formData.append('video', file);

        setIsUploadingVideo(true);
        try {
            const res = await api.post('/upload/video-hls', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                const fullUrl = resolveMediaUrl(res.data.estimatedPlaylistUrl);

                setLessonForm(prev => ({ ...prev, videoUrl: fullUrl }));
                toast.success("Video uploaded and is processing for HLS!");
            }
        } catch (error) {
            const backendMessage = error.response?.data?.message || '';
            const shouldFallbackToDirectVideo = error.response?.status === 403
                && /(hls|feature|subscription)/i.test(backendMessage);

            if (shouldFallbackToDirectVideo) {
                try {
                    const directVideoFormData = new FormData();
                    directVideoFormData.append('file', file);

                    const fallbackRes = await api.post('/upload/file', directVideoFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    if (fallbackRes.data.success) {
                        setLessonForm(prev => ({ ...prev, videoUrl: fallbackRes.data.fileUrl }));
                        toast.success('Video uploaded in standard mode (HLS disabled on current plan).');
                        return;
                    }
                } catch (fallbackError) {
                    console.error('Direct video upload fallback failed:', fallbackError);
                }
            }

            console.error('Video upload failed:', error);
            toast.error(backendMessage || 'Failed to upload video');
        } finally {
            setIsUploadingVideo(false);
        }
    };

    const removeAttachment = (index) => {
        setLessonForm(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    // --- Render Helpers ---

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading course...</p>
                </div>
            </div>
        );
    }

    if (!course) return null;

    const totalLessons = lessons.length;
    const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Enhanced Header */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                        <button
                            onClick={() => router.push('/tutor/courses')}
                            className="mt-1 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.status === 'published' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' :
                                    course.status === 'pending' ? 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200' :
                                        course.status === 'rejected' ? 'bg-red-100 text-red-700 ring-1 ring-red-200' :
                                            'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                                    }`}>
                                    {course.status === 'published' ? '● Published' :
                                        course.status === 'pending' ? '● Pending Approval' :
                                            course.status === 'rejected' ? '● Rejected' :
                                                '● Draft'}
                                </span>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <PlayCircle className="w-4 h-4" />
                                    <span>{totalLessons} lessons</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{Math.round(totalDuration / 3600)} hours</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span>{course.modules?.length || 0} modules</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handlePublishToggle}
                                disabled={publishing}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 border shadow-sm ${course.status === 'published' || course.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    }`}
                            >
                                {publishing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : course.status === 'published' || course.status === 'pending' ? (
                                    <>
                                        <EyeOff className="w-4 h-4" />
                                        Unpublish
                                    </>
                                ) : (
                                    <>
                                        <Globe className="w-4 h-4" />
                                        {course.status === 'rejected' ? 'Resubmit' : 'Publish'}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => router.push(`/tutor/courses/${id}/assignments`)}
                                className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-2"
                            >
                                <ClipboardList className="w-4 h-4" />
                                Assignments
                            </button>
                            <button
                                onClick={openSettingsModal}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Preview
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 mt-6 mb-6 px-1">
                    <button
                        onClick={() => setActiveTab('curriculum')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'curriculum'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        Curriculum
                    </button>
                    <button
                        onClick={() => setActiveTab('exams')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'exams'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <Award className="w-4 h-4" />
                        Exams ({courseExams.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'announcements'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <Megaphone className="w-4 h-4" />
                        Announcements
                    </button>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6">
                    {activeTab === 'curriculum' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 p-6 border-b border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-blue-600" />
                                            Course Curriculum
                                        </h2>
                                        <p className="text-sm text-slate-600 mt-1">Organize your lessons into modules</p>
                                    </div>
                                    <button
                                        onClick={() => setIsModuleModalOpen(true)}
                                        className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Module
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                {course.modules && course.modules.length > 0 ? (
                                    <div className="space-y-4">
                                        {course.modules.map((module, index) => {
                                            const moduleLessons = lessons.filter(l => l.moduleId === module._id);
                                            const moduleDuration = moduleLessons.reduce((acc, l) => acc + (l.content?.duration || 0), 0);
                                            const isEditing = editingModuleId === module._id;

                                            return (
                                                <div
                                                    key={module._id}
                                                    className="group border border-slate-200 rounded-xl bg-gradient-to-br from-white to-slate-50/50 hover:shadow-md transition-all duration-200"
                                                >
                                                    {/* Module Header */}
                                                    <div className="p-5 bg-white rounded-t-xl border-b border-slate-100">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <button className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <GripVertical className="w-5 h-5 text-slate-400" />
                                                                </button>

                                                                {isEditing ? (
                                                                    <div className="flex items-center gap-2 flex-1">
                                                                        <input
                                                                            type="text"
                                                                            value={editingModuleTitle}
                                                                            onChange={(e) => setEditingModuleTitle(e.target.value)}
                                                                            className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                            autoFocus
                                                                        />
                                                                        <button
                                                                            onClick={saveModuleEdit}
                                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                        >
                                                                            <Check className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={cancelModuleEdit}
                                                                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-lg font-bold text-slate-900">
                                                                                    Module {index + 1}: {module.title}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                                                                <span>{moduleLessons.length} lessons</span>
                                                                                <span>•</span>
                                                                                <span>{Math.round(moduleDuration / 60)} mins</span>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {!isEditing && (
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => openLessonModal(module._id)}
                                                                        className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                        Lesson
                                                                    </button>
                                                                    <div className="relative group/menu">
                                                                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                                                            <MoreVertical className="w-4 h-4 text-slate-600" />
                                                                        </button>
                                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                                                                            <button
                                                                                onClick={() => startEditingModule(module)}
                                                                                className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                                            >
                                                                                <Edit3 className="w-4 h-4" />
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => deleteModule(module._id)}
                                                                                className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Lessons List */}
                                                    <div className="p-4">
                                                        {moduleLessons.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {moduleLessons.map((lesson, idx) => (
                                                                    <div
                                                                        key={lesson._id}
                                                                        className="group/lesson flex items-center gap-4 p-4 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                                                                    >
                                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold text-sm shadow-sm">
                                                                            {idx + 1}
                                                                        </div>

                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <p className="font-semibold text-slate-900 truncate">{lesson.title}</p>
                                                                                {lesson.isFree && (
                                                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full ring-1 ring-emerald-200">
                                                                                        FREE
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                                                <div className="flex items-center gap-1">
                                                                                    {lesson.type === 'document' ? (
                                                                                        <FileText className="w-3 h-3 text-amber-500" />
                                                                                    ) : lesson.type === 'quiz' ? (
                                                                                        <AlertCircle className="w-3 h-3 text-purple-500" />
                                                                                    ) : (
                                                                                        <Video className="w-3 h-3 text-indigo-500" />
                                                                                    )}
                                                                                    <span className="capitalize">{lesson.type || 'video'}</span>
                                                                                </div>
                                                                                <span>•</span>
                                                                                <div className="flex items-center gap-1">
                                                                                    <Clock className="w-3 h-3" />
                                                                                    <span>{lesson.type === 'quiz' ? (lesson.content?.quiz?.timeLimit ? `${lesson.content.quiz.timeLimit} mins` : 'No Limit') : `${Math.round((lesson.content?.duration || 0) / 60)} mins`}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-2 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                                                                            {lesson.type === 'quiz' && (
                                                                                <button
                                                                                    onClick={() => router.push(`/tutor/courses/${id}/modules/${module._id}/lessons/${lesson._id}/quiz`)}
                                                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
                                                                                    title="Manage Quiz Questions"
                                                                                >
                                                                                    <FileText className="w-4 h-4" />
                                                                                    <span className="sr-only">Manage Quiz</span>
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={() => openLessonModal(module._id, lesson)}
                                                                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent"
                                                                            >
                                                                                <Edit3 className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => deleteLesson(lesson._id)}
                                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                                                <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                                                <p className="text-slate-500 font-medium mb-2">No lessons yet</p>
                                                                <p className="text-sm text-slate-400 mb-4">Add your first lesson to this module</p>
                                                                <button
                                                                    onClick={() => openLessonModal(module._id)}
                                                                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-2"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    Add Lesson
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
                                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                                            <FileText className="w-10 h-10 text-blue-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Start Building Your Course</h3>
                                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                                            Create your first module to organize your lessons and start building an amazing learning experience
                                        </p>
                                        <button
                                            onClick={() => setIsModuleModalOpen(true)}
                                            className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Create First Module
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'announcements' && (
                        <div className="space-y-6">
                            {/* Create Announcement Form */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <BellRing className="w-5 h-5 text-indigo-600" />
                                    Create Announcement
                                </h3>
                                <form onSubmit={handlePostAnnouncement} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={announcementForm.title}
                                            onChange={(e) => setAnnouncementForm(p => ({ ...p, title: e.target.value }))}
                                            placeholder="Keep it brief, e.g., 'Midterm Exam Materials Uploaded'"
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                        <textarea
                                            value={announcementForm.message}
                                            onChange={(e) => setAnnouncementForm(p => ({ ...p, message: e.target.value }))}
                                            placeholder="Write your announcement message here..."
                                            rows={4}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all resize-none"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                                            Post Announcement
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Previous Announcements List */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl">
                                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                                    <h3 className="font-bold text-slate-900">Previous Announcements</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {course.announcements && course.announcements.length > 0 ? (
                                        [...course.announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((ann, idx) => (
                                            <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-slate-900">{ann.title}</h4>
                                                    <span className="text-xs text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-md">
                                                        {new Date(ann.createdAt).toLocaleDateString()} {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 text-sm whitespace-pre-wrap">{ann.message}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-slate-500">
                                            <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                            <p>No announcements yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'exams' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 p-6 border-b border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                <Award className="w-5 h-5 text-blue-600" />
                                                Course Exams
                                            </h2>
                                            <p className="text-sm text-slate-600 mt-1">Exams linked to this course</p>
                                        </div>
                                        <Link
                                            href={`/tutor/quizzes/create?courseId=${id}&courseTitle=${encodeURIComponent(course.title)}`}
                                            className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Create Exam
                                        </Link>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {courseExams.length > 0 ? courseExams.map(exam => (
                                        <div key={exam._id} className="p-5 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900">{exam.title}</h3>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                            <span>{exam.totalQuestions || exam.questions?.length || 0} Questions</span>
                                                            <span>•</span>
                                                            <span>{exam.duration || 30} min</span>
                                                            {exam.type && <><span>•</span><span className="capitalize">{exam.type}</span></>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${exam.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {exam.status === 'published' ? 'Published' : 'Draft'}
                                                    </span>
                                                    {exam.examAttempts?.length > 0 && (
                                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                                            <Users className="w-3.5 h-3.5" />
                                                            {exam.examAttempts.length} attempts
                                                        </span>
                                                    )}
                                                    <Link href={`/tutor/quizzes/${exam._id}/edit`} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                                        <Edit3 className="w-4 h-4 text-slate-500" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-12 text-center">
                                            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <h3 className="font-semibold text-slate-700 mb-1">No Exams Yet</h3>
                                            <p className="text-sm text-slate-500 mb-4">Create an exam for this course</p>
                                            <Link
                                                href={`/tutor/quizzes/create?courseId=${id}&courseTitle=${encodeURIComponent(course.title)}`}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" /> Create First Exam
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Module Modal */}
            {isModuleModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                            <h3 className="text-xl font-bold">Create New Module</h3>
                            <p className="text-blue-100 text-sm mt-1">Add a new section to your course</p>
                        </div>
                        <form onSubmit={handleCreateModule} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Module Title
                                </label>
                                <input
                                    type="text"
                                    value={moduleTitle}
                                    onChange={(e) => setModuleTitle(e.target.value)}
                                    placeholder="e.g., Introduction to React Hooks"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModuleModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !moduleTitle}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {submitting ? 'Creating...' : 'Create Module'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Lesson Modal */}
            {
                isLessonModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shrink-0">
                                <h3 className="text-xl font-bold">{editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}</h3>
                                <p className="text-blue-100 text-sm mt-1">Add content to your module</p>
                            </div>
                            <form onSubmit={handleSaveLesson} className="flex flex-col flex-1 min-h-0">
                                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Lesson Type</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['video', 'document', 'quiz'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setLessonForm(prev => ({ ...prev, type }))}
                                                    className={`py-2 px-3 rounded-lg border-2 text-sm font-bold capitalize transition-all ${lessonForm.type === type
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                        : 'border-slate-200 text-slate-600 hover:border-blue-300'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Lesson Title
                                        </label>
                                        <input
                                            type="text"
                                            value={lessonForm.title}
                                            onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="e.g., Understanding useState Hook"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Lesson Overview
                                        </label>
                                        <textarea
                                            value={lessonForm.description}
                                            onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Briefly describe what students will learn in this lesson..."
                                            rows={3}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Resources & Attachments
                                        </label>
                                        <div className="space-y-3">
                                            {lessonForm.attachments.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                                            <FileText className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                                            <p className="text-xs text-slate-500 uppercase">{file.type?.split('/')[1] || 'File'}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAttachment(idx)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}

                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                    id="resource-upload"
                                                />
                                                <label
                                                    htmlFor="resource-upload"
                                                    className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 font-medium hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Upload Resource
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {lessonForm.type === 'video' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Video Content
                                            </label>

                                            <div className="space-y-4">
                                                {/* File Upload Option */}
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        onChange={handleVideoUpload}
                                                        accept="video/mp4,video/x-m4v,video/*"
                                                        className="hidden"
                                                        id="video-upload"
                                                        disabled={isUploadingVideo}
                                                    />
                                                    <label
                                                        htmlFor="video-upload"
                                                        className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-lg text-blue-700 font-medium hover:border-blue-500 hover:bg-blue-100 transition-all ${isUploadingVideo ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                                    >
                                                        {isUploadingVideo ? (
                                                            <><Loader2 className="w-5 h-5 animate-spin" /> Uploading & Processing...</>
                                                        ) : (
                                                            <><Video className="w-5 h-5" /> Upload Video (Auto HLS Conversion)</>
                                                        )}
                                                    </label>
                                                </div>

                                                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium uppercase tracking-wider before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">
                                                    OR PASTE URL
                                                </div>

                                                {/* Direct URL Option */}
                                                <div>
                                                    <input
                                                        type="url"
                                                        value={lessonForm.videoUrl}
                                                        onChange={(e) => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                                                        placeholder="https://example.com/video.mp4"
                                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    />
                                                    <p className="text-xs text-slate-500 mt-2">Enter a direct video link or YouTube URL</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {lessonForm.type === 'document' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Upload Documents (PDF, Word, PPT)
                                            </label>
                                            <div className="space-y-3">
                                                {lessonForm.documents?.map((file, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                                                                <FileText className="w-4 h-4 text-amber-600" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDocument(idx)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}

                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        onChange={handleDocumentUpload}
                                                        className="hidden"
                                                        id="document-upload"
                                                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                                                    />
                                                    <label
                                                        htmlFor="document-upload"
                                                        className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-lg text-amber-700 font-medium hover:border-amber-500 hover:bg-amber-100 transition-all cursor-pointer"
                                                    >
                                                        <Upload className="w-5 h-5" />
                                                        Upload Document File
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {lessonForm.type === 'quiz' && (
                                        <div className="bg-purple-50 p-4 border border-purple-200 rounded-lg flex flex-col items-center justify-center text-center">
                                            <AlertCircle className="w-8 h-8 text-purple-500 mb-2" />
                                            <h4 className="font-bold text-purple-900">Quiz Builder</h4>
                                            <p className="text-sm text-purple-700 mt-1 mb-4">Quiz questions are managed in the Quiz Builder interface after creation. Basic info is saved here.</p>

                                            <div className="w-full grid grid-cols-2 gap-4 text-left">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Passing Score (%)</label>
                                                    <input
                                                        type="number"
                                                        value={lessonForm.quiz?.passingScore || 70}
                                                        onChange={(e) => setLessonForm(p => ({ ...p, quiz: { ...p.quiz, passingScore: e.target.value } }))}
                                                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Time Limit (mins)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="No limit"
                                                        value={lessonForm.quiz?.timeLimit || ''}
                                                        onChange={(e) => setLessonForm(p => ({ ...p, quiz: { ...p.quiz, timeLimit: e.target.value } }))}
                                                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {lessonForm.type !== 'quiz' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Duration (minutes)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={lessonForm.duration}
                                                    onChange={(e) => setLessonForm(prev => ({ ...prev, duration: e.target.value }))}
                                                    placeholder="15"
                                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                                                <input
                                                    type="checkbox"
                                                    id="isFree"
                                                    checked={lessonForm.isFree}
                                                    onChange={(e) => setLessonForm(prev => ({ ...prev, isFree: e.target.checked }))}
                                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                                                />
                                                <label htmlFor="isFree" className="text-sm font-medium text-slate-700 cursor-pointer">
                                                    Mark as free preview lesson
                                                </label>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Sticky Footer */}
                                <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsLessonModalOpen(false)}
                                            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting || !lessonForm.title}
                                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            {submitting ? 'Saving...' : (editingLessonId ? 'Update Lesson' : 'Add Lesson')}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white border-b border-slate-700 shrink-0">
                            <h3 className="text-xl font-bold">Course Settings</h3>
                            <p className="text-slate-300 text-sm mt-1">Update all course details</p>
                        </div>
                        <form onSubmit={handleSaveSettings} className="flex flex-col flex-1 min-h-0">
                            <div className="p-6 space-y-5 overflow-y-auto flex-1">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Course Title</label>
                                    <input
                                        type="text"
                                        value={settingsForm.title}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                    <textarea
                                        value={settingsForm.description}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Price (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={settingsForm.price}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, price: e.target.value }))}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Level</label>
                                        <select
                                            value={settingsForm.level}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, level: e.target.value }))}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Language</label>
                                    <input
                                        type="text"
                                        value={settingsForm.language}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, language: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Course Visibility</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${settingsForm.visibility === 'institute' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                            <input type="radio" name="visibility" value="institute" checked={settingsForm.visibility === 'institute'} onChange={(e) => setSettingsForm(prev => ({ ...prev, visibility: e.target.value }))} className="sr-only" />
                                            <Lock className="w-4 h-4 text-slate-600" />
                                            <div>
                                                <span className="block text-sm font-semibold">Institute</span>
                                                <span className="block text-xs text-slate-500">Your students only</span>
                                            </div>
                                        </label>
                                        <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${settingsForm.visibility === 'public' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                            <input type="radio" name="visibility" value="public" checked={settingsForm.visibility === 'public'} onChange={(e) => setSettingsForm(prev => ({ ...prev, visibility: e.target.value }))} className="sr-only" />
                                            <Globe className="w-4 h-4 text-slate-600" />
                                            <div>
                                                <span className="block text-sm font-semibold">Global</span>
                                                <span className="block text-xs text-slate-500">Visible to everyone</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">What Students Will Learn</label>
                                    <div className="space-y-2">
                                        {settingsForm.whatYouWillLearn.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => {
                                                        const updated = [...settingsForm.whatYouWillLearn];
                                                        updated[idx] = e.target.value;
                                                        setSettingsForm(prev => ({ ...prev, whatYouWillLearn: updated }));
                                                    }}
                                                    placeholder={`Learning outcome ${idx + 1}`}
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                                                />
                                                {settingsForm.whatYouWillLearn.length > 1 && (
                                                    <button type="button" onClick={() => {
                                                        const updated = settingsForm.whatYouWillLearn.filter((_, i) => i !== idx);
                                                        setSettingsForm(prev => ({ ...prev, whatYouWillLearn: updated }));
                                                    }} className="p-1 hover:bg-red-50 rounded text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setSettingsForm(prev => ({ ...prev, whatYouWillLearn: [...prev.whatYouWillLearn, ''] }))} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                            <Plus className="w-3 h-3" /> Add item
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Prerequisites & Requirements</label>
                                    <div className="space-y-2">
                                        {settingsForm.requirements.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => {
                                                        const updated = [...settingsForm.requirements];
                                                        updated[idx] = e.target.value;
                                                        setSettingsForm(prev => ({ ...prev, requirements: updated }));
                                                    }}
                                                    placeholder={`Requirement ${idx + 1}`}
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                                                />
                                                {settingsForm.requirements.length > 1 && (
                                                    <button type="button" onClick={() => {
                                                        const updated = settingsForm.requirements.filter((_, i) => i !== idx);
                                                        setSettingsForm(prev => ({ ...prev, requirements: updated }));
                                                    }} className="p-1 hover:bg-red-50 rounded text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setSettingsForm(prev => ({ ...prev, requirements: [...prev.requirements, ''] }))} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                            <Plus className="w-3 h-3" /> Add item
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsSettingsModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
}
