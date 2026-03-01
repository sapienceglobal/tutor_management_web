'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Star,
    Award,
    CheckCircle,
    Loader2,
    BookOpen,
    MessageSquare,
    ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { format, addDays, startOfToday, isSameDay, parse } from 'date-fns';

export default function TutorDetailPage({ params }) {
    const { id } = use(params);

    const [tutor, setTutor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('about');
    const [tutorCourses, setTutorCourses] = useState([]);
    const [tutorReviews, setTutorReviews] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(false);

    const [selectedDate, setSelectedDate] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingNote, setBookingNote] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [datesWithSlots, setDatesWithSlots] = useState([]);

    useEffect(() => {
        (async () => {
            await fetchTutorProfile();
            fetchTutorFullSchedule();
            fetchTutorCourses();
            fetchTutorReviews();
        })();
    }, [id]);

    const fetchTutorCourses = async () => {
        try {
            setLoadingCourses(true);
            const response = await api.get(`/courses?tutorId=${id}`);
            if (response.data.success) setTutorCourses(response.data.courses || []);
        } catch (error) {
            console.error('Error fetching tutor courses:', error);
        } finally {
            setLoadingCourses(false);
        }
    };

    const fetchTutorReviews = async () => {
        try {
            setLoadingReviews(true);
            const response = await api.get(`/reviews/tutor/${id}/public?limit=10`);
            if (response.data.success) setTutorReviews(response.data.reviews || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    const fetchTutorProfile = async () => {
        try {
            const response = await api.get(`/tutors/${id}`);
            if (response.data.success) setTutor(response.data.tutor);
        } catch (error) {
            console.error('Error fetching tutor profile:', error);
            toast.error('Failed to load tutor');
        } finally {
            setLoading(false);
        }
    };

    const fetchTutorFullSchedule = async () => {
        try {
            const response = await api.get(`/appointments/schedule/${id}`);
            if (response.data.success) {
                calculateAvailableDates(response.data.schedule || [], response.data.dateOverrides || []);
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
        }
    };

    const calculateAvailableDates = (schedule, overrides) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
        if (!selectedDate && available.length > 0) {
            setSelectedDate(parse(available[0], 'yyyy-MM-dd', new Date()));
        }
    };

    const fetchSlotsForDate = async () => {
        if (!selectedDate) return;
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const response = await api.get(`/appointments/schedule/${id}?date=${dateStr}`);
            if (response.data.success) setAvailableSlots(response.data.slots || []);
            else setAvailableSlots([]);
        } catch (error) {
            setAvailableSlots([]);
        }
    };

    useEffect(() => {
        if (id && selectedDate) fetchSlotsForDate();
    }, [selectedDate, id]);

    // Slot format from API can be "10:00-11:00"; use start time for booking
    const getSlotStartTime = (slot) => (slot && slot.includes('-') ? slot.split('-')[0] : slot);

    const handleBookAppointment = async () => {
        if (!selectedSlot) return;
        const startTime = getSlotStartTime(selectedSlot);
        const [hours, minutes] = startTime.split(':').map(Number);
        const dateTime = new Date(selectedDate);
        dateTime.setHours(hours, minutes || 0, 0, 0);

        try {
            setBookingLoading(true);
            const response = await api.post('/appointments', {
                tutorId: id,
                dateTime: dateTime.toISOString(),
                notes: bookingNote,
            });
            if (response.data.success) {
                toast.success('Appointment requested successfully!');
                setBookingNote('');
                setSelectedSlot(null);
                fetchSlotsForDate();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to book appointment');
        } finally {
            setBookingLoading(false);
        }
    };

    const renderStars = (rating) =>
        [...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < Math.round(rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
        ));

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f0f2f8] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (!tutor) {
        return (
            <div className="min-h-screen bg-[#f0f2f8] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md">
                    <p className="text-slate-600 mb-4">Tutor not found.</p>
                    <Link href="/student/tutors"><Button variant="outline">Back to Find a Tutor</Button></Link>
                </div>
            </div>
        );
    }

    const calendarDays = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));
    const tabs = [
        { id: 'about', label: 'About', icon: null },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'reviews', label: 'Reviews', icon: MessageSquare },
        { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    ];

    return (
        <div className="min-h-screen bg-[#f0f2f8]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <Link href="/student/tutors" className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 text-sm font-medium mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Find a Tutor
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left: Profile + Tabs */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="h-24 bg-gradient-to-r from-indigo-600 to-indigo-700" />
                            <div className="px-6 pb-6 -mt-12 relative">
                                <div className="flex flex-col sm:flex-row gap-4 items-start">
                                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg shrink-0 overflow-hidden bg-slate-100">
                                        {tutor.userId?.profileImage ? (
                                            <img src={tutor.userId.profileImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                                                {tutor.userId?.name?.[0] || 'T'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h1 className="text-xl font-bold text-slate-900">{tutor.userId?.name}</h1>
                                            {tutor.isVerified && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-indigo-600 font-medium mt-0.5">{tutor.categoryId?.name || 'Expert'} Tutor</p>
                                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                                            <span className="flex items-center gap-1.5">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                <strong className="text-slate-800">{tutor.rating?.toFixed(1) || 'New'}</strong>
                                                ({tutor.reviewCount || 0} reviews)
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Award className="w-4 h-4 text-indigo-500" />
                                                {tutor.experience ?? 0} yrs exp
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                Online
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex border-b border-slate-100 overflow-x-auto">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {tab.icon && <tab.icon className="w-4 h-4" />}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="p-6 min-h-[320px]">
                                {activeTab === 'about' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-slate-900">About</h3>
                                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                                            {tutor.bio || 'Passionate tutor dedicated to helping students achieve their goals.'}
                                        </p>
                                        <div className="grid grid-cols-2 gap-4 mt-6">
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-2xl font-bold text-indigo-600">{tutorCourses.length}</p>
                                                <p className="text-sm text-slate-600">Active Courses</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-2xl font-bold text-slate-900">₹{tutor.hourlyRate ?? 0}</p>
                                                <p className="text-sm text-slate-600">Hourly rate</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'courses' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-indigo-600" />
                                            Courses
                                        </h3>
                                        {loadingCourses ? (
                                            <div className="flex justify-center py-12">
                                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                            </div>
                                        ) : tutorCourses.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {tutorCourses.map((course) => (
                                                    <Link
                                                        key={course._id}
                                                        href={`/student/courses/${course._id}`}
                                                        className="block bg-slate-50 rounded-xl border border-slate-100 overflow-hidden hover:border-indigo-200 hover:shadow-sm transition-all"
                                                    >
                                                        <div className="aspect-video bg-slate-200 relative">
                                                            {course.thumbnail ? (
                                                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                                            ) : null}
                                                            <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold">₹{course.price ?? 0}</div>
                                                        </div>
                                                        <div className="p-3">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                                <span className="text-sm font-semibold text-slate-800">{course.rating?.toFixed(1) || '—'}</span>
                                                            </div>
                                                            <h4 className="font-semibold text-slate-900 line-clamp-2">{course.title}</h4>
                                                            <p className="text-xs text-slate-500 mt-1">{course.lessons?.length || 0} lessons</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                                <p className="text-slate-500">No courses yet.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'reviews' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <Star className="w-5 h-5 text-indigo-600" />
                                            Reviews ({tutor.reviewCount || 0})
                                        </h3>
                                        {loadingReviews ? (
                                            <div className="flex justify-center py-12">
                                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                            </div>
                                        ) : tutorReviews.length > 0 ? (
                                            <div className="space-y-4">
                                                {tutorReviews.map((review) => (
                                                    <div key={review._id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden text-slate-500 font-bold">
                                                                    {review.studentId?.name?.[0] || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-900">{review.studentId?.name}</p>
                                                                    <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-slate-600 text-sm mt-2">{review.comment}</p>
                                                        {review.courseId?.title && (
                                                            <Badge variant="outline" className="mt-2 text-xs bg-white border-slate-200">
                                                                {review.courseId.title}
                                                            </Badge>
                                                        )}
                                                        {review.tutorResponse?.comment && (
                                                            <div className="mt-3 p-3 bg-indigo-50 border-l-2 border-indigo-400 rounded-r-lg">
                                                                <p className="text-xs font-semibold text-indigo-900 mb-1">Tutor reply</p>
                                                                <p className="text-sm text-indigo-800">{review.tutorResponse.comment}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                                <p className="text-slate-500">No reviews yet.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'schedule' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                                                Select date
                                            </h3>
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {calendarDays.map((date) => {
                                                    const dateStr = format(date, 'yyyy-MM-dd');
                                                    const hasSlots = datesWithSlots.includes(dateStr);
                                                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                                                    return (
                                                        <button
                                                            key={dateStr}
                                                            type="button"
                                                            onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                                                            disabled={!hasSlots}
                                                            className={`min-w-[64px] py-3 px-2 rounded-xl border text-center shrink-0 transition-all ${
                                                                isSelected
                                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                                    : hasSlots
                                                                        ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                                                                        : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            <span className="block text-xs font-medium uppercase">{format(date, 'EEE')}</span>
                                                            <span className="block text-lg font-bold">{format(date, 'd')}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-indigo-600" />
                                                Available slots
                                            </h3>
                                            {availableSlots.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {availableSlots.map((slot) => (
                                                        <button
                                                            key={slot}
                                                            type="button"
                                                            onClick={() => setSelectedSlot(slot)}
                                                            className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                                                                selectedSlot === slot
                                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                                                            }`}
                                                        >
                                                            {slot}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 py-6 text-center bg-slate-50 rounded-xl border border-dashed">
                                                    {selectedDate ? 'No slots for this date.' : 'Select a date.'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Sticky booking card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-6 space-y-6">
                            <div className="text-center pb-4 border-b border-slate-100">
                                <p className="text-sm font-medium text-slate-500">Hourly rate</p>
                                <p className="text-3xl font-bold text-slate-900">₹{tutor.hourlyRate ?? 0}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        Booking details
                                    </h4>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Date</dt>
                                            <dd className="font-medium text-slate-900">{selectedDate ? format(selectedDate, 'PPP') : '—'}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Time</dt>
                                            <dd className={selectedSlot ? 'font-semibold text-indigo-600' : 'text-slate-400'}>{selectedSlot || 'Select slot'}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Duration</dt>
                                            <dd className="font-medium text-slate-900">60 min</dd>
                                        </div>
                                    </dl>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Note for tutor (optional)</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                        rows={3}
                                        placeholder="What would you like to focus on?"
                                        value={bookingNote}
                                        onChange={(e) => setBookingNote(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                                    disabled={!selectedSlot || bookingLoading}
                                    onClick={handleBookAppointment}
                                >
                                    {bookingLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Confirming...
                                        </>
                                    ) : (
                                        'Confirm booking'
                                    )}
                                </Button>
                                <p className="text-xs text-center text-slate-400">Free cancellation up to 24 hours before.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
