'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Search,
    Upload,
    ChevronDown,
    X,
    FileText,
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 5;

export default function StudentAssignmentsPage() {
    const [enrollments, setEnrollments] = useState([]);
    const [allRows, setAllRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All Assignments');
    const [courseFilter, setCourseFilter] = useState('');
    const [titleFilter, setTitleFilter] = useState('');
    const [showTitleChip, setShowTitleChip] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [successMessage, setSuccessMessage] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const enrollRes = await api.get('/enrollments/my-enrollments');
                const enrollmentsList = enrollRes.data?.enrollments || [];
                setEnrollments(enrollmentsList);

                const rows = [];
                for (const enr of enrollmentsList) {
                    const cid = enr.courseId?._id || enr.courseId;
                    if (!cid) continue;
                    const res = await assignmentService.getCourseAssignments(cid);
                    const assignments = res.assignments || [];
                    const courseTitle = enr.courseId?.title || 'Course';
                    assignments.forEach((a) => {
                        rows.push({
                            ...a,
                            courseTitle,
                            courseId: cid,
                        });
                    });
                }
                rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                setAllRows(rows);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const now = new Date();
    const getStatus = (row) => {
        const sub = row.mySubmission;
        const due = row.dueDate ? new Date(row.dueDate) : null;
        if (sub?.status === 'graded') return { label: 'Submitted', type: 'submitted', isGraded: true };
        if (sub?.status === 'submitted') return { label: 'Submitted', type: 'submitted' };
        if (due && due < now) return { label: 'Overdue', type: 'overdue' };
        return { label: 'Pending', type: 'pending' };
    };

    const filtered = allRows.filter((row) => {
        const status = getStatus(row);
        if (activeTab === 'Pending' && status.type !== 'pending') return false;
        if (activeTab === 'Submitted' && status.type !== 'submitted') return false;
        if (activeTab === 'Overdue' && status.type !== 'overdue') return false;
        if (courseFilter && row.courseTitle.toLowerCase().indexOf(courseFilter.toLowerCase()) === -1) return false;
        if (titleFilter && row.title.toLowerCase().indexOf(titleFilter.toLowerCase()) === -1) return false;
        return true;
    });

    const pendingCount = allRows.filter((r) => getStatus(r).type === 'pending').length;
    const submittedCount = allRows.filter((r) => getStatus(r).type === 'submitted').length;
    const overdueCount = allRows.filter((r) => getStatus(r).type === 'overdue').length;

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f2f8]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
                    <div className="flex items-center gap-2">
                        <Link href="/student/assignments/upload">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                                <Upload className="w-4 h-4" />
                                Upload Assignment
                            </Button>
                        </Link>
                        <div className="relative">
                            <select className="appearance-none pl-4 pr-8 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option>Sort</option>
                                <option>Due Date</option>
                                <option>Date Assigned</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('All Assignments'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${activeTab === 'All Assignments' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        All Assignments
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('Pending'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${activeTab === 'Pending' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        {pendingCount} Pending
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('Submitted'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${activeTab === 'Submitted' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        Submitted
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('Overdue'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${activeTab === 'Overdue' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        {overdueCount} Overdue
                    </button>
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-3">
                    {showTitleChip && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                            Assignment Title
                            <button type="button" onClick={() => { setShowTitleChip(false); setTitleFilter(''); }} className="hover:bg-indigo-200 rounded-full p-0.5">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by Course"
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold text-slate-600">
                                    <th className="px-6 py-3 w-12">#</th>
                                    <th className="px-6 py-3">Assignment Title</th>
                                    <th className="px-6 py-3">Course</th>
                                    <th className="px-6 py-3">Date Assigned</th>
                                    <th className="px-6 py-3">Due Date</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.length > 0 ? (
                                    pageRows.map((row, idx) => {
                                        const status = getStatus(row);
                                        const globalIdx = (currentPage - 1) * PAGE_SIZE + idx + 1;
                                        return (
                                            <tr key={row._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                <td className="px-6 py-4 text-slate-600">{globalIdx}</td>
                                                <td className="px-6 py-4 font-medium text-slate-900">{row.title}</td>
                                                <td className="px-6 py-4 text-slate-700">{row.courseTitle}</td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                                                        status.type === 'overdue' ? 'bg-red-100 text-red-700' :
                                                        status.type === 'submitted' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {status.type === 'submitted' && '✓ '}
                                                        {status.type === 'overdue' && '⊙ '}
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {status.type === 'overdue' ? (
                                                        <Link href={`/student/courses/${row.courseId}/assignments/${row._id}`}>
                                                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Upload</Button>
                                                        </Link>
                                                    ) : (
                                                        <Link href={`/student/courses/${row.courseId}/assignments/${row._id}`}>
                                                            <Button size="sm" variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">View</Button>
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            No assignments match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {successMessage && (
                        <div className="mx-6 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium">
                            Success! You scored 80%
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
                            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                                Previous
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-9 h-9 rounded-lg text-sm font-medium ${currentPage === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {p}
                                </button>
                            ))}
                            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
