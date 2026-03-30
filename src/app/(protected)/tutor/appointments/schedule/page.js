'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    Calendar, Save, Plus, Trash2, Clock,
    AlertCircle, Settings, Star, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TABS = [
    { id: 'weekly',   label: 'Weekly Schedule',  icon: Calendar },
    { id: 'custom',   label: 'Custom Slots',     icon: Star },
    { id: 'blocked',  label: 'Blocked Dates',    icon: AlertCircle },
    { id: 'settings', label: 'Booking Settings', icon: Settings },
];

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: '#E3DFF8',
    border: '1.5px solid transparent',
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

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
            if (profileRes?.data?.success) {
                const tutorId = profileRes.data.tutor._id;
                const res = await api.get(`/appointments/schedule/${tutorId}`);
                if (res?.data?.success) {
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
            if (res?.data?.success) toast.success('Weekly schedule saved!');
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
            if (res?.data?.success) {
                toast.success('Date blocked');
                setDateOverrides(res.data.dateOverrides);
                e.target.reset();
            }
        } catch (error) { toast.error(error?.response?.data?.message || 'Failed to block date'); }
    };

    const handleUnblockDate = async (date) => {
        try {
            const res = await api.delete(`/appointments/schedule/unblock-date/${date}`);
            if (res?.data?.success) { toast.success('Date unblocked'); setDateOverrides(res.data.dateOverrides); }
        } catch { toast.error('Failed'); }
    };

    const handleSaveSettings = async () => {
        try {
            const res = await api.put('/appointments/schedule/booking-settings', settings);
            if (res?.data?.success) toast.success('Settings updated');
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
            if (res?.data?.success) { toast.success('Custom slots set successfully'); setDateOverrides(res.data.dateOverrides); e.target.reset(); }
        } catch (error) { toast.error(error?.response?.data?.message || 'Failed to set custom slots'); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading schedule...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <Calendar size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>Schedule Management</h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>Set your weekly availability and overrides</p>
                    </div>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-2 mb-6 p-2" style={{ backgroundColor: '#EAE8FA', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 cursor-pointer border-none transition-all"
                        style={{
                            backgroundColor: activeTab === id ? C.surfaceWhite : 'transparent',
                            color: activeTab === id ? C.btnPrimary : C.textMuted,
                            borderRadius: R.lg,
                            boxShadow: activeTab === id ? S.card : 'none',
                            fontSize: T.size.sm,
                            fontWeight: T.weight.bold,
                            fontFamily: T.fontFamily
                        }}>
                        <Icon size={16} /> {label}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                WEEKLY SCHEDULE
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'weekly' && (
                <div className="space-y-6">
                    <div className="overflow-hidden" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex flex-col">
                            {DAYS.map((day, idx) => {
                                const daySchedule = schedule.find(s => s.day === day);
                                const hasSlots = daySchedule?.slots?.length > 0;

                                return (
                                    <div key={day} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ borderBottom: idx !== DAYS.length -1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                                        <div className="flex items-center gap-3">
                                            <span style={{ width: '12px', height: '12px', borderRadius: R.full, backgroundColor: hasSlots ? C.success : C.textMuted, opacity: hasSlots ? 1 : 0.3 }} />
                                            <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, width: '100px' }}>{day}</span>
                                            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, backgroundColor: '#E3DFF8', padding: '4px 8px', borderRadius: R.md }}>
                                                {hasSlots ? `${daySchedule.slots.length} slot${daySchedule.slots.length > 1 ? 's' : ''}` : 'Unavailable'}
                                            </span>
                                        </div>

                                        <div className="flex-1 w-full md:w-auto flex flex-wrap items-center gap-2 pl-0 md:pl-6">
                                            {hasSlots && daySchedule.slots.map((slot, index) => (
                                                <div key={index} className="flex items-center gap-2 p-1.5 pr-2 transition-colors"
                                                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl }}>
                                                    <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.md }}>
                                                        <Clock size={14} color={C.btnPrimary} />
                                                    </div>
                                                    <input type="text" defaultValue={slot}
                                                        onBlur={(e) => handleUpdateSlot(day, index, e.target.value)}
                                                        placeholder="09:00-10:00"
                                                        style={{ backgroundColor: 'transparent', border: 'none', outline: 'none', color: C.heading, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, width: '90px', textAlign: 'center' }} />
                                                    <button onClick={() => handleRemoveSlot(day, index)}
                                                        className="w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer border-none transition-opacity hover:opacity-70"
                                                        style={{ backgroundColor: C.dangerBg, borderRadius: R.md }}>
                                                        <Trash2 size={14} color={C.danger} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => handleAddSlot(day)}
                                                className="flex items-center justify-center gap-1.5 h-10 px-4 cursor-pointer border-none transition-opacity hover:opacity-80"
                                                style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px dashed ${C.btnPrimary}` }}>
                                                <Plus size={16} /> Add Slot
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={handleSaveSchedule}
                            className="flex items-center justify-center gap-2 h-12 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            <Save size={18} /> Save Weekly Schedule
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                CUSTOM SLOTS
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'custom' && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Form */}
                    <div className="p-6 space-y-5 h-fit" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h3 className="flex items-center gap-2" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>
                            <Star size={20} color={C.warning} /> Set Custom Availability
                        </h3>
                        <form onSubmit={handleSetCustomSlots} className="space-y-4">
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Select Date</label>
                                <input type="date" name="date" required style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Reason (Optional)</label>
                                <input type="text" name="reason" placeholder="e.g. Extra Session" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Slots (Comma separated)</label>
                                <input type="text" name="slots" placeholder="09:00-10:00, 14:00-15:00" required style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                <p style={{ fontSize: '11px', color: C.textMuted, fontWeight: T.weight.medium, margin: 0 }}>Format: HH:MM-HH:MM</p>
                            </div>
                            <button type="submit"
                                className="w-full flex items-center justify-center h-11 mt-4 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                Set Custom Slots
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="space-y-4">
                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>Custom Availability</h3>
                        {dateOverrides.filter(o => !o.isBlocked && o.customSlots?.length > 0).length === 0 ? (
                            <div className="text-center py-16 flex flex-col items-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                                <Star size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No custom slots set.</p>
                            </div>
                        ) : (
                            dateOverrides.filter(o => !o.isBlocked && o.customSlots?.length > 0).map(override => (
                                <div key={override.date} className="p-5 flex flex-col gap-3" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>
                                                {new Date(override.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                            {override.reason && (
                                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, margin: 0 }}>{override.reason}</p>
                                            )}
                                        </div>
                                        <button onClick={() => handleUnblockDate(override.date)}
                                            className="w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer border-none transition-opacity hover:opacity-70"
                                            style={{ backgroundColor: C.dangerBg, borderRadius: R.md }}>
                                            <Trash2 size={16} color={C.danger} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {override.customSlots.map((slot, i) => (
                                            <span key={i} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: '#E3DFF8', color: C.btnPrimary, padding: '4px 10px', borderRadius: R.md, border: `1px solid ${C.cardBorder}` }}>
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
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Form */}
                    <div className="p-6 space-y-5 h-fit" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h3 className="flex items-center gap-2" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>
                            <AlertCircle size={20} color={C.danger} /> Block a Date
                        </h3>
                        <form onSubmit={handleBlockDate} className="space-y-4">
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Select Date</label>
                                <input type="date" name="date" required style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Reason (Optional)</label>
                                <input type="text" name="reason" placeholder="e.g. Personal Leave" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <button type="submit"
                                className="w-full flex items-center justify-center h-11 mt-4 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                                style={{ backgroundColor: C.danger, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                Block Date
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="space-y-4">
                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>Blocked Dates</h3>
                        {dateOverrides.filter(o => o.isBlocked).length === 0 ? (
                            <div className="text-center py-16 flex flex-col items-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                                <AlertCircle size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No blocked dates.</p>
                            </div>
                        ) : (
                            dateOverrides.filter(o => o.isBlocked).map(override => (
                                <div key={override.date} className="p-5 flex items-center justify-between gap-4" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                    <div>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>
                                            {new Date(override.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                        {override.reason && <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.danger, margin: 0 }}>{override.reason}</p>}
                                    </div>
                                    <button onClick={() => handleUnblockDate(override.date)}
                                        className="w-10 h-10 flex items-center justify-center shrink-0 cursor-pointer border-none transition-opacity hover:opacity-70"
                                        style={{ backgroundColor: C.dangerBg, borderRadius: R.md }}>
                                        <Trash2 size={18} color={C.danger} />
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
                <div className="max-w-2xl mx-auto overflow-hidden" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="p-6" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                        <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Booking Rules</h3>
                    </div>
                    <div>
                        {[
                            { key: 'minAdvanceHours', label: 'Minimum Advance Notice', desc: 'How many hours before can students book?', unit: 'hours' },
                            { key: 'maxAdvanceDays', label: 'Booking Horizon', desc: 'How far in advance can students book?', unit: 'days' },
                            { key: 'slotCapacity', label: 'Slot Capacity', desc: 'Max students per slot', unit: 'students' },
                        ].map(({ key, label, desc, unit }, i) => (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6" style={{ borderBottom: i !== 2 ? `1px solid ${C.cardBorder}` : 'none' }}>
                                <div>
                                    <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>{label}</p>
                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{desc}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <input type="number" value={settings[key]} onChange={(e) => setSettings(s => ({ ...s, [key]: parseInt(e.target.value) }))}
                                        style={{ ...baseInputStyle, width: '100px', textAlign: 'center', fontSize: T.size.md, fontWeight: T.weight.black, color: C.btnPrimary }}
                                        onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, width: '60px' }}>{unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 flex justify-end" style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                        <button onClick={handleSaveSettings}
                            className="flex items-center justify-center gap-2 h-12 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            <Save size={18} /> Save Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}