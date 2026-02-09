'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    Calendar,
    Save,
    Plus,
    Trash2,
    Clock,
    AlertCircle,
    Settings,
    CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export default function ScheduleManagementPage() {
    const [activeTab, setActiveTab] = useState('weekly');
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState([]);
    const [dateOverrides, setDateOverrides] = useState([]);
    const [settings, setSettings] = useState({
        minAdvanceHours: 24,
        maxAdvanceDays: 60,
        slotCapacity: 1
    });

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            // Get tutor ID from profile content or specialized endpoint
            // Assuming the backend endpoint /appointments/schedule/:tutorId works, 
            // but we might need /appointments/schedule/me if implemented, 
            // relying on the controller: router.get("/schedule/:tutorId", getSchedule);
            // We need the tutor's ID first. For now, let's assume the user IS the tutor 
            // and we can fetch their own schedule via user ID or a 'me' endpoint if it existed.
            // Wait, the backend shows router.get("/schedule/:tutorId", getSchedule);
            // We need to fetch the current tutor profile first.

            const profileRes = await api.get('/tutors/profile');
            if (profileRes.data.success) {
                const tutorId = profileRes.data.tutor._id;
                const response = await api.get(`/appointments/schedule/${tutorId}`);

                if (response.data.success) {
                    setSchedule(response.data.schedule || []);
                    setDateOverrides(response.data.dateOverrides || []);
                    setSettings(response.data.bookingSettings || settings);
                }
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
            // toast.error('Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSchedule = async () => {
        try {
            const response = await api.post('/appointments/schedule', {
                availability: schedule
            });
            if (response.data.success) {
                toast.success('Weekly schedule saved!');
            }
        } catch (error) {
            toast.error('Failed to save schedule');
        }
    };

    const handleAddSlot = (day) => {
        setSchedule(prev => {
            const daySchedule = prev.find(d => d.day === day);
            if (daySchedule) {
                return prev.map(d => d.day === day ? { ...d, slots: [...d.slots, '09:00-10:00'] } : d);
            } else {
                return [...prev, { day, slots: ['09:00-10:00'] }];
            }
        });
    };

    const handleUpdateSlot = (day, index, value) => {
        setSchedule(prev => prev.map(d => {
            if (d.day === day) {
                const newSlots = [...d.slots];
                newSlots[index] = value;
                return { ...d, slots: newSlots };
            }
            return d;
        }));
    };

    const handleRemoveSlot = (day, index) => {
        setSchedule(prev => prev.map(d => {
            if (d.day === day) {
                const newSlots = d.slots.filter((_, i) => i !== index);
                return { ...d, slots: newSlots };
            }
            return d;
        }).filter(d => d.slots.length > 0));
    };

    const handleBlockDate = async (e) => {
        e.preventDefault();
        const date = e.target.date.value;
        const reason = e.target.reason.value;

        try {
            const response = await api.post('/appointments/schedule/block-date', { date, reason });
            if (response.data.success) {
                toast.success('Date blocked');
                setDateOverrides(response.data.dateOverrides);
                e.target.reset();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to block date');
        }
    };

    const handleUnblockDate = async (date) => {
        try {
            const response = await api.delete(`/appointments/schedule/unblock-date/${date}`);
            if (response.data.success) {
                toast.success('Date unblocked');
                setDateOverrides(response.data.dateOverrides);
            }
        } catch (error) {
            toast.error('Failed');
        }
    };

    const handleSaveSettings = async () => {
        try {
            const response = await api.put('/appointments/schedule/booking-settings', settings);
            if (response.data.success) {
                toast.success('Settings updated');
            }
        } catch (error) {
            toast.error('Failed to update settings');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading schedule...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
                <p className="text-gray-500">Set your weekly availability and overrides.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b">
                {[
                    { id: 'weekly', label: 'Weekly Schedule', icon: Calendar },
                    { id: 'blocked', label: 'Blocked Dates', icon: AlertCircle },
                    { id: 'settings', label: 'Booking Settings', icon: Settings },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors
                            ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }
                        `}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* WEEKLY SCHEDULE TAB */}
            {activeTab === 'weekly' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl border p-6 shadow-sm space-y-6">
                        {DAYS.map(day => {
                            const daySchedule = schedule.find(s => s.day === day);
                            const hasSlots = daySchedule && daySchedule.slots.length > 0;

                            return (
                                <div key={day} className="border-b last:border-0 pb-6 last:pb-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${hasSlots ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <h3 className="font-semibold text-gray-900 w-24">{day}</h3>
                                            <span className="text-sm text-gray-500">
                                                {hasSlots ? `${daySchedule.slots.length} slots` : 'Unavailable'}
                                            </span>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleAddSlot(day)}>
                                            <Plus className="w-4 h-4 mr-1" /> Add Slot
                                        </Button>
                                    </div>

                                    {hasSlots && (
                                        <div className="flex flex-wrap gap-3 pl-6">
                                            {daySchedule.slots.map((slot, index) => (
                                                <div key={index} className="flex items-center gap-2 bg-gray-50 border rounded-lg p-2">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        defaultValue={slot}
                                                        className="bg-transparent text-sm w-24 font-medium focus:outline-none"
                                                        onBlur={(e) => handleUpdateSlot(day, index, e.target.value)}
                                                        placeholder="09:00-10:00"
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveSlot(day, index)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-end sticky bottom-6">
                        <Button size="lg" onClick={handleSaveSchedule} className="shadow-lg">
                            <Save className="w-4 h-4 mr-2" /> Save Weekly Schedule
                        </Button>
                    </div>
                </div>
            )}

            {/* BLOCKED DATES TAB */}
            {activeTab === 'blocked' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Form */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" /> Block a Date
                            </h3>
                            <form onSubmit={handleBlockDate} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Select Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        required
                                        className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Reason (Optional)</label>
                                    <input
                                        type="text"
                                        name="reason"
                                        placeholder="e.g. Personal Leave"
                                        className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                                    Block Date
                                </Button>
                            </form>
                        </div>

                        {/* List */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900">Blocked Dates</h3>
                            {dateOverrides.filter(o => o.isBlocked).length === 0 ? (
                                <p className="text-gray-500 italic">No blocked dates.</p>
                            ) : (
                                dateOverrides.filter(o => o.isBlocked).map(override => (
                                    <div key={override.date} className="bg-white p-4 rounded-xl border hover:border-red-200 transition-colors flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-900">{new Date(override.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                            <p className="text-sm text-red-500">{override.reason}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-gray-400 hover:text-red-600"
                                            onClick={() => handleUnblockDate(override.date)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl border p-6 shadow-sm space-y-6 max-w-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">Minimum Advance Notice</h3>
                                <p className="text-sm text-gray-500">How many hours before can students book?</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.minAdvanceHours}
                                    onChange={(e) => setSettings({ ...settings, minAdvanceHours: parseInt(e.target.value) })}
                                    className="w-20 p-2 border rounded-lg text-center font-bold"
                                />
                                <span className="text-sm text-gray-500">hours</span>
                            </div>
                        </div>
                        <div className="border-t pt-6 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">Booking Horizon</h3>
                                <p className="text-sm text-gray-500">How far in advance can students book?</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.maxAdvanceDays}
                                    onChange={(e) => setSettings({ ...settings, maxAdvanceDays: parseInt(e.target.value) })}
                                    className="w-20 p-2 border rounded-lg text-center font-bold"
                                />
                                <span className="text-sm text-gray-500">days</span>
                            </div>
                        </div>
                        <div className="border-t pt-6 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">Slot Capacity</h3>
                                <p className="text-sm text-gray-500">Max students per slot</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.slotCapacity}
                                    onChange={(e) => setSettings({ ...settings, slotCapacity: parseInt(e.target.value) })}
                                    className="w-20 p-2 border rounded-lg text-center font-bold"
                                />
                                <span className="text-sm text-gray-500">students</span>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button onClick={handleSaveSettings}>Save Settings</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
