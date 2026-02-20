'use client';

import { useState, useEffect, useRef } from 'react';
import {
    X,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Settings,
    Download,
    FileText,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Loader2,
    ArrowLeft,
    Menu,
    List,
    ChevronDown,
    PlayCircle,
    Video,
    Image,
    MessageSquare,
    Send,
    Trash2,
    BookOpen,
    Award,
    Clock,
    FileQuestion
} from 'lucide-react';
import api from '@/lib/axios';
import QuizPlayer from '@/components/courses/QuizPlayer';

export default function LessonPlayerModal({
    lessons,
    modules = [],
    initialIndex,
    courseId,
    onClose,
    onLessonComplete
}) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [currentLesson, setCurrentLesson] = useState(lessons[initialIndex]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedModules, setExpandedModules] = useState([]);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [user, setUser] = useState(null);
    const [showControls, setShowControls] = useState(false);

    const videoRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    useEffect(() => {
        if (modules.length > 0) {
            const currentModuleId = currentLesson.moduleId?._id || currentLesson.moduleId;
            if (currentModuleId) {
                setExpandedModules([currentModuleId]);
            } else {
                setExpandedModules([modules[0]?._id]);
            }
        }
    }, [modules, currentLesson]);

    useEffect(() => {
        const newLesson = lessons[currentIndex];
        setCurrentLesson(newLesson);
        loadLessonProgress(newLesson._id);
        setProgress(0);
        setIsPlaying(false);

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [currentIndex, lessons]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.success) setUser(res.data.user);
            } catch (e) {
                console.error('Failed to fetch user');
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (activeTab === 'discussion') {
            fetchComments();
        }
    }, [activeTab, currentLesson._id]);

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const res = await api.get(`/comments/${currentLesson._id}`);
            if (res.data.success) setComments(res.data.comments);
        } catch (error) {
            console.error('Failed to fetch comments', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const res = await api.post(`/comments/${currentLesson._id}`, { text: commentText });
            if (res.data.success) {
                setComments(prev => [res.data.comment, ...prev]);
                setCommentText('');
            }
        } catch (error) {
            alert('Failed to post comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm('Delete this comment?')) return;
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(prev => prev.filter(c => c._id !== commentId));
        } catch (error) {
            alert('Failed to delete comment');
        }
    };

    const loadLessonProgress = async (lessonId) => {
        try {
            const response = await api.get(`/progress/lesson/${lessonId}`);
            if (response.data && response.data.lastWatchedPosition) {
                if (videoRef.current) {
                    videoRef.current.currentTime = response.data.lastWatchedPosition;
                }
            }
        } catch (error) {
            // No progress found
        }
    };

    const syncProgress = async () => {
        if (!videoRef.current || currentLesson.type !== 'video') return;
        try {
            await api.post('/progress', {
                courseId,
                lessonId: currentLesson._id,
                lastWatchedPosition: Math.floor(videoRef.current.currentTime),
                timeSpent: Math.floor(videoRef.current.currentTime),
                completed: false
            });
        } catch (error) {
            console.error('Error syncing progress:', error);
        }
    };

    const startProgressSync = () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(syncProgress, 15000);
    };

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                syncProgress();
            } else {
                videoRef.current.play();
                startProgressSync();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(p);
        }
    };

    const handleSeek = (e) => {
        if (videoRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime = pos * videoRef.current.duration;
        }
    };

    const handleVolumeChange = (newVolume) => {
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    const handleCompleteAndNext = async () => {
        setIsCompleting(true);
        try {
            await api.post('/progress', {
                courseId,
                lessonId: currentLesson._id,
                lastWatchedPosition: videoRef.current?.currentTime || 0,
                timeSpent: videoRef.current?.currentTime || 0,
                completed: true
            });

            if (onLessonComplete) await onLessonComplete(currentLesson._id);

            if (currentIndex < lessons.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                alert('Course Completed! 🎉');
                onClose(true);
            }
        } catch (error) {
            alert('Failed to update progress');
        } finally {
            setIsCompleting(false);
        }
    };

    const toggleModule = (moduleId) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const isVideoLesson = currentLesson.type === 'video';
    const hasYouTubeId = isVideoLesson ? getYouTubeVideoId(currentLesson.content?.videoUrl) : null;
    const isQuizLesson = currentLesson.type === 'quiz';

    return (
        <div className="fixed inset-0 z-[60] flex bg-black overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-6 bg-gradient-to-b from-black/90 to-transparent absolute top-0 left-0 right-0 z-30 backdrop-blur-sm">
                    <button
                        onClick={() => onClose()}
                        className="flex items-center gap-3 text-white/80 hover:text-white transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all group-hover:scale-110">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="hidden sm:inline font-semibold">Back to Course</span>
                    </button>

                    <div className="flex-1 px-6 text-center">
                        <h1 className="font-bold text-lg text-white line-clamp-1">{currentLesson.title}</h1>
                        <p className="text-xs text-white/60 hidden md:block">
                            Lesson {currentIndex + 1} of {lessons.length}
                        </p>
                    </div>

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                    >
                        <Menu className="w-5 h-5 text-white" />
                    </button>
                </header>

                {/* Video Player */}
                <main className="flex-1 relative bg-black" onMouseMove={handleMouseMove}>
                    {isVideoLesson ? (
                        <div className="w-full h-full flex items-center justify-center">
                            {hasYouTubeId ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${hasYouTubeId}?autoplay=0&rel=0&modestbranding=1`}
                                    title="YouTube video player"
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : currentLesson.content?.videoUrl ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        src={currentLesson.content.videoUrl}
                                        className="w-full h-full object-contain"
                                        onTimeUpdate={handleTimeUpdate}
                                        onEnded={() => setIsPlaying(false)}
                                        onClick={handlePlayPause}
                                    />

                                    {/* Custom Controls */}
                                    <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                                        {/* Progress Bar */}
                                        <div className="px-6 pb-4">
                                            <div
                                                className="group/bar h-1 bg-white/20 rounded-full cursor-pointer hover:h-1.5 transition-all relative"
                                                onClick={handleSeek}
                                            >
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full relative transition-all"
                                                    style={{ width: `${progress}%` }}
                                                >
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover/bar:scale-100 transition-transform shadow-lg"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Controls */}
                                        <div className="flex items-center justify-between px-6 pb-6">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={handlePlayPause}
                                                    className="text-white hover:scale-110 transition-transform"
                                                >
                                                    {isPlaying ? (
                                                        <Pause className="w-8 h-8" />
                                                    ) : (
                                                        <Play className="w-8 h-8 fill-current" />
                                                    )}
                                                </button>

                                                <div className="flex items-center gap-2 group/vol">
                                                    <button onClick={toggleMute} className="text-white hover:scale-110 transition-transform">
                                                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                    </button>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.1"
                                                        value={volume}
                                                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                                        className="w-0 group-hover/vol:w-20 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                                                    />
                                                </div>

                                                <div className="text-sm text-white/90 font-medium tabular-nums">
                                                    {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(videoRef.current?.duration || 0)}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => videoRef.current?.requestFullscreen()}
                                                    className="text-white hover:scale-110 transition-transform"
                                                >
                                                    <Maximize className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-12">
                                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Video className="w-12 h-12 text-slate-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Video Unavailable</h3>
                                    <p className="text-slate-400">The content for this lesson could not be loaded.</p>
                                </div>
                            )}
                        </div>
                    ) : isQuizLesson ? (
                        <div className="w-full h-full flex items-center justify-center p-8">
                            <QuizPlayer lesson={currentLesson} onComplete={handleCompleteAndNext} />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-12">
                            <div className="text-center max-w-2xl">
                                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                    <FileText className="w-12 h-12 text-white" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-4">{currentLesson.title}</h3>
                                <p className="text-slate-400 text-lg">This is a text-based lesson. Please refer to the resources or description below.</p>
                            </div>
                        </div>
                    )}
                </main>

                {/* Lesson Details */}
                <div className="bg-gradient-to-b from-slate-900 to-black border-t border-slate-800">
                    <div className="max-w-7xl mx-auto">
                        {/* Tabs */}
                        <div className="flex items-center gap-8 px-8 border-b border-slate-800">
                            {['overview', 'resources', 'discussion'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-4 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === tab
                                        ? 'text-indigo-400'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {tab === 'overview' && <BookOpen className="w-4 h-4 inline mr-2" />}
                                    {tab === 'resources' && <Download className="w-4 h-4 inline mr-2" />}
                                    {tab === 'discussion' && <MessageSquare className="w-4 h-4 inline mr-2" />}
                                    {tab}
                                    {activeTab === tab && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-8 max-h-96 overflow-y-auto relative">
                            {/* Overview Tab */}
                            <div className={`transition-all duration-300 ${activeTab === 'overview' 
                                ? 'opacity-100 translate-y-0 relative' 
                                : 'opacity-0 -translate-y-4 absolute inset-0 pointer-events-none'
                            }`}>
                                <h2 className="text-2xl font-bold text-white mb-4">About This Lesson</h2>
                                {currentLesson?.description ? (
                                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {currentLesson.description}
                                    </p>
                                ) : (
                                    <div className="text-center py-12 bg-slate-800/30 rounded-2xl">
                                        <p className="text-slate-500">No description available.</p>
                                    </div>
                                )}
                            </div>

                            {/* Resources Tab */}
                            <div className={`transition-all duration-300 ${activeTab === 'resources' 
                                ? 'opacity-100 translate-y-0 relative' 
                                : 'opacity-0 -translate-y-4 absolute inset-0 pointer-events-none'
                            }`}>
                                <h2 className="text-2xl font-bold text-white mb-4">Resources</h2>
                                {currentLesson?.content?.attachments?.length > 0 ? (
                                    <div className="space-y-3">
                                        {currentLesson.content.attachments.map((attachment, idx) => (
                                            <a
                                                key={idx}
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl transition-all duration-200 group"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="p-3 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                                                    {attachment.type?.includes('pdf') ? (
                                                        <FileText className="w-6 h-6 text-indigo-400" />
                                                    ) : attachment.type?.includes('image') ? (
                                                        <Image className="w-6 h-6 text-indigo-400" />
                                                    ) : (
                                                        <Download className="w-6 h-6 text-indigo-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors duration-200">
                                                        {attachment.name}
                                                    </h3>
                                                    <p className="text-sm text-slate-500">{attachment.type || 'File'}</p>
                                                </div>
                                                <Download className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-all duration-200 group-hover:translate-x-1" />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-800/30 rounded-2xl">
                                        <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                        <p className="text-slate-500">No resources available.</p>
                                    </div>
                                )}
                            </div>

                            {/* Discussion Tab */}
                            <div className={`transition-all duration-300 ${activeTab === 'discussion' 
                                ? 'opacity-100 translate-y-0 relative' 
                                : 'opacity-0 -translate-y-4 absolute inset-0 pointer-events-none'
                            }`}>
                                <h2 className="text-2xl font-bold text-white mb-6">Discussion</h2>

                                {/* Comment Form */}
                                <form onSubmit={handlePostComment} className="mb-8">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
                                            {user?.name?.[0] || 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 text-white rounded-xl px-4 py-3 focus:outline-none transition-all duration-200 resize-none focus:ring-2 focus:ring-indigo-500/20"
                                                rows={3}
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                {commentText && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setCommentText('')}
                                                        className="px-4 py-2 text-slate-400 hover:text-white transition-all duration-200 hover:scale-105"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                <button
                                                    type="submit"
                                                    disabled={!commentText.trim()}
                                                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-105 disabled:hover:scale-100"
                                                >
                                                    <Send className="w-4 h-4" />
                                                    Post
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>

                                {/* Comments */}
                                {loadingComments ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    </div>
                                ) : comments.length > 0 ? (
                                    <div className="space-y-6">
                                        {comments.map((comment, idx) => (
                                            <div 
                                                key={comment._id} 
                                                className="flex gap-4 group animate-in slide-in-from-bottom duration-300"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white overflow-hidden">
                                                    {comment.studentId?.avatar?.url ? (
                                                        <img src={comment.studentId.avatar.url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        comment.studentId?.name?.[0] || '?'
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-white">{comment.studentId?.name || 'Unknown'}</span>
                                                        <span className="text-xs text-slate-500">
                                                            {new Date(comment.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-300 leading-relaxed">{comment.text}</p>
                                                    {user && (user._id === comment.studentId?._id || user._id === comment.studentId) && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment._id)}
                                                            className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-500">No comments yet. Start the discussion!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-4 p-6 border-t border-slate-800">
                            <button
                                onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                                disabled={currentIndex === 0}
                                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Previous
                            </button>

                            <button
                                onClick={handleCompleteAndNext}
                                disabled={isCompleting}
                                className="flex-1 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                {isCompleting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Complete & Continue
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => currentIndex < lessons.length - 1 && setCurrentIndex(currentIndex + 1)}
                                disabled={currentIndex === lessons.length - 1}
                                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                            >
                                Next
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 right-0 z-40 w-96 bg-slate-900 border-l border-slate-800 transform transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 border-b border-slate-800 bg-slate-900">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-white flex items-center gap-2">
                            <List className="w-5 h-5 text-indigo-400" />
                            Course Content
                        </h2>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {modules.map((module, idx) => {
                        const moduleLessons = lessons.filter(l => (l.moduleId?._id || l.moduleId) === module._id);
                        const isExpanded = expandedModules.includes(module._id);

                        return (
                            <div key={module._id} className="border-b border-slate-800">
                                <button
                                    onClick={() => toggleModule(module._id)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                                >
                                    <div>
                                        <h3 className="font-bold text-white text-left">
                                            {idx + 1}. {module.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">{moduleLessons.length} lessons</p>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>

                                {isExpanded && (
                                    <div className="bg-black/20">
                                        {moduleLessons.map((lesson, lIdx) => {
                                            const isActive = lesson._id === currentLesson._id;

                                            return (
                                                <button
                                                    key={lesson._id}
                                                    onClick={() => setCurrentIndex(lessons.findIndex(l => l._id === lesson._id))}
                                                    className={`w-full px-6 py-3 flex items-center gap-3 border-l-4 transition-all ${isActive
                                                        ? 'bg-indigo-900/30 border-indigo-500'
                                                        : 'border-transparent hover:bg-slate-800/30'
                                                        }`}
                                                >
                                                    <div className={`${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                                                        {lesson.type === 'video' ? <PlayCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className={`text-sm ${isActive ? 'text-white font-semibold' : 'text-slate-400'}`}>
                                                            {lIdx + 1}. {lesson.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Clock className="w-3 h-3 text-slate-600" />
                                                            <span className="text-xs text-slate-600">
                                                                {lesson.content?.duration ? `${Math.round(lesson.content.duration / 60)} min` : '5 min'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </aside>
        </div>
    );
}