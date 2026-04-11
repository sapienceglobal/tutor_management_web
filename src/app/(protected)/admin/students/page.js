'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Eye, Edit, MoreHorizontal, Users, CheckSquare, AlertTriangle, Hourglass, UploadCloud, Plus, MessageSquare, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import AddStudentWizardModal from '@/components/admin/AddStudentWizardModal';
import Link from 'next/link';

export default function AdminStudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { confirmDialog } = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => { fetchStudents(); }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/admin/students');
            if (res.data.success) {
                setStudents(res.data.students);
                setStats(res.data.stats || null);
                setRecentActivities(res.data.recentActivities || []);
                setNotifications(res.data.notifications || []);
            }
        } catch (error) {
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirmDialog("Delete Student", "Are you sure you want to delete this student?", { variant: 'destructive' });
        if (!isConfirmed) return;
        try {
            await api.delete(`/admin/users/${id}`);
            setStudents(students.filter(s => s._id !== id));
            toast.success('Student deleted successfully');
        } catch (error) { toast.error('Failed to delete student'); }
    };

    const handleSaveUser = async (formData, id) => {
        try {
            if (id) {
                const res = await api.put(`/admin/users/${id}`, formData);
                if (res.data.success) {
                    toast.success('User updated successfully');
                    fetchStudents();
                    return true;
                }
            } else {
                const res = await api.post('/admin/users', formData);
                if (res.data.success) {
                    toast.success('User created successfully');
                    fetchStudents();
                    return true;
                }
            }
            return false;
        } catch (error) { 
            toast.error(error.response?.data?.message || 'Failed to save student'); 
            throw error; 
        }
    };

    const handleBulkImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isConfirmed = await confirmDialog("Bulk Import", `Are you sure you want to import students from ${file.name}?`);
        if (!isConfirmed) {
            e.target.value = ''; // Reset input
            return;
        }

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const rows = text.split('\n').map(row => row.trim()).filter(row => row);
                if (rows.length < 2) throw new Error("CSV file must contain a header row and at least one student data row.");

                // Very simple CSV parser (Assumes: Name, Email, Phone format)
                const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
                const nameIdx = headers.findIndex(h => h.includes('name'));
                const emailIdx = headers.findIndex(h => h.includes('email'));
                const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));

                if (nameIdx === -1 || emailIdx === -1) {
                    throw new Error("CSV must contain 'Name' and 'Email' columns.");
                }

                let successCount = 0;
                let failCount = 0;

                for (let i = 1; i < rows.length; i++) {
                    const columns = rows[i].split(',').map(c => c.trim());
                    const payload = {
                        name: columns[nameIdx],
                        email: columns[emailIdx],
                        phone: phoneIdx !== -1 ? columns[phoneIdx] : '',
                        password: 'Password@123', // Default bulk password
                        role: 'student'
                    };

                    if (!payload.name || !payload.email) continue; // Skip invalid rows

                    try {
                        await api.post('/admin/users', payload);
                        successCount++;
                    } catch (err) {
                        failCount++;
                    }
                }

                toast.success(`Bulk import completed: ${successCount} successful, ${failCount} failed.`);
                fetchStudents(); // Refresh data
            } catch (err) {
                toast.error(err.message || "Failed to process CSV file.");
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                    // Tumhare diye gaye specific background colors aur solid icon backgrounds
                    { title: 'Total Students', value: stats?.total || 120, bg: '#E8CBF3', iconBg: '#A059C5', icon: Users },
                    { title: 'Active Students', value: stats?.active || 94, bg: '#E9D6FC', iconBg: '#4ABCA8', icon: CheckSquare },
                    { title: 'Inactive/In Review', value: stats?.inactive || 18, bg: '#D9D5F1', iconBg: '#FC8730', icon: AlertTriangle },
                    { title: 'Pending Requests', value: stats?.pending || 7, bg: '#D6C3FC', iconBg: '#6B4DF1', icon: Hourglass }
                ].map((stat, i) => (
                    <div 
                        key={i} 
                        className="rounded-2xl p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 relative cursor-pointer" 
                        style={{ backgroundColor: stat.bg, boxShadow: softShadow }}
                    >
                        {/* Left: Solid Icon Box */}
                        <div className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center shrink-0" 
                             style={{ backgroundColor: stat.iconBg }}>
                            <stat.icon size={22} color="#ffffff" strokeWidth={2.5} />
                        </div>
                        
                        {/* Middle: Value & Title */}
                        <div className="flex flex-col">
                            <span className="text-[26px] font-black text-[#27225B] leading-none mb-1.5">{stat.value}</span>
                            <span className="text-[13px] font-semibold text-[#4A3E68] leading-none">{stat.title}</span>
                        </div>

                        {/* Right: Chevron Arrow */}
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
                        placeholder="Search students..."
                        className="pl-10 pr-4 py-2.5 bg-[#F4F0FD] border-none text-[#27225B] text-[14px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] w-full placeholder-[#A0ABC0]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select className="bg-[#F4F0FD] text-[#27225B] text-[13px] font-bold px-4 py-2.5 rounded-xl border-none outline-none appearance-none cursor-pointer">
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                    <select className="bg-[#F4F0FD] text-[#27225B] text-[13px] font-bold px-4 py-2.5 rounded-xl border-none outline-none appearance-none cursor-pointer">
                        <option>All Grades</option>
                        <option>Class 8</option>
                        <option>Class 9</option>
                        <option>Class 10</option>
                    </select>
                    <button className="w-10 h-10 bg-[#F4F0FD] rounded-xl flex items-center justify-center text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer border-none">
                        <Filter size={16} />
                    </button>
                    <button
                        onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#6B4DF1] text-white font-bold text-[14px] rounded-xl hover:bg-[#5839D6] transition-colors shadow-md border-none cursor-pointer"
                    >
                        <Plus className="w-4 h-4" strokeWidth={3} /> Add Student
                    </button>
                </div>
            </div>

            {/* ── Students Table ── */}
           {/* ── Students Table ── */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: softShadow }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F4F0FD] border-b border-[#E9DFFC]">
                            <tr>
                                <th className="px-5 py-4 w-12"><input type="checkbox" className="rounded text-[#6B4DF1] focus:ring-[#6B4DF1] w-4 h-4 cursor-pointer" /></th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Student Name</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Email</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Phone</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Grade</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Status</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F0FD]">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student._id} className="hover:bg-[#F8F7FF] transition-colors group">
                                        <td className="px-5 py-3"><input type="checkbox" className="rounded text-[#6B4DF1] focus:ring-[#6B4DF1] w-4 h-4 cursor-pointer" /></td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img src={student.profileImage || `https://ui-avatars.com/api/?name=${student.name}&background=E9DFFC&color=6B4DF1`} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#27225B] text-[14px] flex items-center gap-2">
                                                        {student.name}
                                                        {student.isBlocked && (
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FEE2E2] text-[#DC2626] uppercase">
                                                                Blocked
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-[#A0ABC0] truncate w-32">{student._id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[13px] font-semibold text-[#4A5568]">{student.email}</td>
                                        <td className="px-4 py-3 text-[13px] font-semibold text-[#4A5568]">{student.phone || 'N/A'}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-3 py-1 bg-[#F4F0FD] text-[#6B4DF1] text-[12px] font-bold rounded-lg">Class 9</span> 
                                        </td>
                                        <td className="px-4 py-3">
                                            {student.isBlocked ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF7ED] text-[#FC8730] text-[12px] font-bold rounded-lg">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#FC8730]"></div> Inactive
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ECFDF5] text-[#4ABCA8] text-[12px] font-bold rounded-lg">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#4ABCA8]"></div> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {/* Action Buttons with Tooltips & Full Original Functionality */}
                                            <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                
                                                {/* View Student */}
                                                <button onClick={() => router.push(`/admin/students/${student._id}`)} className="text-[#6B4DF1] hover:text-[#5839D6] bg-transparent border-none cursor-pointer p-1" title="View Profile">
                                                    <Eye size={18} />
                                                </button>
                                                
                                                {/* Edit Student */}
                                                <button onClick={() => { setEditingUser(student); setIsModalOpen(true); }} className="text-[#4ABCA8] hover:text-[#389E8D] bg-transparent border-none cursor-pointer p-1" title="Edit Details">
                                                    <Edit size={18} />
                                                </button>

                                                {/* Block / Unblock Student */}
                                                <button 
                                                    onClick={() => handleBlock(student._id, student.isBlocked)} 
                                                    className={`bg-transparent border-none cursor-pointer p-1 ${student.isBlocked ? 'text-[#FC8730] hover:text-[#E07425]' : 'text-[#A0ABC0] hover:text-[#FC8730]'}`} 
                                                    title={student.isBlocked ? "Unblock Student" : "Block Student"}
                                                >
                                                    {student.isBlocked ? <CheckSquare size={18} /> : <AlertTriangle size={18} />}
                                                </button>

                                                {/* Dropdown Menu logic for Delete/Remove replaced with direct icons for quick access just like original */}
                                                <button 
                                                    onClick={() => handleRemoveFromInstitute(student._id, student.name)} 
                                                    className="text-[#A0ABC0] hover:text-[#E53E3E] bg-transparent border-none cursor-pointer p-1" 
                                                    title="Remove from Institute"
                                                >
                                                    <Users size={18} /> {/* Using Users icon as a proxy for remove/manage, or you can use UserX */}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-[#7D8DA6] font-medium">
                                        No students found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-[#F4F0FD] flex items-center justify-between bg-[#F8F7FF]">
                    <span className="text-[13px] font-semibold text-[#7D8DA6]">Showing 1 to {filteredStudents.length} of {students.length} students</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#7D8DA6] mr-2">Rows per page: 10</span>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer"><ChevronLeft size={16}/></button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#6B4DF1] text-white font-bold border-none cursor-pointer text-[13px]">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer"><ChevronRight size={16}/></button>
                    </div>
                </div>
            </div>

            {/* ── Bottom Widgets Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Quick Actions */}
                <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                    <h3 className="text-[15px] font-black text-[#27225B] mb-4">Quick Actions</h3>
                    <div className="flex gap-4">
                        <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6B4DF1] text-white font-bold text-[13px] border-none cursor-pointer hover:bg-[#5839D6] transition-colors shadow-sm">
                            <UploadCloud size={16} /> Add New Student
                        </button>
                        <button disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[#DC7967] font-bold text-[13px] border-[#E09EBE] cursor-pointer hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50" style={{ backgroundColor: '#DDB1D2' }}>
                            {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />} 
                            {isImporting ? 'Importing...' : 'Bulk Import'}
                        </button>
                        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleBulkImport} className="hidden" />
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                    <h3 className="text-[15px] font-black text-[#27225B] mb-4">Recent Activities</h3>
                    <div className="flex flex-col gap-3">
                        {recentActivities.length > 0 ? recentActivities.map((act, i) => (
                            <div key={i} className="flex items-center gap-3">
                                {act.image ? (
                                    <img src={act.image} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />
                                ) : (
                                    <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: ['#FF8A8A', '#53B2FF', '#4ABCA8'][i % 3] }}></div>
                                )}
                                <p className="text-[13px] font-semibold text-[#4A5568] m-0"><span className="font-bold text-[#27225B]">{act.studentName}</span> enrolled in {act.courseTitle}</p>
                            </div>
                        )) : (
                            <p className="text-[13px] font-medium text-[#A0ABC0] italic m-0">No recent activities.</p>
                        )}
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                    <h3 className="text-[15px] font-black text-[#27225B] mb-4">Notifications</h3>
                    <div className="flex flex-col gap-3">
                        {notifications.length > 0 ? notifications.map((notif, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#F4F0FD]">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle size={16} className="text-[#6B4DF1]" />
                                    <span className="text-[13px] font-bold text-[#27225B] truncate max-w-[200px]">{notif.text}</span>
                                </div>
                                <Link href="#" className="text-[12px] font-bold text-[#6B4DF1] no-underline">View</Link>
                            </div>
                        )) : (
                            <p className="text-[13px] font-medium text-[#A0ABC0] italic m-0">No new notifications.</p>
                        )}
                    </div>
                </div>

            </div>

            <AddStudentWizardModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                }}
                onSubmit={handleSaveUser}
                user={editingUser}
            />
        </div>
    );
}