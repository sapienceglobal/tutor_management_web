'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/axios';
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Star,
    Award,
    CheckCircle,
    ChevronRight,
    Loader2,
    BookOpen,
    MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { format, addDays, startOfToday, isSameDay, parse, addMinutes } from 'date-fns';

export default function BookTutorPage({ params }) {
    const { id } = use(params);

    const [tutor, setTutor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('about');
    const [tutorCourses, setTutorCourses] = useState([]);
    const [tutorReviews, setTutorReviews] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(false);

    // Booking State
    const [selectedDate, setSelectedDate] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingNote, setBookingNote] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [tutorFullSchedule, setTutorFullSchedule] = useState(null);
    const [datesWithSlots, setDatesWithSlots] = useState([]);

    useEffect(() => {
        const init = async () => {
            await fetchTutorProfile();
            // Load other data in background
            fetchTutorFullSchedule();
            fetchTutorCourses();
            fetchTutorReviews();
        };
        init();
    }, [id]);

    const fetchTutorCourses = async () => {
        try {
            setLoadingCourses(true);
            // Assuming we have an endpoint to filter courses by tutorId
            // If not, we might need to filter client-side or add endpoint
            // Using existing general search with tutorId param if supported, or assuming a new endpoint/param
            // Let's assume /courses?tutorId={id} works or we filter in /tutors/{id}/courses
            // Based on list_dir earlier, we only saw general course controllers. 
            // Checking existing patterns, usually `api.get('/courses?tutorId=...')`
            const response = await api.get(`/courses?tutorId=${id}`);
            if (response.data.success) {
                setTutorCourses(response.data.courses || []);
            }
        } catch (error) {
            console.error('Error fetching tutor courses:', error);
        } finally {
            setLoadingCourses(false);
        }
    };

    const fetchTutorReviews = async () => {
        try {
            setLoadingReviews(true);
            const response = await api.get(`/reviews/tutor/${id}/public?limit=5`);
            if (response.data.success) {
                setTutorReviews(response.data.reviews || []);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    const fetchTutorProfile = async () => {
        try {
            const response = await api.get(`/tutors/${id}`);
            if (response.data.success) {
                setTutor(response.data.tutor);
            }
        } catch (error) {
            console.error('Error fetching tutor profile:', error);
            toast.error('Failed to load tutor data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTutorFullSchedule = async () => {
        try {
            // Fetch full schedule without date param to get weekly schedule + overrides
            const response = await api.get(`/appointments/schedule/${id}`);
            if (response.data.success) {
                setTutorFullSchedule({
                    schedule: response.data.schedule || [],
                    dateOverrides: response.data.dateOverrides || [],
                    bookingSettings: response.data.bookingSettings || {}
                });
                // Calculate which dates have slots
                calculateAvailableDates(response.data.schedule, response.data.dateOverrides);
            }
        } catch (error) {
            console.error('Error fetching full schedule:', error);
        }
    };

    const calculateAvailableDates = (schedule, overrides) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const available = [];

        // Check next 14 days
        for (let i = 0; i < 14; i++) {
            const date = addDays(startOfToday(), i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayName = days[date.getDay()];

            // Check if date is overridden
            const override = overrides?.find(o => o.date === dateStr);

            if (override) {
                if (!override.isBlocked && override.customSlots?.length > 0) {
                    available.push(dateStr);
                }
            } else {
                // Check weekly schedule
                const daySchedule = schedule?.find(d => d.day === dayName);
                if (daySchedule && daySchedule.isActive !== false && daySchedule.slots?.length > 0) {
                    available.push(dateStr);
                }
            }
        }

        setDatesWithSlots(available);

        // Auto-select first available date if none selected
        if (!selectedDate && available.length > 0) {
            const firstAvailableDate = parse(available[0], 'yyyy-MM-dd', new Date());
            setSelectedDate(firstAvailableDate);
        }
    };

    const fetchTutorSchedule = async () => {
        if (!selectedDate) return;

        try {
            // Fetch slots for the selected date
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const response = await api.get(`/appointments/schedule/${id}?date=${dateStr}`);
            if (response.data.success) {
                setAvailableSlots(response.data.slots || []);
            } else {
                setAvailableSlots([]);
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
            setAvailableSlots([]);
        }
    };

    // Re-fetch schedule when date changes
    useEffect(() => {
        if (id) {
            fetchTutorSchedule();
        }
    }, [selectedDate, id]);

    const handleBookAppointment = async () => {
        if (!selectedSlot) return;

        try {
            setBookingLoading(true);
            const response = await api.post('/appointments', {
                tutorId: id,
                date: selectedDate,
                timeSlot: selectedSlot,
                note: bookingNote
            });

            if (response.data.success) {
                toast.success('Appointment requested successfully!');
                setBookingNote('');
                setSelectedSlot(null);
                // Optionally redirect to appointments page
                // router.push('/student/appointments');
            }
        } catch (error) {
            console.error('Booking error:', error);
            toast.error(error.response?.data?.message || 'Failed to book appointment');
        } finally {
            setBookingLoading(false);
        }
    };

    // ... (rendering logic)

    // Helper to render stars
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < Math.round(rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ));
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!tutor) return <div className="p-8 text-center bg-gray-50 border-2 border-dashed rounded-xl m-8">Tutor not found</div>;

    const calendarDays = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Tutor Profile & Tabs */}
            <div className="lg:col-span-2 space-y-8">
                {/* Profile Header */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-100/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-10"></div>

                    <div className="relative flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl shrink-0 overflow-hidden bg-white">
                            {tutor.userId?.profileImage ? (
                                <img src={tutor.userId.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400 bg-gray-50">
                                    {tutor.userId?.name?.[0]}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 pt-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{tutor.userId?.name}</h1>
                                    <p className="text-indigo-600 font-medium text-lg">{tutor.categoryId?.name || 'Expert'} Tutor</p>
                                </div>
                                <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100 shadow-sm">
                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    <span className="font-bold text-yellow-800 text-lg">{tutor.rating || 'New'}</span>
                                    <span className="text-yellow-600 text-sm">({tutor.reviewCount || 0} reviews)</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-6">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border">
                                    <Award className="w-4 h-4 text-indigo-500" />
                                    {tutor.experience} Years Experience
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border">
                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                    Online
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Verified Tutor
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex border-b">
                        {['about', 'courses', 'reviews', 'schedule'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-4 font-semibold text-sm transition-all relative ${activeTab === tab
                                    ? 'text-indigo-600 bg-indigo-50/50'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 md:p-8 min-h-[400px]">
                        {/* Tab Content: About */}
                        {activeTab === 'about' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-xl font-bold text-gray-900">About Me</h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">
                                    {tutor.bio || "Passionate tutor dedicated to helping students achieve their academic goals."}
                                </p>

                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                        <p className="text-indigo-600 font-bold text-2xl">{tutorCourses.length || '-'}</p>
                                        <p className="text-sm text-gray-600 font-medium">Active Courses</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                        <p className="text-purple-600 font-bold text-2xl">{tutor.hourlyRate}</p>
                                        <p className="text-sm text-gray-600 font-medium">Hourly Rate (INR)</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Courses */}
                        {activeTab === 'courses' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                    Courses by {tutor.userId?.name}
                                </h3>

                                {loadingCourses ? (
                                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" /></div>
                                ) : tutorCourses.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {tutorCourses.map(course => (
                                            <a
                                                key={course._id}
                                                href={`/student/courses/${course._id}`}
                                                className="group block bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all"
                                            >
                                                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                                                        ₹{course.price}
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex items-center gap-1 mb-2">
                                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                        <span className="text-xs font-bold text-gray-700">{course.rating?.toFixed(1) || '0.0'}</span>
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">{course.title}</h4>
                                                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                                                        <span className="bg-gray-100 px-2 py-1 rounded-md">{course.level}</span>
                                                        <span>{course.lessons?.length || 0} Lessons</span>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                                        <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No courses available yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab Content: Reviews */}
                        {activeTab === 'reviews' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-indigo-600" />
                                    Student Reviews ({tutor.reviewCount})
                                </h3>

                                {loadingReviews ? (
                                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" /></div>
                                ) : tutorReviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {tutorReviews.map(review => (
                                            <div key={review._id} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border">
                                                            {review.studentId?.profileImage ? (
                                                                <img src={review.studentId.profileImage} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="font-bold text-gray-400">{review.studentId?.name?.[0]}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{review.studentId?.name}</p>
                                                            <div className="flex gap-0.5">
                                                                {renderStars(review.rating)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                </div>

                                                <div className="ml-13 pl-13">
                                                    <p className="text-gray-700 leading-relaxed text-sm mb-3">{review.comment}</p>
                                                    <Badge variant="outline" className="text-xs font-normal text-gray-500 bg-white">
                                                        Course: {review.courseId?.title}
                                                    </Badge>

                                                    {review.tutorResponse && (
                                                        <div className="mt-3 p-3 bg-indigo-50 border-l-2 border-indigo-400 rounded-r-lg">
                                                            <p className="text-xs font-bold text-indigo-900 mb-1">Tutor Reply</p>
                                                            <p className="text-xs text-indigo-800">{review.tutorResponse.comment}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                                        <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No reviews yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab Content: Schedule */}
                        {activeTab === 'schedule' && (
                            <div className="animate-in fade-in space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <CalendarIcon className="w-5 h-5 text-indigo-600" /> Select Date
                                    </h2>
                                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                        {calendarDays.map((date) => {
                                            const isSelected = selectedDate && isSameDay(date, selectedDate);
                                            const dateStr = format(date, 'yyyy-MM-dd');
                                            const hasSlots = datesWithSlots.includes(dateStr);

                                            return (
                                                <button
                                                    key={date.toString()}
                                                    onClick={() => {
                                                        setSelectedDate(date);
                                                        setSelectedSlot(null);
                                                    }}
                                                    disabled={!hasSlots}
                                                    className={`
                                                        relative flex flex-col items-center justify-center min-w-[70px] h-20 rounded-xl border transition-all shrink-0
                                                        ${isSelected
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                                                            : hasSlots
                                                                ? 'bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 border-gray-200'
                                                                : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                                                        }
                                                    `}
                                                >
                                                    <span className="text-xs font-medium uppercase">{format(date, 'EEE')}</span>
                                                    <span className="text-xl font-bold">{format(date, 'd')}</span>
                                                    {hasSlots && !isSelected && (
                                                        <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-indigo-600" /> Available Slots
                                    </h2>

                                    {availableSlots.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {availableSlots.map((slot) => (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`
                                                        py-3 px-4 rounded-lg border text-sm font-medium transition-all
                                                        ${selectedSlot === slot
                                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                                                            : 'bg-white hover:border-gray-300 text-gray-700'
                                                        }
                                                    `}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed text-gray-500">
                                            No available slots for this date.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Col: Booking Summary & Sticky Action */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 sticky top-6 space-y-6">
                    <div className="text-center pb-6 border-b">
                        <p className="text-gray-500 font-medium mb-1">Hourly Rate</p>
                        <h2 className="text-4xl font-bold text-gray-900">₹{tutor.hourlyRate}</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" /> Booking Details
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Date</span>
                                    <span className="font-medium text-gray-900">{format(selectedDate, 'PPP')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Time</span>
                                    <span className={`font-medium ${selectedSlot ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                                        {selectedSlot || 'Select slot'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Duration</span>
                                    <span className="font-medium text-gray-900">60 mins</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Note for Tutor</label>
                            <textarea
                                className="w-full text-sm p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none bg-white transition-all"
                                rows="3"
                                placeholder="What would you like to focus on?"
                                value={bookingNote}
                                onChange={(e) => setBookingNote(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full py-6 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 transform hover:-translate-y-0.5 transition-all"
                            disabled={!selectedSlot || bookingLoading}
                            onClick={handleBookAppointment}
                        >
                            {bookingLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...
                                </>
                            ) : (
                                'Confirm Booking'
                            )}
                        </Button>
                        <p className="text-xs text-center text-gray-400">
                            Free cancellation up to 24 hours before class.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
