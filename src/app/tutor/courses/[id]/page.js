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
    EyeOff
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';

export default function ManageCoursePage({ params }) {
    const router = useRouter();
    const { id } = use(params);

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);

    const [loading, setLoading] = useState(true);
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

    const [currentModuleId, setCurrentModuleId] = useState(null);
    const [moduleTitle, setModuleTitle] = useState('');

    const [lessonForm, setLessonForm] = useState({
        title: '',
        videoUrl: '',
        duration: '',
        isFree: false
    });

    const [submitting, setSubmitting] = useState(false);
    const [editingModuleId, setEditingModuleId] = useState(null);
    const [editingModuleTitle, setEditingModuleTitle] = useState('');
    const [editingLessonId, setEditingLessonId] = useState(null);
    const [publishing, setPublishing] = useState(false);

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
        if (!confirm(`Are you sure you want to ${course.status === 'published' ? 'unpublish' : 'publish'} this course?`)) return;

        setPublishing(true);
        try {
            const newStatus = course.status === 'published' ? 'draft' : 'published';
            await api.patch(`/courses/${id}`, { status: newStatus });
            setCourse(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error(error);
            alert('Failed to update course status');
        } finally {
            setPublishing(false);
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
        } catch (error) {
            alert('Failed to create module');
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
        } catch (error) {
            alert('Failed to update module');
        }
    };

    const cancelModuleEdit = () => {
        setEditingModuleId(null);
        setEditingModuleTitle('');
    };

    const deleteModule = async (moduleId) => {
        if (!confirm('Delete this module? Associated lessons will be unlinked (or you should delete them first).')) return;

        try {
            const updatedModules = course.modules.filter(m => m._id !== moduleId);
            await api.patch(`/courses/${id}`, { modules: updatedModules });

            const res = await api.get(`/courses/${id}`);
            if (res.data.success) setCourse(res.data.course);
        } catch (error) {
            alert('Failed to delete module');
        }
    };

    // --- Lesson Management ---

    const openLessonModal = (moduleId, lesson = null) => {
        setCurrentModuleId(moduleId);
        if (lesson) {
            setEditingLessonId(lesson._id);
            setLessonForm({
                title: lesson.title,
                videoUrl: lesson.content?.videoUrl || '',
                duration: Math.round((lesson.content?.duration || 0) / 60).toString(),
                isFree: lesson.isFree
            });
        } else {
            setEditingLessonId(null);
            setLessonForm({ title: '', videoUrl: '', duration: '', isFree: false });
        }
        setIsLessonModalOpen(true);
    };

    const handleSaveLesson = async (e) => {
        e.preventDefault();
        if (!lessonForm.title || !currentModuleId) return;

        setSubmitting(true);
        try {
            const content = {
                videoUrl: lessonForm.videoUrl,
                duration: Number(lessonForm.duration) * 60 // Convert to seconds
            };

            if (editingLessonId) {
                // Update existing lesson
                await api.patch(`/lessons/${editingLessonId}`, {
                    title: lessonForm.title,
                    content,
                    isFree: lessonForm.isFree,
                });
            } else {
                // Create new lesson
                await api.post('/lessons', {
                    courseId: id,
                    moduleId: currentModuleId,
                    title: lessonForm.title,
                    content,
                    isFree: lessonForm.isFree,
                    type: 'video'
                });
            }

            // Refresh lessons
            const res = await api.get(`/lessons/course/${id}`);
            if (res.data.success) setLessons(res.data.lessons);

            setIsLessonModalOpen(false);
            setEditingLessonId(null);
        } catch (error) {
            console.error(error);
            alert('Failed to save lesson');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteLesson = async (lessonId) => {
        if (!confirm('Delete this lesson? This action cannot be undone.')) return;

        try {
            await api.delete(`/lessons/${lessonId}`);
            setLessons(prev => prev.filter(l => l._id !== lessonId));
        } catch (error) {
            alert('Failed to delete lesson');
        }
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
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.status === 'published'
                                    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                                    : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                                    }`}>
                                    {course.status === 'published' ? '● Published' : '● Draft'}
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
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 border shadow-sm ${course.status === 'published'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    }`}
                            >
                                {publishing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : course.status === 'published' ? (
                                    <>
                                        <EyeOff className="w-4 h-4" />
                                        Unpublish
                                    </>
                                ) : (
                                    <>
                                        <Globe className="w-4 h-4" />
                                        Publish
                                    </>
                                )}
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2">
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

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Curriculum Section */}
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
                                                                                <Video className="w-3 h-3" />
                                                                                <span>Video</span>
                                                                            </div>
                                                                            <span>•</span>
                                                                            <div className="flex items-center gap-1">
                                                                                <Clock className="w-3 h-3" />
                                                                                <span>{Math.round((lesson.content?.duration || 0) / 60)} mins</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => openLessonModal(module._id, lesson)}
                                                                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                                        >
                                                                            <Edit3 className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => deleteLesson(lesson._id)}
                                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            {isLessonModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                            <h3 className="text-xl font-bold">Add New Lesson</h3>
                            <p className="text-blue-100 text-sm mt-1">Create a new video lesson</p>
                        </div>
                        <form onSubmit={handleSaveLesson} className="p-6 space-y-5">
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
                                    Video URL
                                </label>
                                <input
                                    type="url"
                                    value={lessonForm.videoUrl}
                                    onChange={(e) => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                                    placeholder="https://example.com/video.mp4"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <p className="text-xs text-slate-500 mt-2">Enter a direct video link (MP4 format)</p>
                            </div>
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
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsLessonModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
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
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}