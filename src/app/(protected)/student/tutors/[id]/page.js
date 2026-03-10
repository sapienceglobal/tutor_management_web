'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import {
    Calendar as CalendarIcon, Clock, MapPin, Star, Award,
    CheckCircle, Loader2, BookOpen, MessageSquare, ArrowLeft,
    Users, Sparkles, GraduationCap, X, Bot
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { format, addDays, startOfToday, isSameDay, parse } from 'date-fns';
import AiTutorWidget from '@/components/AiTutorWidget';

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ src, name, size = 'xl' }) {
    const dims = { xl: 'w-20 h-20', lg: 'w-14 h-14', md: 'w-10 h-10', sm: 'w-8 h-8' };
    const fonts = { xl: 'text-3xl', lg: 'text-xl', md: 'text-base', sm: 'text-sm' };
    return (
        <div className={`${dims[size]} rounded-2xl overflow-hidden border-[3px] border-white shadow-md shrink-0 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-accent)]`}>
            {src
                ? <img src={src} alt={name} className="w-full h-full object-cover" />
                : <div className={`w-full h-full flex items-center justify-center ${fonts[size]} font-black text-[var(--theme-primary)]/70`}>
                    {name?.[0]?.toUpperCase() || 'T'}
                  </div>}
        </div>
    );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
    return (
        <button onClick={onClick}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all
                ${active
                    ? 'border-[var(--theme-primary)] text-[var(--theme-primary)] bg-[var(--theme-primary)]/20/60'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
            {Icon && <Icon className="w-4 h-4" />}
            {label}
        </button>
    );
}

function StarRow({ rating, size = 4 }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-${size} h-${size} ${s <= Math.round(rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
            ))}
        </div>
    );
}

function SectionTitle({ icon: Icon, children, iconBg = 'bg-[var(--theme-primary)]/20', iconColor = 'text-[var(--theme-primary)]' }) {
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div className={`w-7 h-7 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">{children}</h3>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TutorDetailPage({ params }) {
    const { id } = use(params);

    const [tutor, setTutor]                   = useState(null);
    const [loading, setLoading]               = useState(true);
    const [activeTab, setActiveTab]           = useState('about');
    const [tutorCourses, setTutorCourses]     = useState([]);
    const [tutorReviews, setTutorReviews]     = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [aiOpen, setAiOpen]                 = useState(false);

    const [selectedDate, setSelectedDate]     = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot]     = useState(null);
    const [bookingNote, setBookingNote]       = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [datesWithSlots, setDatesWithSlots] = useState([]);

    useEffect(() => {
        (async () => {
            const tutorData = await fetchTutorProfile();
            fetchTutorFullSchedule();
            if (tutorData?._id) fetchTutorCourses(tutorData._id);
            fetchTutorReviews();
        })();
    }, [id]);

    const fetchTutorCourses = async (tutorDocId) => {
        if (!tutorDocId) return;
        try {
            setLoadingCourses(true);
            const res = await api.get(`/courses/tutor/${tutorDocId}`);
            if (res.data.success) setTutorCourses(res.data.courses || []);
        } catch {} finally { setLoadingCourses(false); }
    };

    const fetchTutorReviews = async () => {
        try {
            setLoadingReviews(true);
            const res = await api.get(`/reviews/tutor/${id}/public?limit=10`);
            if (res.data.success) setTutorReviews(res.data.reviews || []);
        } catch {} finally { setLoadingReviews(false); }
    };

    const fetchTutorProfile = async () => {
        try {
            const res = await api.get(`/tutors/${id}`);
            if (res.data.success) { setTutor(res.data.tutor); return res.data.tutor; }
        } catch { toast.error('Failed to load tutor'); }
        finally { setLoading(false); }
        return null;
    };

    const fetchTutorFullSchedule = async () => {
        try {
            const res = await api.get(`/appointments/schedule/${id}`);
            if (res.data.success) calculateAvailableDates(res.data.schedule || [], res.data.dateOverrides || []);
        } catch {}
    };

    const calculateAvailableDates = (schedule, overrides) => {
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const available = [];
        for (let i = 0; i < 14; i++) {
            const date = addDays(startOfToday(), i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayName = days[date.getDay()];
            const override = overrides?.find(o => o.date === dateStr);
            if (override) {
                if (!override.isBlocked && override.customSlots?.length > 0) available.push(dateStr);
            } else {
                const daySchedule = schedule?.find(d => d.day === dayName);
                if (daySchedule && daySchedule.isActive !== false && daySchedule.slots?.length > 0) available.push(dateStr);
            }
        }
        setDatesWithSlots(available);
        if (!selectedDate && available.length > 0) setSelectedDate(parse(available[0], 'yyyy-MM-dd', new Date()));
    };

    const fetchSlotsForDate = async () => {
        if (!selectedDate) return;
        try {
            const res = await api.get(`/appointments/schedule/${id}?date=${format(selectedDate, 'yyyy-MM-dd')}`);
            setAvailableSlots(res.data.success ? res.data.slots || [] : []);
        } catch { setAvailableSlots([]); }
    };

    useEffect(() => { if (id && selectedDate) fetchSlotsForDate(); }, [selectedDate, id]);

    const getSlotStartTime = (slot) => (slot && slot.includes('-') ? slot.split('-')[0] : slot);

    const handleBookAppointment = async () => {
        if (!selectedSlot) return;
        const [hours, minutes] = getSlotStartTime(selectedSlot).split(':').map(Number);
        const dateTime = new Date(selectedDate);
        dateTime.setHours(hours, minutes || 0, 0, 0);
        try {
            setBookingLoading(true);
            const res = await api.post('/appointments', { tutorId: id, dateTime: dateTime.toISOString(), notes: bookingNote });
            if (res.data.success) {
                toast.success('Appointment requested successfully!');
                setBookingNote(''); setSelectedSlot(null); fetchSlotsForDate();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to book appointment');
        } finally { setBookingLoading(false); }
    };

    // ── Loading / Not found ──────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-11 h-11">
                    <div className="w-11 h-11 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[var(--theme-primary)] animate-pulse" />
                    </div>
                </div>
                <p className="text-sm text-slate-400 font-medium">Loading tutor profile…</p>
            </div>
        </div>
    );

    if (!tutor) return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center max-w-sm">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium mb-4">Tutor not found.</p>
                <Link href="/student/tutors"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Tutors
                </Link>
            </div>
        </div>
    );

    const calendarDays = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));
    const tabs = [
        { id: 'about',    label: 'About',    icon: null },
        { id: 'courses',  label: 'Courses',  icon: BookOpen },
        { id: 'reviews',  label: 'Reviews',  icon: MessageSquare },
        { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    ];

    return (
        <div className="space-y-5 pb-10" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Back link ──────────────────────────────────────────────── */}
            <Link href="/student/tutors"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[var(--theme-primary)] transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Find a Tutor
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── LEFT: Profile + Tabs ────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Profile hero card */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Banner */}
                        <div className="h-24 relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-primary) 100%)' }}>
                            {/* dot grid */}
                            <div className="absolute inset-0 opacity-[0.08]"
                                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-[var(--theme-accent)]/20/20 blur-2xl" />
                        </div>

                        {/* Info */}
                        <div className="px-6 pb-5 -mt-10 relative">
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <Avatar src={tutor.userId?.profileImage} name={tutor.userId?.name} size="xl" />

                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-xl font-black text-slate-800">{tutor.userId?.name}</h1>
                                        {tutor.isVerified && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200">
                                                <CheckCircle className="w-3 h-3" /> Verified
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                        <span className="text-sm font-semibold text-[var(--theme-primary)]">
                                            {tutor.categoryId?.name || 'Expert'} Tutor
                                        </span>
                                        {tutor.instituteId && (
                                            <span className="px-2 py-0.5 bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] text-[10px] font-bold uppercase tracking-wider rounded-full border border-[var(--theme-accent)]/30">
                                                {tutor.instituteId.name || 'Institute'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Meta row */}
                                    <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <StarRow rating={tutor.rating} />
                                            <span className="text-xs font-bold text-slate-700">{tutor.rating?.toFixed(1) || 'New'}</span>
                                            <span className="text-xs text-slate-400">({tutor.reviewCount || 0})</span>
                                        </div>
                                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                            <Award className="w-3.5 h-3.5 text-[var(--theme-primary)]/70" /> {tutor.experience ?? 0} yrs exp
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                            <Users className="w-3.5 h-3.5 text-slate-400" /> {tutor.studentsCount || 0} students
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {tutor.location || 'Online'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs card */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Tab bar */}
                        <div className="flex border-b border-slate-100 overflow-x-auto">
                            {tabs.map(tab => (
                                <TabBtn key={tab.id} active={activeTab === tab.id}
                                    onClick={() => setActiveTab(tab.id)} icon={tab.icon} label={tab.label} />
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="p-6 min-h-[320px]">

                            {/* ── ABOUT ── */}
                            {activeTab === 'about' && (
                                <div className="space-y-5">
                                    <SectionTitle icon={GraduationCap}>About</SectionTitle>

                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                                        {tutor.bio || 'Passionate tutor dedicated to helping students achieve their goals.'}
                                    </p>

                                    {tutor.title && (
                                        <div className="flex items-center gap-2 p-3 bg-[var(--theme-primary)]/20 rounded-xl border border-[var(--theme-primary)]/30">
                                            <Award className="w-4 h-4 text-[var(--theme-primary)] shrink-0" />
                                            <span className="text-sm font-semibold text-[var(--theme-primary)]">{tutor.title}</span>
                                        </div>
                                    )}

                                    {tutor.subjects?.length > 0 && (
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.07em] mb-2">Subjects / Expertise</p>
                                            <div className="flex flex-wrap gap-2">
                                                {tutor.subjects.map((s, i) => (
                                                    <span key={i} className="px-3 py-1 bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] text-xs font-bold rounded-full border border-[var(--theme-primary)]/30">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                            <p className="text-2xl font-black text-[var(--theme-primary)]">{tutorCourses.length}</p>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">Active Courses</p>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-[var(--theme-primary)]/20 text-center"
                                            style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                            <p className="text-2xl font-black text-white">₹{tutor.hourlyRate ?? 0}</p>
                                            <p className="text-xs text-[var(--theme-primary)]/70 font-medium mt-0.5">Per Hour</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── COURSES ── */}
                            {activeTab === 'courses' && (
                                <div>
                                    <SectionTitle icon={BookOpen}>Courses by {tutor.userId?.name?.split(' ')[0]}</SectionTitle>

                                    {loadingCourses ? (
                                        <div className="flex justify-center py-12">
                                            <div className="relative w-8 h-8">
                                                <div className="w-8 h-8 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
                                            </div>
                                        </div>
                                    ) : tutorCourses.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {tutorCourses.map(course => (
                                                <Link key={course._id} href={`/student/courses/${course._id}`}
                                                    className="block bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden hover:border-[var(--theme-primary)]/30 hover:shadow-sm hover:-translate-y-0.5 transition-all">
                                                    <div className="aspect-video bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-accent)] relative">
                                                        {course.thumbnail && (
                                                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                                        )}
                                                        <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded-lg text-xs font-black text-slate-800 shadow-sm">
                                                            ₹{course.price ?? 0}
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <StarRow rating={course.rating} size={3} />
                                                            <span className="text-xs font-bold text-slate-700 ml-0.5">{course.rating?.toFixed(1) || '—'}</span>
                                                        </div>
                                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-2">{course.title}</h4>
                                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">{course.lessons?.length || 0} lessons</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
                                            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                            <p className="text-sm text-slate-400 font-medium">No courses published yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── REVIEWS ── */}
                            {activeTab === 'reviews' && (
                                <div>
                                    <SectionTitle icon={Star} iconBg="bg-amber-50" iconColor="text-amber-500">
                                        Reviews ({tutor.reviewCount || 0})
                                    </SectionTitle>

                                    {loadingReviews ? (
                                        <div className="flex justify-center py-12">
                                            <div className="w-8 h-8 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
                                        </div>
                                    ) : tutorReviews.length > 0 ? (
                                        <div className="space-y-3">
                                            {tutorReviews.map(review => (
                                                <div key={review._id}
                                                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-50/80 transition-colors">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-accent)] border border-white shadow-sm flex items-center justify-center text-sm font-black text-[var(--theme-primary)] overflow-hidden shrink-0">
                                                                {review.studentId?.profileImage
                                                                    ? <img src={review.studentId.profileImage} className="w-full h-full object-cover" />
                                                                    : review.studentId?.name?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">{review.studentId?.name}</p>
                                                                <StarRow rating={review.rating} size={3} />
                                                            </div>
                                                        </div>
                                                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
                                                            {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 leading-relaxed mt-2">{review.comment}</p>
                                                    {review.courseId?.title && (
                                                        <span className="inline-block mt-2 px-2.5 py-0.5 bg-white border border-slate-200 text-[11px] font-semibold text-slate-500 rounded-full">
                                                            {review.courseId.title}
                                                        </span>
                                                    )}
                                                    {review.tutorResponse?.comment && (
                                                        <div className="mt-3 p-3 bg-[var(--theme-primary)]/20 border-l-[3px] border-[var(--theme-primary)]/30 rounded-r-xl">
                                                            <p className="text-[10px] font-black text-[var(--theme-primary)] uppercase tracking-wider mb-1">Tutor Reply</p>
                                                            <p className="text-sm text-[var(--theme-primary)] font-medium">{review.tutorResponse.comment}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
                                            <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                            <p className="text-sm text-slate-400 font-medium">No reviews yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── SCHEDULE ── */}
                            {activeTab === 'schedule' && (
                                <div className="space-y-6">
                                    {/* Date picker */}
                                    <div>
                                        <SectionTitle icon={CalendarIcon}>Select Date</SectionTitle>
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {calendarDays.map(date => {
                                                const dateStr = format(date, 'yyyy-MM-dd');
                                                const hasSlots = datesWithSlots.includes(dateStr);
                                                const isSelected = selectedDate && isSameDay(date, selectedDate);
                                                return (
                                                    <button key={dateStr} type="button"
                                                        onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                                                        disabled={!hasSlots}
                                                        className={`min-w-[60px] py-3 px-2 rounded-xl border-2 text-center shrink-0 transition-all
                                                            ${isSelected
                                                                ? 'text-white border-[var(--theme-primary)]'
                                                                : hasSlots
                                                                    ? 'bg-white border-slate-200 text-slate-700 hover:border-[var(--theme-primary)]/30 hover:bg-[var(--theme-primary)]/20/50'
                                                                    : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'}`}
                                                        style={isSelected ? { background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' } : {}}>
                                                        <span className="block text-[10px] font-bold uppercase tracking-wider">
                                                            {format(date, 'EEE')}
                                                        </span>
                                                        <span className="block text-lg font-black">{format(date, 'd')}</span>
                                                        {hasSlots && !isSelected && (
                                                            <span className="block w-1.5 h-1.5 bg-emerald-400 rounded-full mx-auto mt-1" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Time slots */}
                                    <div>
                                        <SectionTitle icon={Clock}>Available Slots</SectionTitle>
                                        {availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {availableSlots.map(slot => (
                                                    <button key={slot} type="button"
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`py-2.5 px-3 rounded-xl border-2 text-sm font-bold transition-all
                                                            ${selectedSlot === slot
                                                                ? 'text-white border-[var(--theme-primary)]'
                                                                : 'bg-white border-slate-200 text-slate-700 hover:border-[var(--theme-primary)]/30 hover:bg-[var(--theme-primary)]/20/50'}`}
                                                        style={selectedSlot === slot ? { background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' } : {}}>
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                                <p className="text-sm text-slate-400 font-medium">
                                                    {selectedDate ? 'No slots available for this date.' : 'Select a date to see slots.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Booking card ─────────────────────────────────── */}
                <div className="lg:col-span-1 space-y-4">

                    {/* Booking card */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
                        {/* Rate header */}
                        <div className="px-5 py-4 border-b border-slate-100 text-center relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-sidebar) 100%)' }}>
                            <div className="absolute inset-0 opacity-[0.07]"
                                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                            <p className="text-[11px] font-bold text-[var(--theme-primary)]/70 uppercase tracking-[0.08em] relative">Hourly Rate</p>
                            <p className="text-3xl font-black text-white relative">₹{tutor.hourlyRate ?? 0}</p>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Booking summary */}
                            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <p className="text-xs font-bold text-slate-700 uppercase tracking-[0.07em]">Booking Details</p>
                                </div>
                                <dl className="space-y-2">
                                    {[
                                        { label: 'Date',     value: selectedDate ? format(selectedDate, 'PPP') : '—', highlight: false },
                                        { label: 'Time',     value: selectedSlot || 'Select a slot',                   highlight: !!selectedSlot },
                                        { label: 'Duration', value: '60 minutes',                                      highlight: false },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between text-xs">
                                            <dt className="text-slate-400 font-medium">{item.label}</dt>
                                            <dd className={`font-bold ${item.highlight ? 'text-[var(--theme-primary)]' : 'text-slate-700'}`}>
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            {/* Note textarea */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1.5">
                                    Note for tutor (optional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="What would you like to focus on?"
                                    value={bookingNote}
                                    onChange={e => setBookingNote(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] resize-none placeholder:text-slate-300 font-medium"
                                />
                            </div>

                            {/* Book button */}
                            <button
                                disabled={!selectedSlot || bookingLoading}
                                onClick={handleBookAppointment}
                                className="w-full py-3 text-sm font-black text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                {bookingLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</>
                                ) : (
                                    <><CalendarIcon className="w-4 h-4" /> Confirm Booking</>
                                )}
                            </button>

                            <p className="text-[11px] text-center text-slate-400 font-medium">
                                Free cancellation up to 24 hours before.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Floating AI Assistant Button ────────────────────────── */}
            <button
                onClick={() => setAiOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 text-white text-sm font-bold rounded-2xl shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                <div className="relative">
                    <Bot className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                Tutor Assistant
            </button>

            {/* ── AI Drawer Overlay ───────────────────────────────────── */}
            {aiOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                        onClick={() => setAiOpen(false)}
                    />
                    <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-[85vh] sm:h-[600px] sm:bottom-6 sm:right-6 sm:rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
                        style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-sidebar) 100%)' }}>
                            <div className="absolute inset-0 opacity-[0.07]"
                                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                            <div className="relative flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-[var(--theme-primary)]/70" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white">Tutor Assistant</p>
                                    <p className="text-[11px] text-[var(--theme-primary)]/70 font-medium">Ask anything about this tutor</p>
                                </div>
                            </div>
                            <button onClick={() => setAiOpen(false)}
                                className="relative w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <AiTutorWidget
                                title="Tutor Assistant"
                                subtitle="Want to know more about this tutor?"
                                context={{ pageType: 'tutor_profile', tutorId: tutor._id }}
                                recommendedTopics={[
                                    "What is this tutor's teaching experience?",
                                    "What subjects does this tutor specialize in?",
                                    "Is this tutor a good fit for me?",
                                ]}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}