'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import {
    Video,
    Calendar,
    Clock,
    ExternalLink,
    User,
    PlayCircle,
    BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function StudentLiveClassesPage() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/live-classes');
            if (response.data.success) {
                setClasses(response.data.liveClasses);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading live classes...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Video className="w-8 h-8 text-primary" />
                    Live Classes & Webinars
                </h1>
                <p className="text-gray-500">Join upcoming live sessions from your tutors.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-white rounded-xl border border-dashed">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900">No classes scheduled</h3>
                        <p className="text-gray-500">Check back later for upcoming sessions.</p>
                    </div>
                ) : (
                    classes.map(cls => {
                        const isPast = new Date(cls.dateTime) < new Date();
                        const tutorName = cls.tutorId?.userId?.name || 'Tutor';
                        const tutorImage = cls.tutorId?.userId?.profileImage || 'https://via.placeholder.com/40';

                        return (
                            <Card key={cls._id} className={`hover:shadow-lg transition-all duration-300 ${isPast && !cls.recordingLink ? 'opacity-75 grayscale' : ''}`}>
                                <CardContent className="p-0 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                                        <div className="flex justify-between items-start">
                                            <span className="bg-white/20 backdrop-blur-sm text-xs px-2 py-1 rounded-full">
                                                {cls.platform === 'zoom' ? 'Zoom Meeting' : 'Live Class'}
                                            </span>
                                            <span className="text-xs font-medium opacity-90">
                                                {cls.duration} min
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg mt-2 line-clamp-2">{cls.title}</h3>
                                        {cls.courseId?.title && (
                                            <div className="flex items-center gap-1 text-xs text-blue-100 mt-1">
                                                <BookOpen className="w-3 h-3" />
                                                <span className="truncate">{cls.courseId.title}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={tutorImage}
                                                alt={tutorName}
                                                className="w-10 h-10 rounded-full object-cover border"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{tutorName}</p>
                                                <p className="text-xs text-gray-500">Instructor</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span>{format(new Date(cls.dateTime), 'PPP')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span>{format(new Date(cls.dateTime), 'h:mm a')}</span>
                                            </div>
                                        </div>

                                        {cls.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2 border-t pt-3 mt-3">
                                                {cls.description}
                                            </p>
                                        )}

                                        <div className="flex gap-2">
                                            {(!isPast || !cls.recordingLink) && (
                                                <a
                                                    href={isPast ? '#' : cls.meetingLink}
                                                    target={isPast ? undefined : "_blank"}
                                                    rel="noopener noreferrer"
                                                    className={`
                                                        flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-colors
                                                        ${isPast
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg'
                                                        }
                                                    `}
                                                >
                                                    {isPast ? 'Ended' : <><ExternalLink className="w-4 h-4" /> Join Class</>}
                                                </a>
                                            )}

                                            {cls.recordingLink && (
                                                <a
                                                    href={cls.recordingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-colors"
                                                >
                                                    <PlayCircle className="w-4 h-4" />
                                                    Watch Recording
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
