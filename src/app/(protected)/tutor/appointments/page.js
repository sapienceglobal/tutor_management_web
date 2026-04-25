'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    Calendar, Clock, CheckCircle, XCircle, User,
    MessageSquare, Video, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { C, T, S, R } from '@/constants/tutorTokens';

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

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        confirmed: { bg: C.successBg, color: C.success, border: C.successBorder },
        pending:   { bg: C.warningBg, color: C.warning, border: C.warningBorder },
        completed: { bg: C.surfaceWhite, color: C.textMuted, border: C.cardBorder },
        cancelled: { bg: C.dangerBg, color: C.danger, border: C.dangerBorder },
    };
    const style = map[status] || map.completed;
    
    return (
        <span style={{ 
            fontSize: '11px', fontWeight: T.weight.black, padding: '4px 10px', borderRadius: R.md, textTransform: 'capitalize',
            backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}`
        }}>
            {status}
        </span>
    );
}

const TABS = ['pending', 'confirmed', 'history'];

export default function ManageAppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [activeTab, setActiveTab]       = useState('pending');

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
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading appointments...</p>
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
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>Manage Appointments</h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>Track and manage your online live class bookings</p>
                    </div>
                </div>

                {/* Tab pills in header */}
                <div className="flex gap-2 p-1 w-full sm:w-auto" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className="flex-1 sm:flex-none px-4 py-2 cursor-pointer border-none transition-all flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: activeTab === tab ? C.surfaceWhite : 'transparent',
                                color: activeTab === tab ? C.btnPrimary : C.textMuted,
                                borderRadius: R.lg,
                                boxShadow: activeTab === tab ? S.card : 'none',
                                fontSize: T.size.sm,
                                fontWeight: T.weight.bold,
                                fontFamily: T.fontFamily,
                                textTransform: 'capitalize'
                            }}>
                            {tab}
                            {tab !== 'history' && (
                                <span style={{ 
                                    backgroundColor: activeTab === tab ? 'rgba(117,115,232,0.1)' : C.surfaceWhite, 
                                    color: activeTab === tab ? C.btnPrimary : C.textMuted, 
                                    width: '20px', height: '20px', borderRadius: R.full, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    fontSize: '10px', fontWeight: T.weight.black 
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((apt) => (
                        <div key={apt._id} className="p-5 flex flex-col h-full transition-transform hover:-translate-y-0.5" 
                            style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            
                            <div className="flex items-start justify-between gap-4 mb-4 pb-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                
                                {/* Date box */}
                                <div className="flex flex-col items-center justify-center w-16 h-16 shrink-0"
                                    style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                    <span style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {format(new Date(apt.dateTime), 'MMM')}
                                    </span>
                                    <span style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.btnPrimary, lineHeight: 1.2 }}>
                                        {format(new Date(apt.dateTime), 'dd')}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: C.gradientBtn, border: `2px solid ${C.surfaceWhite}` }}>
                                            {apt.studentId?.profileImage
                                                ? <img src={apt.studentId.profileImage} alt="" className="w-full h-full object-cover" />
                                                : <span style={{ color: '#fff', fontSize: T.size.xs, fontWeight: T.weight.bold }}>{apt.studentId?.name?.[0]?.toUpperCase() || 'S'}</span>}
                                        </div>
                                        <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                            {apt.studentId?.name || 'Unknown Student'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted }}>
                                        <Clock size={12} />
                                        {format(new Date(apt.dateTime), 'PPP')} at {format(new Date(apt.dateTime), 'p')}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mb-4">
                                <StatusBadge status={apt.status} />
                            </div>

                            {/* Actions */}
                            <div className="mt-auto flex flex-col gap-2">
                                {apt.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdateStatus(apt._id, 'confirmed')}
                                            className="flex-1 flex items-center justify-center gap-2 h-10 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                                            style={{ backgroundColor: C.success, color: '#fff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                            <CheckCircle size={16} /> Accept
                                        </button>
                                        <button onClick={() => handleUpdateStatus(apt._id, 'cancelled')}
                                            className="flex-1 flex items-center justify-center gap-2 h-10 cursor-pointer border-none transition-opacity hover:opacity-80"
                                            style={{ backgroundColor: C.surfaceWhite, color: C.danger, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.dangerBorder}` }}>
                                            <XCircle size={16} /> Decline
                                        </button>
                                    </div>
                                )}

                                {apt.status === 'confirmed' && (
                                    <div className="flex gap-2">
                                        <button className="flex-1 flex items-center justify-center gap-2 h-10 cursor-pointer border-none transition-opacity hover:opacity-80"
                                            style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                                            <MessageSquare size={16} /> Message
                                        </button>
                                        <button onClick={() => handleJoin(apt.meetingLink)} className="flex-1 flex items-center justify-center gap-2 h-10 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                                            style={{ background: C.gradientBtn, color: '#fff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                            <Video size={16} /> Join Live
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 flex flex-col items-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                    <div className="w-14 h-14 flex items-center justify-center mb-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <AlertCircle size={28} color={C.btnPrimary} />
                    </div>
                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No appointments found</h3>
                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>No {activeTab} appointments at this time.</p>
                </div>
            )}
        </div>
    );
}
