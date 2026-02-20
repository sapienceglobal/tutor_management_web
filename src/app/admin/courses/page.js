'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, Search, BookOpen, Eye, ExternalLink } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function AdminCoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/admin/courses');
            if (res.data.success) {
                setCourses(res.data.courses);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

        try {
            await api.delete(`/admin/courses/${id}`);
            setCourses(courses.filter(c => c._id !== id));
            toast.success('Course deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete course');
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.tutorId && course.tutorId.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex bg-slate-50 min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Courses Management</h1>
                    <p className="text-slate-500">Monitor and manage all courses</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">Course</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Instructor</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Price</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCourses.length > 0 ? (
                                filteredCourses.map((course) => (
                                    <tr key={course._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden">
                                                    {course.thumbnail ? (
                                                        <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <BookOpen className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 line-clamp-1">{course.title}</div>
                                                    <div className="text-xs text-slate-500">{course.category || 'Uncategorized'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {course.tutorId ? (
                                                <div className="text-slate-700 font-medium">{course.tutorId.name}</div>
                                            ) : (
                                                <span className="text-slate-400 italic">Unknown Tutor</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-700">
                                            ${course.price || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                                ${course.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                                                    course.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {course.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => router.push(`/admin/courses/${course._id}`)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="View Course"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(course._id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Course"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No courses found matching your search.
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
