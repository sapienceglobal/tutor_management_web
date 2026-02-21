'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, Search, User, Eye } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';

export default function AdminStudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { confirmDialog } = useConfirm();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/admin/students');
            if (res.data.success) {
                setStudents(res.data.students);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirmDialog("Delete Student", "Are you sure you want to delete this student? This action cannot be undone.", { variant: 'destructive' });
        if (!isConfirmed) return;

        try {
            await api.delete(`/admin/users/${id}`);
            setStudents(students.filter(s => s._id !== id));
            toast.success('Student deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete student');
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h1 className="text-2xl font-bold text-slate-800">Students Management</h1>
                    <p className="text-slate-500">Manage all registered students</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search students..."
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
                                <th className="px-6 py-4 font-semibold text-slate-600">Student</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Contact</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Joined</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {student.profileImage ? (
                                                    <img src={student.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-slate-900">{student.name}</div>
                                                    <div className="text-xs text-slate-500 capitalize">{student.authProvider || 'Email'} User</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-600">{student.email}</div>
                                            {student.phone && <div className="text-xs text-slate-400">{student.phone}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(student.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => router.push(`/admin/students/${student._id}`)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student._id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        No students found matching your search.
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
