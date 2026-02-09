'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Plus, Video, MoreHorizontal, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { format } from 'date-fns';

// Mock data for the chart - replace with API data in future
const chartDataMock = [
    { name: 'Jan', revenue: 4000, students: 24 },
    { name: 'Feb', revenue: 3000, students: 13 },
    { name: 'Mar', revenue: 2000, students: 98 },
    { name: 'Apr', revenue: 2780, students: 39 },
    { name: 'May', revenue: 1890, students: 48 },
    { name: 'Jun', revenue: 2390, students: 38 },
    { name: 'Jul', revenue: 3490, students: 43 },
];

export default function TutorDashboard() {
    const [stats, setStats] = useState({
        revenue: 0,
        tempRevenue: 12500, // Mock total
        activeStudents: 0,
        upcomingSessions: 0
    });
    const [chartData, setChartData] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [aptRes, statsRes, earningsRes] = await Promise.all([
                api.get('/appointments?limit=3&status=confirmed'),
                api.get('/tutor/dashboard/stats'),
                api.get('/tutor/dashboard/earnings')
            ]);

            if (aptRes.data.success) {
                setAppointments(aptRes.data.appointments);
            }

            if (statsRes.data.success) {
                setStats({
                    revenue: statsRes.data.stats.revenue.total,
                    activeStudents: statsRes.data.stats.students.total,
                    upcomingSessions: statsRes.data.stats.appointments.upcoming
                });
            }

            if (earningsRes.data.success) {
                setChartData(earningsRes.data.earnings.monthly);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/tutor/courses/create">
                            <Plus className="w-4 h-4 mr-2" />
                            New Course
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/tutor/appointments/schedule">
                            <Clock className="w-4 h-4 mr-2" />
                            Manage Availability
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <span className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">Lifetime earnings</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                        <span className="text-2xl font-bold">{stats.activeStudents}</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">Enrolled in your courses</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                        <span className="text-2xl font-bold">{stats.upcomingSessions}</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">Confirmed appointments</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        formatter={(value) => [`₹${value}`, 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#2563eb"
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Upcoming Appointments</CardTitle>
                        <Link href="/tutor/appointments" className="text-sm text-blue-600 hover:underline">View All</Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {appointments.length > 0 ? (
                                appointments.slice(0, 3).map((apt, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border">
                                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-lg border shadow-sm shrink-0">
                                            <span className="text-xs font-bold text-slate-500 uppercase">{format(new Date(apt.dateTime), 'MMM')}</span>
                                            <span className="text-lg font-bold text-slate-900">{format(new Date(apt.dateTime), 'dd')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{apt.studentId?.name || 'Student'}</p>
                                            <div className="flex items-center text-xs text-slate-500 mt-0.5">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {format(new Date(apt.dateTime), 'p')}
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                                            <Link href="/tutor/appointments">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-slate-500">
                                    <p className="text-sm">No upcoming appointments</p>
                                    <Button variant="link" asChild className="px-0 h-auto mt-2">
                                        <Link href="/tutor/appointments">Manage Schedule</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
