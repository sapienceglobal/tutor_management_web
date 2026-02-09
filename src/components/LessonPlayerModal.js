'use client';

import { useState, useEffect, useRef } from 'react';
import {
    X,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    SkipBack,
    SkipForward,
    Settings,
    Download,
    FileText,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import QuizPlayer from '@/components/courses/QuizPlayer';

export default function LessonPlayerModal({
    lessons,
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
    const [activeTab, setActiveTab] = useState('resources');

    const videoRef = useRef(null);
    const progressIntervalRef = useRef(null);

    useEffect(() => {
        setCurrentLesson(lessons[currentIndex]);
        loadLessonProgress();

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            syncProgress();
        };
    }, [currentIndex]);

    const loadLessonProgress = async () => {
        try {
            const response = await api.get(`/progress/lesson/${lessons[currentIndex]._id}`);

            if (response.data && response.data.lastWatchedPosition) {
                if (videoRef.current) {
                    videoRef.current.currentTime = response.data.lastWatchedPosition;
                }
            }
        } catch (error) {
            console.warn('No previous progress found');
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
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        progressIntervalRef.current = setInterval(() => {
            syncProgress();
        }, 15000); // Sync every 15 seconds
    };

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
                startProgressSync();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(progress);
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

    const handleCompleteAndNext = async () => {
        setIsCompleting(true);

        try {
            // Mark as completed
            await api.post('/progress', {
                courseId,
                lessonId: currentLesson._id,
                lastWatchedPosition: videoRef.current?.currentTime || 0,
                timeSpent: videoRef.current?.currentTime || 0,
                completed: true
            });

            // Wait for backend processing
            await new Promise(resolve => setTimeout(resolve, 800));

            // Notify parent component
            if (onLessonComplete) {
                await onLessonComplete(currentLesson._id);
            }

            // Move to next lesson or close
            if (currentIndex < lessons.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                alert('🎉 Course Completed! Well done!');
                onClose(true); // Pass true to indicate completion
            }
        } catch (error) {
            alert('Failed to mark lesson as complete');
        } finally {
            setIsCompleting(false);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < lessons.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };



    // ... imports ...

    // ... inside component ...

    const isVideoLesson = currentLesson.type === 'video';
    const isQuizLesson = currentLesson.type === 'quiz';

    const handleQuizComplete = async () => {
        // Mark as completed in backend is handled by QuizPlayer usually via submit, 
        // but we might need to sync the 'progress' completion if QuizPlayer doesn't do it fully or if we want to advance.
        // Actually QuizPlayer submit calls backend which updates Progress.
        // So we just need to refresh progress or move next.

        // Wait a bit then move next
        setTimeout(() => {
            if (onLessonComplete) onLessonComplete(currentLesson._id);
            if (currentIndex < lessons.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                onClose(true);
            }
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onClose()}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-white font-bold text-lg">{currentLesson.title}</h2>
                        <p className="text-slate-400 text-sm">
                            Lesson {currentIndex + 1} of {lessons.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-slate-900 overflow-y-auto flex flex-col">
                {isVideoLesson && currentLesson.content?.videoUrl && (
                    <div className="relative bg-black aspect-video max-h-[60vh] shrink-0">
                        <video
                            ref={videoRef}
                            src={currentLesson.content.videoUrl}
                            className="w-full h-full"
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={() => setIsPlaying(false)}
                            onClick={handlePlayPause}
                        />

                        {/* Video Controls Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                {/* Progress Bar */}
                                <div
                                    className="h-1 bg-white/30 rounded-full mb-4 cursor-pointer"
                                    onClick={handleSeek}
                                >
                                    <div
                                        className="h-full bg-blue-600 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-between text-white">
                                    <div className="flex items-center gap-4">
                                        <button onClick={handlePlayPause} className="hover:scale-110 transition-transform">
                                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                        </button>
                                        <button className="hover:scale-110 transition-transform">
                                            <SkipBack className="w-5 h-5" />
                                        </button>
                                        <button className="hover:scale-110 transition-transform">
                                            <SkipForward className="w-5 h-5" />
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button onClick={toggleMute}>
                                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                            </button>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={volume}
                                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                                className="w-20"
                                            />
                                        </div>

                                        <span className="text-sm">
                                            {videoRef.current ? `${Math.floor(videoRef.current.currentTime / 60)}:${String(Math.floor(videoRef.current.currentTime % 60)).padStart(2, '0')}` : '0:00'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button className="hover:scale-110 transition-transform">
                                            <Settings className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => videoRef.current?.requestFullscreen()}
                                            className="hover:scale-110 transition-transform"
                                        >
                                            <Maximize className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isQuizLesson && (
                    <div className="flex-1 min-h-[500px] bg-slate-900">
                        <QuizPlayer lesson={currentLesson} onComplete={handleQuizComplete} />
                    </div>
                )}

                {/* Info & Resources (Only for Video lessons or if we want to show resources below quiz too) */}
                {/* Let's show resources only if it's NOT a quiz, or below quiz if desired. For now, specific to video flow or general content */}

                {isVideoLesson && (
                    <div className="flex-1 bg-slate-900">
                        <div className="max-w-4xl mx-auto p-6">
                            {/* Tabs */}
                            <div className="flex gap-4 mb-6 border-b border-slate-700">
                                <button
                                    onClick={() => setActiveTab('resources')}
                                    className={`pb-3 px-2 font-semibold transition-colors ${activeTab === 'resources'
                                        ? 'text-blue-400 border-b-2 border-blue-400'
                                        : 'text-slate-400 hover:text-slate-300'
                                        }`}
                                >
                                    Resources
                                </button>
                                <button
                                    onClick={() => setActiveTab('transcript')}
                                    className={`pb-3 px-2 font-semibold transition-colors ${activeTab === 'transcript'
                                        ? 'text-blue-400 border-b-2 border-blue-400'
                                        : 'text-slate-400 hover:text-slate-300'
                                        }`}
                                >
                                    Transcript
                                </button>
                            </div>
                            {/* Tab Content ... (rest of existing code) */}
                            {activeTab === 'resources' && (
                                <div className="space-y-4">
                                    <h3 className="text-white font-bold text-lg mb-4">Lesson Resources</h3>

                                    {currentLesson.content?.attachments?.length > 0 ? (
                                        currentLesson.content.attachments.map((file, index) => (
                                            <a
                                                key={index}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                                            >
                                                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-white font-semibold">{file.name}</h4>
                                                    <p className="text-slate-400 text-sm">{file.type.toUpperCase()}</p>
                                                </div>
                                                <Download className="w-5 h-5 text-slate-400" />
                                            </a>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 text-center py-8">No resources available</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'transcript' && (
                                <div className="text-slate-300 space-y-4">
                                    <p>Transcript not available for this lesson.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation (Only for Video) */}
            {isVideoLesson && (
                <div className="bg-slate-900 border-t border-slate-700 p-6 mt-auto">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        {currentIndex > 0 && (
                            <button
                                onClick={handlePrevious}
                                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Previous
                            </button>
                        )}

                        <button
                            onClick={handleCompleteAndNext}
                            disabled={isCompleting}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {isCompleting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    {currentIndex < lessons.length - 1 ? 'Complete & Next' : 'Finish Course'}
                                    {currentIndex < lessons.length - 1 && <ChevronRight className="w-5 h-5" />}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}