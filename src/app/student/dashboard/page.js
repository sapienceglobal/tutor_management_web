'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Award, Clock } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { EnrolledCourseCard } from '@/components/student/EnrolledCourseCard';

export default function StudentDashboard() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        completedCourses: 0,
        inProgress: 0,
        totalLearningHours: 0
    });

    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Enrollments
                const enrollRes = await api.get('/enrollments/my-enrollments');
                if (enrollRes.data.success) {
                    const data = enrollRes.data.enrollments;
                    setEnrollments(data);

                    const completed = data.filter(e => e.progress?.percentage === 100).length;
                    setStats(prev => ({
                        ...prev,
                        completedCourses: completed,
                        inProgress: data.length - completed
                    }));
                }

                try {
                    // Fetch Recent History (Ensure ID is 'all' not interpreted as Exam ID)
                    const historyRes = await api.get('/exams/student/history-all');
                    if (historyRes.data.success) {
                        setHistory(historyRes.data.attempts.slice(0, 3)); // Top 3 recent
                    }
                } catch (historyError) {
                    console.warn('Failed to fetch history:', historyError);
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading your dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
                <p className="text-gray-500 mt-2">Pick up where you left off.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg text-blue-600 shadow-sm">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Courses in Progress</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.inProgress}</h3>
                    </div>
                </div>
                <div className="bg-green-50 p-6 rounded-xl border border-green-100 flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg text-green-600 shadow-sm">
                        <Award className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Completed Courses</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.completedCourses}</h3>
                    </div>
                </div>
                {/* 
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg text-purple-600 shadow-sm">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Learning Hours</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.totalLearningHours}</h3>
                    </div>
                </div> 
                */}
            </div>

            {/* My Learning Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">My Learning</h2>
                    <div className="flex gap-3">
                        <Link href="/student/tutors">
                            <Button className="bg-indigo-600 hover:bg-indigo-700">Book a Tutor</Button>
                        </Link>
                        <Link href="/student/appointments">
                            <Button variant="outline">My Appointments</Button>
                        </Link>
                        <Link href="/student/courses">
                            <Button variant="outline">Browse Courses</Button>
                        </Link>
                    </div>
                </div>

                {enrollments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {enrollments.map(enrollment => (
                            <EnrolledCourseCard
                                key={enrollment._id}
                                course={enrollment}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                        <div className="mx-auto h-16 w-16 text-gray-300 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                            <BookOpen className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No enrollments yet</h3>
                        <p className="text-gray-500 mt-1 mb-6 max-w-sm mx-auto">
                            You haven't enrolled in any courses yet. Explore our catalog to find your next skill.
                        </p>
                        <Link href="/student/courses">
                            <Button size="lg" className="shadow-lg shadow-primary/25">
                                Browse Courses
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
