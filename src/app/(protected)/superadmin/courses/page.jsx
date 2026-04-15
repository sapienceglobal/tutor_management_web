'use client';

import { useState, useEffect } from 'react';
import {
    Loader2, BookOpen, Search, ShieldAlert, GraduationCap,
    Building2, AlertTriangle, CheckCircle2, Ban, Eye, Video,
    MoreHorizontal, Clock, Star
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [kpis, setKpis] = useState({ totalCourses: 0, publishedCourses: 0, suspendedCourses: 0, totalEnrollments: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchCourses();
    }, [statusFilter]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            let query = `/superadmin/courses?status=${statusFilter}`;
            if (searchTerm) query += `&search=${searchTerm}`;

            const res = await api.get(query);
            if (res.data.success) {
                setCourses(res.data.data.courses);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load global courses');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchCourses();
    };

    const handleStatusChange = async (id, currentStatus, title) => {
        const newStatus = currentStatus === 'suspended' ? 'published' : 'suspended';
        const actionText = newStatus === 'suspended' ? 'SUSPEND' : 'RESTORE';

        if (!confirm(`🚨 Are you sure you want to ${actionText} the course: "${title}"?`)) return;

        try {
            const res = await api.patch(`/superadmin/courses/${id}/status`, { status: newStatus });
            if (res.data.success) {
                setCourses(courses.map(c => c._id === id ? { ...c, status: newStatus } : c));
                toast.success(`Course successfully ${newStatus}`);
            }
        } catch (error) {
            toast.error('Failed to update course status');
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'published': return { color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]', border: 'border-[#D1FAE5]', icon: CheckCircle2, label: 'Published' };
            case 'suspended': return { color: 'text-[#E53E3E]', bg: 'bg-[#FEE2E2]', border: 'border-[#FECACA]', icon: ShieldAlert, label: 'Suspended' };
            case 'pending': return { color: 'text-[#F59E0B]', bg: 'bg-[#FFF7ED]', border: 'border-[#FFEDD5]', icon: Clock, label: 'Pending Review' };
            default: return { color: 'text-[#7D8DA6]', bg: 'bg-[#F8F6FC]', border: 'border-[#E9DFFC]', icon: BookOpen, label: status };
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <BookOpen className="w-6 h-6 text-[#6B4DF1]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">Global Course Registry</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Monitor, audit, and moderate all content across the platform.</p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0"><BookOpen size={20} /></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Total Courses</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{kpis.totalCourses}</h3></div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0"><CheckCircle2 size={20} /></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Active / Live</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{kpis.publishedCourses}</h3></div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#E53E3E] flex items-center justify-center shrink-0"><ShieldAlert size={20} /></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Suspended</p><h3 className="text-[24px] font-black text-[#E53E3E] m-0">{kpis.suspendedCourses}</h3></div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center shrink-0"><GraduationCap size={20} /></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Global Enrollments</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{kpis.totalEnrollments.toLocaleString()}</h3></div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                <div className="flex bg-[#F4F0FD] p-1.5 rounded-xl w-full xl:w-auto overflow-x-auto">
                    {['all', 'published', 'pending', 'suspended'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all capitalize whitespace-nowrap border-none cursor-pointer ${statusFilter === status ? 'bg-white text-[#6B4DF1] shadow-sm' : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'}`}>
                            {status === 'all' ? 'All Courses' : status}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSearch} className="relative w-full xl:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                    <input type="text" placeholder="Search by course title..." className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </form>
            </div>

            {/* ── Courses List ── */}
            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>
            ) : courses.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#E9DFFC] p-16 text-center shadow-sm">
                    <AlertTriangle className="w-14 h-14 text-[#D1C4F9] mx-auto mb-4" />
                    <h3 className="text-[18px] font-black text-[#27225B] m-0">No courses found</h3>
                    <p className="text-[13px] text-[#7D8DA6] mt-2 m-0">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {courses.map(course => {
                        const statusData = getStatusConfig(course.status);
                        const StatusIcon = statusData.icon;

                        return (
                            <div key={course._id} className="bg-white rounded-[24px] border border-[#E9DFFC] overflow-hidden hover:-translate-y-1 transition-transform flex flex-col group shadow-sm">

                                {/* Thumbnail Header */}
                                {/* Thumbnail Header */}
                                <div className="h-40 w-full relative bg-[#F4F0FD] overflow-hidden border-b border-[#E9DFFC]">
                                    {/* Safely rendering image or fallback icon */}
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#D1C4F9]">
                                            <Video size={48} strokeWidth={1.5} />
                                        </div>
                                    )}

                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm border ${statusData.bg} ${statusData.color} ${statusData.border}`}>
                                            <StatusIcon size={10} /> {statusData.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-[#6B4DF1] uppercase tracking-wider bg-[#F4F0FD] px-2 py-0.5 rounded border border-[#E9DFFC]">{course.level}</span>
                                        <span className="text-[13px] font-black text-[#27225B]">{course.isFree ? 'Free' : `₹${course.price}`}</span>
                                    </div>

                                    <h3 className="font-black text-[15px] text-[#27225B] mb-3 line-clamp-2 leading-snug">{course.title}</h3>

                                    {/* Context Details */}
                                    <div className="space-y-2 mt-auto">
                                        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#4A5568]">
                                            <Building2 size={14} className="text-[#A0ABC0] shrink-0" />
                                            <span className="truncate">{course.instituteId ? course.instituteId.name : 'Global Platform'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#4A5568]">
                                            <div className="w-4 h-4 rounded-full bg-[#E9DFFC] flex items-center justify-center overflow-hidden shrink-0">
                                                {course.tutorId?.profileImage ? <img src={course.tutorId.profileImage} className="w-full h-full object-cover" /> : <span className="text-[8px] font-bold text-[#6B4DF1]">T</span>}
                                            </div>
                                            <span className="truncate">{course.tutorId?.name || 'Unknown Tutor'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer & God Actions */}
                                <div className="p-4 border-t border-[#F4F0FD] bg-[#FDFBFF] flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 text-[11px] font-bold text-[#7D8DA6]">
                                        <span className="flex items-center gap-1"><GraduationCap size={12} /> {course.enrolledCount}</span>
                                        <span className="flex items-center gap-1 text-[#F59E0B]"><Star size={12} className="fill-[#F59E0B]" /> {course.rating.toFixed(1)}</span>
                                    </div>

                                    {/* Master Ban Button */}
                                    <button
                                        onClick={() => handleStatusChange(course._id, course.status, course.title)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer border-none shadow-sm ${course.status === 'suspended' ? 'bg-[#ECFDF5] text-[#10B981] hover:bg-[#D1FAE5]' : 'bg-white border border-[#E9DFFC] text-[#E53E3E] hover:bg-[#FEE2E2] hover:border-[#FECACA]'}`}
                                        title={course.status === 'suspended' ? 'Restore Course' : 'Suspend / Takedown Course'}
                                    >
                                        {course.status === 'suspended' ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                                    </button>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}