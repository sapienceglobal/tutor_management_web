'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar, Clock, Video, Users, ArrowRight, BookOpen,
    MoreHorizontal, PlayCircle, CheckCircle, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'react-hot-toast';

export default function LiveClassesPage() {
    const [liveClasses, setLiveClasses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Live Classes
                // Assuming the backend has a route to get all live classes or student specific ones
                // If not, we might need to filter client side or update backend
                // For now, let's try generic fetch and filter for "upcoming"
                const classesRes = await api.get('/live-classes');
                if (classesRes.data.success) {
                    // Filter for upcoming/live
                    const now = new Date();
                    // Show classes that are upcoming OR (started less than duration ago ie. live)
                    const pending = classesRes.data.liveClasses.filter(c => {
                        const start = new Date(c.dateTime);
                        const durationMs = (c.duration || 60) * 60 * 1000;
                        const end = new Date(start.getTime() + durationMs);

                        // Show if:
                        // 1. It hasn't ended yet (Now < End)
                        // 2. OR status is 'live' manually set
                        return (now < end) || c.status === 'live';
                    }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

                    setLiveClasses(pending);
                }

                // Fetch Enrollments for "My Classroom"
                const enrollRes = await api.get('/enrollments/my-enrollments');
                if (enrollRes.data.success) {
                    setEnrollments(enrollRes.data.enrollments);
                }

            } catch (error) {
                console.error('Error fetching classroom data:', error);
                // toast.error("Failed to load classroom data"); // Optional: don't spam toast on load
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-student-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-student-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    // Determine the immediate next class
    const nextClass = liveClasses[0];

    return (
        <motion.div
            className="min-h-screen bg-student-bg p-6 lg:p-8 font-sans"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">My Classroom</h1>
                        <p className="text-slate-500 mt-1">Manage your live sessions and courses</p>
                    </div>
                </div>

                {/* 1. Upcoming Class Hero (Quez Style - High Emphasis) */}
                {nextClass ? (
                    <motion.div variants={item} className="relative overflow-hidden rounded-[2.5rem] bg-teal-900 text-white shadow-xl shadow-teal-900/20">
                        {/* Abstract Background Shapes */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

                        <div className="relative p-8 lg:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-6 flex-1">
                                <Badge className="bg-teal-400/20 text-teal-200 border-0 px-3 py-1 uppercase tracking-wider text-xs font-bold hover:bg-teal-400/30">
                                    Up Next
                                </Badge>

                                <div className="space-y-2">
                                    <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                                        {nextClass.title}
                                    </h2>
                                    <p className="text-teal-100 text-lg flex items-center gap-2">
                                        <Users className="w-5 h-5 opacity-70" />
                                        with {nextClass.tutorId?.userId?.name || 'Tutor'}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-6 text-sm text-teal-100/80">
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(nextClass.dateTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                        <Clock className="w-4 h-4" />
                                        {new Date(nextClass.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({nextClass.duration} mins)
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 min-w-[200px]">
                                <Button
                                    size="xl"
                                    className="h-14 bg-teal-400 hover:bg-teal-500 text-teal-950 font-bold text-lg rounded-2xl shadow-lg shadow-teal-500/20 transition-all hover:scale-105"
                                    onClick={async () => {
                                        // Mark Attendance (Fire and forget)
                                        try {
                                            await api.post(`/live-classes/${nextClass._id}/attendance`);
                                        } catch (err) {
                                            console.error('Attendance Error:', err);
                                        }

                                        if (nextClass.meetingId) {
                                            // Join Jitsi Meeting (External - New Tab)
                                            window.open(`https://meet.jit.si/${nextClass.meetingId}`, '_blank');
                                        } else {
                                            // External Link
                                            window.open(nextClass.meetingLink, '_blank');
                                        }
                                    }}
                                >
                                    <Video className="w-5 h-5 mr-2" />
                                    Join Class
                                </Button>

                                <div className="flex gap-2 justify-center">
                                    {nextClass.materialLink && (
                                        <Button
                                            variant="outline"
                                            className="border-teal-500/30 text-teal-100 hover:bg-teal-500/20 hover:text-white"
                                            onClick={() => window.open(nextClass.materialLink, '_blank')}
                                        >
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Resources
                                        </Button>
                                    )}
                                    {nextClass.recordingLink && (
                                        <Button
                                            variant="outline"
                                            className="border-teal-500/30 text-teal-100 hover:bg-teal-500/20 hover:text-white"
                                            onClick={() => window.open(nextClass.recordingLink, '_blank')}
                                        >
                                            <PlayCircle className="w-4 h-4 mr-2" />
                                            Watch Recording
                                        </Button>
                                    )}
                                </div>
                                <p className="text-center text-teal-200/60 text-sm">
                                    Starts {new Date(nextClass.dateTime) <= new Date() ? 'now' : 'soon'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div variants={item} className="p-12 rounded-[2.5rem] bg-indigo-900/5 border-2 border-dashed border-indigo-900/10 text-center">
                        <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Calendar className="w-8 h-8 text-indigo-300" />
                        </div>
                        <h3 className="text-xl font-bold text-indigo-900">No Upcoming Live Classes</h3>
                        <p className="text-indigo-600/70 mt-2">You're all caught up! Check back later for new sessions.</p>
                    </motion.div>
                )}

                {/* 2. My Classroom Grid (Subject Cards) */}
                <motion.div variants={item} className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-indigo-500" />
                        My Classroom
                    </h2>

                    {enrollments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrollments.map((enrollment, idx) => (
                                <Link href={`/student/courses/${enrollment.courseId?._id}`} key={enrollment._id}>
                                    <motion.div
                                        className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 cursor-pointer h-full flex flex-col"
                                        whileHover={{ y: -4 }}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${idx % 4 === 0 ? 'bg-orange-100 text-orange-600' :
                                                idx % 4 === 1 ? 'bg-purple-100 text-purple-600' :
                                                    idx % 4 === 2 ? 'bg-blue-100 text-blue-600' :
                                                        'bg-pink-100 text-pink-600'
                                                }`}>
                                                {/* Use first letter of course title as icon if no icon */}
                                                {enrollment.courseId?.title?.charAt(0) || 'C'}
                                            </div>
                                            <div className="p-2 rounded-full hover:bg-slate-50 text-slate-300 group-hover:text-indigo-500 transition-colors">
                                                <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 leading-tight">
                                                {enrollment.courseId?.title || 'Untitled Course'}
                                            </h3>
                                            <p className="text-slate-500 text-sm mb-6 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                {enrollment.courseId?.tutorId?.userId?.name || 'Unknown Tutor'}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-slate-400 uppercase tracking-wider">Progress</span>
                                                <span className="text-indigo-600">{enrollment.progress?.percentage || 0}%</span>
                                            </div>
                                            <Progress
                                                value={enrollment.progress?.percentage || 0}
                                                className="h-2 bg-slate-100"
                                            />
                                            {enrollment.progress?.percentage >= 100 && (
                                                <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-50 w-fit px-2 py-1 rounded-md">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Completed
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100">
                            <div className="max-w-md mx-auto">
                                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-900">No enrollments yet</h3>
                                <p className="text-slate-500 mb-6 mt-2">Join a course to see it here.</p>
                                <Button asChild>
                                    <Link href="/student/courses">Browse Courses</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* 3. Other Live Sessions (Horizontal List if any) */}
                {liveClasses.length > 1 && (
                    <motion.div variants={item} className="space-y-6 pt-4">
                        <h2 className="text-xl font-bold text-slate-800">More Upcoming Sessions</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {liveClasses.slice(1).map(session => (
                                <div key={session._id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-indigo-100 transition-colors">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-50 rounded-xl text-slate-600 font-bold border border-slate-100">
                                        <span className="text-[10px] uppercase">{new Date(session.dateTime).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-lg leading-none">{new Date(session.dateTime).getDate()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 truncate">{session.title}</h4>
                                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(session.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

            </div>
        </motion.div>
    );
}
