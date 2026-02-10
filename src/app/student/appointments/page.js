'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    Calendar,
    Clock,
    Video,
    MoreVertical,
    User,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function StudentAppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await api.get('/appointments');
            if (response.data.success) {
                setAppointments(response.data.appointments);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = (link) => {
        if (!link) {
            toast.error('Meeting link is not available yet.');
            return;
        }
        window.open(link, '_blank');
    };

    const handleCancel = async (id) => {
        // Simple functional confirmation using toast for now to avoid complex modal state overhead in this file
        // For distinct "industry level", a custom dialog is better, but toast with action is quick and clean.
        // Reverting to improved window.confirm or implementing a simple inline state if modal.jsx is complex.
        // Let's stick to standard confirm but styled if possible, or just native for speed unless Modal is easy.
        // Using native confirm for reliability in this step, but documented as such.
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

        try {
            const response = await api.delete(`/appointments/${id}`);
            if (response.data.success) {
                toast.success('Appointment cancelled');
                fetchAppointments();
            }
        } catch (error) {
            toast.error('Failed to cancel');
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        if (activeTab === 'upcoming') return ['confirmed', 'pending'].includes(apt.status); // Adjusted to show pending in upcoming too or keep separate?
        // User asked for "status cancelled... accepted... complete".
        // Keeping tabs: Upcoming (Confirmed), Pending (Pending), History (Completed/Cancelled) seems logical.
        if (activeTab === 'upcoming') return apt.status === 'confirmed';
        if (activeTab === 'pending') return apt.status === 'pending';
        if (activeTab === 'history') return ['completed', 'cancelled'].includes(apt.status);
        return true;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Appointments</h1>
                    <p className="text-gray-500 mt-1">Track your upcoming sessions and booking history.</p>
                </div>
                <div className="flex gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border shadow-sm">
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>Confirmed</span>
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>Pending</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b flex gap-8">
                {[
                    { id: 'upcoming', label: 'Upcoming' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'history', label: 'History' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            pb-4 text-sm font-semibold border-b-2 transition-all capitalize px-2
                            ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4 min-h-[400px]">
                {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((apt) => (
                        <div key={apt._id} className="group bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row gap-6 hover:shadow-lg hover:border-primary/10 transition-all duration-300">
                            {/* Date Badge */}
                            <div className="flex flex-row md:flex-col items-center md:justify-center gap-3 md:gap-0 w-full md:w-24 md:h-24 bg-gray-50/50 rounded-2xl border border-gray-100 shrink-0 p-3 md:p-0">
                                <span className="text-xs text-primary font-bold uppercase tracking-wider">
                                    {format(new Date(apt.dateTime), 'MMM')}
                                </span>
                                <span className="text-2xl md:text-3xl font-black text-gray-900 my-0 md:my-1">
                                    {format(new Date(apt.dateTime), 'dd')}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">
                                    {format(new Date(apt.dateTime), 'EEE')}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">
                                            {apt.tutorId?.userId?.name || 'Tutor'}
                                        </h3>
                                        <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                                            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                                                {apt.tutorId?.categoryId?.name || 'Session'}
                                            </span>
                                        </p>
                                    </div>
                                    <Badge className={`${getStatusColor(apt.status)} border px-3 py-1 shadow-sm`}>
                                        {apt.status}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">{format(new Date(apt.dateTime), 'h:mm a')}</span>
                                        <span className="text-gray-400">|</span>
                                        <span>{apt.duration} min</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <Video className="w-4 h-4 text-gray-400" />
                                        <span>Online Meeting</span>
                                    </div>
                                    {apt.notes && (
                                        <div className="flex items-center gap-2 text-gray-400 italic">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="truncate max-w-[200px]">{apt.notes}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="pt-2 flex gap-3">
                                    {apt.status === 'confirmed' && (
                                        apt.meetingLink ? (
                                            <Button
                                                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                                                onClick={() => handleJoin(apt.meetingLink)}
                                            >
                                                <Video className="w-4 h-4 mr-2" /> Join Class
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" disabled className="bg-gray-100 text-gray-400 cursor-not-allowed">
                                                <Clock className="w-4 h-4 mr-2" /> Waiting for Link
                                            </Button>
                                        )
                                    )}

                                    {['pending', 'confirmed'].includes(apt.status) && (
                                        <Button
                                            variant="outline"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 hover:border-red-200"
                                            onClick={() => handleCancel(apt._id)}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No appointments found</h3>
                        <p className="text-gray-500 max-w-sm mt-2">
                            You don't have any {activeTab} appointments scheduled at the moment.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
