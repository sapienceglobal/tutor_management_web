'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, Search, BookOpen, Eye, CheckCircle, XCircle, AlertTriangle, Ban, Plus, Filter, LayoutGrid, Clock, UploadCloud, Download, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import Link from 'next/link';
import AddCourseWizardModal from '@/components/admin/AddCourseWizardModal';

export default function AdminCoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [tutorsList, setTutorsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const { confirmDialog } = useConfirm();

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchCourses();
        fetchTutors();
    }, []);

    const fetchTutors = async () => {
        try {
            const res = await api.get('/admin/tutors');
            if (res.data?.success) setTutorsList(res.data.tutors || []);
        } catch (error) {
            console.error('Failed to fetch tutors', error);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get('/admin/courses');
            if (res.data.success) {
                setCourses(res.data.courses);
                setStats(res.data.stats || null);
                setRecentActivities(res.data.recentActivities || []);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSubmit = async (formData) => {
        if (editingCourse) {
            await api.put(`/admin/courses/${editingCourse._id}`, formData);
        } else {
            await api.post('/admin/courses', formData);
        }
        await fetchCourses(); 
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirmDialog("Delete Course", "Are you sure you want to delete this course? This action cannot be undone.", { variant: 'destructive' });
        if (!isConfirmed) return;

        try {
            await api.delete(`/admin/courses/${id}`);
            setCourses(courses.filter(c => c._id !== id));
            toast.success('Course deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete course');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        const actionMap = { 'published': 'Approve', 'rejected': 'Reject', 'suspended': 'Suspend' };
        const actionName = actionMap[newStatus] || newStatus;

        const isConfirmed = await confirmDialog(`${actionName} Course`, `Are you sure you want to ${actionName.toLowerCase()} this course?`, { variant: newStatus === 'rejected' || newStatus === 'suspended' ? 'destructive' : 'default' });
        if (!isConfirmed) return;

        try {
            const res = await api.put(`/admin/courses/${id}/status`, { status: newStatus });
            if (res.data.success) {
                setCourses(courses.map(c => c._id === id ? { ...c, status: newStatus } : c));
                toast.success(`Course ${actionName.toLowerCase()}ed successfully`);
            }
        } catch (error) {
            console.error('Status update error:', error);
            toast.error(`Failed to update course status`);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.tutorId && course.tutorId.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );



    if (loading) {
        return (
            <div className="flex bg-[#F1EAFB] min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#6B4DF1]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F1EAFB', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Top Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { title: 'Total Courses', value: stats?.total || 0, bg: '#E8CBF3', iconBg: '#A059C5', icon: BookOpen },
                    { title: 'Published Courses', value: stats?.published || 0, bg: '#D1F4E6', iconBg: '#4ABCA8', icon: CheckCircle },
                    { title: 'Draft Courses', value: stats?.draft || 0, bg: '#FFE5D3', iconBg: '#FC8730', icon: AlertTriangle },
                    { title: 'Inactive Courses', value: stats?.inactive || 0, bg: '#D9D5F1', iconBg: '#4F7BF0', icon: Ban }
                ].map((stat, i) => (
                    <div 
                        key={i} 
                        className="rounded-2xl p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 relative cursor-pointer" 
                        style={{ backgroundColor: stat.bg, boxShadow: softShadow }}
                    >
                        <div className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center shrink-0" style={{ backgroundColor: stat.iconBg }}>
                            <stat.icon size={22} color="#ffffff" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[26px] font-black text-[#27225B] leading-none mb-1.5">{stat.value}</span>
                            <span className="text-[13px] font-semibold text-[#4A3E68] leading-none">{stat.title}</span>
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40">
                            <ChevronRight size={18} className="text-[#27225B]" strokeWidth={3} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar / Filters ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ boxShadow: softShadow }}>
                <div className="relative w-full sm:w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D8DA6]" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        className="pl-10 pr-4 py-2.5 bg-[#F4F0FD] border-none text-[#27225B] text-[14px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] w-full placeholder-[#A0ABC0]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select className="bg-[#F4F0FD] text-[#27225B] text-[13px] font-bold px-4 py-2.5 rounded-xl border-none outline-none appearance-none cursor-pointer">
                        <option>All Categories...</option>
                        <option>Computer Science</option>
                        <option>Business</option>
                        <option>Science</option>
                    </select>
                    <button className="w-10 h-10 bg-[#F4F0FD] rounded-xl flex items-center justify-center text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer border-none">
                        <Filter size={16} />
                    </button>
                    <button
                        onClick={() => { setEditingCourse(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#6B4DF1] text-white font-bold text-[14px] rounded-xl hover:bg-[#5839D6] transition-colors shadow-md border-none cursor-pointer"
                    >
                        <Plus className="w-4 h-4" strokeWidth={3} /> Add Course
                    </button>
                </div>
            </div>

            {/* ── Course Grid (Cards) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                        <div key={course._id} className="bg-white rounded-2xl overflow-hidden flex flex-col group relative transition-all hover:shadow-lg" style={{ boxShadow: softShadow }}>
                            
                            {/* Thumbnail & Hover Overlay */}
                            <div className="h-[130px] bg-[#E9DFFC] relative overflow-hidden shrink-0">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Course Thumbnail" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#6B4DF1]">
                                        <BookOpen size={40} className="opacity-50" />
                                    </div>
                                )}
                                
                                {/* Admin Action Overlay (Visible on Hover) */}
                                <div className="absolute inset-0 bg-[#27225B]/80 flex flex-wrap items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-4">
                                    <button onClick={() => { setEditingCourse(course); setIsModalOpen(true); }} className="w-8 h-8 rounded-full bg-white text-[#6B4DF1] flex items-center justify-center hover:scale-110 transition-transform border-none cursor-pointer" title="Edit Details">
                                        <Eye size={15}/>
                                    </button>

                                    {(course.status === 'pending' || course.status === 'suspended' || course.status === 'rejected') && (
                                        <button onClick={() => handleStatusChange(course._id, 'published')} className="w-8 h-8 rounded-full bg-[#4ABCA8] text-white flex items-center justify-center hover:scale-110 transition-transform border-none cursor-pointer" title="Approve & Publish">
                                            <CheckCircle size={15}/>
                                        </button>
                                    )}

                                    {(course.status === 'pending' || course.status === 'published') && (
                                        <button onClick={() => handleStatusChange(course._id, 'rejected')} className="w-8 h-8 rounded-full bg-[#FC8730] text-white flex items-center justify-center hover:scale-110 transition-transform border-none cursor-pointer" title="Reject Course">
                                            <XCircle size={15}/>
                                        </button>
                                    )}

                                    {course.status === 'published' && (
                                        <button onClick={() => handleStatusChange(course._id, 'suspended')} className="w-8 h-8 rounded-full bg-[#E53E3E] text-white flex items-center justify-center hover:scale-110 transition-transform border-none cursor-pointer" title="Suspend Course">
                                            <Ban size={15}/>
                                        </button>
                                    )}

                                    <button onClick={() => handleDelete(course._id)} className="w-8 h-8 rounded-full bg-white text-red-500 flex items-center justify-center hover:scale-110 transition-transform border-none cursor-pointer" title="Delete Course">
                                        <Trash2 size={15}/>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="text-[14px] font-bold text-[#27225B] line-clamp-1 m-0 mb-2" title={course.title}>
                                    {course.title}
                                </h3>
                                
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] font-semibold text-[#7D8DA6] truncate max-w-[60%]">
                                        {course.category || 'Computer Science'}
                                    </span>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider
                                        ${course.status === 'published' ? 'bg-[#ECFDF5] text-[#4ABCA8]' : 
                                          course.status === 'draft' ? 'bg-[#F4F0FD] text-[#6B4DF1]' : 
                                          'bg-[#FFF7ED] text-[#FC8730]'}`}>
                                        {course.status || 'Draft'}
                                    </span>
                                </div>

                                {/* Footer Stats */}
                                <div className="mt-auto pt-3 border-t border-[#F4F0FD] flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[#A0ABC0]">
                                        <LayoutGrid size={12} />
                                        <span className="text-[11px] font-bold">{course.modules?.length || Math.floor(Math.random() * 20) + 5} Modules</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[#A0ABC0]">
                                        <Clock size={12} />
                                        <span className="text-[11px] font-bold">{course.duration || Math.floor(Math.random() * 60) + 10} Mins</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-white rounded-2xl" style={{ boxShadow: softShadow }}>
                        <BookOpen className="w-12 h-12 text-[#D1C4F9] mx-auto mb-3" />
                        <p className="text-[14px] font-semibold text-[#7D8DA6] m-0">No courses found matching your search.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {filteredCourses.length > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#7D8DA6]">Showing 1 to {filteredCourses.length} of {courses.length} courses</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#7D8DA6] mr-2">Rows per page: 10 ▾</span>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer"><ChevronLeft size={16}/></button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#6B4DF1] text-white font-bold border-none cursor-pointer text-[13px]">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer"><ChevronRight size={16}/></button>
                    </div>
                </div>
            )}

            {/* ── Bottom Widgets Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Quick Actions */}
                <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                    <h3 className="text-[15px] font-black text-[#27225B] mb-4">Quick Actions</h3>
                    <div className="flex gap-4">
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6B4DF1] text-white font-bold text-[13px] border-none cursor-pointer hover:bg-[#5839D6] transition-colors shadow-sm">
                            <UploadCloud size={16} /> Bulk Export
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[#DC7967] font-bold text-[13px] border-none cursor-pointer hover:opacity-90 transition-opacity shadow-sm" style={{ backgroundColor: '#FEE2E2' }}>
                            <Download size={16} /> Bulk Import
                        </button>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                    <h3 className="text-[15px] font-black text-[#27225B] mb-4">Recent Activities</h3>
                    <div className="flex flex-col gap-3">
                        {recentActivities.map((activity, idx) => (
                            <div key={activity.id || idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activity.action === 'published' ? 'bg-[#ECFDF5] text-[#4ABCA8]' : 'bg-[#F4F0FD] text-[#6B4DF1]'}`}>
                                        {activity.action === 'published' ? <CheckCircle size={14}/> : <Plus size={14}/>}
                                    </div>
                                    <p className="text-[13px] font-semibold text-[#4A5568] m-0"><span className="font-bold text-[#27225B] truncate max-w-[120px] inline-block align-bottom">{activity.title}</span> {activity.action}</p>
                                </div>
                                <span className="text-[11px] font-medium text-[#A0ABC0]">Recently</span>
                            </div>
                        ))}
                        {recentActivities.length === 0 && (
                            <p className="text-[13px] font-medium text-[#A0ABC0] italic text-center">No recent course activities</p>
                        )}
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                    <h3 className="text-[15px] font-black text-[#27225B] mb-4">Notifications</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F0FD]">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={16} className="text-[#6B4DF1]" />
                                <span className="text-[13px] font-bold text-[#27225B]">{stats?.pending || 0} courses pending approval</span>
                            </div>
                            <Link href="#" className="text-[12px] font-bold text-[#6B4DF1] no-underline">Review</Link>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F0FD]">
                            <div className="flex items-center gap-3">
                                <Ban size={16} className="text-[#6B4DF1]" />
                                <span className="text-[13px] font-bold text-[#27225B] truncate w-40">{stats?.inactive || 0} inactive courses</span>
                            </div>
                            <Link href="#" className="text-[12px] font-bold text-[#6B4DF1] no-underline">View</Link>
                        </div>
                    </div>
                </div>

            </div>

            <AddCourseWizardModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingCourse(null); }}
                onSubmit={handleCourseSubmit}
                course={editingCourse}
                tutorsList={tutorsList}
            />
        </div>
    );
}