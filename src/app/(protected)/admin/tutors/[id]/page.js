'use client';

import { useState, useEffect, use } from 'react';
import { Loader2, Mail, Phone, MapPin, Calendar, BookOpen, Star, DollarSign, UserCheck, Shield } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AdminTutorDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [tutor, setTutor] = useState(null);
    const [stats, setStats] = useState(null);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetchTutorDetails();
    }, [id]);

    const fetchTutorDetails = async () => {
        try {
            const res = await api.get(`/admin/tutors/${id}`);
            if (res.data.success) {
                setTutor(res.data.tutor);
                setStats(res.data.stats);
                setCourses(res.data.courses);
            }
        } catch (error) {
            console.error('Failed to fetch tutor details:', error);
            toast.error('Failed to load tutor details');
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

    if (!tutor) {
        return (
            <div className="p-6 text-center text-slate-500">
                Tutor not found
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="px-6 pb-6">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end gap-4">
                            <div className="w-24 h-24 rounded-xl border-4 border-white bg-slate-200 overflow-hidden shadow-md">
                                {tutor.profileImage ? (
                                    <img src={tutor.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-400 bg-slate-100">
                                        {tutor.name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="mb-1">
                                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    {tutor.name}
                                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> Tutor
                                    </span>
                                </h1>
                                <p className="text-slate-500">{tutor.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.push('/admin/tutors')}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Back to List
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-sm">{tutor.email}</span>
                            </div>
                            {tutor.phone && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm">{tutor.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-sm">Joined {new Date(tutor.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <h3 className="font-medium text-slate-800">Bio</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {tutor.bio || "No biography provided."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Courses</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats?.totalCourses || 0}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Students</p>
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
                            <p className="text-sm text-slate-500 font-medium">Total Earnings</p>
                            <h3 className="text-2xl font-bold text-slate-800">${stats?.totalEarnings || 0}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Courses List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Courses by {tutor.name}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">Title</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Category</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Price</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {courses.length > 0 ? (
                                courses.map((course) => (
                                    <tr key={course._id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {course.title}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {course.category}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            ${course.price}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                                ${course.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                                                    course.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>
                                                {course.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => router.push(`/admin/courses/${course._id}`)}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No courses created yet.
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
