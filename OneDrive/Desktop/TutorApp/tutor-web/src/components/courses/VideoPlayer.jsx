import { Lock, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have this utility

export function VideoPlayer({
    videoUrl,
    thumbnail,
    isLocked = false,
    title,
    onPlay
}) {
    if (isLocked) {
        return (
            <div className="relative aspect-video w-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center group">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10" />
                {thumbnail && (
                    <img
                        src={thumbnail}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                )}
                <div className="z-20 flex flex-col items-center text-white text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Content Locked</h3>
                    <p className="text-gray-300 max-w-sm">
                        Enroll in this course to unlock this lesson and continue your learning journey.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            {videoUrl ? (
                <video
                    controls
                    className="w-full h-full"
                    poster={thumbnail}
                    onPlay={onPlay}
                >
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-white bg-gray-900">
                    <PlayCircle className="w-16 h-16 text-gray-500 mb-4" />
                    <p className="text-gray-400">Select a lesson to start watching</p>
                </div>
            )}
        </div>
    );
}
