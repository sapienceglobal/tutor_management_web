'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    MdCalendarMonth, MdSave, MdAdd, MdDelete, MdAccessTime,
    MdWarning, MdSettings, MdStar, MdHourglassEmpty
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/studentTokens';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TABS = [
    { id: 'weekly',   label: 'Weekly Schedule',  icon: MdCalendarMonth },
    { id: 'custom',   label: 'Custom Slots',     icon: MdStar },
    { id: 'blocked',  label: 'Blocked Dates',    icon: MdWarning },
    { id: 'settings', label: 'Booking Settings', icon: MdSettings },
];

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}30`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.innerBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
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
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <MdHourglassEmpty className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading schedule...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: C.iconBg, borderRadius: '10px' }}>
                        <MdCalendarMonth size={24} color={C.iconColor} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 2px 0' }}>Schedule Management</h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.semibold, margin: 0 }}>Set your weekly availability and overrides</p>
                    </div>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-2 mb-6 p-1 w-full sm:w-max" style={{ backgroundColor: C.innerBg, borderRadius: '12px', border: `1px solid ${C.cardBorder}` }}>
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 cursor-pointer border-none transition-all"
                        style={{
                            backgroundColor: activeTab === id ? C.btnPrimary : 'transparent',
                            color: activeTab === id ? '#ffffff' : C.textMuted,
                            borderRadius: '10px',
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
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex flex-col">
                            {DAYS.map((day, idx) => {
                                const daySchedule = schedule.find(s => s.day === day);
                                const hasSlots = daySchedule?.slots?.length > 0;

                                return (
                                    <div key={day} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors" 
                                        style={{ borderBottom: idx !== DAYS.length -1 ? `1px solid ${C.cardBorder}` : 'none' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        
                                        <div className="flex items-center gap-3">
                                            <span style={{ width: '12px', height: '12px', borderRadius: R.full, backgroundColor: hasSlots ? C.success : C.textMuted, opacity: hasSlots ? 1 : 0.3 }} />
                                            <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, width: '100px' }}>{day}</span>
                                            <span style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, backgroundColor: C.innerBg, padding: '4px 8px', borderRadius: '8px', border: `1px solid ${C.cardBorder}` }}>
                                                {hasSlots ? `${daySchedule.slots.length} slot${daySchedule.slots.length > 1 ? 's' : ''}` : 'Unavailable'}
                                            </span>
                                        </div>

                                        <div className="flex-1 w-full md:w-auto flex flex-wrap items-center gap-2 pl-0 md:pl-6">
                                            {hasSlots && daySchedule.slots.map((slot, index) => (
                                                <div key={index} className="flex items-center gap-2 p-1.5 pr-2 transition-colors"
                                                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                                                    <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ backgroundColor: C.innerBg, borderRadius: '6px' }}>
                                                        <MdAccessTime size={16} color={C.btnPrimary} />
                                                    </div>
                                                    <input type="text" defaultValue={slot}
                                                        onBlur={(e) => handleUpdateSlot(day, index, e.target.value)}
                                                        placeholder="09:00-10:00"
                                                        style={{ backgroundColor: 'transparent', border: 'none', outline: 'none', color: C.heading, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, width: '90px', textAlign: 'center' }} />
                                                    <button onClick={() => handleRemoveSlot(day, index)}
                                                        className="w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer border-none transition-opacity hover:opacity-70"
                                                        style={{ backgroundColor: C.dangerBg, borderRadius: '6px' }}>
                                                        <MdDelete size={16} color={C.danger} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => handleAddSlot(day)}
                                                className="flex items-center justify-center gap-1.5 h-11 px-4 cursor-pointer border-none transition-opacity hover:opacity-80"
                                                style={{ backgroundColor: C.innerBg, color: C.btnPrimary, borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px dashed ${C.btnPrimary}` }}>
                                                <MdAdd size={18} /> Add Slot
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={handleSaveSchedule}
                            className="flex items-center justify-center gap-2 h-12 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                            <MdSave size={18} /> Save Weekly Schedule
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                CUSTOM SLOTS
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'custom' && (
                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                    {/* Form */}
                    <div className="p-6 space-y-5 h-fit" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h3 className="flex items-center gap-2" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>
                            <MdStar size={22} color={C.warning} /> Set Custom Availability
                        </h3>
                        <form onSubmit={handleSetCustomSlots} className="space-y-4">
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Select Date</label>
                                <input type="date" name="date" required style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Reason (Optional)</label>
                                <input type="text" name="reason" placeholder="e.g. Extra Session" style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Slots (Comma separated)</label>
                                <input type="text" name="slots" placeholder="09:00-10:00, 14:00-15:00" required style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                <p style={{ fontSize: '11px', color: C.textMuted, fontWeight: T.weight.semibold, margin: '4px 0 0 0' }}>Format: HH:MM-HH:MM</p>
                            </div>
                            <button type="submit"
                                className="w-full flex items-center justify-center h-12 mt-6 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                                Set Custom Slots
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="space-y-4">
                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>Custom Availability</h3>
                        {dateOverrides.filter(o => !o.isBlocked && o.customSlots?.length > 0).length === 0 ? (
                            <div className="text-center py-16 flex flex-col items-center" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                                <div className="flex items-center justify-center mb-3" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                    <MdStar size={32} color={C.textMuted} style={{ opacity: 0.5 }} />
                                </div>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No custom slots set.</p>
                            </div>
                        ) : (
                            dateOverrides.filter(o => !o.isBlocked && o.customSlots?.length > 0).map(override => (
                                <div key={override.date} className="p-5 flex flex-col gap-3" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
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
                                            style={{ backgroundColor: C.dangerBg, borderRadius: '8px' }}>
                                            <MdDelete size={16} color={C.danger} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {override.customSlots.map((slot, i) => (
                                            <span key={i} style={{ fontSize: '11px', fontWeight: T.weight.bold, backgroundColor: C.innerBg, color: C.btnPrimary, padding: '6px 12px', borderRadius: '8px', border: `1px solid ${C.cardBorder}` }}>
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
                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                    {/* Form */}
                    <div className="p-6 space-y-5 h-fit" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h3 className="flex items-center gap-2" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>
                            <MdWarning size={22} color={C.danger} /> Block a Date
                        </h3>
                        <form onSubmit={handleBlockDate} className="space-y-4">
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Select Date</label>
                                <input type="date" name="date" required style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Reason (Optional)</label>
                                <input type="text" name="reason" placeholder="e.g. Personal Leave" style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <button type="submit"
                                className="w-full flex items-center justify-center h-12 mt-6 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                                style={{ backgroundColor: C.danger, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                Block Date
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="space-y-4">
                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>Blocked Dates</h3>
                        {dateOverrides.filter(o => o.isBlocked).length === 0 ? (
                            <div className="text-center py-16 flex flex-col items-center" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                                <div className="flex items-center justify-center mb-3" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                    <MdWarning size={32} color={C.textMuted} style={{ opacity: 0.5 }} />
                                </div>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No blocked dates.</p>
                            </div>
                        ) : (
                            dateOverrides.filter(o => o.isBlocked).map(override => (
                                <div key={override.date} className="p-5 flex items-center justify-between gap-4 transition-colors hover:bg-white/40" 
                                    style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                    <div>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>
                                            {new Date(override.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                        {override.reason && <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.danger, margin: 0 }}>{override.reason}</p>}
                                    </div>
                                    <button onClick={() => handleUnblockDate(override.date)}
                                        className="w-10 h-10 flex items-center justify-center shrink-0 cursor-pointer border-none transition-opacity hover:opacity-70 shadow-sm"
                                        style={{ backgroundColor: C.dangerBg, borderRadius: '10px', border: `1px solid ${C.dangerBorder}` }}>
                                        <MdDelete size={18} color={C.danger} />
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
                <div className="max-w-2xl mx-auto overflow-hidden animate-in fade-in duration-500" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="p-6" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                        <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Booking Rules</h3>
                    </div>
                    <div>
                        {[
                            { key: 'minAdvanceHours', label: 'Minimum Advance Notice', desc: 'How many hours before can students book?', unit: 'hours' },
                            { key: 'maxAdvanceDays', label: 'Booking Horizon', desc: 'How far in advance can students book?', unit: 'days' },
                            { key: 'slotCapacity', label: 'Slot Capacity', desc: 'Max students per slot', unit: 'students' },
                        ].map(({ key, label, desc, unit }, i) => (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 transition-colors hover:bg-white/40" 
                                style={{ borderBottom: i !== 2 ? `1px solid ${C.cardBorder}` : 'none' }}>
                                <div>
                                    <p style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>{label}</p>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{desc}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <input type="number" value={settings[key]} onChange={(e) => setSettings(s => ({ ...s, [key]: parseInt(e.target.value) }))}
                                        style={{ ...baseInputStyle, width: '100px', textAlign: 'center', fontSize: T.size.md, fontWeight: T.weight.black, color: C.btnPrimary, backgroundColor: C.surfaceWhite }}
                                        onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, width: '60px' }}>{unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 flex justify-end" style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                        <button onClick={handleSaveSettings}
                            className="flex items-center justify-center gap-2 h-12 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                            <MdSave size={18} /> Save Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}