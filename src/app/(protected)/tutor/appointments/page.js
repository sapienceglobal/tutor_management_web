'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    MdCalendarMonth,
    MdAccessTime,
    MdCheckCircle,
    MdCancel,
    MdPerson,
    MdMessage,
    MdVideocam,
    MdErrorOutline,
    MdHourglassEmpty,
    MdChevronRight
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        confirmed: { bg: C.successBg, color: C.success, border: C.successBorder },
        pending: { bg: C.warningBg, color: C.warning, border: C.warningBorder },
        completed: { bg: C.innerBg, color: C.textMuted, border: C.cardBorder },
        cancelled: { bg: C.dangerBg, color: C.danger, border: C.dangerBorder },
    };
    const style = map[status] || map.completed;

    return (
        <span style={{
            fontFamily: T.fontFamily,
            fontSize: T.size.xs,
            fontWeight: T.weight.bold,
            padding: '4px 10px',
            borderRadius: '10px',
            textTransform: 'uppercase',
            letterSpacing: T.tracking.wider,
            backgroundColor: style.bg,
            color: style.color,
            border: `1px solid ${style.border}`
        }}>
            {status}
        </span>
    );
}

const TABS = ['pending', 'confirmed', 'history'];

export default function ManageAppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => { fetchAppointments(); }, []);

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments');
            if (res?.data?.success) setAppointments(res.data.appointments);
        } catch {
            toast.error('Failed to load appointments');
        } finally { setLoading(false); }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await api.patch(`/appointments/${id}`, { status });
            if (res?.data?.success) {
                toast.success(`Appointment ${status} successfully`);
                fetchAppointments();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Update failed');
        }
    };

    const handleJoin = (link) => {
        if (!link) {
            toast.error('Meeting link is not available yet');
            return;
        }
        window.open(link, '_blank');
    };

    const filtered = appointments.filter(apt =>
        activeTab === 'history'
            ? apt.status === 'completed' || apt.status === 'cancelled'
            : apt.status === activeTab
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                        Loading appointments...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5"
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0"
                        style={{ width: 48, height: 48, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                        <MdCalendarMonth style={{ width: 24, height: 24, color: C.iconColor }} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.bold, margin: '0 0 2px 0' }}>
                            Manage Appointments
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.base, fontWeight: T.weight.semibold, margin: 0 }}>
                            Track and manage your online live class bookings
                        </p>
                    </div>
                </div>

                {/* Animated Switcher Pattern */}
                <div className="relative flex items-center p-1 rounded-xl self-start xl:self-auto"
                    style={{ minWidth: '320px', backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                    <div className="absolute top-1 bottom-1 transition-transform duration-300 ease-in-out z-0"
                        style={{
                            width: 'calc(33.33% - 4px)',
                            backgroundColor: C.btnPrimary,
                            transform: activeTab === 'pending' ? 'translateX(0)' : activeTab === 'confirmed' ? 'translateX(100%)' : 'translateX(200%)',
                            boxShadow: `0 2px 10px ${C.btnPrimary}40`,
                            borderRadius: '10px'
                        }} />
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className="flex-1 relative z-10 py-1.5 capitalize transition-colors duration-300 border-none cursor-pointer flex items-center justify-center gap-2"
                            style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                color: activeTab === tab ? '#ffffff' : C.text,
                                background: 'transparent',
                                borderRadius: '10px'
                            }}>
                            {tab}
                            {tab !== 'history' && (
                                <span style={{
                                    backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.2)' : C.cardBg,
                                    color: activeTab === tab ? '#ffffff' : C.btnPrimary,
                                    minWidth: '20px', height: '20px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: T.size.xs, fontWeight: T.weight.bold, padding: '0 4px'
                                }}>
                                    {appointments.filter(a => a.status === tab).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── List ──────────────────────────────────────────────────────── */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    {filtered.map((apt) => (
                        <div key={apt._id} className="p-5 flex flex-col h-full transition-all hover:-translate-y-1"
                            style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>

                            <div className="flex items-start justify-between gap-4 mb-4 pb-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>

                                {/* Date box */}
                                <div className="flex flex-col items-center justify-center w-16 h-16 shrink-0"
                                    style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>
                                        {format(new Date(apt.dateTime), 'MMM')}
                                    </span>
                                    <span style={{ fontSize: T.size.stat, fontWeight: T.weight.bold, color: C.btnPrimary, lineHeight: 1 }}>
                                        {format(new Date(apt.dateTime), 'dd')}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                                            style={{ background: C.gradientBtn, border: `2px solid ${C.surfaceWhite}`, boxShadow: S.btn }}>
                                            {apt.studentId?.profileImage
                                                ? <img src={apt.studentId.profileImage} alt="" className="w-full h-full object-cover" />
                                                : <MdPerson style={{ width: 18, height: 18, color: '#ffffff' }} />}
                                        </div>
                                        <p className="truncate" style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                            {apt.studentId?.name || 'Unknown Student'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>
                                        <MdAccessTime style={{ width: 14, height: 14 }} />
                                        {format(new Date(apt.dateTime), 'p')}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-5">
                                <StatusBadge status={apt.status} />
                            </div>

                            {/* Actions */}
                            <div className="mt-auto flex flex-col gap-2">
                                {apt.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdateStatus(apt._id, 'confirmed')}
                                            className="flex-1 flex items-center justify-center gap-2 h-10 cursor-pointer border-none transition-opacity hover:opacity-90"
                                            style={{ backgroundColor: C.success, color: '#ffffff', borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                                            <MdCheckCircle style={{ width: 18, height: 18 }} /> Accept
                                        </button>
                                        <button onClick={() => handleUpdateStatus(apt._id, 'cancelled')}
                                            className="flex-1 flex items-center justify-center gap-2 h-10 cursor-pointer border-none transition-opacity hover:opacity-80"
                                            style={{ backgroundColor: C.dangerBg, color: C.danger, borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.dangerBorder}` }}>
                                            <MdCancel style={{ width: 18, height: 18 }} /> Decline
                                        </button>
                                    </div>
                                )}

                                {apt.status === 'confirmed' && (
                                    <div className="flex gap-2">
                                        <button className="flex-1 flex items-center justify-center gap-2 h-10 cursor-pointer border-none transition-opacity hover:opacity-80"
                                            style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                                            <MdMessage style={{ width: 18, height: 18 }} /> Message
                                        </button>
                                        <button onClick={() => handleJoin(apt.meetingLink)} className="flex-1 flex items-center justify-center gap-2 h-10 cursor-pointer border-none transition-opacity hover:opacity-90"
                                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                                            <MdVideocam style={{ width: 18, height: 18 }} /> Join Live
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-14 text-center border border-dashed"
                    style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4"
                        style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdErrorOutline style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                        No appointments found
                    </h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>
                        No {activeTab} appointments at this time.
                    </p>
                </div>
            )}
        </div>
    );
}