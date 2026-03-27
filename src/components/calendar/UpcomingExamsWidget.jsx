'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ArrowRight, Bell } from 'lucide-react';
import api from '@/lib/axios';
import { C, T, S } from '@/constants/tutorTokens';

export function UpcomingExamsWidget({ isTutor = false }) {
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchExams();
    }, []);

    // Calculate time left for the closest exam
    useEffect(() => {
        if (!upcomingExams || upcomingExams.length === 0) return;

        const earliestExamDate = new Date(upcomingExams[0].startDate).getTime();

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = earliestExamDate - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                setTimeLeft(null); // Exam has started
            }
        };

        // Initial call
        calculateTimeLeft();

        // Update every second
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [upcomingExams]);


    const fetchExams = async () => {
        try {
            const res = await api.get('/calendar/upcoming-exams');
            if (res.data.success) {
                setUpcomingExams(res.data.exams);
            }
        } catch (err) {
            console.error('Failed to fetch upcoming exams:', err);
            setError('Could not load upcoming exams.');
        } finally {
            setLoading(false);
        }
    };

    const wrapperClass = isTutor ? "rounded-2xl overflow-hidden shadow-sm flex flex-col h-full" : "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full";
    const wrapperStyle = isTutor ? { backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card, fontFamily: T.fontFamily } : {};

    if (loading) {
        return (
            <div className={wrapperClass} style={{ ...wrapperStyle, alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: isTutor ? C.btnPrimary : '#4f46e5' }}></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={wrapperClass} style={{ ...wrapperStyle, alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: isTutor ? C.warning : '#64748b' }}>
                <Bell className="w-8 h-8 mb-2 opacity-50" />
                <p>{error}</p>
            </div>
        );
    }

    if (upcomingExams.length === 0) {
        return (
            <div className={wrapperClass} style={{ ...wrapperStyle, alignItems: 'center', justifyContent: 'center', minHeight: '300px', textAlign: 'center', padding: '2rem' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: isTutor ? C.innerBg : '#f8fafc' }}>
                    <CalendarIcon className="w-8 h-8" style={{ color: isTutor ? C.iconColor : '#94a3b8' }} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: isTutor ? C.heading : '#1e293b' }}>No Upcoming Exams</h3>
                <p className="text-sm mt-2" style={{ color: isTutor ? C.text : '#64748b' }}>
                    {isTutor ? 'You have not scheduled any upcoming exams.' : 'You have no scheduled exams at this time. Relax!'}
                </p>
            </div>
        );
    }

    const nextExam = upcomingExams[0];
    const otherExams = upcomingExams.slice(1, 4); // Show max 3 other exams

    return (
        <div className={wrapperClass} style={wrapperStyle}>
            <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: isTutor ? C.cardBorder : '#f1f5f9' }}>
                <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={isTutor ? { width: 32, height: 32, backgroundColor: C.iconBg } : {}}>
                    <CalendarIcon className="w-4 h-4" style={{ color: isTutor ? C.iconColor : '#6366f1' }} />
                </div>
                <h3 className="font-bold" style={{ color: isTutor ? C.heading : '#1e293b' }}>Upcoming Exams</h3>
            </div>

            {/* Countdown Hero Section */}
            <div className="bg-gradient-to-br from-[#0F172A] to-indigo-950 text-white p-6 relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-orange-500 opacity-20 blur-2xl rounded-full"></div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <span className="inline-block px-2.5 py-1 bg-white/10 rounded-md text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">
                            Next Exam In
                        </span>

                        {timeLeft ? (
                            <div className="flex items-center gap-3 md:gap-4 mb-4">
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl md:text-3xl font-black">{String(timeLeft.days).padStart(2, '0')}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Days</span>
                                </div>
                                <span className="text-2xl font-bold text-slate-600 mb-4">:</span>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl md:text-3xl font-black">{String(timeLeft.hours).padStart(2, '0')}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Hrs</span>
                                </div>
                                <span className="text-2xl font-bold text-slate-600 mb-4">:</span>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl md:text-3xl font-black">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Min</span>
                                </div>
                                <span className="text-2xl font-bold text-slate-600 mb-4 hidden sm:block">:</span>
                                <div className="flex flex-col items-center hidden sm:flex">
                                    <span className="text-2xl md:text-3xl font-black text-orange-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Sec</span>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <span className="text-2xl font-black text-emerald-400">Started / Ending Soon</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-2">
                        <h4 className="font-bold text-lg line-clamp-1" title={nextExam.title}>{nextExam.title}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 mt-2 text-sm text-slate-300">
                            <span className="flex items-center gap-1.5 line-clamp-1">
                                <BookOpenIcon className="w-4 h-4 text-slate-400" />
                                {nextExam.courseId?.title}
                            </span>
                            <span className="flex items-center gap-1.5 whitespace-nowrap">
                                <Clock className="w-4 h-4 text-slate-400" />
                                {nextExam.duration} mins
                            </span>
                        </div>
                        <div className="mt-3 text-sm text-slate-400 flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4" />
                            {new Date(nextExam.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Other Upcoming Exams List */}
            {otherExams.length > 0 && (
                <div className="p-2 flex-1 overflow-y-auto">
                    <div className="px-3 pt-3 pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Later</div>
                    <div className="space-y-1">
                        {otherExams.map((exam) => (
                            <div key={exam._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 group transition-colors cursor-default">
                                <div className="flex flex-col w-[70%]">
                                    <span className="font-semibold text-slate-800 text-sm line-clamp-1">{exam.title}</span>
                                    <span className="text-xs text-slate-500 mt-0.5 line-clamp-1">{exam.courseId?.title}</span>
                                </div>
                                <div className="flex flex-col items-end text-xs w-[25%] text-right shrink-0">
                                    <span className="font-medium text-indigo-600">{new Date(exam.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    <span className="text-slate-400">{new Date(exam.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* View All Footer */}
            {!isTutor && (
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-center shrink-0">
                    <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center transition-colors">
                        View Exam Center <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                </div>
            )}
        </div>
    );
}

// Simple BookOpen helper for this file
function BookOpenIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    )
}
