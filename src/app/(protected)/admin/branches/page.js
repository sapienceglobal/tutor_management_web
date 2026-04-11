'use client';

import { useState, useEffect } from 'react';
import {
    Loader2, Plus, Edit, Trash2, Search, Eye,
    CheckCircle2, ChevronLeft, ChevronRight,
    UploadCloud, Download, Bell, Building2, AlertCircle, Clock,
    FileText,
    MoreHorizontal
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import AddBranchWizardModal from '@/components/admin/AddBranchWizardModal';

const ROWS_PER_PAGE = 10;

export default function AdminBranchesPage() {
    const { confirmDialog } = useConfirm();
    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    const [branches, setBranches] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, pending: 0 });
    const [recentActivities, setRecentActivities] = useState([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await api.get('/facilities');
            if (res.data.success) {
                const data = res.data.facilities || res.data.data || [];
                setBranches(data);
                if (res.data.stats) setStats(res.data.stats);
                if (res.data.recentActivities) setRecentActivities(res.data.recentActivities);
                if (res.data.categoryBreakdown) setCategoryBreakdown(res.data.categoryBreakdown);
            }
        } catch (error) {
            toast.error('Failed to load branches');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBranches(); }, []);

    const handleDelete = async (id) => {
        const ok = await confirmDialog('Delete Branch', 'Are you sure you want to delete this branch? This cannot be undone.', { variant: 'destructive' });
        if (!ok) return;
        try {
            await api.delete(`/facilities/${id}`);
            toast.success('Branch deleted successfully');
            fetchBranches();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete branch');
        }
    };

    // Filter & paginate
    const filtered = branches.filter(b => {
        const matchSearch = !searchTerm || b.campusName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.address?.city?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = !statusFilter || b.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

    const statusBadge = (status) => {
        const map = {
            active: { bg: '#ECFDF5', color: '#059669', label: 'Active', icon: CheckCircle2 },
            inactive: { bg: '#FFF7ED', color: '#D97706', label: 'Inactive', icon: AlertCircle },
            pending: { bg: '#EFF6FF', color: '#2563EB', label: 'Pending', icon: Clock },
        };
        return map[status] || map['active'];
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const h = Math.floor(diff / 3600000);
        const d = Math.floor(diff / 86400000);
        if (h < 1) return 'Just now';
        if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
        return `${d} day${d > 1 ? 's' : ''} ago`;
    };

    const CATEGORY_COLORS = ['#6B4DF1', '#3182CE', '#4ABCA8', '#FC8730', '#E53E3E', '#805AD5'];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F1EAFB]">
                <Loader2 className="w-8 h-8 animate-spin text-[#6B4DF1]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F1EAFB', fontFamily: "'Inter', sans-serif" }}>

           {/* ── Main Integrated Branch Management Card ── */}
            <div className="bg-white rounded-3xl flex flex-col overflow-hidden mb-6" style={{ boxShadow: softShadow }}>
                
                {/* Header inside the card */}
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4F0FD]">
                    <h1 className="text-[22px] font-black text-[#27225B] m-0">Branch Management</h1>
                    <button onClick={() => { setEditingBranch(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#6B4DF1] text-white font-bold text-[14px] rounded-xl hover:bg-[#5839D6] transition-colors shadow-md border-none cursor-pointer">
                        <Plus size={18} strokeWidth={3} /> Add Branch
                    </button>
                </div>
                
                {/* Table Toolbar */}
                <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#F4F0FD]">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D8DA6]" />
                        <input type="text" placeholder="Search branches..." className="pl-10 pr-4 py-2.5 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] w-full placeholder-[#A0ABC0]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select className="bg-white border border-[#E9DFFC] text-[#7D8DA6] text-[13px] font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer min-w-[120px]">
                            <option>All Status</option>
                        </select>
                        <select className="bg-white border border-[#E9DFFC] text-[#7D8DA6] text-[13px] font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer min-w-[140px]">
                            <option>All Categories</option>
                        </select>
                        <button className="w-10 h-10 bg-white border border-[#E9DFFC] rounded-xl flex items-center justify-center text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer">
                            <span className="font-bold text-[14px]">→</span>
                        </button>
                        <select className="bg-white border border-[#E9DFFC] text-[#7D8DA6] text-[13px] font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer min-w-[140px]">
                            <option>Bulk Actions</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto px-6 pb-2">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F4F0FD] rounded-xl">
                            <tr>
                                <th className="px-5 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider first:rounded-l-xl">Branch Name ▾</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Address</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Category</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Status</th>
                                <th className="px-5 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider text-center last:rounded-r-xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F0FD]">
                            {branches.map((branch, i) => (
                                <tr key={branch._id || i} className="hover:bg-[#F8F7FF] transition-colors group">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-[10px] bg-[#6B4DF1] text-white flex items-center justify-center shrink-0">
                                                <Building2 size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#27225B] text-[14px]">{branch.campusName}</span>
                                                <span className="text-[12px] font-medium text-[#7D8DA6] truncate w-48 mt-0.5">{branch.address?.street}, {branch.address?.city}, {branch.address?.state}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-[#4A5568]">{branch.address?.street}, {branch.address?.city}, {branch.address?.state}:</span>
                                            <span className="text-[13px] font-medium text-[#7D8DA6]">{branch.address?.zipCode}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-[13px] font-semibold text-[#4A5568]">{branch.features?.[0]?.name || 'Engineering'}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ECFDF5] text-[#4ABCA8] text-[12px] font-bold rounded-lg border border-[#A7F3D0]">
                                            <CheckCircle2 size={14} /> Active
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-[#6B4DF1] hover:text-[#5839D6] bg-transparent border-none cursor-pointer"><Eye size={18} strokeWidth={2.5} /></button>
                                            <button className="text-[#6B4DF1] hover:text-[#5839D6] bg-transparent border-none cursor-pointer"><Edit size={16} strokeWidth={2.5} /></button>
                                            <button onClick={() => handleDelete(branch._id)} className="text-[#A0ABC0] hover:text-[#27225B] bg-transparent border-none cursor-pointer"><MoreHorizontal size={18} strokeWidth={2.5} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Table Pagination */}
                <div className="px-6 py-4 border-t border-[#F4F0FD] flex items-center justify-between bg-white mt-2">
                    <span className="text-[13px] font-bold text-[#7D8DA6]">Showing {branches.length} of {branches.length} Branches</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#7D8DA6] mr-2">Rows per page: 10 ▾</span>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer"><ChevronLeft size={16}/></button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F0FD] text-[#6B4DF1] font-bold border-none cursor-pointer text-[13px]">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer"><ChevronRight size={16}/></button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer ml-2"><FileText size={14}/></button>
                    </div>
                </div>
            </div>

            {/* ── Bottom Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Branch Overview + Recent Activities */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-5 rounded-2xl" style={{ boxShadow: softShadow }}>
                        <h3 className="text-[15px] font-black text-[#27225B] m-0 mb-4">Branch Overview</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Total\nBranches', value: stats.total, bg: '#F4F0FD', iconBg: '#6B4DF1', icon: Building2 },
                                { label: 'Active\nBranches', value: stats.active, bg: '#ECFDF5', iconBg: '#4ABCA8', icon: CheckCircle2 },
                                { label: 'Inactive\nBranches', value: stats.inactive, bg: '#FFF7ED', iconBg: '#FC8730', icon: AlertCircle },
                                { label: 'Pending\nApproval', value: stats.pending, bg: '#EBF8FF', iconBg: '#3182CE', icon: Clock },
                            ].map((s, i) => (
                                <div key={i} className="rounded-xl p-3 flex flex-col items-center justify-center text-center h-28"
                                    style={{ backgroundColor: s.bg }}>
                                    <div className="w-8 h-8 rounded-full text-white flex items-center justify-center mb-2" style={{ backgroundColor: s.iconBg }}>
                                        <s.icon size={14} />
                                    </div>
                                    <span className="text-[20px] font-black text-[#27225B] leading-none mb-1">{s.value}</span>
                                    <span className="text-[10px] font-bold text-[#7D8DA6] uppercase leading-tight whitespace-pre">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl flex-1" style={{ boxShadow: softShadow }}>
                        <h3 className="text-[15px] font-black text-[#27225B] m-0 mb-4">Recent Branch Activities</h3>
                        {recentActivities.length === 0 ? (
                            <p className="text-[12px] text-[#A0ABC0] font-medium">No recent activities yet.</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {recentActivities.map((act, i) => (
                                    <div key={act.id || i} className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[#6B4DF1] mt-1 shrink-0" />
                                            <p className="text-[12px] font-bold text-[#4A5568] m-0 leading-snug">{act.action}</p>
                                        </div>
                                        <span className="text-[10px] font-semibold text-[#A0ABC0] whitespace-nowrap ml-2">{timeAgo(act.time)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle: Top Branches + Categories */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-5 rounded-2xl" style={{ boxShadow: softShadow }}>
                        <h3 className="text-[15px] font-black text-[#27225B] m-0 mb-4">All Branches</h3>
                        {branches.length === 0 ? (
                            <p className="text-[12px] text-[#A0ABC0] font-medium">No branches added yet.</p>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#F4F0FD]">
                                        <th className="pb-2 text-[12px] font-bold text-[#7D8DA6]">Branch Name</th>
                                        <th className="pb-2 text-[12px] font-bold text-[#7D8DA6] text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branches.slice(0, 6).map(b => {
                                        const badge = statusBadge(b.status);
                                        return (
                                            <tr key={b._id} className="border-b border-[#F4F0FD] last:border-0">
                                                <td className="py-2.5 text-[13px] font-bold text-[#27225B]">{b.campusName}</td>
                                                <td className="py-2.5 text-right">
                                                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: badge.bg, color: badge.color }}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="bg-white p-5 rounded-2xl flex-1" style={{ boxShadow: softShadow }}>
                        <h3 className="text-[15px] font-black text-[#27225B] m-0 mb-4">Branch Categories</h3>
                        {categoryBreakdown.length === 0 ? (
                            <p className="text-[12px] text-[#A0ABC0] font-medium">No categories assigned yet.</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {categoryBreakdown.map((cat, i) => (
                                    <div key={cat.name} className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                                        <span className="text-[12px] font-bold text-[#27225B] flex-1">{cat.name}</span>
                                        <span className="text-[12px] font-semibold text-[#A0ABC0]">({cat.count})</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Quick Actions + Notifications */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-5 rounded-2xl" style={{ boxShadow: softShadow }}>
                        <h3 className="text-[15px] font-black text-[#27225B] m-0 mb-4">Quick Actions</h3>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => { setEditingBranch(null); setShowModal(true); }}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#F4F0FD] border-none cursor-pointer hover:bg-[#E9DFFC] transition-colors">
                                <div className="w-8 h-8 rounded-full bg-[#6B4DF1] text-white flex items-center justify-center">
                                    <Plus size={16} strokeWidth={3} />
                                </div>
                                <span className="text-[13px] font-bold text-[#6B4DF1]">Add New Branch</span>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#FFF7ED] border-none cursor-pointer hover:bg-[#FFEDD5] transition-colors">
                                <div className="w-8 h-8 rounded-full bg-[#FC8730] text-white flex items-center justify-center">
                                    <UploadCloud size={16} />
                                </div>
                                <span className="text-[13px] font-bold text-[#FC8730]">Import Branches</span>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#ECFDF5] border-none cursor-pointer hover:bg-[#D1FAE5] transition-colors">
                                <div className="w-8 h-8 rounded-full bg-[#4ABCA8] text-white flex items-center justify-center">
                                    <Download size={16} />
                                </div>
                                <span className="text-[13px] font-bold text-[#4ABCA8]">Download Branch Report</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl flex-1" style={{ boxShadow: softShadow }}>
                        <h3 className="text-[15px] font-black text-[#27225B] m-0 mb-4">Notifications</h3>
                        <div className="flex flex-col gap-4">
                            {stats.pending > 0 && (
                                <>
                                    <div className="flex items-start justify-between gap-3">
                                        <Bell size={16} className="text-[#6B4DF1] mt-0.5 shrink-0" />
                                        <span className="text-[12px] font-bold text-[#4A5568] flex-1 leading-snug">
                                            {stats.pending} branch{stats.pending > 1 ? 'es are' : ' is'} pending verification
                                        </span>
                                    </div>
                                    <hr className="border-t border-[#F4F0FD] m-0" />
                                </>
                            )}
                            {stats.inactive > 0 && (
                                <>
                                    <div className="flex items-start justify-between gap-3">
                                        <Bell size={16} className="text-[#6B4DF1] mt-0.5 shrink-0" />
                                        <span className="text-[12px] font-bold text-[#4A5568] flex-1 leading-snug">
                                            {stats.inactive} branch{stats.inactive > 1 ? 'es have' : ' has'} inactive status
                                        </span>
                                    </div>
                                    <hr className="border-t border-[#F4F0FD] m-0" />
                                </>
                            )}
                            {stats.total === 0 && (
                                <p className="text-[12px] text-[#A0ABC0] font-medium">No notifications at this time.</p>
                            )}
                            {stats.total > 0 && (
                                <div className="flex items-start justify-between gap-3">
                                    <Bell size={16} className="text-[#6B4DF1] mt-0.5 shrink-0" />
                                    <span className="text-[12px] font-bold text-[#4A5568] flex-1 leading-snug">
                                        {stats.total} total branch{stats.total > 1 ? 'es' : ''} registered
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Wizard Modal ── */}
            {showModal && (
                <AddBranchWizardModal
                    initialData={editingBranch}
                    onClose={() => { setShowModal(false); setEditingBranch(null); }}
                    onSuccess={fetchBranches}
                />
            )}
        </div>
    );
}