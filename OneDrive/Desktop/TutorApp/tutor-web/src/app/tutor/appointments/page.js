'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    User,
    MoreVertical,
    MessageSquare,
    Video,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function ManageAppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

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
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const response = await api.patch(`/appointments/${id}`, { status });
            if (response.data.success) {
                toast.success(`Appointment ${status} successfully`);
                fetchAppointments(); // Refresh list
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        if (activeTab === 'history') {
            return apt.status === 'completed' || apt.status === 'cancelled';
        }
        return apt.status === activeTab;
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

    if (loading) {
        return <div className="p-8 text-center">Loading appointments...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Appointments</h1>
                    <p className="text-gray-500">Track and manage your student bookings</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                {['pending', 'confirmed', 'history'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            px-6 py-2.5 text-sm font-medium rounded-lg transition-all capitalize
                            ${activeTab === tab
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
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
                        <div key={apt._id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Date Box */}
                                <div className="hidden md:flex flex-col items-center justify-center w-20 h-20 bg-gray-50 rounded-xl border">
                                    <span className="text-xs text-gray-500 font-medium uppercase">
                                        {format(new Date(apt.dateTime), 'MMM')}
                                    </span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        {format(new Date(apt.dateTime), 'dd')}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {format(new Date(apt.dateTime), 'EEE')}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {apt.studentId?.profileImage ? (
                                                    <img src={apt.studentId.profileImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{apt.studentId?.name || 'Unknown Student'}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(apt.dateTime), 'PPP')} at {format(new Date(apt.dateTime), 'p')}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className={`capitalize ${getStatusColor(apt.status)} border-0`}>
                                            {apt.status}
                                        </Badge>
                                    </div>

                                    {/* Actions */}
                                    {apt.status === 'pending' && (
                                        <div className="flex items-center gap-3 pt-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleUpdateStatus(apt._id, 'confirmed')}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" /> Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleUpdateStatus(apt._id, 'cancelled')}
                                            >
                                                <XCircle className="w-4 h-4 mr-2" /> Decline
                                            </Button>
                                        </div>
                                    )}

                                    {apt.status === 'confirmed' && (
                                        <div className="flex items-center gap-3 pt-2">
                                            <Button size="sm" variant="outline">
                                                <MessageSquare className="w-4 h-4 mr-2" /> Message
                                            </Button>
                                            <Button size="sm" variant="default">
                                                <Video className="w-4 h-4 mr-2" /> Join Meeting
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No appointments found</h3>
                        <p className="text-gray-500">No {activeTab} appointments referenced at this time.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
