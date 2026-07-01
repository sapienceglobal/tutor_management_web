'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Calendar, Clock, Video, AlertCircle } from 'lucide-react';
import { 
    MdCalendarMonth, 
    MdCheckCircleOutline, 
    MdTrendingUp, 
    MdHourglassEmpty 
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import StatCard from '@/components/StatCard';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';

export default function StudentAppointmentsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [activeTab, setActiveTab]       = useState('upcoming');
    const { confirmDialog }               = useConfirm();

    useEffect(() => { fetchAppointments(); }, []);

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments');
            if (res.data.success) setAppointments(res.data.appointments);
        } catch (err) {
            console.error('Error fetching appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = (apt) => {
        if (!apt.meetingLink) { toast.error('Meeting link is not available yet.'); return; }
        router.push(`/student/appointments/${apt._id}/join`);
    };

    const handleCancel = async (id) => {
        const ok = await confirmDialog('Cancel Appointment', 'Are you sure you want to cancel this appointment?', { variant: 'destructive' });
        if (!ok) return;
        try {
            const res = await api.delete(`/appointments/${id}`);
            if (res.data.success) { toast.success('Appointment cancelled'); fetchAppointments(); }
        } catch { toast.error('Failed to cancel'); }
    };

    const filteredAppointments = appointments.filter(apt => {
        if (activeTab === 'upcoming') return ['confirmed', 'pending'].includes(apt.status);
        if (activeTab === 'pending')  return apt.status === 'pending';
        if (activeTab === 'history')  return ['completed', 'cancelled'].includes(apt.status);
        return true;
    });

    const totalBooked = appointments.length;
    const completedSessions = appointments.filter(a => a.status === 'completed').length;
    const pendingApproval = appointments.filter(a => a.status === 'pending').length;
    const confirmedSessions = appointments.filter(a => a.status === 'confirmed').length;

    // ── Status badge ─────────────────────────────────────────────────────────
    const statusStyle = (status) => {
        const map = {
            confirmed: { bg: C.successBg,  color: C.success,  border: C.successBorder },
            pending:   { bg: C.warningBg,  color: C.warning,  border: C.warningBorder },
            completed: { bg: `${C.btnPrimary}15`, color: C.btnPrimary, border: `${C.btnPrimary}30` },
            cancelled: { bg: C.dangerBg,   color: C.danger,   border: C.dangerBorder },
        };
        return map[status] || { bg: C.innerBg, color: C.textMuted, border: C.cardBorder };
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55 }}>
                    Loading appointments…
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 pb-8" style={pageStyle}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                        My Appointments
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55, marginTop: 2 }}>
                        Track your upcoming sessions and booking history.
                    </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl self-start"
                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
                    <span className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.semibold }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.success }} /> Confirmed
                    </span>
                    <span className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.semibold }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.warning }} /> Pending
                    </span>
                </div>
            </div>

            {/* ── Stats Grid ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={MdCalendarMonth}
                    value={totalBooked}
                    label="Total Bookings"
                    iconBg="#EEF2FF"
                    iconColor="#4F46E5"
                />
                <StatCard
                    icon={MdCheckCircleOutline}
                    value={confirmedSessions}
                    label="Confirmed Classes"
                    iconBg="#ECFDF5"
                    iconColor="#10B981"
                />
                <StatCard
                    icon={MdTrendingUp}
                    value={completedSessions}
                    label="Completed Sessions"
                    iconBg="#EBF8FF"
                    iconColor="#3182CE"
                />
                <StatCard
                    icon={MdHourglassEmpty}
                    value={pendingApproval}
                    label="Pending Approvals"
                    iconBg="#FFF7ED"
                    iconColor="#F59E0B"
                />
            </div>

            {/* ── Tabs (Segmented Switcher) ────────────────────────────────── */}
            <div className="relative flex items-center p-1 rounded-xl self-start"
                style={{
                    width: '360px',
                    backgroundColor: C.cardBg,
                    border: `1px solid ${C.cardBorder}`,
                    height: '42px'
                }}
            >
                <div className="absolute top-1 bottom-1 transition-transform duration-300 ease-in-out z-0"
                    style={{
                        width: 'calc(33.33% - 4px)',
                        backgroundColor: C.btnPrimary,
                        transform:
                            activeTab === 'upcoming'
                                ? 'translateX(0)'
                                : activeTab === 'pending'
                                ? 'translateX(100%)'
                                : 'translateX(200%)',
                        boxShadow: `0 2px 10px ${C.btnPrimary}40`,
                        borderRadius: '8px',
                        left: '4px'
                    }}
                />
                {[
                    { id: 'upcoming', label: 'Upcoming' },
                    { id: 'pending',  label: 'Pending' },
                    { id: 'history',  label: 'History' },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className="flex-1 relative z-10 py-1.5 capitalize transition-colors duration-300 border-none cursor-pointer flex items-center justify-center"
                        style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.sm,
                            fontWeight: T.weight.bold,
                            color: activeTab === tab.id ? '#ffffff' : C.text,
                            background: 'transparent',
                            borderRadius: '8px',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── List ──────────────────────────────────────────────────── */}
            <div className="space-y-4 min-h-[300px]">
                {filteredAppointments.length > 0 ? filteredAppointments.map(apt => {
                    const ss = statusStyle(apt.status);
                    return (
                        <div key={apt._id}
                            className="group rounded-2xl flex flex-col md:flex-row gap-5 transition-all duration-200 hover:-translate-y-0.5"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card, padding: 20 }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = S.cardHover; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = S.card; }}>

                            {/* Date Badge */}
                            <div className="flex flex-row md:flex-col items-center md:justify-center gap-3 md:gap-0 shrink-0 rounded-2xl p-3 md:p-0"
                                style={{ width: undefined, minWidth: undefined }}
                                // mobile: row, desktop: column
                            >
                                <div className="flex flex-row md:flex-col items-center justify-center gap-2 md:gap-0 w-full md:w-20 md:h-20 rounded-2xl p-3"
                                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>
                                        {format(new Date(apt.dateTime), 'MMM')}
                                    </span>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, lineHeight: 1, margin: '2px 0' }}>
                                        {format(new Date(apt.dateTime), 'dd')}
                                    </span>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.medium }}>
                                        {format(new Date(apt.dateTime), 'EEE')}
                                    </span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-3">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                                    <div>
                                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>
                                            {apt.tutorId?.userId?.name || 'Tutor'}
                                        </h3>
                                        <div className="mt-1">
                                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold"
                                                style={{ backgroundColor: `${C.chartLine}20`, color: C.chartLine, fontFamily: T.fontFamily }}>
                                                {apt.tutorId?.categoryId?.name || 'Session'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold capitalize self-start"
                                        style={{ backgroundColor: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontFamily: T.fontFamily }}>
                                        {apt.status}
                                    </span>
                                </div>

                                {/* Meta */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                                        style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                        <Clock className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>
                                            {format(new Date(apt.dateTime), 'h:mm a')}
                                        </span>
                                        <span style={{ color: C.cardBorder }}>|</span>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>
                                            {apt.duration} min
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                                        style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                        <Video className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>
                                            Online Meeting
                                        </span>
                                    </div>
                                    {apt.notes && (
                                        <div className="flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
                                            <span className="truncate max-w-[180px]"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontStyle: 'italic' }}>
                                                {apt.notes}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-1">
                                    {apt.status === 'confirmed' && (
                                        apt.meetingLink ? (
                                            <button
                                                onClick={() => handleJoin(apt)}
                                                className="flex items-center gap-2 px-4 py-2 text-white text-xs rounded-xl font-bold transition-all hover:opacity-90"
                                                style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                                                <Video className="w-3.5 h-3.5" /> Join Class
                                            </button>
                                        ) : (
                                            <button disabled
                                                className="flex items-center gap-2 px-4 py-2 text-xs rounded-xl font-bold opacity-50 cursor-not-allowed"
                                                style={{ ...cx.btnSecondary(), fontFamily: T.fontFamily }}>
                                                <Clock className="w-3.5 h-3.5" /> Waiting for Link
                                            </button>
                                        )
                                    )}
                                    {['pending', 'confirmed'].includes(apt.status) && (
                                        <button
                                            onClick={() => handleCancel(apt._id)}
                                            className="px-4 py-2 text-xs rounded-xl font-bold transition-all hover:opacity-80"
                                            style={{ backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}`, fontFamily: T.fontFamily }}>
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed"
                        style={{ borderColor: C.cardBorder, backgroundColor: C.cardBg }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                            style={{ backgroundColor: C.innerBg }}>
                            <Calendar className="w-8 h-8" style={{ color: C.cardBorder }} />
                        </div>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>
                            No appointments found
                        </h3>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, marginTop: 6, maxWidth: 320, textAlign: 'center' }}>
                            You don&apos;t have any {activeTab} appointments scheduled at the moment.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}