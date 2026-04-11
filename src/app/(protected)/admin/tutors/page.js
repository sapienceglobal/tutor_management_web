'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, Search, GraduationCap, Eye, Plus, Edit, Ban, CheckCircle, CheckCircle2, XCircle, ShieldAlert, UserX, Download, Bell, Filter, ChevronLeft, ChevronRight, Users, AlertTriangle, Hourglass, UploadCloud } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import AddInstructorWizardModal from '@/components/admin/AddInstructorWizardModal';
import Link from 'next/link';

export default function AdminTutorsPage() {
    const router = useRouter();
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { confirmDialog } = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [stats, setStats] = useState(null);

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchTutors();
    }, []);

    const fetchTutors = async () => {
        try {
            const res = await api.get('/admin/tutors');
            if (res.data.success) {
                setTutors(res.data.tutors);
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch tutors:', error);
            toast.error('Failed to load tutors');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirmDialog("Delete Tutor", "Are you sure you want to delete this tutor? This action cannot be undone.", { variant: 'destructive' });
        if (!isConfirmed) return;

        try {
            await api.delete(`/admin/users/${id}`);
            setTutors(tutors.filter(t => t._id !== id));
            toast.success('Tutor deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete tutor');
        }
    };

    const handleBlock = async (id, currentStatus) => {
        const action = currentStatus ? "Unblock" : "Block";
        const isConfirmed = await confirmDialog(`${action} Tutor`, `Are you sure you want to ${action.toLowerCase()} this tutor?`, { variant: currentStatus ? 'default' : 'destructive' });
        if (!isConfirmed) return;

        try {
            await api.put(`/admin/users/${id}/status`, { isBlocked: !currentStatus });
            setTutors(tutors.map(t => t._id === id ? { ...t, isBlocked: !currentStatus } : t));
            toast.success(`Tutor ${action.toLowerCase()}ed successfully`);
        } catch (error) {
            console.error('Block error:', error);
            toast.error(`Failed to ${action.toLowerCase()} tutor`);
        }
    };

    const handleVerify = async (tutorId, currentStatus) => {
        try {
            const action = currentStatus ? "Revoke Verification" : "Verify";
            const isConfirmed = await confirmDialog(`${action} Tutor`, `Are you sure you want to ${action.toLowerCase()} this tutor?`, { variant: currentStatus ? 'destructive' : 'default' });
            if (!isConfirmed) return;

            const res = await api.put(`/admin/tutors/${tutorId}/verify`, { isVerified: !currentStatus });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchTutors();
            }
        } catch (error) {
            console.error('Verify error:', error);
            toast.error(error.response?.data?.message || 'Failed to update verification status');
        }
    };

    const handleRemoveFromInstitute = async (id, name) => {
        const isConfirmed = await confirmDialog(
            "Remove from Institute", 
            `Are you sure you want to remove ${name} from the institute? They will lose access to all institute resources and can only rejoin with a new invite.`, 
            { variant: 'destructive' }
        );
        if (!isConfirmed) return;

        try {
            await api.delete(`/admin/users/${id}/remove-from-institute`);
            setTutors(tutors.filter(t => t._id !== id));
            toast.success(`${name} removed from institute successfully`);
        } catch (error) {
            console.error('Remove from institute error:', error);
            toast.error(error.response?.data?.message || 'Failed to remove from institute');
        }
    };

    const handleSubmitUser = async (formData, id) => {
        try {
            if (id) {
                // Edit
                const res = await api.put(`/admin/users/${id}`, formData);
                setTutors(tutors.map(t => t._id === id ? res.data.user : t));
                toast.success('Tutor updated successfully');
            } else {
                // Create
                const res = await api.post('/admin/users', formData);
                setTutors([res.data.user, ...tutors]);
                toast.success('Tutor created successfully');
            }
            fetchTutors(); // Refresh to ensure backend sync
            return true;
        } catch (error) {
            console.error('Submit user error:', error);
            toast.error(error.response?.data?.message || 'Failed to save tutor');
            return false;
        }
    };

    const filteredTutors = tutors.filter(tutor =>
        tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                    { title: 'Total Instructors', value: stats?.total || tutors.length || '0', bg: '#E8CBF3', iconBg: '#A059C5', icon: Users },
                    { title: 'Active Instructors', value: stats?.active || '0', bg: '#E9D6FC', iconBg: '#4ABCA8', icon: CheckCircle2 },
                    { title: 'Inactive/In Review', value: stats?.inactive || '0', bg: '#D9D5F1', iconBg: '#FC8730', icon: AlertTriangle },
                    { title: 'Pending Requests', value: stats?.pending || '0', bg: '#D6C3FC', iconBg: '#6B4DF1', icon: Hourglass }
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
                        placeholder="Search instructors..."
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
                        <option>All Subjects</option>
                        <option>Mathematics</option>
                        <option>Physics</option>
                    </select>
                    <button className="w-10 h-10 bg-[#F4F0FD] rounded-xl flex items-center justify-center text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer border-none">
                        <Filter size={16} />
                    </button>
                    <button
                        onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#6B4DF1] text-white font-bold text-[14px] rounded-xl hover:bg-[#5839D6] transition-colors shadow-md border-none cursor-pointer"
                    >
                        <Plus className="w-4 h-4" strokeWidth={3} /> Add Instructor
                    </button>
                </div>
            </div>

            {/* ── Tutors Table ── */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: softShadow }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F4F0FD] border-b border-[#E9DFFC]">
                            <tr>
                                <th className="px-5 py-4 w-12"><input type="checkbox" className="rounded text-[#6B4DF1] focus:ring-[#6B4DF1] w-4 h-4 cursor-pointer" /></th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Instructor</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Email</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Phone</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Subject(s)</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Status</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F0FD]">
                            {filteredTutors.length > 0 ? (
                                filteredTutors.map((tutor) => (
                                    <tr key={tutor._id} className="hover:bg-[#F8F7FF] transition-colors group">
                                        <td className="px-5 py-3"><input type="checkbox" className="rounded text-[#6B4DF1] focus:ring-[#6B4DF1] w-4 h-4 cursor-pointer" /></td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {tutor.profileImage ? (
                                                    <img src={tutor.profileImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-[#E9DFFC] flex items-center justify-center text-[#6B4DF1]">
                                                        <GraduationCap className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#27225B] text-[14px] flex items-center gap-2">
                                                        {tutor.name}
                                                        {!tutor.isVerified && (
                                                            <span title="Pending Verification" className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FEF3C7] text-[#B45309] uppercase flex items-center gap-1 cursor-help">
                                                                <ShieldAlert size={10} /> Pending
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-[#A0ABC0] truncate w-32">{tutor._id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[13px] font-semibold text-[#4A5568]">{tutor.email}</td>
                                        <td className="px-4 py-3 text-[13px] font-semibold text-[#4A5568]">{tutor.phone || '+91 8876543210'}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-3 py-1 bg-[#F4F0FD] text-[#6B4DF1] text-[12px] font-bold rounded-lg flex w-fit items-center gap-1">
                                                <ChevronRight size={12}/> {tutor.subject || 'Mathematics'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {tutor.isBlocked ? (
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
                                            <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => router.push(`/admin/tutors/${tutor._id}`)} className="text-[#6B4DF1] hover:text-[#5839D6] bg-transparent border-none cursor-pointer p-1" title="View Profile">
                                                    <Eye size={18} />
                                                </button>
                                                
                                                <button onClick={() => { setEditingUser(tutor); setIsModalOpen(true); }} className="text-[#4ABCA8] hover:text-[#389E8D] bg-transparent border-none cursor-pointer p-1" title="Edit Details">
                                                    <Edit size={18} />
                                                </button>

                                                <button 
                                                    onClick={() => handleVerify(tutor.tutorId, tutor.isVerified)}
                                                    className={`bg-transparent border-none cursor-pointer p-1 ${tutor.isVerified ? 'text-[#4ABCA8] hover:text-[#389E8D]' : 'text-[#A0ABC0] hover:text-[#FC8730]'}`}
                                                    title={tutor.isVerified ? "Revoke Verification" : "Verify Instructor"}
                                                >
                                                    {tutor.isVerified ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
                                                </button>

                                                <button 
                                                    onClick={() => handleBlock(tutor._id, tutor.isBlocked)} 
                                                    className={`bg-transparent border-none cursor-pointer p-1 ${tutor.isBlocked ? 'text-[#FC8730] hover:text-[#E07425]' : 'text-[#A0ABC0] hover:text-[#FC8730]'}`} 
                                                    title={tutor.isBlocked ? "Unblock Instructor" : "Block Instructor"}
                                                >
                                                    <Ban size={18} />
                                                </button>

                                                <button 
                                                    onClick={() => handleRemoveFromInstitute(tutor._id, tutor.name)} 
                                                    className="text-[#A0ABC0] hover:text-[#E53E3E] bg-transparent border-none cursor-pointer p-1" 
                                                    title="Remove from Institute"
                                                >
                                                    <UserX size={18} />
                                                </button>

                                                <button onClick={() => handleDelete(tutor._id)} className="text-[#A0ABC0] hover:text-red-600 bg-transparent border-none cursor-pointer p-1" title="Delete User">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-[#7D8DA6] font-medium">
                                        No instructors found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-[#F4F0FD] flex items-center justify-between bg-[#F8F7FF]">
                    <span className="text-[13px] font-semibold text-[#7D8DA6]">Showing 1 to {filteredTutors.length} of {tutors.length} instructors</span>
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
                
                {/* Recent Activities */}
                <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                    <h3 className="text-[15px] font-black text-[#27225B] mb-4">Recent Activities</h3>
                    <div className="flex flex-col gap-4">
                        {tutors.slice(0, 3).map((tutor, idx) => (
                            <div key={tutor._id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-[#6B4DF1]' : idx === 1 ? 'bg-[#FC8730]' : 'bg-[#4ABCA8]'}`}></div>
                                    <p className="text-[13px] font-semibold text-[#4A5568] m-0"><span className="font-bold text-[#27225B] max-w-[100px] truncate inline-block align-bottom">{tutor.name}</span> added to system</p>
                                </div>
                                <span className="text-[11px] font-medium text-[#A0ABC0]">Recently</span>
                            </div>
                        ))}
                        {tutors.length === 0 && (
                            <p className="text-[13px] font-medium text-[#A0ABC0] italic text-center">No recent activities</p>
                        )}
                    </div>
                    <Link href="#" className="text-[13px] font-bold text-[#6B4DF1] mt-5 no-underline">View All Activities &gt;</Link>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                    <h3 className="text-[15px] font-black text-[#27225B] mb-4">Quick Actions</h3>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F4F0FD] hover:bg-[#E9DFFC] transition-colors border-none cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-[#6B4DF1] flex items-center justify-center text-white"><Plus size={16} strokeWidth={3}/></div>
                            <span className="text-[14px] font-bold text-[#6B4DF1]">Add New Instructor</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFF7ED] hover:bg-[#FFEDD5] transition-colors border-none cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-[#FC8730] flex items-center justify-center text-white"><UploadCloud size={16}/></div>
                            <span className="text-[14px] font-bold text-[#FC8730]">Bulk Import</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] transition-colors border-none cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-[#4ABCA8] flex items-center justify-center text-white"><Download size={16}/></div>
                            <span className="text-[14px] font-bold text-[#4ABCA8]">Download Report</span>
                        </button>
                    </div>
                </div>

                {/* Instructor Statistics (Notifications Style) */}
                <div className="bg-white p-5 rounded-2xl flex flex-col" style={{ boxShadow: softShadow }}>
                    <h3 className="text-[15px] font-black text-[#27225B] mb-4">Instructor Statistics</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F0FD]">
                            <div className="flex items-center gap-3">
                                <Bell size={16} className="text-[#6B4DF1]" />
                                <span className="text-[13px] font-bold text-[#27225B]">{stats?.pending || 0} instructors pending verification</span>
                            </div>
                            <Link href="#" className="text-[12px] font-bold text-[#6B4DF1] no-underline">View</Link>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F0FD]">
                            <div className="flex items-center gap-3">
                                <Bell size={16} className="text-[#6B4DF1]" />
                                <span className="text-[13px] font-bold text-[#27225B] truncate w-40">Here's your monthly instructor report</span>
                            </div>
                            <Link href="#" className="text-[12px] font-bold text-[#6B4DF1] no-underline">Download</Link>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F0FD]">
                            <div className="flex items-center gap-3">
                                <Bell size={16} className="text-[#6B4DF1]" />
                                <span className="text-[13px] font-bold text-[#27225B]">{stats?.inactive || 0} inactive instructors</span>
                            </div>
                            <Link href="#" className="text-[12px] font-bold text-[#6B4DF1] no-underline">View</Link>
                        </div>
                    </div>
                </div>

            </div>

            <AddInstructorWizardModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
                onSubmit={handleSubmitUser}
                user={editingUser}
            />
        </div>
    );
}