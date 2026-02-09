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

    const handleCancel = async (id) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

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
        if (activeTab === 'upcoming') return apt.status === 'confirmed';
        if (activeTab === 'pending') return apt.status === 'pending';
        if (activeTab === 'history') return ['completed', 'cancelled'].includes(apt.status);
        return true;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) return <div className="p-8 text-center">Loading appointments...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                <p className="text-gray-500">Manage your upcoming sessions.</p>
            </div>

            {/* Tabs */}
            <div className="border-b flex gap-6">
                {['upcoming', 'pending', 'history'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            pb-3 text-sm font-medium border-b-2 transition-colors capitalize
                            ${activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }
                        `}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((apt) => (
                        <div key={apt._id} className="bg-white rounded-xl border p-6 flex flex-col md:flex-row gap-6 hover:shadow-sm transition-shadow">
                            {/* Date Badge */}
                            <div className="hidden md:flex flex-col items-center justify-center w-20 h-20 bg-gray-50 rounded-xl border shrink-0">
                                <span className="text-xs text-gray-500 font-bold uppercase">
                                    {format(new Date(apt.dateTime), 'MMM')}
                                </span>
                                <span className="text-2xl font-bold text-gray-900 my-1">
                                    {format(new Date(apt.dateTime), 'dd')}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {format(new Date(apt.dateTime), 'EEE')}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">
                                            {apt.tutorId?.userId?.name || 'Tutor'}
                                        </h3>
                                        <p className="text-gray-500 text-sm">
                                            {apt.tutorId?.categoryId?.name || 'Session'}
                                        </p>
                                    </div>
                                    <Badge className={`${getStatusColor(apt.status)} border-0 capitalize`}>
                                        {apt.status}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {format(new Date(apt.dateTime), 'p')} ({apt.duration} min)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Video className="w-4 h-4" />
                                        Online Meeting
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-2 flex gap-3">
                                    {apt.status === 'confirmed' && (
                                        <Button className="bg-blue-600 hover:bg-blue-700">
                                            <Video className="w-4 h-4 mr-2" /> Join Class
                                        </Button>
                                    )}
                                    {['pending', 'confirmed'].includes(apt.status) && (
                                        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleCancel(apt._id)}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No appointments</h3>
                        <p className="text-gray-500">You don't have any {activeTab} appointments.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
