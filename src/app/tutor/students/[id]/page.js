'use client';

import { useState, useEffect, use } from 'react';
import { Loader2, Mail, Calendar, BookOpen, User, CreditCard } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function TutorStudentDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [stats, setStats] = useState(null);
    const [enrollments, setEnrollments] = useState([]);

    useEffect(() => {
        fetchStudentDetails();
    }, [id]);

    const fetchStudentDetails = async () => {
        try {
            const res = await api.get(`/tutors/students/${id}`);
            if (res.data.success) {
                setStudent(res.data.student);
                // Map backend response to local stats state
                setStats({
                    totalEnrolled: res.data.tutorCoursesCount,
                    totalSpent: res.data.totalSpent
                });
                setEnrollments(res.data.enrollments);
            }
        } catch (error) {
            console.error('Failed to fetch student details:', error);
            toast.error('Failed to load student details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-6 text-center text-slate-500">
                Student not found
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
                                {student.profileImage ? (
                                    <img src={student.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-400 bg-slate-100">
                                        {student.name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="mb-1">
                                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    {student.name}
                                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <User className="w-3 h-3" /> Student
                                    </span>
                                </h1>
                                <p className="text-slate-500">{student.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.back()}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Back
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-sm">{student.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-sm">Joined {new Date(student.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Courses Enrolled</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats?.totalEnrolled || 0}</h3>
                            <p className="text-xs text-slate-400">In your courses</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg text-green-600">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Spent</p>
                            <h3 className="text-2xl font-bold text-slate-800">${stats?.totalSpent || 0}</h3>
                            <p className="text-xs text-slate-400">On your courses</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enrollments List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Enrolled Courses</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">Course</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Level</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Price</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Progress</th>
                                {/* <th className="px-6 py-4 font-semibold text-slate-600 text-right">Action</th> */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {enrollments.length > 0 ? (
                                enrollments.map((enrollment) => (
                                    <tr key={enrollment._id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {enrollment.courseId?.thumbnail && (
                                                    <img src={enrollment.courseId.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                                                )}
                                                <span className="font-medium text-slate-900">{enrollment.courseId?.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 capitalize">
                                            {enrollment.courseId?.level}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            ${enrollment.courseId?.price}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-emerald-500 h-full rounded-full"
                                                        style={{ width: `${enrollment.progress?.percentage || 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-slate-500">{enrollment.progress?.percentage || 0}%</span>
                                            </div>
                                        </td>
                                        {/* 
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => router.push(`/tutor/courses/${enrollment.courseId?._id}`)} // Need to verify if this page exists and is correct
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >
                                                View Course
                                            </button>
                                        </td> 
                                        */}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No active enrollments.
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
