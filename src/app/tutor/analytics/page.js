'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, Users, BookOpen, Star, Clock } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export default function TutorAnalyticsPage() {
    const [monthlyEarnings, setMonthlyEarnings] = useState([]);
    const [courseEnrollments, setCourseEnrollments] = useState([]);
    const [studentDistribution, setStudentDistribution] = useState([]);
    const [stats, setStats] = useState({
        avgRating: 0,
        totalReviews: 0,
        totalStudents: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [earningsRes, statsRes, coursesRes] = await Promise.all([
                api.get('/tutor/dashboard/earnings'),
                api.get('/tutor/dashboard/stats'),
                api.get('/courses/my-courses') // Fetch courses to get levels for distribution
            ]);

            if (earningsRes.data.success) {
                // Monthly Earnings
                setMonthlyEarnings(earningsRes.data.earnings.monthly);

                // Top Courses
                const byCourse = earningsRes.data.earnings.byCourse.map(c => ({
                    name: c.title,
                    students: c.enrollments
                })).sort((a, b) => b.students - a.students).slice(0, 5);
                setCourseEnrollments(byCourse);
            }

            if (statsRes.data.success) {
                setStats({
                    avgRating: statsRes.data.stats.rating.average,
                    totalReviews: statsRes.data.stats.rating.totalReviews,
                    totalStudents: statsRes.data.stats.students.total
                });
            }

            if (coursesRes.data.success) {
                // Calculate Student Level Distribution based on course levels and their enrollment counts
                const levels = {
                    beginner: 0,
                    intermediate: 0,
                    advanced: 0
                };

                coursesRes.data.courses.forEach(course => {
                    const level = course.level?.toLowerCase() || 'beginner';
                    if (levels[level] !== undefined) {
                        levels[level] += course.enrolledCount;
                    }
                });

                setStudentDistribution([
                    { name: 'Beginner', value: levels.beginner },
                    { name: 'Intermediate', value: levels.intermediate },
                    { name: 'Advanced', value: levels.advanced }
                ].filter(d => d.value > 0));
            }

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading analytics...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analytics</h1>
                <p className="text-gray-500 mt-2">Deep dive into your course performance and student engagement.</p>
            </div>

            {/* Key Metrics Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">N/A</div>
                        <p className="text-xs text-muted-foreground">Data not available yet</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgRating}</div>
                        <p className="text-xs text-muted-foreground">Based on {stats.totalReviews} reviews</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{courseEnrollments.length}</div>
                        <p className="text-xs text-muted-foreground">Active courses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalStudents}</div>
                        <p className="text-xs text-muted-foreground">Total enrollments</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="courses">Course Performance</TabsTrigger>
                    <TabsTrigger value="students">Student Insights</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        {/* Revenue Chart */}
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Revenue Trends</CardTitle>
                                <CardDescription>Monthly income.</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyEarnings}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Bar dataKey="revenue" name="Earnings" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Courses List */}
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Most Popular Courses</CardTitle>
                                <CardDescription>By active enrollment count.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    {courseEnrollments.length > 0 ? (
                                        courseEnrollments.map((course, index) => (
                                            <div key={index} className="flex items-center">
                                                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold mr-4">
                                                    {index + 1}
                                                </div>
                                                <div className="ml-4 space-y-1 flex-1">
                                                    <p className="text-sm font-medium leading-none">{course.name}</p>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${(course.students / (courseEnrollments[0].students || 1)) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="ml-auto font-medium">{course.students}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">No courses yet.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* COURSES TAB */}
                <TabsContent value="courses">
                    <Card>
                        <CardHeader>
                            <CardTitle>Enrollment Distribution</CardTitle>
                            <CardDescription>Number of students per course.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyEarnings}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* STUDENTS TAB */}
                <TabsContent value="students">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Student Level Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={studentDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {studentDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
