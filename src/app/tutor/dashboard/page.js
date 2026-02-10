'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Plus, Video, TrendingUp, DollarSign, Users, CalendarClock, ArrowUpRight, BookOpen, MessageSquare, Star } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { format } from 'date-fns';

export default function TutorDashboard() {
    const [stats, setStats] = useState({
        revenue: 0,
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">
                            Welcome back, Tutor
                        </h1>
                        <p className="text-slate-600 text-lg">Here's what's happening with your courses today</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button 
                            variant="outline" 
                            asChild 
                            className="bg-white hover:bg-slate-50 border-slate-200 shadow-sm hover:shadow transition-all duration-200"
                        >
                            <Link href="/tutor/courses/create" className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                New Course
                            </Link>
                        </Button>
                        <Button 
                            asChild 
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200"
                        >
                            <Link href="/tutor/appointments/schedule" className="flex items-center gap-2">
                                <CalendarClock className="w-4 h-4" />
                                Manage Availability
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Revenue Card */}
                    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600"></div>
                        <CardHeader className="relative pb-3">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <TrendingUp className="w-5 h-5 text-white/80" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            <p className="text-emerald-50 text-sm font-medium mb-1">Total Revenue</p>
                            <h3 className="text-4xl font-bold text-white mb-2">₹{stats.revenue.toLocaleString()}</h3>
                            <p className="text-emerald-100 text-xs">Lifetime earnings</p>
                        </CardContent>
                    </Card>

                    {/* Active Students Card */}
                    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600"></div>
                        <CardHeader className="relative pb-3">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-white/80" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            <p className="text-blue-50 text-sm font-medium mb-1">Active Students</p>
                            <h3 className="text-4xl font-bold text-white mb-2">{stats.activeStudents}</h3>
                            <p className="text-blue-100 text-xs">Enrolled in your courses</p>
                        </CardContent>
                    </Card>

                    {/* Upcoming Sessions Card */}
                    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600"></div>
                        <CardHeader className="relative pb-3">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <Clock className="w-5 h-5 text-white/80" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            <p className="text-purple-50 text-sm font-medium mb-1">Upcoming Sessions</p>
                            <h3 className="text-4xl font-bold text-white mb-2">{stats.upcomingSessions}</h3>
                            <p className="text-purple-100 text-xs">Confirmed appointments</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Revenue Chart - Takes 2 columns */}
                    <Card className="lg:col-span-2 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">Revenue Overview</CardTitle>
                                    <p className="text-sm text-slate-600 mt-1">Monthly earnings trend</p>
                                </div>
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#94a3b8" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis 
                                            stroke="#94a3b8" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            tickFormatter={(value) => `₹${value}`}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                backgroundColor: '#fff', 
                                                borderRadius: '12px', 
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                            formatter={(value) => [`₹${value}`, 'Revenue']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#4f46e5"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appointments Card */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">Upcoming</CardTitle>
                                    <p className="text-sm text-slate-600 mt-1">Your schedule</p>
                                </div>
                                <Link href="/tutor/appointments">
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                    >
                                        View All
                                        <ArrowUpRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {appointments.length > 0 ? (
                                    appointments.slice(0, 3).map((apt, i) => (
                                        <div 
                                            key={i} 
                                            className="group p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shrink-0">
                                                    <span className="text-[10px] font-bold text-indigo-100 uppercase">
                                                        {format(new Date(apt.dateTime), 'MMM')}
                                                    </span>
                                                    <span className="text-xl font-bold text-white">
                                                        {format(new Date(apt.dateTime), 'dd')}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate mb-1">
                                                        {apt.studentId?.name || 'Student'}
                                                    </p>
                                                    <div className="flex items-center text-xs text-slate-600">
                                                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                        {format(new Date(apt.dateTime), 'p')}
                                                    </div>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                                    asChild
                                                >
                                                    <Link href="/tutor/appointments">
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4">
                                            <Calendar className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-slate-900 mb-2">No upcoming appointments</h3>
                                        <p className="text-xs text-slate-600 mb-4">Your calendar is clear</p>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            asChild
                                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                        >
                                            <Link href="/tutor/appointments">
                                                Manage Schedule
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Link href="/tutor/courses" className="group">
                        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">My Courses</h3>
                                        <p className="text-xs text-slate-600 mt-0.5">Manage content</p>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-orange-600 transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/tutor/students" className="group">
                        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors">Students</h3>
                                        <p className="text-xs text-slate-600 mt-0.5">View enrolled students</p>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/tutor/reviews" className="group">
                        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                                        <Star className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">Reviews</h3>
                                        <p className="text-xs text-slate-600 mt-0.5">Student feedback</p>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}