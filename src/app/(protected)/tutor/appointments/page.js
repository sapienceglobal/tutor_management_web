'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    Calendar, Clock, CheckCircle, XCircle, User,
    MessageSquare, Video, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pending:   'bg-amber-50 text-amber-700 border-amber-200',
        completed: 'bg-slate-100 text-slate-600 border-slate-200',
        cancelled: 'bg-red-50 text-red-600 border-red-200',
    };
    return (
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border capitalize ${map[status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
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
            if (res.data.success) setAppointments(res.data.appointments);
        } catch {
            toast.error('Failed to load appointments');
        } finally { setLoading(false); }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await api.patch(`/appointments/${id}`, { status });
            if (res.data.success) {
                toast.success(`Appointment ${status} successfully`);
                fetchAppointments();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        }
    };

    const filtered = appointments.filter(apt =>
        activeTab === 'history'
            ? apt.status === 'completed' || apt.status === 'cancelled'
            : apt.status === activeTab
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm text-slate-400">Loading appointments...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                        <Calendar className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Manage Appointments</h1>
                        <p className="text-xs text-slate-400">Track and manage your student bookings</p>
                    </div>
                </div>

                {/* Tab pills in header */}
                <div className="flex gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl">
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize"
                            style={activeTab === tab
                                ? { backgroundColor: 'white', color: 'var(--theme-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                                : { color: '#94a3b8' }}>
                            {tab}
                            {tab !== 'history' && (
                                <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-black"
                                    style={activeTab === tab
                                        ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', color: 'var(--theme-primary)' }
                                        : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
                                    {appointments.filter(a => a.status === tab).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── List ──────────────────────────────────────────────────────── */}
            {filtered.length > 0 ? (
                <div className="space-y-3">
                    {filtered.map((apt) => (
                        <div key={apt._id}
                            className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
                            <div className="flex gap-4">

                                {/* Date box */}
                                <div className="hidden md:flex flex-col items-center justify-center w-16 h-16 rounded-xl flex-shrink-0 border"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 6%, white)', borderColor: 'color-mix(in srgb, var(--theme-primary) 15%, white)' }}>
                                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                                        {format(new Date(apt.dateTime), 'MMM')}
                                    </span>
                                    <span className="text-2xl font-black text-slate-800 leading-tight">
                                        {format(new Date(apt.dateTime), 'dd')}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium">
                                        {format(new Date(apt.dateTime), 'EEE')}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                                                style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                                {apt.studentId?.profileImage
                                                    ? <img src={apt.studentId.profileImage} alt="" className="w-full h-full object-cover" />
                                                    : <span className="text-white text-xs font-bold">{apt.studentId?.name?.[0]?.toUpperCase() || 'S'}</span>}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{apt.studentId?.name || 'Unknown Student'}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(apt.dateTime), 'PPP')} at {format(new Date(apt.dateTime), 'p')}
                                                </div>
                                            </div>
                                        </div>
                                        <StatusBadge status={apt.status} />
                                    </div>

                                    {/* Actions */}
                                    {apt.status === 'pending' && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleUpdateStatus(apt._id, 'confirmed')}
                                                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors">
                                                <CheckCircle className="w-3.5 h-3.5" /> Accept
                                            </button>
                                            <button onClick={() => handleUpdateStatus(apt._id, 'cancelled')}
                                                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-colors">
                                                <XCircle className="w-3.5 h-3.5" /> Decline
                                            </button>
                                        </div>
                                    )}

                                    {apt.status === 'confirmed' && (
                                        <div className="flex items-center gap-2">
                                            <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
                                                <MessageSquare className="w-3.5 h-3.5" /> Message
                                            </button>
                                            <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-xl transition-opacity"
                                                style={{ backgroundColor: 'var(--theme-primary)' }}>
                                                <Video className="w-3.5 h-3.5" /> Join Meeting
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                    <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, white)' }}>
                        <AlertCircle className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">No appointments found</h3>
                    <p className="text-xs text-slate-400">No {activeTab} appointments at this time.</p>
                </div>
            )}
        </div>
    );
}