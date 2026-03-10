'use client';

import { useState, useEffect, use } from 'react';
import { Loader2, BookOpen, Users, DollarSign, Calendar, Clock, BarChart } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AdminCourseDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [stats, setStats] = useState(null);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        fetchCourseDetails();
    }, [id]);

    const fetchCourseDetails = async () => {
        try {
            const res = await api.get(`/admin/courses/${id}`);
            if (res.data.success) {
                setCourse(res.data.course);
                setStats(res.data.stats);
                setStudents(res.data.students);
            }
        } catch (error) {
            console.error('Failed to fetch course details:', error);
            toast.error('Failed to load course details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex bg-slate-50 min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="p-6 text-center text-slate-500">
                Course not found
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Course Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="relative h-48 bg-slate-900">
                    {course.thumbnail && (
                        <>
                            <img src={course.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                        </>
                    )}
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold
                                        ${course.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                                        {course.status}
                                    </span>
                                    <span className="text-slate-300 text-sm">• {course.level}</span>
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
                                <p className="text-slate-300 text-sm line-clamp-1 max-w-2xl">{course.description}</p>
                            </div>
                            <button
                                onClick={() => router.push('/admin/courses')}
                                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                            >
                                Back to List
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div onClick={() => router.push(`/admin/tutors/${course.tutorId?._id}`)} className="cursor-pointer group">
                            <h3 className="text-sm font-medium text-slate-500 mb-1">Instructor</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                                    {course.tutorId?.profileImage ? (
                                        <img src={course.tutorId.profileImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                                            {course.tutorId?.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <span className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
                                    {course.tutorId?.name || 'Unknown'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-slate-500 mb-1">Price</h3>
                            <div className="text-lg font-bold text-slate-800">
                                {course.price > 0 ? `$${course.price}` : 'Free'}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-slate-500 mb-1">Category</h3>
                            <div className="text-slate-800">{course.category || 'General'}</div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-slate-500 mb-1">Created</h3>
                            <div className="text-slate-800">{new Date(course.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Enrolled Students</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats?.totalStudents || 0}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-slate-800">${stats?.totalRevenue || 0}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Enrolled Students</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">Student Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Email</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Enrolled Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Progress</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {student.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {student.email}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(student.enrolledAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-indigo-500 h-full rounded-full"
                                                        style={{ width: `${student.progress || 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-slate-500">{student.progress || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => router.push(`/admin/students/${student._id}`)}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >
                                                View Profile
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No students enrolled yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
