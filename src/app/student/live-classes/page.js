'use client';

import { useEffect, useState } from 'react';
import {
    Calendar,
    Clock,
    Video,
    Users,
    ChevronLeft,
    ChevronRight,
    PlayCircle,
    Bell,
    Repeat,
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';

const SCHEDULE_PAGE_SIZE = 4;

export default function LiveClassesPage() {
    const [liveClasses, setLiveClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [schedulePage, setSchedulePage] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/live-classes');
                if (res.data.success && res.data.liveClasses) {
                    setLiveClasses(res.data.liveClasses);
                }
            } catch (error) {
                console.error('Error fetching live classes:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const getClassesForDate = (date) => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        return liveClasses.filter((c) => {
            const dt = new Date(c.dateTime);
            return dt >= dayStart && dt < dayEnd;
        }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    };

    const todayClasses = getClassesForDate(selectedDate);
    const upcomingClasses = liveClasses
        .filter((c) => new Date(c.dateTime) >= now)
        .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
        .slice(0, 5);
    const pastClasses = liveClasses
        .filter((c) => new Date(c.dateTime) < now)
        .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
        .slice(0, 5);

    const allScheduled = liveClasses
        .filter((c) => new Date(c.dateTime) >= now)
        .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    const scheduleTotalPages = Math.max(1, Math.ceil(allScheduled.length / SCHEDULE_PAGE_SIZE));
    const scheduleSlice = allScheduled.slice(
        (schedulePage - 1) * SCHEDULE_PAGE_SIZE,
        schedulePage * SCHEDULE_PAGE_SIZE
    );

    const isLive = (c) => {
        const start = new Date(c.dateTime);
        const end = new Date(start.getTime() + (c.duration || 60) * 60 * 1000);
        return now >= start && now <= end;
    };

    const joinClass = async (c) => {
        try {
            await api.post(`/live-classes/${c._id}/attendance`).catch(() => {});
            if (c.meetingId) {
                window.open(`https://meet.jit.si/${c.meetingId}`, '_blank');
            } else if (c.meetingLink) {
                window.open(c.meetingLink, '_blank');
            }
        } catch (e) {
            if (c.meetingLink) window.open(c.meetingLink, '_blank');
        }
    };

    const formatDisplayDate = (d) => {
        return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const shiftDate = (delta) => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + delta);
        setSelectedDate(next);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f2f8]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
                {/* Banner: Title + Subtitle + Illustration */}
                <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 lg:p-8">
                        <div className="space-y-2">
                            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Live Classes</h1>
                            <p className="text-slate-600 max-w-xl">
                                Join your live classes and interact with instructors in real-time to enhance your learning.
                            </p>
                        </div>
                        <div className="hidden md:flex w-48 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl items-center justify-center text-slate-400">
                            <Video className="w-16 h-16 opacity-60" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Today's Classes + Schedule Table */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Today's Classes */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <h2 className="font-bold text-slate-900">Today&apos;s Classes</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => shiftDate(-1)}
                                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-medium text-slate-700 min-w-[180px] text-center">
                                        {formatDisplayDate(selectedDate)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => shiftDate(1)}
                                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                {todayClasses.length > 0 ? (
                                    todayClasses.map((c) => (
                                        <div
                                            key={c._id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-indigo-200 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900">{c.title}</h3>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {c.tutorId?.userId?.name || 'Instructor'}
                                                    {c.courseId?.title && ` (${c.courseId.title})`}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {c.duration || 60} min
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        — students
                                                    </span>
                                                    {c.scheduleDescription && (
                                                        <span className="flex items-center gap-1">
                                                            <Repeat className="w-4 h-4" />
                                                            {c.scheduleDescription}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {isLive(c) && (
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                                                        In Progress
                                                    </span>
                                                )}
                                                <Button
                                                    onClick={() => joinClass(c)}
                                                    className={isLive(c) ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}
                                                >
                                                    Join Class
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-500 text-center py-8">No classes scheduled for this day.</p>
                                )}
                            </div>
                        </div>

                        {/* My Live Classes Schedule Table */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <h2 className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900">
                                My Live Classes Schedule
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold text-slate-600">
                                            <th className="px-6 py-3">#</th>
                                            <th className="px-6 py-3">Class Name</th>
                                            <th className="px-6 py-3">Instructor</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Time</th>
                                            <th className="px-6 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scheduleSlice.length > 0 ? (
                                            scheduleSlice.map((c, idx) => (
                                                <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 text-slate-600">{(schedulePage - 1) * SCHEDULE_PAGE_SIZE + idx + 1}</td>
                                                    <td className="px-6 py-4 font-medium text-slate-900">{c.title}</td>
                                                    <td className="px-6 py-4 text-slate-700">{c.tutorId?.userId?.name || '—'}</td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        {new Date(c.dateTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        {new Date(c.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Button variant="outline" size="sm" className="gap-1">
                                                            <Bell className="w-4 h-4" />
                                                            Remind Me
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                                    No upcoming live classes.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {scheduleTotalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-slate-100">
                                    <Button variant="outline" size="sm" disabled={schedulePage <= 1} onClick={() => setSchedulePage((p) => p - 1)}>
                                        Previous
                                    </Button>
                                    {Array.from({ length: scheduleTotalPages }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setSchedulePage(p)}
                                            className={`w-9 h-9 rounded-lg text-sm font-medium ${schedulePage === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <Button variant="outline" size="sm" disabled={schedulePage >= scheduleTotalPages} onClick={() => setSchedulePage((p) => p + 1)}>
                                        Next
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Upcoming + Past */}
                    <div className="space-y-6">
                        {/* Upcoming Live Classes */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900">Upcoming Live Classes</h2>
                                {upcomingClasses.length > 3 && (
                                    <span className="text-sm font-medium text-indigo-600 cursor-pointer">View All</span>
                                )}
                            </div>
                            <div className="p-4 space-y-3">
                                {upcomingClasses.length > 0 ? (
                                    upcomingClasses.slice(0, 4).map((c) => (
                                        <div key={c._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0">
                                                {c.tutorId?.userId?.name?.charAt(0) || 'I'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-slate-800 truncate">{c.title}</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(c.dateTime).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} -{' '}
                                                    {new Date(c.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-500 text-sm py-4 text-center">No upcoming classes.</p>
                                )}
                            </div>
                        </div>

                        {/* Past Live Classes */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <h2 className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900">Past Live Classes</h2>
                            <div className="p-4 space-y-3">
                                {pastClasses.length > 0 ? (
                                    pastClasses.slice(0, 4).map((c) => (
                                        <div key={c._id} className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0">
                                                    {c.tutorId?.userId?.name?.charAt(0) || 'I'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 truncate">{c.title}</p>
                                                    <p className="text-xs text-slate-500">{c.tutorId?.userId?.name || 'Instructor'}</p>
                                                </div>
                                            </div>
                                            {c.recordingLink ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50"
                                                    onClick={() => window.open(c.recordingLink, '_blank')}
                                                >
                                                    <PlayCircle className="w-4 h-4 mr-1" />
                                                    View Recording
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-slate-400 shrink-0">No recording</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-500 text-sm py-4 text-center">No past classes.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
