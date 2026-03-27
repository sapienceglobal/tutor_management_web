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
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 'xl' }) {
    const dims = { xl: 80, lg: 56, md: 40, sm: 32 };
    const fonts = { xl: T.size['3xl'], lg: T.size.xl, md: T.size.md, sm: T.size.base };
    const dim = dims[size];
    return (
        <div style={{
            width: dim, height: dim,
            borderRadius: R.xl,
            overflow: 'hidden',
            border: '3px solid white',
            boxShadow: S.card,
            flexShrink: 0,
            backgroundColor: C.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {src
                ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: T.fontFamily, fontSize: fonts[size], fontWeight: T.weight.black, color: C.iconColor }}>
                    {name?.[0]?.toUpperCase() || 'T'}
                  </span>}
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label }) {
    return (
        <button onClick={onClick}
            className="flex items-center gap-2 px-4 py-3.5 text-sm whitespace-nowrap border-b-2 transition-all"
            style={active
                ? { borderBottomColor: C.btnPrimary, color: C.btnPrimary, fontFamily: T.fontFamily, fontWeight: T.weight.bold, backgroundColor: `${C.btnPrimary}10` }
                : { borderBottomColor: 'transparent', color: C.textMuted, fontFamily: T.fontFamily, fontWeight: T.weight.medium }}>
            {Icon && <Icon className="w-4 h-4" />}
            {label}
        </button>
    );
}

// ─── Star Row ─────────────────────────────────────────────────────────────────
function StarRow({ rating, size = 4 }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-${size} h-${size} ${s <= Math.round(rating || 0) ? 'fill-current' : ''}`}
                    style={{ color: s <= Math.round(rating || 0) ? '#f59e0b' : C.cardBorder }} />
            ))}
        </div>
    );
}

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, children, accentColor }) {
    const color = accentColor || C.btnPrimary;
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
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

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-11 h-11">
                    <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                        style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 animate-pulse" style={{ color: C.btnPrimary }} />
                    </div>
                </div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55 }}>
                    Loading tutor profile…
                </p>
            </div>
        </div>
    );

    if (!tutor) return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <div className="rounded-2xl p-8 text-center max-w-sm"
                style={{ ...cx.card() }}>
                <GraduationCap className="w-12 h-12 mx-auto mb-3" style={{ color: C.cardBorder }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginBottom: 16 }}>
                    Tutor not found.
                </p>
                <Link href="/student/tutors"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                    style={cx.btnSecondary()}>
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
        <div className="space-y-5 pb-10" style={pageStyle}>

            {/* ── Back link ─────────────────────────────────────────────── */}
            <Link href="/student/tutors"
                className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
                style={{ fontFamily: T.fontFamily, fontWeight: T.weight.semibold, color: C.textMuted }}>
                <ArrowLeft className="w-4 h-4" /> Back to Find a Tutor
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── LEFT: Profile + Tabs ──────────────────────────────── */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Profile hero */}
                    <div className="rounded-2xl overflow-hidden" style={{ ...cx.card() }}>
                        {/* Banner */}
                        <div className="h-24 relative overflow-hidden"
                            style={{ background: C.gradientBtn }}>
                            <div className="absolute inset-0 opacity-[0.08]"
                                style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        </div>

                        {/* Info */}
                        <div className="px-6 pb-5 -mt-10 relative">
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <Avatar src={tutor.userId?.profileImage} name={tutor.userId?.name} size="xl" />

                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading }}>
                                            {tutor.userId?.name}
                                        </h1>
                                        {tutor.isVerified && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                                                style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}`, fontFamily: T.fontFamily }}>
                                                <CheckCircle className="w-3 h-3" /> Verified
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.btnPrimary }}>
                                            {tutor.categoryId?.name || 'Expert'} Tutor
                                        </span>
                                        {tutor.instituteId && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                                                style={{ backgroundColor: `${C.chartLine}25`, color: C.chartLine, fontFamily: T.fontFamily, letterSpacing: T.tracking.wide }}>
                                                {tutor.instituteId.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <StarRow rating={tutor.rating} />
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>
                                                {tutor.rating?.toFixed(1) || 'New'}
                                            </span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                                ({tutor.reviewCount || 0})
                                            </span>
                                        </div>
                                        {[
                                            { icon: Award,  text: `${tutor.experience ?? 0} yrs exp` },
                                            { icon: Users,  text: `${tutor.studentsCount || 0} students` },
                                            { icon: MapPin, text: tutor.location || 'Online' },
                                        ].map(({ icon: Icon, text }) => (
                                            <span key={text} className="flex items-center gap-1.5"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.medium }}>
                                                <Icon className="w-3.5 h-3.5" /> {text}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs card */}
                    <div className="rounded-2xl overflow-hidden" style={cx.card()}>
                        {/* Tab bar */}
                        <div className="flex overflow-x-auto" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            {tabs.map(tab => (
                                <TabBtn key={tab.id} active={activeTab === tab.id}
                                    onClick={() => setActiveTab(tab.id)} icon={tab.icon} label={tab.label} />
                            ))}
                        </div>

                        <div className="p-6 min-h-[320px]">

                            {/* ── ABOUT ── */}
                            {activeTab === 'about' && (
                                <div className="space-y-5">
                                    <SectionTitle icon={GraduationCap}>About</SectionTitle>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, lineHeight: T.leading.relaxed, whiteSpace: 'pre-line' }}>
                                        {tutor.bio || 'Passionate tutor dedicated to helping students achieve their goals.'}
                                    </p>

                                    {tutor.title && (
                                        <div className="flex items-center gap-2 p-3 rounded-xl"
                                            style={{ backgroundColor: `${C.btnPrimary}12`, border: `1px solid ${C.btnPrimary}30` }}>
                                            <Award className="w-4 h-4 shrink-0" style={{ color: C.btnPrimary }} />
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.btnPrimary }}>
                                                {tutor.title}
                                            </span>
                                        </div>
                                    )}

                                    {tutor.subjects?.length > 0 && (
                                        <div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 8 }}>
                                                Subjects / Expertise
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {tutor.subjects.map((s, i) => (
                                                    <span key={i} className="px-3 py-1 rounded-full text-xs font-bold"
                                                        style={{ backgroundColor: `${C.btnPrimary}18`, color: C.btnPrimary, border: `1px solid ${C.btnPrimary}30`, fontFamily: T.fontFamily }}>
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.btnPrimary }}>
                                                {tutorCourses.length}
                                            </p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.medium, marginTop: 2 }}>
                                                Active Courses
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl text-center"
                                            style={{ background: C.gradientBtn, border: `1px solid ${C.btnPrimary}30` }}>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: '#ffffff' }}>
                                                ₹{tutor.hourlyRate ?? 0}
                                            </p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: 'rgba(255,255,255,0.65)', fontWeight: T.weight.medium, marginTop: 2 }}>
                                                Per Hour
                                            </p>
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
                                            <div className="w-8 h-8 rounded-full border-[3px] animate-spin"
                                                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                                        </div>
                                    ) : tutorCourses.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {tutorCourses.map(course => (
                                                <Link key={course._id} href={`/student/courses/${course._id}`}
                                                    className="block rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-all"
                                                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.btnPrimary}40`; e.currentTarget.style.boxShadow = S.card; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}>
                                                    <div className="aspect-video relative" style={{ backgroundColor: C.iconBg }}>
                                                        {course.thumbnail && (
                                                            <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        )}
                                                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-xs font-black shadow-sm"
                                                            style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: C.heading, fontFamily: T.fontFamily }}>
                                                            ₹{course.price ?? 0}
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <StarRow rating={course.rating} size={3} />
                                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, marginLeft: 2 }}>
                                                                {course.rating?.toFixed(1) || '—'}
                                                            </span>
                                                        </div>
                                                        <h4 className="line-clamp-2"
                                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                            {course.title}
                                                        </h4>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 4, fontWeight: T.weight.medium }}>
                                                            {course.lessons?.length || 0} lessons
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 rounded-2xl border-2 border-dashed"
                                            style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg }}>
                                            <BookOpen className="w-10 h-10 mx-auto mb-2" style={{ color: C.cardBorder }} />
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>No courses published yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── REVIEWS ── */}
                            {activeTab === 'reviews' && (
                                <div>
                                    <SectionTitle icon={Star} accentColor="#f59e0b">
                                        Reviews ({tutor.reviewCount || 0})
                                    </SectionTitle>
                                    {loadingReviews ? (
                                        <div className="flex justify-center py-12">
                                            <div className="w-8 h-8 rounded-full border-[3px] animate-spin"
                                                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                                        </div>
                                    ) : tutorReviews.length > 0 ? (
                                        <div className="space-y-3">
                                            {tutorReviews.map(review => (
                                                <div key={review._id} className="p-4 rounded-2xl"
                                                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                                                                style={{ backgroundColor: C.iconBg }}>
                                                                {review.studentId?.profileImage
                                                                    ? <img src={review.studentId.profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    : <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.iconColor }}>
                                                                        {review.studentId?.name?.[0]?.toUpperCase() || '?'}
                                                                      </span>}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                                    {review.studentId?.name}
                                                                </p>
                                                                <StarRow rating={review.rating} size={3} />
                                                            </div>
                                                        </div>
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, flexShrink: 0 }}>
                                                            {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, lineHeight: T.leading.relaxed, marginTop: 8 }}>
                                                        {review.comment}
                                                    </p>
                                                    {review.courseId?.title && (
                                                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                                                            style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted, fontFamily: T.fontFamily }}>
                                                            {review.courseId.title}
                                                        </span>
                                                    )}
                                                    {review.tutorResponse?.comment && (
                                                        <div className="mt-3 p-3 rounded-r-xl border-l-[3px]"
                                                            style={{ backgroundColor: `${C.btnPrimary}10`, borderLeftColor: `${C.btnPrimary}40` }}>
                                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 4 }}>
                                                                Tutor Reply
                                                            </p>
                                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.btnPrimary, fontWeight: T.weight.medium }}>
                                                                {review.tutorResponse.comment}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 rounded-2xl border-2 border-dashed"
                                            style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg }}>
                                            <MessageSquare className="w-10 h-10 mx-auto mb-2" style={{ color: C.cardBorder }} />
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>No reviews yet.</p>
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
                                                const hasSlots  = datesWithSlots.includes(dateStr);
                                                const isSelected = selectedDate && isSameDay(date, selectedDate);
                                                return (
                                                    <button key={dateStr} type="button"
                                                        onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                                                        disabled={!hasSlots}
                                                        className="min-w-[60px] py-3 px-2 text-center shrink-0 rounded-xl border-2 transition-all"
                                                        style={isSelected
                                                            ? { background: C.gradientBtn, color: '#ffffff', borderColor: C.btnPrimary, fontFamily: T.fontFamily }
                                                            : hasSlots
                                                                ? { backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, color: C.heading, fontFamily: T.fontFamily }
                                                                : { backgroundColor: C.innerBg, borderColor: C.innerBg, color: C.textMuted, cursor: 'not-allowed', fontFamily: T.fontFamily }}>
                                                        <span className="block text-[10px] font-bold uppercase tracking-wider">
                                                            {format(date, 'EEE')}
                                                        </span>
                                                        <span className="block text-lg font-black">{format(date, 'd')}</span>
                                                        {hasSlots && !isSelected && (
                                                            <span className="block w-1.5 h-1.5 rounded-full mx-auto mt-1"
                                                                style={{ backgroundColor: C.success }} />
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
                                                        className="py-2.5 px-3 rounded-xl border-2 text-sm font-bold transition-all"
                                                        style={selectedSlot === slot
                                                            ? { background: C.gradientBtn, color: '#ffffff', borderColor: C.btnPrimary, fontFamily: T.fontFamily }
                                                            : { backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, color: C.heading, fontFamily: T.fontFamily }}>
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 rounded-2xl border-2 border-dashed"
                                                style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg }}>
                                                <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: C.cardBorder }} />
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
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

                {/* ── RIGHT: Booking card ───────────────────────────────── */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl overflow-hidden sticky top-6" style={cx.card()}>
                        {/* Rate header */}
                        <div className="px-5 py-5 text-center relative overflow-hidden"
                            style={{ background: C.gradientBtn }}>
                            <div className="absolute inset-0 opacity-[0.07]"
                                style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                            <p className="relative" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                Hourly Rate
                            </p>
                            <p className="relative" style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.black, color: '#ffffff' }}>
                                ₹{tutor.hourlyRate ?? 0}
                            </p>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Booking summary */}
                            <div className="p-4 rounded-xl" style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-4 h-4" style={{ color: C.success }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                        Booking Details
                                    </p>
                                </div>
                                <dl className="space-y-2">
                                    {[
                                        { label: 'Date',     value: selectedDate ? format(selectedDate, 'PPP') : '—', highlight: false },
                                        { label: 'Time',     value: selectedSlot || 'Select a slot',                   highlight: !!selectedSlot },
                                        { label: 'Duration', value: '60 minutes',                                      highlight: false },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between">
                                            <dt style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.medium }}>
                                                {item.label}
                                            </dt>
                                            <dd style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: item.highlight ? C.btnPrimary : C.heading }}>
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            {/* Note textarea */}
                            <div>
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>
                                    Note for tutor (optional)
                                </label>
                                <textarea rows={3} placeholder="What would you like to focus on?"
                                    value={bookingNote}
                                    onChange={e => setBookingNote(e.target.value)}
                                    style={{ ...cx.input(), width: '100%', padding: '10px 14px', resize: 'none' }}
                                    onFocus={e => Object.assign(e.target.style, cx.inputFocus)}
                                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>

                            {/* Book button */}
                            <button disabled={!selectedSlot || bookingLoading}
                                onClick={handleBookAppointment}
                                className="w-full py-3 text-sm text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontWeight: T.weight.black, boxShadow: selectedSlot ? S.btn : 'none' }}>
                                {bookingLoading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</>
                                    : <><CalendarIcon className="w-4 h-4" /> Confirm Booking</>}
                            </button>

                            <p style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted, textAlign: 'center' }}>
                                Free cancellation up to 24 hours before.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Floating AI Button ────────────────────────────────────── */}
            <button onClick={() => setAiOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 text-white text-sm rounded-2xl shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontWeight: T.weight.bold }}>
                <div className="relative">
                    <Bot className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                        style={{ backgroundColor: C.success }} />
                </div>
                Tutor Assistant
            </button>

            {/* ── AI Drawer ─────────────────────────────────────────────── */}
            {aiOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setAiOpen(false)} />
                    <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-[85vh] sm:h-[600px] sm:bottom-6 sm:right-6 sm:rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
                        style={{ border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily }}>
                        {/* Drawer header */}
                        <div className="px-5 py-4 flex items-center justify-between relative overflow-hidden"
                            style={{ background: C.gradientBtn, borderBottom: `1px solid ${C.cardBorder}` }}>
                            <div className="absolute inset-0 opacity-[0.07]"
                                style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                            <div className="relative flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#ffffff' }}>
                                        Tutor Assistant
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: T.weight.medium }}>
                                        Ask anything about this tutor
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setAiOpen(false)}
                                className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                                style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.20)'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.10)'; }}>
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