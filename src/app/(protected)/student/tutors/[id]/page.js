'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import {
    MdCalendarMonth,
    MdAccessTime,
    MdLocationOn,
    MdStar,
    MdStarBorder,
    MdEmojiEvents,
    MdCheckCircle,
    MdMenuBook,
    MdMessage,
    MdArrowBack,
    MdPeople,
    MdAutoAwesome,
    MdSchool,
    MdClose,
    MdSmartToy,
    MdSchedule,
    MdPerson,
    MdHourglassEmpty,
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { format, addDays, startOfToday, isSameDay, parse } from 'date-fns';
import AiTutorWidget from '@/components/AiTutorWidget';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow   = '0 0 0 3px rgba(117,115,232,0.15)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow   = 'none';
};

const baseInputStyle = {
    backgroundColor: C.cardBg,
    border:          `1px solid ${C.cardBorder}`,
    borderRadius:    '10px',
    color:           C.heading,
    fontFamily:      T.fontFamily,
    fontSize:        T.size.base,
    fontWeight:      T.weight.semibold,
    outline:         'none',
    width:           '100%',
    padding:         '12px 16px',
    transition:      'all 0.2s ease',
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 'xl' }) {
    const dims  = { xl: 88, lg: 52, md: 40, sm: 32 };
    const fonts = { xl: T.size['3xl'], lg: T.size.xl, md: T.size.md, sm: T.size.base };
    const dim   = dims[size];
    return (
        <div
            style={{
                width:           dim,
                height:          dim,
                borderRadius:    R.xl,
                overflow:        'hidden',
                border:          `3px solid ${C.cardBg}`,
                boxShadow:       S.card,
                flexShrink:      0,
                backgroundColor: C.innerBg,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
            }}
        >
            {src ? (
                <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <span
                    style={{
                        fontFamily: T.fontFamily,
                        fontSize:   fonts[size],
                        fontWeight: T.weight.bold,
                        color:      C.btnPrimary,
                    }}
                >
                    {name?.[0]?.toUpperCase() || 'T'}
                </span>
            )}
        </div>
    );
}

// ─── Icon Pill ─────────────────────────────────────────────────────────────────
function IconPill({ icon: Icon, size = 20 }) {
    return (
        <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
        >
            <Icon style={{ width: size, height: size, color: C.iconColor }} />
        </div>
    );
}

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, children, accentColor }) {
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div
                className="flex items-center justify-center rounded-lg shrink-0"
                style={{
                    width:           40,
                    height:          40,
                    backgroundColor: accentColor ? `${accentColor}18` : C.iconBg,
                }}
            >
                <Icon style={{ width: 16, height: 16, color: accentColor || C.iconColor }} />
            </div>
            <h3
                style={{
                    fontFamily:  T.fontFamily,
                    fontSize:    T.size.xl,
                    fontWeight:  T.weight.semibold,
                    color:       C.heading,
                    margin:      0,
                }}
            >
                {children}
            </h3>
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center gap-2 px-5 py-2 transition-all border-none cursor-pointer whitespace-nowrap"
            style={
                active
                    ? {
                        backgroundColor: C.btnPrimary,
                        color:           '#ffffff',
                        fontFamily:      T.fontFamily,
                        fontSize:        T.size.base,
                        fontWeight:      T.weight.semibold,
                        borderRadius:    '10px',
                        boxShadow:       `0 2px 8px ${C.btnPrimary}40`,
                    }
                    : {
                        backgroundColor: 'transparent',
                        color:           C.text,
                        fontFamily:      T.fontFamily,
                        fontSize:        T.size.base,
                        fontWeight:      T.weight.semibold,
                        borderRadius:    '10px',
                    }
            }
        >
            {Icon && <Icon style={{ width: 16, height: 16 }} />}
            {label}
        </button>
    );
}

// ─── Star Row ─────────────────────────────────────────────────────────────────
function StarRow({ rating }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s =>
                s <= Math.round(rating || 0)
                    ? <MdStar     key={s} style={{ width: 14, height: 14, color: '#F59E0B' }} />
                    : <MdStarBorder key={s} style={{ width: 14, height: 14, color: C.cardBorder }} />
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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
            const date    = addDays(startOfToday(), i);
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
            const res = await api.post('/appointments', {
                tutorId: id,
                dateTime: dateTime.toISOString(),
                notes: bookingNote,
                sessionType: 'online_live',
            });
            if (res.data?.success) {
                toast.success('Live class requested successfully! 🎉');
                setBookingNote(''); setSelectedSlot(null); fetchSlotsForDate();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to book appointment');
        } finally { setBookingLoading(false); }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div
            className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <div className="relative w-12 h-12">
                <div
                    className="w-12 h-12 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                />
            </div>
            <p style={{ color: C.text, fontSize: T.size.base, fontWeight: T.weight.medium }}>
                Loading tutor profile…
            </p>
        </div>
    );

    // ── Not Found ────────────────────────────────────────────────────────────
    if (!tutor) return (
        <div
            className="flex flex-col items-center justify-center min-h-screen gap-4"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <div
                className="p-10 text-center max-w-sm"
                style={{
                    backgroundColor: C.cardBg,
                    border:          `1px solid ${C.cardBorder}`,
                    boxShadow:       S.card,
                    borderRadius:    R['2xl'],
                }}
            >
                <div
                    className="flex items-center justify-center mx-auto mb-4"
                    style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: R.lg }}
                >
                    <MdSchool style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.4 }} />
                </div>
                <p
                    style={{
                        fontFamily:   T.fontFamily,
                        fontSize:     T.size.lg,
                        fontWeight:   T.weight.bold,
                        color:        C.heading,
                        marginBottom: 8,
                    }}
                >
                    Tutor not found
                </p>
                <p
                    style={{
                        fontFamily:   T.fontFamily,
                        fontSize:     T.size.base,
                        color:        C.text,
                        marginBottom: 24,
                    }}
                >
                    The profile you are looking for does not exist or has been removed.
                </p>
                <Link href="/student/tutors">
                    <button
                        className="w-full flex items-center justify-center gap-2 h-11 text-white cursor-pointer border-none transition-opacity hover:opacity-90"
                        style={{
                            background:   C.gradientBtn,
                            fontFamily:   T.fontFamily,
                            fontSize:     T.size.base,
                            fontWeight:   T.weight.bold,
                            borderRadius: '10px',
                            boxShadow:    S.btn,
                        }}
                    >
                        <MdArrowBack style={{ width: 16, height: 16 }} /> Back to Search
                    </button>
                </Link>
            </div>
        </div>
    );

    const calendarDays = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));
    const tabs = [
        { id: 'about',    label: 'About',    icon: MdSchool },
        { id: 'courses',  label: 'Courses',  icon: MdMenuBook },
        { id: 'reviews',  label: 'Reviews',  icon: MdMessage },
        { id: 'schedule', label: 'Schedule', icon: MdCalendarMonth },
    ];

    return (
        <div
            className="w-full min-h-screen space-y-5 pb-20 relative"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            {/* ── Breadcrumb ──────────────────────────────────────────────── */}
            <div
                className="flex items-center gap-2 w-fit px-4 py-2"
                style={{
                    backgroundColor: C.cardBg,
                    border:          `1px solid ${C.cardBorder}`,
                    boxShadow:       S.card,
                    borderRadius:    '10px',
                }}
            >
                <Link
                    href="/student/tutors"
                    className="flex items-center gap-1.5 transition-colors hover:opacity-70"
                    style={{
                        fontFamily:  T.fontFamily,
                        fontSize:    T.size.base,
                        fontWeight:  T.weight.semibold,
                        color:       C.btnPrimary,
                    }}
                >
                    <MdArrowBack style={{ width: 16, height: 16 }} /> Find a Tutor
                </Link>
                <span style={{ color: C.cardBorder, fontSize: T.size.base }}>／</span>
                <span
                    style={{
                        fontFamily:  T.fontFamily,
                        fontSize:    T.size.base,
                        fontWeight:  T.weight.semibold,
                        color:       C.heading,
                    }}
                >
                    {tutor.userId?.name}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── LEFT: Profile + Tabs ────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Profile Hero Card */}
                    <div
                        className="overflow-hidden"
                        style={{
                            backgroundColor: C.cardBg,
                            border:          `1px solid ${C.cardBorder}`,
                            boxShadow:       S.card,
                            borderRadius:    R['2xl'],
                        }}
                    >
                        {/* Banner */}
                        <div
                            className="h-28 relative overflow-hidden"
                            style={{ background: C.gradientBtn }}
                        >
                            <div
                                className="absolute inset-0 opacity-[0.08]"
                                style={{
                                    backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                                    backgroundSize:  '16px 16px',
                                }}
                            />
                        </div>

                        {/* Info section */}
                        <div className="px-6 pb-6 relative">
                            {/* Avatar pulled up */}
                            <div className="-mt-11 mb-4">
                                <Avatar src={tutor.userId?.profileImage} name={tutor.userId?.name} size="xl" />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    {/* Name + Verified */}
                                    <div className="flex items-center gap-3 flex-wrap mb-1">
                                        <h1
                                            style={{
                                                fontFamily:  T.fontFamily,
                                                fontSize:    T.size['2xl'],
                                                fontWeight:  T.weight.bold,
                                                color:       C.heading,
                                                margin:      0,
                                                lineHeight:  T.leading.tight,
                                            }}
                                        >
                                            {tutor.userId?.name}
                                        </h1>
                                        {tutor.isVerified && (
                                            <span
                                                className="inline-flex items-center gap-1 px-2 py-0.5"
                                                style={{
                                                    backgroundColor: C.successBg,
                                                    color:           C.success,
                                                    border:          `1px solid ${C.successBorder}`,
                                                    fontFamily:      T.fontFamily,
                                                    fontSize:        T.size.xs,
                                                    fontWeight:      T.weight.bold,
                                                    borderRadius:    '10px',
                                                    textTransform:   'uppercase',
                                                }}
                                            >
                                                <MdCheckCircle style={{ width: 12, height: 12 }} /> Verified
                                            </span>
                                        )}
                                    </div>

                                    {/* Category + Institute */}
                                    <div className="flex items-center gap-2 flex-wrap mb-4">
                                        <span
                                            style={{
                                                fontFamily:  T.fontFamily,
                                                fontSize:    T.size.base,
                                                fontWeight:  T.weight.semibold,
                                                color:       C.btnPrimary,
                                            }}
                                        >
                                            {tutor.categoryId?.name || 'Expert'} Tutor
                                        </span>
                                        {tutor.instituteId && (
                                            <span
                                                className="px-2 py-0.5"
                                                style={{
                                                    backgroundColor: C.innerBg,
                                                    color:           C.text,
                                                    border:          `1px solid ${C.cardBorder}`,
                                                    fontFamily:      T.fontFamily,
                                                    fontSize:        T.size.xs,
                                                    fontWeight:      T.weight.semibold,
                                                    borderRadius:    '10px',
                                                    textTransform:   'uppercase',
                                                }}
                                            >
                                                {tutor.instituteId.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Rating + Meta */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div
                                            className="flex items-center gap-2 px-3 py-1.5"
                                            style={{
                                                backgroundColor: C.innerBg,
                                                border:          `1px solid ${C.cardBorder}`,
                                                borderRadius:    '10px',
                                            }}
                                        >
                                            <StarRow rating={tutor.rating} />
                                            <span
                                                style={{
                                                    fontFamily:  T.fontFamily,
                                                    fontSize:    T.size.base,
                                                    fontWeight:  T.weight.bold,
                                                    color:       C.heading,
                                                    marginLeft:  2,
                                                }}
                                            >
                                                {tutor.rating?.toFixed(1) || 'New'}
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily:  T.fontFamily,
                                                    fontSize:    T.size.xs,
                                                    fontWeight:  T.weight.medium,
                                                    color:       C.text,
                                                }}
                                            >
                                                ({tutor.reviewCount || 0} reviews)
                                            </span>
                                        </div>
                                        {[
                                            { icon: MdEmojiEvents, text: `${tutor.experience ?? 0} yrs exp` },
                                            { icon: MdPeople,      text: `${tutor.studentsCount || 0} students` },
                                            { icon: MdLocationOn,  text: 'Live Online' },
                                        ].map(({ icon: Icon, text }) => (
                                            <span
                                                key={text}
                                                className="flex items-center gap-1.5"
                                                style={{
                                                    fontFamily:  T.fontFamily,
                                                    fontSize:    T.size.base,
                                                    fontWeight:  T.weight.medium,
                                                    color:       C.text,
                                                }}
                                            >
                                                <Icon style={{ width: 15, height: 15, color: C.btnPrimary }} />
                                                {text}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Card */}
                    <div
                        className="overflow-hidden flex flex-col"
                        style={{
                            backgroundColor: C.cardBg,
                            border:          `1px solid ${C.cardBorder}`,
                            boxShadow:       S.card,
                            borderRadius:    R['2xl'],
                        }}
                    >
                        {/* Tab Bar */}
                        <div
                            className="flex p-1.5 overflow-x-auto gap-1 shrink-0"
                            style={{
                                backgroundColor: C.innerBg,
                                borderBottom:    `1px solid ${C.cardBorder}`,
                            }}
                        >
                            {tabs.map(tab => (
                                <TabBtn
                                    key={tab.id}
                                    active={activeTab === tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    icon={tab.icon}
                                    label={tab.label}
                                />
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-5 md:p-6 flex-1 min-h-[400px]">

                            {/* ── ABOUT ── */}
                            {activeTab === 'about' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                    {/* Bio */}
                                    <div>
                                        <SectionTitle icon={MdSchool}>About the Tutor</SectionTitle>
                                        <p
                                            style={{
                                                fontFamily:  T.fontFamily,
                                                fontSize:    T.size.base,
                                                color:       C.heading,
                                                lineHeight:  T.leading.relaxed,
                                                fontWeight:  T.weight.medium,
                                                whiteSpace:  'pre-line',
                                                margin:      0,
                                            }}
                                        >
                                            {tutor.bio || 'Passionate tutor dedicated to helping students achieve their goals through personalized and interactive learning sessions.'}
                                        </p>
                                    </div>

                                    {/* Title badge */}
                                    {tutor.title && (
                                        <div
                                            className="flex items-center gap-3 p-4"
                                            style={{
                                                backgroundColor: C.innerBg,
                                                border:          `1px solid ${C.btnPrimary}`,
                                                borderRadius:    '10px',
                                            }}
                                        >
                                            <MdEmojiEvents style={{ width: 20, height: 20, color: C.btnPrimary, flexShrink: 0 }} />
                                            <span
                                                style={{
                                                    fontFamily:  T.fontFamily,
                                                    fontSize:    T.size.base,
                                                    fontWeight:  T.weight.semibold,
                                                    color:       C.heading,
                                                }}
                                            >
                                                {tutor.title}
                                            </span>
                                        </div>
                                    )}

                                    {/* Subjects */}
                                    {tutor.subjects?.length > 0 && (
                                        <div>
                                            <p
                                                style={{
                                                    fontFamily:    T.fontFamily,
                                                    fontSize:      T.size.xs,
                                                    fontWeight:    T.weight.bold,
                                                    color:         C.text,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: T.tracking.wider,
                                                    marginBottom:  12,
                                                }}
                                            >
                                                Expertise & Subjects
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {tutor.subjects.map((s, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-4 py-2"
                                                        style={{
                                                            backgroundColor: C.innerBg,
                                                            color:           C.btnPrimary,
                                                            border:          `1px solid ${C.cardBorder}`,
                                                            fontFamily:      T.fontFamily,
                                                            fontSize:        T.size.base,
                                                            fontWeight:      T.weight.semibold,
                                                            borderRadius:    '10px',
                                                        }}
                                                    >
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            className="p-5 text-center"
                                            style={{
                                                backgroundColor: C.innerBg,
                                                border:          `1px solid ${C.cardBorder}`,
                                                borderRadius:    '10px',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontFamily:   T.fontFamily,
                                                    fontSize:     T.size['3xl'],
                                                    fontWeight:   T.weight.bold,
                                                    color:        C.btnPrimary,
                                                    margin:       '0 0 4px 0',
                                                    lineHeight:   1,
                                                }}
                                            >
                                                {tutorCourses.length}
                                            </p>
                                            <p
                                                style={{
                                                    fontFamily:    T.fontFamily,
                                                    fontSize:      T.size.xs,
                                                    color:         C.text,
                                                    fontWeight:    T.weight.semibold,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: T.tracking.wider,
                                                    margin:        0,
                                                }}
                                            >
                                                Active Courses
                                            </p>
                                        </div>
                                        <div
                                            className="p-5 text-center"
                                            style={{
                                                background:   C.gradientBtn,
                                                borderRadius: '10px',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontFamily:  T.fontFamily,
                                                    fontSize:    T.size['3xl'],
                                                    fontWeight:  T.weight.bold,
                                                    color:       '#ffffff',
                                                    margin:      '0 0 4px 0',
                                                    lineHeight:  1,
                                                }}
                                            >
                                                ₹{tutor.hourlyRate ?? 0}
                                            </p>
                                            <p
                                                style={{
                                                    fontFamily:    T.fontFamily,
                                                    fontSize:      T.size.xs,
                                                    color:         'rgba(255,255,255,0.75)',
                                                    fontWeight:    T.weight.semibold,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: T.tracking.wider,
                                                    margin:        0,
                                                }}
                                            >
                                                Per Hour
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── COURSES ── */}
                            {activeTab === 'courses' && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <SectionTitle icon={MdMenuBook}>
                                        Courses by {tutor.userId?.name?.split(' ')[0]}
                                    </SectionTitle>

                                    {loadingCourses ? (
                                        <div className="flex justify-center py-16">
                                            <div
                                                className="w-10 h-10 rounded-full border-[3px] animate-spin"
                                                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                                            />
                                        </div>
                                    ) : tutorCourses.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {tutorCourses.map(course => (
                                                <Link key={course._id} href={`/student/courses/${course._id}`} className="block group">
                                                    <div
                                                        className="overflow-hidden transition-all duration-200"
                                                        style={{
                                                            backgroundColor: C.innerBg,
                                                            border:          `1px solid ${C.cardBorder}`,
                                                            borderRadius:    '10px',
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.borderColor = C.btnPrimary;
                                                            e.currentTarget.style.transform   = 'translateY(-2px)';
                                                            e.currentTarget.style.boxShadow   = S.cardHover;
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.borderColor = C.cardBorder;
                                                            e.currentTarget.style.transform   = 'none';
                                                            e.currentTarget.style.boxShadow   = 'none';
                                                        }}
                                                    >
                                                        <div
                                                            className="aspect-video relative overflow-hidden"
                                                            style={{ backgroundColor: C.cardBg }}
                                                        >
                                                            {course.thumbnail && (
                                                                <img
                                                                    src={course.thumbnail}
                                                                    alt={course.title}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                />
                                                            )}
                                                            <div
                                                                className="absolute top-3 right-3 px-3 py-1 backdrop-blur-md"
                                                                style={{
                                                                    backgroundColor: 'rgba(255,255,255,0.92)',
                                                                    color:           C.heading,
                                                                    fontFamily:      T.fontFamily,
                                                                    fontSize:        T.size.xs,
                                                                    fontWeight:      T.weight.bold,
                                                                    borderRadius:    '10px',
                                                                }}
                                                            >
                                                                {course.price ? `₹${course.price}` : 'FREE'}
                                                            </div>
                                                        </div>

                                                        <div className="p-4">
                                                            <div className="flex items-center gap-1.5 mb-2">
                                                                <StarRow rating={course.rating} />
                                                                <span
                                                                    style={{
                                                                        fontFamily:  T.fontFamily,
                                                                        fontSize:    T.size.xs,
                                                                        fontWeight:  T.weight.bold,
                                                                        color:       C.heading,
                                                                        marginLeft:  2,
                                                                    }}
                                                                >
                                                                    {course.rating?.toFixed(1) || '—'}
                                                                </span>
                                                            </div>
                                                            <h4
                                                                className="line-clamp-2"
                                                                style={{
                                                                    fontFamily:   T.fontFamily,
                                                                    fontSize:     T.size.base,
                                                                    fontWeight:   T.weight.semibold,
                                                                    color:        C.heading,
                                                                    margin:       '0 0 6px 0',
                                                                    lineHeight:   T.leading.snug,
                                                                }}
                                                            >
                                                                {course.title}
                                                            </h4>
                                                            <p
                                                                className="flex items-center gap-1.5"
                                                                style={{
                                                                    fontFamily:  T.fontFamily,
                                                                    fontSize:    T.size.xs,
                                                                    color:       C.text,
                                                                    fontWeight:  T.weight.medium,
                                                                    margin:      0,
                                                                }}
                                                            >
                                                                <MdMenuBook style={{ width: 12, height: 12, opacity: 0.6 }} />
                                                                {course.lessons?.length || 0} lessons
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div
                                            className="text-center py-16 border-2 border-dashed"
                                            style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg, borderRadius: '10px' }}
                                        >
                                            <MdMenuBook style={{ width: 40, height: 40, color: C.cardBorder, margin: '0 auto 12px' }} />
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                                                No courses published yet.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── REVIEWS ── */}
                            {activeTab === 'reviews' && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <SectionTitle icon={MdStar} accentColor="#F59E0B">
                                        Student Reviews ({tutor.reviewCount || 0})
                                    </SectionTitle>

                                    {loadingReviews ? (
                                        <div className="flex justify-center py-16">
                                            <div
                                                className="w-10 h-10 rounded-full border-[3px] animate-spin"
                                                style={{ borderColor: `${C.warning}30`, borderTopColor: C.warning }}
                                            />
                                        </div>
                                    ) : tutorReviews.length > 0 ? (
                                        <div className="space-y-4">
                                            {tutorReviews.map(review => (
                                                <div
                                                    key={review._id}
                                                    className="p-4"
                                                    style={{
                                                        backgroundColor: C.innerBg,
                                                        border:          `1px solid ${C.cardBorder}`,
                                                        borderRadius:    '10px',
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between gap-4 mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="flex items-center justify-center overflow-hidden shrink-0"
                                                                style={{
                                                                    width:           40,
                                                                    height:          40,
                                                                    borderRadius:    '10px',
                                                                    backgroundColor: C.cardBg,
                                                                    border:          `1px solid ${C.cardBorder}`,
                                                                }}
                                                            >
                                                                {review.studentId?.profileImage
                                                                    ? <img src={review.studentId.profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    : <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}>
                                                                        {review.studentId?.name?.[0]?.toUpperCase() || '?'}
                                                                      </span>
                                                                }
                                                            </div>
                                                            <div>
                                                                <p
                                                                    style={{
                                                                        fontFamily:   T.fontFamily,
                                                                        fontSize:     T.size.base,
                                                                        fontWeight:   T.weight.semibold,
                                                                        color:        C.heading,
                                                                        margin:       '0 0 3px 0',
                                                                    }}
                                                                >
                                                                    {review.studentId?.name || 'Student'}
                                                                </p>
                                                                <StarRow rating={review.rating} />
                                                            </div>
                                                        </div>
                                                        <span
                                                            style={{
                                                                fontFamily:  T.fontFamily,
                                                                fontSize:    T.size.xs,
                                                                fontWeight:  T.weight.medium,
                                                                color:       C.text,
                                                                flexShrink:  0,
                                                            }}
                                                        >
                                                            {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                                                month: 'short', day: 'numeric', year: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>

                                                    <p
                                                        style={{
                                                            fontFamily:   T.fontFamily,
                                                            fontSize:     T.size.base,
                                                            color:        C.heading,
                                                            lineHeight:   T.leading.relaxed,
                                                            fontWeight:   T.weight.medium,
                                                            margin:       '0 0 10px 0',
                                                        }}
                                                    >
                                                        "{review.comment}"
                                                    </p>

                                                    {review.courseId?.title && (
                                                        <span
                                                            className="inline-block px-3 py-1"
                                                            style={{
                                                                backgroundColor: C.cardBg,
                                                                border:          `1px solid ${C.cardBorder}`,
                                                                color:           C.text,
                                                                fontFamily:      T.fontFamily,
                                                                fontSize:        T.size.xs,
                                                                fontWeight:      T.weight.medium,
                                                                borderRadius:    '10px',
                                                            }}
                                                        >
                                                            Course: {review.courseId.title}
                                                        </span>
                                                    )}

                                                    {review.tutorResponse?.comment && (
                                                        <div
                                                            className="mt-4 p-4"
                                                            style={{
                                                                backgroundColor: `${C.btnPrimary}0d`,
                                                                borderLeft:      `3px solid ${C.btnPrimary}`,
                                                                borderRadius:    '0 10px 10px 0',
                                                            }}
                                                        >
                                                            <p
                                                                style={{
                                                                    fontFamily:    T.fontFamily,
                                                                    fontSize:      T.size.xs,
                                                                    fontWeight:    T.weight.bold,
                                                                    color:         C.btnPrimary,
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: T.tracking.wider,
                                                                    margin:        '0 0 4px 0',
                                                                }}
                                                            >
                                                                Tutor Reply
                                                            </p>
                                                            <p
                                                                style={{
                                                                    fontFamily:  T.fontFamily,
                                                                    fontSize:    T.size.base,
                                                                    color:       C.btnPrimary,
                                                                    fontWeight:  T.weight.medium,
                                                                    margin:      0,
                                                                    lineHeight:  T.leading.relaxed,
                                                                }}
                                                            >
                                                                {review.tutorResponse.comment}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div
                                            className="text-center py-16 border-2 border-dashed"
                                            style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg, borderRadius: '10px' }}
                                        >
                                            <MdMessage style={{ width: 40, height: 40, color: C.cardBorder, margin: '0 auto 12px' }} />
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                                                No reviews yet.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── SCHEDULE ── */}
                            {activeTab === 'schedule' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                    {/* Date picker */}
                                    <div>
                                        <SectionTitle icon={MdCalendarMonth}>Select Live Class Date</SectionTitle>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {calendarDays.map(date => {
                                                const dateStr    = format(date, 'yyyy-MM-dd');
                                                const hasSlots   = datesWithSlots.includes(dateStr);
                                                const isSelected = selectedDate && isSameDay(date, selectedDate);
                                                return (
                                                    <button
                                                        key={dateStr}
                                                        type="button"
                                                        onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                                                        disabled={!hasSlots}
                                                        className="min-w-[60px] h-[76px] flex flex-col items-center justify-center shrink-0 transition-all cursor-pointer disabled:cursor-not-allowed border"
                                                        style={
                                                            isSelected
                                                                ? {
                                                                    background:   C.gradientBtn,
                                                                    color:        '#ffffff',
                                                                    borderColor:  'transparent',
                                                                    boxShadow:    S.btn,
                                                                    borderRadius: '10px',
                                                                }
                                                                : hasSlots
                                                                ? {
                                                                    backgroundColor: C.cardBg,
                                                                    borderColor:     C.cardBorder,
                                                                    color:           C.heading,
                                                                    borderRadius:    '10px',
                                                                }
                                                                : {
                                                                    backgroundColor: C.innerBg,
                                                                    borderColor:     'transparent',
                                                                    color:           C.text,
                                                                    opacity:         0.5,
                                                                    borderRadius:    '10px',
                                                                }
                                                        }
                                                    >
                                                        <span
                                                            style={{
                                                                fontFamily:    T.fontFamily,
                                                                fontSize:      T.size.xs,
                                                                fontWeight:    T.weight.bold,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: T.tracking.wider,
                                                                marginBottom:  4,
                                                            }}
                                                        >
                                                            {format(date, 'EEE')}
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontFamily:  T.fontFamily,
                                                                fontSize:    T.size.xl,
                                                                fontWeight:  T.weight.bold,
                                                                lineHeight:  1,
                                                            }}
                                                        >
                                                            {format(date, 'd')}
                                                        </span>
                                                        {hasSlots && !isSelected && (
                                                            <div
                                                                className="rounded-full mt-1.5"
                                                                style={{ width: 5, height: 5, backgroundColor: C.success }}
                                                            />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Time slots */}
                                    <div>
                                        <SectionTitle icon={MdAccessTime}>Available Live Class Slots</SectionTitle>
                                        {availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {availableSlots.map(slot => (
                                                    <button
                                                        key={slot}
                                                        type="button"
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className="py-3 px-4 border transition-all cursor-pointer"
                                                        style={
                                                            selectedSlot === slot
                                                                ? {
                                                                    background:   C.gradientBtn,
                                                                    color:        '#ffffff',
                                                                    borderColor:  'transparent',
                                                                    fontFamily:   T.fontFamily,
                                                                    fontSize:     T.size.base,
                                                                    fontWeight:   T.weight.bold,
                                                                    borderRadius: '10px',
                                                                    boxShadow:    S.btn,
                                                                }
                                                                : {
                                                                    backgroundColor: C.cardBg,
                                                                    borderColor:     C.cardBorder,
                                                                    color:           C.heading,
                                                                    fontFamily:      T.fontFamily,
                                                                    fontSize:        T.size.base,
                                                                    fontWeight:      T.weight.semibold,
                                                                    borderRadius:    '10px',
                                                                }
                                                        }
                                                        onMouseEnter={e => {
                                                            if (selectedSlot !== slot) e.currentTarget.style.borderColor = C.btnPrimary;
                                                        }}
                                                        onMouseLeave={e => {
                                                            if (selectedSlot !== slot) e.currentTarget.style.borderColor = C.cardBorder;
                                                        }}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div
                                                className="text-center py-10 border-2 border-dashed"
                                                style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg, borderRadius: '10px' }}
                                            >
                                                <MdAccessTime style={{ width: 36, height: 36, color: C.cardBorder, margin: '0 auto 12px' }} />
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
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
                    <div
                        className="overflow-hidden sticky top-6"
                        style={{
                            backgroundColor: C.cardBg,
                            border:          `1px solid ${C.cardBorder}`,
                            boxShadow:       S.card,
                            borderRadius:    R['2xl'],
                        }}
                    >
                        {/* Rate Header */}
                        <div
                            className="px-6 py-8 text-center relative overflow-hidden"
                            style={{ background: C.gradientBtn }}
                        >
                            <div
                                className="absolute inset-0 opacity-[0.07]"
                                style={{
                                    backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                                    backgroundSize:  '16px 16px',
                                }}
                            />
                            <p
                                className="relative"
                                style={{
                                    fontFamily:    T.fontFamily,
                                    fontSize:      T.size.xs,
                                    fontWeight:    T.weight.bold,
                                    color:         'rgba(255,255,255,0.7)',
                                    textTransform: 'uppercase',
                                    letterSpacing: T.tracking.wider,
                                    margin:        '0 0 6px 0',
                                }}
                            >
                                Session Rate
                            </p>
                            <p
                                className="relative"
                                style={{
                                    fontFamily:  T.fontFamily,
                                    fontSize:    T.size['4xl'],
                                    fontWeight:  T.weight.bold,
                                    color:       '#ffffff',
                                    margin:      0,
                                    lineHeight:  1,
                                }}
                            >
                                ₹{tutor.hourlyRate ?? 0}
                                <span
                                    style={{
                                        fontSize:   T.size.base,
                                        fontWeight: T.weight.medium,
                                        color:      'rgba(255,255,255,0.65)',
                                    }}
                                >
                                    /hr
                                </span>
                            </p>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Booking Summary */}
                            <div
                                className="p-4"
                                style={{
                                    backgroundColor: C.innerBg,
                                    border:          `1px solid ${C.cardBorder}`,
                                    borderRadius:    '10px',
                                }}
                            >
                                <div className="flex items-center gap-2.5 mb-4">
                                    <MdCheckCircle style={{ width: 18, height: 18, color: C.success }} />
                                    <p
                                        style={{
                                            fontFamily:  T.fontFamily,
                                            fontSize:    T.size.base,
                                            fontWeight:  T.weight.semibold,
                                            color:       C.heading,
                                            margin:      0,
                                        }}
                                    >
                                        Booking Details
                                    </p>
                                </div>
                                <dl className="space-y-3">
                                    {[
                                        { label: 'Date',     value: selectedDate ? format(selectedDate, 'MMM d, yyyy') : '—', highlight: false },
                                        { label: 'Time',     value: selectedSlot || 'Select a slot',                          highlight: !!selectedSlot },
                                        { label: 'Duration', value: '60 mins',                                                highlight: false },
                                        { label: 'Mode',     value: 'Online Live',                                            highlight: true },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between">
                                            <dt
                                                style={{
                                                    fontFamily:    T.fontFamily,
                                                    fontSize:      T.size.xs,
                                                    color:         C.text,
                                                    fontWeight:    T.weight.semibold,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: T.tracking.wider,
                                                }}
                                            >
                                                {item.label}
                                            </dt>
                                            <dd
                                                style={{
                                                    fontFamily:  T.fontFamily,
                                                    fontSize:    T.size.base,
                                                    fontWeight:  T.weight.bold,
                                                    color:       item.highlight ? C.btnPrimary : C.heading,
                                                }}
                                            >
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            {/* Note textarea */}
                            <div className="space-y-2">
                                <label
                                    style={{
                                        display:       'block',
                                        fontFamily:    T.fontFamily,
                                        fontSize:      T.size.xs,
                                        fontWeight:    T.weight.bold,
                                        color:         C.text,
                                        textTransform: 'uppercase',
                                        letterSpacing: T.tracking.wider,
                                        margin:        0,
                                    }}
                                >
                                    Message for Live Class (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="What do you want to learn?"
                                    value={bookingNote}
                                    onChange={e => setBookingNote(e.target.value)}
                                    style={{ ...baseInputStyle, resize: 'none' }}
                                    onFocus={onFocusHandler}
                                    onBlur={onBlurHandler}
                                />
                            </div>

                            {/* Confirm Button */}
                            <button
                                disabled={!selectedSlot || bookingLoading}
                                onClick={handleBookAppointment}
                                className="w-full py-3.5 transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background:   C.gradientBtn,
                                    color:        '#fff',
                                    fontFamily:   T.fontFamily,
                                    fontSize:     T.size.base,
                                    fontWeight:   T.weight.bold,
                                    borderRadius: '10px',
                                    boxShadow:    S.btn,
                                }}
                            >
                                {bookingLoading
                                    ? <><MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" /> Requesting…</>
                                    : <><MdCalendarMonth style={{ width: 16, height: 16 }} /> Book Live Class</>
                                }
                            </button>

                            <p
                                style={{
                                    fontFamily:    T.fontFamily,
                                    fontSize:      T.size.xs,
                                    fontWeight:    T.weight.medium,
                                    color:         C.text,
                                    textAlign:     'center',
                                    margin:        0,
                                    textTransform: 'uppercase',
                                    letterSpacing: T.tracking.wider,
                                }}
                            >
                                Free cancellation up to 24 hours before.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Floating AI Button ──────────────────────────────────────── */}
            <button
                onClick={() => setAiOpen(true)}
                className="fixed bottom-8 right-8 z-40 flex items-center gap-3 px-5 h-14 text-white transition-all cursor-pointer border-none hover:opacity-90"
                style={{
                    background:   C.gradientBtn,
                    fontFamily:   T.fontFamily,
                    fontSize:     T.size.base,
                    fontWeight:   T.weight.bold,
                    borderRadius: R.full,
                    boxShadow:    S.btnDark,
                }}
            >
                <div
                    className="relative flex items-center justify-center"
                    style={{
                        width:           32,
                        height:          32,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius:    '50%',
                    }}
                >
                    <MdSmartToy style={{ width: 18, height: 18 }} />
                    <span
                        className="absolute top-0 right-0 border-2 rounded-full"
                        style={{
                            width:           10,
                            height:          10,
                            backgroundColor: C.success,
                            borderColor:     C.btnPrimary,
                        }}
                    />
                </div>
                Ask AI Assistant
            </button>

            {/* ── AI Drawer ───────────────────────────────────────────────── */}
            {aiOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                        onClick={() => setAiOpen(false)}
                    />
                    <div
                        className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-[85vh] sm:h-[600px] sm:bottom-8 sm:right-8 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-right-10 duration-300"
                        style={{
                            backgroundColor: C.cardBg,
                            border:          `1px solid ${C.cardBorder}`,
                            boxShadow:       S.cardHover,
                            borderRadius:    R['2xl'],
                        }}
                    >
                        {/* Drawer Header */}
                        <div
                            className="px-6 py-5 flex items-center justify-between relative overflow-hidden shrink-0"
                            style={{
                                background:   C.gradientBtn,
                                borderBottom: `1px solid ${C.cardBorder}`,
                            }}
                        >
                            <div
                                className="absolute inset-0 opacity-[0.07]"
                                style={{
                                    backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                                    backgroundSize:  '14px 14px',
                                }}
                            />
                            <div className="relative flex items-center gap-3">
                                <div
                                    className="flex items-center justify-center"
                                    style={{
                                        width:           40,
                                        height:          40,
                                        backgroundColor: 'rgba(255,255,255,0.18)',
                                        border:          '1px solid rgba(255,255,255,0.2)',
                                        borderRadius:    '10px',
                                    }}
                                >
                                    <MdAutoAwesome style={{ width: 20, height: 20, color: '#FCD34D' }} />
                                </div>
                                <div>
                                    <p
                                        style={{
                                            fontFamily:  T.fontFamily,
                                            fontSize:    T.size.md,
                                            fontWeight:  T.weight.bold,
                                            color:       '#ffffff',
                                            margin:      '0 0 2px 0',
                                        }}
                                    >
                                        Tutor Assistant
                                    </p>
                                    <p
                                        style={{
                                            fontFamily:    T.fontFamily,
                                            fontSize:      T.size.xs,
                                            fontWeight:    T.weight.medium,
                                            color:         'rgba(255,255,255,0.7)',
                                            margin:        0,
                                            textTransform: 'uppercase',
                                            letterSpacing: T.tracking.wider,
                                        }}
                                    >
                                        Ask anything about this tutor
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAiOpen(false)}
                                className="relative flex items-center justify-center cursor-pointer border-none transition-colors"
                                style={{
                                    width:           32,
                                    height:          32,
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    borderRadius:    '10px',
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                            >
                                <MdClose style={{ width: 16, height: 16, color: '#ffffff' }} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-hidden" style={{ backgroundColor: C.innerBg }}>
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