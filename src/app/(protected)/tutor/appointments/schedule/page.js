'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    Calendar, Save, Plus, Trash2, Clock,
    AlertCircle, Settings, Star, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TABS = [
    { id: 'weekly',   label: 'Weekly Schedule',  icon: Calendar },
    { id: 'custom',   label: 'Custom Slots',      icon: Star },
    { id: 'blocked',  label: 'Blocked Dates',     icon: AlertCircle },
    { id: 'settings', label: 'Booking Settings',  icon: Settings },
];

// ─── Shared input class ────────────────────────────────────────────────────────
const inp = "w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-colors bg-white";

export default function ScheduleManagementPage() {
    const [activeTab, setActiveTab]       = useState('weekly');
    const [loading, setLoading]           = useState(true);
    const [schedule, setSchedule]         = useState([]);
    const [dateOverrides, setDateOverrides] = useState([]);
    const [settings, setSettings]         = useState({
        minAdvanceHours: 24, maxAdvanceDays: 60, slotCapacity: 1
    });

    useEffect(() => { fetchSchedule(); }, []);

    const fetchSchedule = async () => {
        try {
            const profileRes = await api.get('/tutors/profile');
            if (profileRes.data.success) {
                const tutorId = profileRes.data.tutor._id;
                const res = await api.get(`/appointments/schedule/${tutorId}`);
                if (res.data.success) {
                    setSchedule((res.data.schedule || []).map(day => ({
                        ...day, isActive: day.slots?.length > 0
                    })));
                    setDateOverrides(res.data.dateOverrides || []);
                    setSettings(res.data.bookingSettings || settings);
                }
            }
        } catch { /* silent — defaults used */ }
        finally { setLoading(false); }
    };

    const handleSaveSchedule = async () => {
        try {
            const res = await api.post('/appointments/schedule', { availability: schedule });
            if (res.data.success) toast.success('Weekly schedule saved!');
        } catch { toast.error('Failed to save schedule'); }
    };

    const handleAddSlot = (day) => {
        setSchedule(prev => {
            const existing = prev.find(d => d.day === day);
            if (existing) return prev.map(d => d.day === day ? { ...d, slots: [...d.slots, '09:00-10:00'], isActive: true } : d);
            return [...prev, { day, slots: ['09:00-10:00'], isActive: true }];
        });
    };

    const handleUpdateSlot = (day, index, value) => {
        setSchedule(prev => prev.map(d => {
            if (d.day !== day) return d;
            const newSlots = [...d.slots]; newSlots[index] = value;
            return { ...d, slots: newSlots };
        }));
    };

    const handleRemoveSlot = (day, index) => {
        setSchedule(prev => prev.map(d => {
            if (d.day !== day) return d;
            const newSlots = d.slots.filter((_, i) => i !== index);
            return { ...d, slots: newSlots, isActive: newSlots.length > 0 };
        }).filter(d => d.slots.length > 0));
    };

    const handleBlockDate = async (e) => {
        e.preventDefault();
        const date = e.target.date.value;
        const reason = e.target.reason.value;
        try {
            const res = await api.post('/appointments/schedule/block-date', { date, reason });
            if (res.data.success) {
                toast.success('Date blocked');
                setDateOverrides(res.data.dateOverrides);
                e.target.reset();
            }
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to block date'); }
    };

    const handleUnblockDate = async (date) => {
        try {
            const res = await api.delete(`/appointments/schedule/unblock-date/${date}`);
            if (res.data.success) { toast.success('Date unblocked'); setDateOverrides(res.data.dateOverrides); }
        } catch { toast.error('Failed'); }
    };

    const handleSaveSettings = async () => {
        try {
            const res = await api.put('/appointments/schedule/booking-settings', settings);
            if (res.data.success) toast.success('Settings updated');
        } catch { toast.error('Failed to update settings'); }
    };

    const handleSetCustomSlots = async (e) => {
        e.preventDefault();
        const date = e.target.date.value;
        const reason = e.target.reason.value;
        const slots = e.target.slots.value.split(',').map(s => s.trim()).filter(s => /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(s));
        if (!slots.length) { toast.error('Please enter valid slots (e.g. 09:00-10:00)'); return; }
        try {
            const res = await api.post('/appointments/schedule/custom-slots', { date, reason, slots });
            if (res.data.success) { toast.success('Custom slots set successfully'); setDateOverrides(res.data.dateOverrides); e.target.reset(); }
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to set custom slots'); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm text-slate-400">Loading schedule...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                        <Calendar className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Schedule Management</h1>
                        <p className="text-xs text-slate-400">Set your weekly availability and overrides</p>
                    </div>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────────── */}
            <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className="flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors"
                        style={activeTab === id
                            ? { borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' }
                            : { borderColor: 'transparent', color: '#94a3b8' }}>
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                WEEKLY SCHEDULE
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'weekly' && (
                <div className="space-y-4 -mt-px">
                    <div className="bg-white rounded-b-xl rounded-tr-xl border border-slate-100 divide-y divide-slate-50">
                        {DAYS.map(day => {
                            const daySchedule = schedule.find(s => s.day === day);
                            const hasSlots = daySchedule?.slots?.length > 0;

                            return (
                                <div key={day} className="px-6 py-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasSlots ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                            <span className="text-sm font-bold text-slate-700 w-24">{day}</span>
                                            <span className="text-xs text-slate-400">
                                                {hasSlots ? `${daySchedule.slots.length} slot${daySchedule.slots.length > 1 ? 's' : ''}` : 'Unavailable'}
                                            </span>
                                        </div>
                                        <button onClick={() => handleAddSlot(day)}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors"
                                            style={{ color: 'var(--theme-primary)', borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, white)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, white)' }}>
                                            <Plus className="w-3 h-3" /> Add Slot
                                        </button>
                                    </div>

                                    {hasSlots && (
                                        <div className="flex flex-wrap gap-2 pl-5">
                                            {daySchedule.slots.map((slot, index) => (
                                                <div key={index}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                                                    <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                    <input type="text" defaultValue={slot}
                                                        className="bg-transparent text-xs font-semibold text-slate-700 w-24 focus:outline-none"
                                                        onBlur={(e) => handleUpdateSlot(day, index, e.target.value)}
                                                        placeholder="09:00-10:00" />
                                                    <button onClick={() => handleRemoveSlot(day, index)}
                                                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-50 transition-colors">
                                                        <Trash2 className="w-3 h-3 text-red-400" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end">
                        <button onClick={handleSaveSchedule}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-opacity"
                            style={{ backgroundColor: 'var(--theme-primary)' }}>
                            <Save className="w-4 h-4" /> Save Weekly Schedule
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                CUSTOM SLOTS
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'custom' && (
                <div className="grid md:grid-cols-2 gap-5 -mt-px">
                    {/* Form */}
                    <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4 h-fit">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)' }}>
                                <Star className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            Set Custom Availability
                        </h3>
                        <form onSubmit={handleSetCustomSlots} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Select Date</label>
                                <input type="date" name="date" required className={inp} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Reason (Optional)</label>
                                <input type="text" name="reason" placeholder="e.g. Extra Session" className={inp} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Slots (Comma separated)</label>
                                <input type="text" name="slots" placeholder="09:00-10:00, 14:00-15:00" required className={inp} />
                                <p className="text-[11px] text-slate-400">Format: HH:MM-HH:MM</p>
                            </div>
                            <button type="submit"
                                className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity"
                                style={{ backgroundColor: 'var(--theme-primary)' }}>
                                Set Custom Slots
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-700">Custom Availability</h3>
                        {dateOverrides.filter(o => !o.isBlocked && o.customSlots?.length > 0).length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
                                <Star className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">No custom slots set.</p>
                            </div>
                        ) : (
                            dateOverrides.filter(o => !o.isBlocked && o.customSlots?.length > 0).map(override => (
                                <div key={override.date}
                                    className="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-sm transition-shadow">
                                    <div className="flex items-start justify-between mb-2.5">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">
                                                {new Date(override.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                            {override.reason && (
                                                <p className="text-xs mt-0.5" style={{ color: 'var(--theme-primary)' }}>{override.reason}</p>
                                            )}
                                        </div>
                                        <button onClick={() => handleUnblockDate(override.date)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {override.customSlots.map((slot, i) => (
                                            <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg font-semibold border"
                                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, white)', color: 'var(--theme-primary)', borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                                                {slot}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                BLOCKED DATES
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'blocked' && (
                <div className="grid md:grid-cols-2 gap-5 -mt-px">
                    {/* Form */}
                    <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4 h-fit">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-red-50">
                                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            </div>
                            Block a Date
                        </h3>
                        <form onSubmit={handleBlockDate} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Select Date</label>
                                <input type="date" name="date" required className={inp} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Reason (Optional)</label>
                                <input type="text" name="reason" placeholder="e.g. Personal Leave" className={inp} />
                            </div>
                            <button type="submit"
                                className="w-full py-2.5 text-sm font-semibold text-white rounded-xl bg-red-500 hover:bg-red-600 transition-colors">
                                Block Date
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-700">Blocked Dates</h3>
                        {dateOverrides.filter(o => o.isBlocked).length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
                                <AlertCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">No blocked dates.</p>
                            </div>
                        ) : (
                            dateOverrides.filter(o => o.isBlocked).map(override => (
                                <div key={override.date}
                                    className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:shadow-sm transition-shadow">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {new Date(override.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                        {override.reason && <p className="text-xs text-red-500 mt-0.5">{override.reason}</p>}
                                    </div>
                                    <button onClick={() => handleUnblockDate(override.date)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                BOOKING SETTINGS
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-b-xl rounded-tr-xl border border-slate-100 overflow-hidden -mt-px max-w-2xl">
                    {[
                        {
                            key: 'minAdvanceHours',
                            label: 'Minimum Advance Notice',
                            desc: 'How many hours before can students book?',
                            unit: 'hours',
                        },
                        {
                            key: 'maxAdvanceDays',
                            label: 'Booking Horizon',
                            desc: 'How far in advance can students book?',
                            unit: 'days',
                        },
                        {
                            key: 'slotCapacity',
                            label: 'Slot Capacity',
                            desc: 'Max students per slot',
                            unit: 'students',
                        },
                    ].map(({ key, label, desc, unit }, i) => (
                        <div key={key} className={`flex items-center justify-between px-6 py-5 ${i > 0 ? 'border-t border-slate-50' : ''}`}>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{label}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <input type="number"
                                    value={settings[key]}
                                    onChange={(e) => setSettings(s => ({ ...s, [key]: parseInt(e.target.value) }))}
                                    className="w-20 h-9 text-center text-sm font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] transition-colors" />
                                <span className="text-xs text-slate-400 w-14">{unit}</span>
                            </div>
                        </div>
                    ))}

                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                        <button onClick={handleSaveSettings}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity"
                            style={{ backgroundColor: 'var(--theme-primary)' }}>
                            <Save className="w-4 h-4" /> Save Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}