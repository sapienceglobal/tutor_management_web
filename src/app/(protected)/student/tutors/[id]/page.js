'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import {
    Calendar as CalendarIcon, Clock, MapPin, Star, Award,
    CheckCircle, Loader2, BookOpen, MessageSquare, ArrowLeft,
    Users, Sparkles, GraduationCap, X, Bot
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, addDays, startOfToday, isSameDay, parse } from 'date-fns';
import AiTutorWidget from '@/components/AiTutorWidget';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const themeBg = '#dfdaf3';
const outerCard = '#EAE8FA';
const innerBox = '#E3DFF8';

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.15)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.bold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 'xl' }) {
    const dims = { xl: 96, lg: 56, md: 40, sm: 32 };
    const fonts = { xl: T.size['4xl'], lg: T.size.xl, md: T.size.md, sm: T.size.base };
    const dim = dims[size];
    return (
        <div style={{
            width: dim, height: dim,
            borderRadius: R['2xl'],
            overflow: 'hidden',
            border: `4px solid ${outerCard}`,
            boxShadow: S.card,
            flexShrink: 0,
            backgroundColor: innerBox,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {src ? (
                <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <span style={{ fontFamily: T.fontFamily, fontSize: fonts[size], fontWeight: T.weight.black, color: C.btnPrimary }}>
                    {name?.[0]?.toUpperCase() || 'T'}
                </span>
            )}
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label }) {
    return (
        <button onClick={onClick}
            className="flex items-center justify-center gap-2 px-5 py-2.5 w-full sm:w-auto rounded-xl transition-all border-none cursor-pointer whitespace-nowrap"
            style={active
                ? { backgroundColor: C.btnPrimary, color: '#ffffff', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                : { backgroundColor: 'transparent', color: C.textMuted, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
            {Icon && <Icon size={16} />}
            {label}
        </button>
    );
}

// ─── Star Row ─────────────────────────────────────────────────────────────────
function StarRow({ rating, size = 4 }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-${size} h-${size} ${s <= Math.round(rating || 0) ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'}`} />
            ))}
        </div>
    );
}

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, children, accentColor }) {
    const color = accentColor || C.btnPrimary;
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: innerBox }}>
                <Icon size={16} style={{ color }} />
            </div>
            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                {children}
            </h3>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
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

    const [selectedDate, setSelectedDate]   = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot]   = useState(null);
    const [bookingNote, setBookingNote]     = useState('');
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
            if (res.data?.success) setTutorCourses(res.data.courses || []);
        } catch {} finally { setLoadingCourses(false); }
    };

    const fetchTutorReviews = async () => {
        try {
            setLoadingReviews(true);
            const res = await api.get(`/reviews/tutor/${id}/public?limit=10`);
            if (res.data?.success) setTutorReviews(res.data.reviews || []);
        } catch {} finally { setLoadingReviews(false); }
    };

    const fetchTutorProfile = async () => {
        try {
            const res = await api.get(`/tutors/${id}`);
            if (res.data?.success) { setTutor(res.data.tutor); return res.data.tutor; }
        } catch { toast.error('Failed to load tutor'); }
        finally { setLoading(false); }
        return null;
    };

    const fetchTutorFullSchedule = async () => {
        try {
            const res = await api.get(`/appointments/schedule/${id}`);
            if (res.data?.success) calculateAvailableDates(res.data.schedule || [], res.data.dateOverrides || []);
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
            setAvailableSlots(res.data?.success ? res.data.slots || [] : []);
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
            if (res.data?.success) {
                toast.success('Appointment requested successfully! 🎉');
                setBookingNote(''); setSelectedSlot(null); fetchSlotsForDate();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to book appointment');
        } finally { setBookingLoading(false); }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily }}>
            <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading tutor profile…</p>
        </div>
    );

    if (!tutor) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily }}>
            <div className="rounded-3xl p-10 text-center max-w-sm shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                <GraduationCap className="w-16 h-16 mx-auto mb-4" style={{ color: C.textMuted, opacity: 0.3 }} />
                <p style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, marginBottom: 8 }}>Tutor not found</p>
                <p style={{ fontSize: T.size.sm, color: C.textMuted, marginBottom: 24 }}>The profile you are looking for does not exist or has been removed.</p>
                <Link href="/student/tutors" className="text-decoration-none block">
                    <button className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-white font-bold cursor-pointer border-none shadow-md transition-transform hover:scale-105"
                        style={{ background: C.gradientBtn, fontSize: T.size.sm, fontFamily: T.fontFamily }}>
                        <ArrowLeft size={16} /> Back to Search
                    </button>
                </Link>
            </div>
        </div>
    );

    const calendarDays = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));
    const tabs = [
        { id: 'about',    label: 'About',    icon: GraduationCap },
        { id: 'courses',  label: 'Courses',  icon: BookOpen },
        { id: 'reviews',  label: 'Reviews',  icon: MessageSquare },
        { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    ];

    return (
        <div className="w-full min-h-screen p-6 space-y-6 pb-20 relative" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Breadcrumb ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white/50 px-4 py-2 rounded-xl border border-white/60 shadow-sm w-fit">
                <Link href="/student/tutors" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5"><ArrowLeft size={14}/> Find a Tutor</Link>
                <span className="text-slate-300">/</span>
                <span className="text-slate-800">{tutor.userId?.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── LEFT: Profile + Tabs ──────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Profile Hero Card */}
                    <div className="rounded-3xl overflow-hidden shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                        {/* Banner */}
                        <div className="h-32 relative overflow-hidden" style={{ background: C.gradientBtn }}>
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        </div>

                        {/* Info */}
                        <div className="px-6 pb-6 sm:px-8 sm:pb-8 relative">
                            {/* Avatar pulled up */}
                            <div className="-mt-12 mb-4">
                                <Avatar src={tutor.userId?.profileImage} name={tutor.userId?.name} size="xl" />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap mb-1">
                                        <h1 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>
                                            {tutor.userId?.name}
                                        </h1>
                                        {tutor.isVerified && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider"
                                                style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` }}>
                                                <CheckCircle size={12} /> Verified
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 flex-wrap mb-4">
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                                            {tutor.categoryId?.name || 'Expert'} Tutor
                                        </span>
                                        {tutor.instituteId && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider"
                                                style={{ backgroundColor: innerBox, color: C.textMuted, border: `1px solid ${C.cardBorder}` }}>
                                                {tutor.instituteId.name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                            <StarRow rating={tutor.rating} size={4} />
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, marginLeft: 4 }}>
                                                {tutor.rating?.toFixed(1) || 'New'}
                                            </span>
                                            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>
                                                ({tutor.reviewCount || 0} reviews)
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {[
                                                { icon: Award,  text: `${tutor.experience ?? 0} yrs exp` },
                                                { icon: Users,  text: `${tutor.studentsCount || 0} students` },
                                                { icon: MapPin, text: tutor.location || 'Online' },
                                            ].map(({ icon: Icon, text }) => (
                                                <span key={text} className="flex items-center gap-1.5 text-xs font-bold" style={{ color: C.textMuted }}>
                                                    <Icon size={14} style={{ color: C.btnPrimary }} /> {text}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Card */}
                    <div className="rounded-3xl overflow-hidden shadow-sm border flex flex-col" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                        
                        {/* Tab Bar */}
                        <div className="flex p-2 overflow-x-auto custom-scrollbar border-b shrink-0" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                            {tabs.map(tab => (
                                <TabBtn key={tab.id} active={activeTab === tab.id}
                                    onClick={() => setActiveTab(tab.id)} icon={tab.icon} label={tab.label} />
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 md:p-8 flex-1 min-h-[400px]">
                            
                            {/* ── ABOUT ── */}
                            {activeTab === 'about' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <SectionTitle icon={GraduationCap}>About the Tutor</SectionTitle>
                                        <p style={{ fontSize: T.size.sm, color: C.heading, lineHeight: 1.7, fontWeight: T.weight.medium, whiteSpace: 'pre-line', margin: 0 }}>
                                            {tutor.bio || 'Passionate tutor dedicated to helping students achieve their goals through personalized and interactive learning sessions.'}
                                        </p>
                                    </div>

                                    {tutor.title && (
                                        <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ backgroundColor: '#E3DFF8', borderColor: C.btnPrimary }}>
                                            <Award size={20} color={C.btnPrimary} className="shrink-0" />
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                {tutor.title}
                                            </span>
                                        </div>
                                    )}

                                    {tutor.subjects?.length > 0 && (
                                        <div>
                                            <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
                                                Expertise & Subjects
                                            </p>
                                            <div className="flex flex-wrap gap-2.5">
                                                {tutor.subjects.map((s, i) => (
                                                    <span key={i} className="px-4 py-2 rounded-xl text-xs font-bold border shadow-sm"
                                                        style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderColor: C.cardBorder }}>
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="p-5 rounded-2xl text-center border" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                            <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.btnPrimary, margin: '0 0 4px 0', lineHeight: 1 }}>
                                                {tutorCourses.length}
                                            </p>
                                            <p style={{ fontSize: '11px', color: C.textMuted, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                                                Active Courses
                                            </p>
                                        </div>
                                        <div className="p-5 rounded-2xl text-center border shadow-md" style={{ background: C.gradientBtn, borderColor: 'rgba(255,255,255,0.1)' }}>
                                            <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: '#ffffff', margin: '0 0 4px 0', lineHeight: 1 }}>
                                                ₹{tutor.hourlyRate ?? 0}
                                            </p>
                                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                                                Per Hour
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── COURSES ── */}
                            {activeTab === 'courses' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <SectionTitle icon={BookOpen}>Courses by {tutor.userId?.name?.split(' ')[0]}</SectionTitle>
                                    
                                    {loadingCourses ? (
                                        <div className="flex justify-center py-16">
                                            <div className="w-10 h-10 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
                                        </div>
                                    ) : tutorCourses.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {tutorCourses.map(course => (
                                                <Link key={course._id} href={`/student/courses/${course._id}`} className="text-decoration-none block group">
                                                    <div className="rounded-2xl overflow-hidden transition-all duration-300 border shadow-sm"
                                                        style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = S.cardHover; }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = S.card; }}>
                                                        
                                                        <div className="aspect-video relative overflow-hidden" style={{ backgroundColor: outerCard }}>
                                                            {course.thumbnail && (
                                                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                            )}
                                                            <div className="absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-black shadow-md backdrop-blur-md"
                                                                style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: C.heading }}>
                                                                {course.price ? `₹${course.price}` : 'FREE'}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="p-4">
                                                            <div className="flex items-center gap-1.5 mb-2">
                                                                <StarRow rating={course.rating} size={3} />
                                                                <span style={{ fontSize: '11px', fontWeight: T.weight.black, color: C.heading, marginLeft: 2 }}>
                                                                    {course.rating?.toFixed(1) || '—'}
                                                                </span>
                                                            </div>
                                                            <h4 className="line-clamp-2" style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: '0 0 6px 0', lineHeight: 1.4 }}>
                                                                {course.title}
                                                            </h4>
                                                            <p style={{ fontSize: '11px', color: C.textMuted, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                                                                <BookOpen size={12} className="inline mr-1 opacity-60" /> {course.lessons?.length || 0} lessons
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 rounded-3xl border-2 border-dashed" style={{ borderColor: C.cardBorder, backgroundColor: innerBox }}>
                                            <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: C.cardBorder }} />
                                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>No courses published yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── REVIEWS ── */}
                            {activeTab === 'reviews' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <SectionTitle icon={Star} accentColor="#f59e0b">
                                        Student Reviews ({tutor.reviewCount || 0})
                                    </SectionTitle>
                                    
                                    {loadingReviews ? (
                                        <div className="flex justify-center py-16">
                                            <div className="w-10 h-10 rounded-full border-[3px] border-[#f59e0b]/30 border-t-[#f59e0b] animate-spin" />
                                        </div>
                                    ) : tutorReviews.length > 0 ? (
                                        <div className="space-y-4">
                                            {tutorReviews.map(review => (
                                                <div key={review._id} className="p-5 rounded-2xl border" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                                    <div className="flex items-start justify-between gap-4 mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-white shadow-sm" style={{ backgroundColor: outerCard }}>
                                                                {review.studentId?.profileImage
                                                                    ? <img src={review.studentId.profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    : <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.textMuted }}>
                                                                        {review.studentId?.name?.[0]?.toUpperCase() || '?'}
                                                                    </span>}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>
                                                                    {review.studentId?.name || 'Student'}
                                                                </p>
                                                                <StarRow rating={review.rating} size={3.5} />
                                                            </div>
                                                        </div>
                                                        <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, flexShrink: 0 }}>
                                                            {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    
                                                    <p style={{ fontSize: T.size.sm, color: C.heading, lineHeight: 1.6, fontWeight: T.weight.medium, margin: '0 0 8px 0' }}>
                                                        "{review.comment}"
                                                    </p>

                                                    {review.courseId?.title && (
                                                        <span className="inline-block px-3 py-1 rounded-lg text-[10px] font-bold border"
                                                            style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, color: C.textMuted }}>
                                                            Course: {review.courseId.title}
                                                        </span>
                                                    )}

                                                    {review.tutorResponse?.comment && (
                                                        <div className="mt-4 p-4 rounded-xl border-l-[4px]" style={{ backgroundColor: `${C.btnPrimary}10`, borderLeftColor: C.btnPrimary }}>
                                                            <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>
                                                                Tutor Reply
                                                            </p>
                                                            <p style={{ fontSize: T.size.sm, color: C.btnPrimary, fontWeight: T.weight.semibold, margin: 0, lineHeight: 1.5 }}>
                                                                {review.tutorResponse.comment}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 rounded-3xl border-2 border-dashed" style={{ borderColor: C.cardBorder, backgroundColor: innerBox }}>
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: C.cardBorder }} />
                                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>No reviews yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── SCHEDULE ── */}
                            {activeTab === 'schedule' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    
                                    {/* Date picker */}
                                    <div>
                                        <SectionTitle icon={CalendarIcon}>Select a Date</SectionTitle>
                                        <div className="flex gap-2.5 overflow-x-auto pb-3 custom-scrollbar">
                                            {calendarDays.map(date => {
                                                const dateStr = format(date, 'yyyy-MM-dd');
                                                const hasSlots  = datesWithSlots.includes(dateStr);
                                                const isSelected = selectedDate && isSameDay(date, selectedDate);
                                                return (
                                                    <button key={dateStr} type="button"
                                                        onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                                                        disabled={!hasSlots}
                                                        className="min-w-[64px] h-[80px] flex flex-col items-center justify-center shrink-0 rounded-2xl border-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                                                        style={isSelected
                                                            ? { background: C.gradientBtn, color: '#ffffff', borderColor: 'transparent', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }
                                                            : hasSlots
                                                                ? { backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, color: C.heading }
                                                                : { backgroundColor: innerBox, borderColor: 'transparent', color: C.textMuted, opacity: 0.6 }}>
                                                        <span style={{ fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                                                            {format(date, 'EEE')}
                                                        </span>
                                                        <span style={{ fontSize: T.size.xl, fontWeight: T.weight.black, lineHeight: 1 }}>
                                                            {format(date, 'd')}
                                                        </span>
                                                        {hasSlots && !isSelected && (
                                                            <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: C.success }} />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Time slots */}
                                    <div>
                                        <SectionTitle icon={Clock}>Available Time Slots</SectionTitle>
                                        {availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {availableSlots.map(slot => (
                                                    <button key={slot} type="button"
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className="py-3 px-4 rounded-xl border-2 transition-all cursor-pointer font-bold text-sm"
                                                        style={selectedSlot === slot
                                                            ? { background: C.gradientBtn, color: '#ffffff', borderColor: 'transparent', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)' }
                                                            : { backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, color: C.heading }}
                                                        onMouseEnter={e => { if(selectedSlot !== slot) e.currentTarget.style.borderColor = C.btnPrimary; }}
                                                        onMouseLeave={e => { if(selectedSlot !== slot) e.currentTarget.style.borderColor = C.cardBorder; }}>
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 rounded-2xl border-2 border-dashed" style={{ borderColor: C.cardBorder, backgroundColor: innerBox }}>
                                                <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: C.cardBorder }} />
                                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                                                    {selectedDate ? 'No slots available for this date.' : 'Select a date to see available slots.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Booking Widget ───────────────────────────────── */}
                <div className="lg:col-span-1">
                    <div className="rounded-3xl overflow-hidden sticky top-6 shadow-md border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                        
                        {/* Rate Header */}
                        <div className="px-6 py-8 text-center relative overflow-hidden" style={{ background: C.gradientBtn }}>
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                            <p className="relative" style={{ fontSize: '10px', fontWeight: T.weight.black, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>
                                Session Rate
                            </p>
                            <p className="relative" style={{ fontSize: T.size['4xl'], fontWeight: T.weight.black, color: '#ffffff', margin: 0, lineHeight: 1 }}>
                                ₹{tutor.hourlyRate ?? 0}<span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.7)' }}>/hr</span>
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Booking Summary */}
                            <div className="p-5 rounded-2xl border" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                        <CheckCircle size={14} style={{ color: C.success }} />
                                    </div>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                        Booking Details
                                    </p>
                                </div>
                                <dl className="space-y-3">
                                    {[
                                        { label: 'Date',     value: selectedDate ? format(selectedDate, 'MMM d, yyyy') : '—', highlight: false },
                                        { label: 'Time',     value: selectedSlot || 'Select a slot',                  highlight: !!selectedSlot },
                                        { label: 'Duration', value: '60 mins',                                        highlight: false },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between">
                                            <dt style={{ fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {item.label}
                                            </dt>
                                            <dd style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: item.highlight ? C.btnPrimary : C.heading }}>
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            {/* Note Textarea */}
                            <div className="space-y-2">
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                                    Message for Tutor (Optional)
                                </label>
                                <textarea rows={3} placeholder="What do you want to learn?"
                                    value={bookingNote}
                                    onChange={e => setBookingNote(e.target.value)}
                                    style={{ ...baseInputStyle, resize: 'none', backgroundColor: C.surfaceWhite }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                            </div>

                            {/* Confirm Button */}
                            <button disabled={!selectedSlot || bookingLoading}
                                onClick={handleBookAppointment}
                                className="w-full py-3.5 rounded-xl transition-all cursor-pointer border-none shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                                style={{ background: C.gradientBtn, color: '#fff', fontSize: T.size.sm, fontWeight: T.weight.black }}>
                                {bookingLoading
                                    ? <><Loader2 size={16} className="animate-spin" /> Requesting…</>
                                    : <><CalendarIcon size={16} /> Book Appointment</>}
                            </button>

                            <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textAlign: 'center', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Free cancellation up to 24 hours before.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Floating AI Button ────────────────────────────────────── */}
            <button onClick={() => setAiOpen(true)}
                className="fixed bottom-8 right-8 z-40 flex items-center gap-3 px-5 h-14 text-white rounded-full shadow-2xl transition-all cursor-pointer border border-white/20 hover:scale-105"
                style={{ background: C.gradientBtn, fontSize: T.size.sm, fontWeight: T.weight.black }}>
                <div className="relative flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
                    <Bot size={18} />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-indigo-600" style={{ backgroundColor: C.success }} />
                </div>
                Ask AI Assistant
            </button>

            {/* ── AI Drawer (Themed) ─────────────────────────────────────────────── */}
            {aiOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setAiOpen(false)} />
                    <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-[85vh] sm:h-[600px] sm:bottom-8 sm:right-8 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border animate-in slide-in-from-bottom-10 sm:slide-in-from-right-10 duration-300"
                        style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                        
                        {/* Drawer Header */}
                        <div className="px-6 py-5 flex items-center justify-between relative overflow-hidden shrink-0 border-b"
                            style={{ background: C.gradientBtn, borderColor: C.cardBorder }}>
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                            <div className="relative flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                    <Sparkles size={20} className="text-amber-300" />
                                </div>
                                <div>
                                    <p style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: '#ffffff', margin: '0 0 2px 0' }}>
                                        Tutor Assistant
                                    </p>
                                    <p style={{ fontSize: '11px', fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Ask anything about this tutor
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setAiOpen(false)} className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer border-none"
                                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}>
                                <X size={16} className="text-white" />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-hidden" style={{ backgroundColor: innerBox }}>
                            <AiTutorWidget
                                title="Profile Insights"
                                subtitle="I can analyze reviews, courses, and schedules."
                                context={{ pageType: 'tutor_profile', tutorId: tutor._id }}
                                className="h-full border-none rounded-none shadow-none bg-transparent"
                                recommendedTopics={[
                                    "What is this tutor's teaching experience?",
                                    "What subjects does this tutor specialize in?",
                                    "Summarize the reviews for this tutor.",
                                ]}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}