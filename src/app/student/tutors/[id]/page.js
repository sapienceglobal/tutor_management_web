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
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { format, addDays, startOfToday, isSameDay, parse, addMinutes } from 'date-fns';

export default function BookTutorPage({ params }) {
    const { id } = use(params);

    const [tutor, setTutor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [schedule, setSchedule] = useState([]);
    const [dateOverrides, setDateOverrides] = useState([]);
    const [settings, setSettings] = useState({});
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingNote, setBookingNote] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            await fetchTutorProfile();
            await fetchTutorSchedule();
        };
        init();
    }, [id]);

    useEffect(() => {
        if (schedule.length > 0) {
            generateSlotsForDate(selectedDate);
        }
    }, [selectedDate, schedule, dateOverrides]);

    const fetchTutorProfile = async () => {
        try {
            const response = await api.get(`/tutors/${id}`);
            if (response.data.success) {
                setTutor(response.data.tutor);
            }
        } catch (error) {
            console.error('Error fetching tutor:', error);
            toast.error('Failed to load tutor details');
        }
    };

    const fetchTutorSchedule = async () => {
        try {
            const response = await api.get(`/appointments/schedule/${id}`);
            if (response.data.success) {
                setSchedule(response.data.schedule || []);
                setDateOverrides(response.data.dateOverrides || []);
                setSettings(response.data.bookingSettings || {});
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateSlotsForDate = async (date) => {
        const dayName = format(date, 'EEEE'); // Monday, Tuesday...
        const dateStr = format(date, 'yyyy-MM-dd');

        let daySlots = [];

        // 1. Check for overrides
        const override = dateOverrides.find(o => o.date === dateStr);

        if (override) {
            if (override.isBlocked) {
                setAvailableSlots([]);
                return;
            }
            if (override.customSlots && override.customSlots.length > 0) {
                daySlots = override.customSlots;
            }
        } else {
            // 2. Use weekly schedule
            const daySchedule = schedule.find(s => s.day === dayName);
            if (daySchedule) {
                daySlots = daySchedule.slots;
            }
        }

        // 3. Filter past slots
        const now = new Date();
        const finalSlots = [];

        for (const slot of daySlots) {
            const [startStr] = slot.split('-');
            const [hours, minutes] = startStr.split(':').map(Number);
            const slotTime = new Date(date);
            slotTime.setHours(hours, minutes, 0, 0);

            if (isSameDay(date, now) && slotTime < now) {
                continue; // Skip past slots
            }
            finalSlots.push({ time: slot, available: true });
        }

        setAvailableSlots(finalSlots);
    };

    const handleBookAppointment = async () => {
        if (!selectedSlot || !tutor) return;

        setBookingLoading(true);
        try {
            const [startStr] = selectedSlot.split('-');
            const [hours, minutes] = startStr.split(':').map(Number);
            const appointmentDate = new Date(selectedDate);
            appointmentDate.setHours(hours, minutes, 0, 0);

            const payload = {
                tutorId: id,
                dateTime: appointmentDate.toISOString(),
                duration: 60,
                notes: bookingNote
            };

            const response = await api.post('/appointments', payload);
            if (response.data.success) {
                toast.success('Appointment booked successfully!');
                window.location.href = '/student/appointments';
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!tutor) return <div className="p-8 text-center bg-gray-50 border-2 border-dashed rounded-xl m-8">Tutor not found</div>;

    const calendarDays = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));

    return (
        <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Tutor Profile */}
            <div className="lg:col-span-2 space-y-8">
                {/* Profile Header */}
                <div className="bg-white rounded-2xl border p-6 flex flex-col md:flex-row gap-6 shadow-sm">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-100 shrink-0 overflow-hidden border-4 border-white shadow-lg">
                        {tutor.userId?.profileImage ? (
                            <img src={tutor.userId.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400 bg-gray-50">
                                {tutor.userId?.name?.[0]}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{tutor.userId?.name}</h1>
                                <p className="text-indigo-600 font-medium">{tutor.categoryId?.name} Tutor</p>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-yellow-700">{tutor.rating || 'New'}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                            <div className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                {tutor.experience} Years Experience
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                Online
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Verified Tutor
                            </div>
                        </div>

                        <div className="pt-4">
                            <h3 className="font-semibold text-gray-900 mb-1">About Me</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {tutor.bio || "Passionate tutor dedicated to helping students achieve their academic goals."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Date Selection */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" /> Select Date
                    </h2>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        {calendarDays.map((date) => {
                            const isSelected = isSameDay(date, selectedDate);
                            return (
                                <button
                                    key={date.toString()}
                                    onClick={() => {
                                        setSelectedDate(date);
                                        setSelectedSlot(null);
                                    }}
                                    className={`
                                        flex flex-col items-center justify-center min-w-[70px] h-20 rounded-xl border transition-all shrink-0
                                        ${isSelected
                                            ? 'bg-primary text-white border-primary shadow-md transform scale-105'
                                            : 'bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <span className="text-xs font-medium uppercase">{format(date, 'EEE')}</span>
                                    <span className="text-xl font-bold">{format(date, 'd')}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Slots Grid */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5" /> Available Slots
                    </h2>

                    {availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {availableSlots.map(({ time }) => (
                                <button
                                    key={time}
                                    onClick={() => setSelectedSlot(time)}
                                    className={`
                                        py-3 px-4 rounded-lg border text-sm font-medium transition-all
                                        ${selectedSlot === time
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                                            : 'bg-white hover:border-gray-300 text-gray-700'
                                        }
                                    `}
                                >
                                    {time}
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

            {/* Right Col: Booking Summary */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border shadow-sm p-6 sticky top-6 space-y-6">
                    <h2 className="font-bold text-lg text-gray-900 border-b pb-4">Booking Summary</h2>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tutor</span>
                            <span className="font-medium text-gray-900">{tutor.userId?.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Date</span>
                            <span className="font-medium text-gray-900">{format(selectedDate, 'PPP')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Time</span>
                            <span className="font-medium text-gray-900">{selectedSlot || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Duration</span>
                            <span className="font-medium text-gray-900">60 mins</span>
                        </div>

                        <div className="border-t border-dashed my-4" />

                        <div className="flex justify-between items-end">
                            <span className="text-gray-900 font-bold">Total</span>
                            <span className="text-2xl font-bold text-primary">₹{tutor.hourlyRate}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Add a Note (Optional)</label>
                        <textarea
                            className="w-full text-sm p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none bg-gray-50"
                            rows="3"
                            placeholder="What would you like to focus on?"
                            value={bookingNote}
                            onChange={(e) => setBookingNote(e.target.value)}
                        />
                    </div>

                    <Button
                        className="w-full py-6 text-lg"
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
                    <p className="text-xs text-center text-gray-500">
                        You won't be charged yet. Cancellation is free up to 24 hours before.
                    </p>
                </div>
            </div>
        </div>
    );
}
