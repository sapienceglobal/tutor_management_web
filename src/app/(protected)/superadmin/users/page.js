'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Loader2, Search, Users, Trash2, Ban, CheckCircle2, Shield, 
    GraduationCap, UserCog, Key, Building2, Eye 
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function SuperAdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [impersonatingId, setImpersonatingId] = useState(null);

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => { fetchUsers(); }, [roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let query = `/superadmin/users?role=${roleFilter}`;
            if (searchTerm) query += `&search=${searchTerm}`;
            const res = await api.get(query);
            if (res.data.success) setUsers(res.data.users);
        } catch (error) { 
            toast.error('Failed to load users'); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    const handleBlock = async (id, currentStatus) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'unblock' : 'block'} this user?`)) return;
        try {
            await api.put(`/superadmin/users/${id}`, { isBlocked: !currentStatus });
            setUsers(users.map(u => u._id === id ? { ...u, isBlocked: !currentStatus } : u));
            toast.success(currentStatus ? 'User unblocked successfully' : 'User blocked successfully');
        } catch (error) { toast.error('Failed to update user status'); }
    };

    const handleRoleChange = async (id, newRole) => {
        if (!confirm(`Change user role to ${newRole.toUpperCase()}?`)) return;
        try {
            await api.put(`/superadmin/users/${id}`, { role: newRole });
            setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
            toast.success('User role updated');
        } catch (error) { toast.error('Failed to update role'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('🚨 DANGER: Are you sure you want to delete this user permanently? This cannot be undone.')) return;
        try {
            await api.delete(`/superadmin/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
            toast.success('User deleted permanently');
        } catch (error) { toast.error('Failed to delete user'); }
    };

    // 🌟 The "God Mode" Login Feature
    const handleImpersonate = async (userId, userName, userRole) => {
        if (userRole === 'superadmin') return toast.error('Cannot impersonate another superadmin');
        if (!confirm(`Enter "God Mode": Login as "${userName}"?`)) return;
        
        setImpersonatingId(userId);
        try {
            const res = await api.post(`/superadmin/impersonate/${userId}`);
            if (res.data.success) {
                const currentToken = localStorage.getItem('token');
                const currentUser = localStorage.getItem('user');
                localStorage.setItem('sa_original_token', currentToken);
                localStorage.setItem('sa_original_user', currentUser);

                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                Cookies.set('token', res.data.token, { expires: 1 });
                Cookies.set('user_role', res.data.user.role, { expires: 1 });
                localStorage.setItem('sa_impersonating', JSON.stringify({
                    name: res.data.user.name,
                    role: res.data.user.role,
                    email: res.data.user.email,
                }));

                toast.success(`Logged in as ${res.data.user.name}`);
                const dashPaths = { admin: '/admin/dashboard', tutor: '/tutor/dashboard', student: '/student/dashboard' };
                window.location.href = dashPaths[res.data.user.role] || '/';
            }
        } catch (error) {
            toast.error('Impersonation failed');
            setImpersonatingId(null);
        }
    };

    // Calculate dynamic KPIs
    const counts = {
        total: users.length,
        students: users.filter(u => u.role === 'student').length,
        tutors: users.filter(u => u.role === 'tutor').length,
        admins: users.filter(u => u.role === 'admin').length,
        blocked: users.filter(u => u.isBlocked).length
    };

    const tabs = [
        { key: 'all', label: 'All Users', icon: Users, count: counts.total },
        { key: 'student', label: 'Students', icon: GraduationCap, count: counts.students },
        { key: 'tutor', label: 'Instructors', icon: UserCog, count: counts.tutors },
        { key: 'admin', label: 'Admins', icon: Shield, count: counts.admins },
    ];

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-black text-[#27225B] m-0">Global User Management</h1>
                    <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Control, monitor, and support all platform users.</p>
                </div>
            </div>

            {/* ── Top KPI Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 transition-transform hover:-translate-y-1" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center"><Users size={16} strokeWidth={2.5}/></div>
                        <span className="text-[13px] font-bold text-[#4A5568] uppercase tracking-wider">Total Users</span>
                    </div>
                    <span className="text-[28px] font-black text-[#27225B]">{counts.total}</span>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 transition-transform hover:-translate-y-1" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#10B981] flex items-center justify-center"><GraduationCap size={16} strokeWidth={2.5}/></div>
                        <span className="text-[13px] font-bold text-[#4A5568] uppercase tracking-wider">Students</span>
                    </div>
                    <span className="text-[28px] font-black text-[#27225B]">{counts.students}</span>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 transition-transform hover:-translate-y-1" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#F59E0B] flex items-center justify-center"><UserCog size={16} strokeWidth={2.5}/></div>
                        <span className="text-[13px] font-bold text-[#4A5568] uppercase tracking-wider">Instructors</span>
                    </div>
                    <span className="text-[28px] font-black text-[#27225B]">{counts.tutors}</span>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 transition-transform hover:-translate-y-1" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center"><Ban size={16} strokeWidth={2.5}/></div>
                        <span className="text-[13px] font-bold text-[#4A5568] uppercase tracking-wider">Blocked</span>
                    </div>
                    <span className="text-[28px] font-black text-[#EF4444]">{counts.blocked}</span>
                </div>
            </div>

            {/* ── Main Table Area ── */}
            <div className="bg-white rounded-3xl flex flex-col border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                
                {/* Table Toolbar */}
                <div className="px-6 py-5 flex flex-col xl:flex-row items-center justify-between gap-4 border-b border-[#F4F0FD] bg-[#FDFBFF] rounded-t-3xl">
                    
                    {/* Role Filter Tabs */}
                    <div className="flex bg-[#F4F0FD] p-1.5 rounded-xl w-full xl:w-auto overflow-x-auto">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = roleFilter === tab.key;
                            return (
                                <button 
                                    key={tab.key} 
                                    onClick={() => { setRoleFilter(tab.key); setSearchTerm(''); }}
                                    className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all whitespace-nowrap border-none cursor-pointer ${
                                        isActive ? 'bg-white text-[#6B4DF1] shadow-sm' : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'
                                    }`}
                                >
                                    <Icon size={16} strokeWidth={2.5} /> {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSearch} className="relative w-full xl:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                        <input 
                            type="text" placeholder="Search name or email..." 
                            className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0]"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </form>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto px-4 pb-4 min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#6B4DF1]" /></div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="bg-[#F9F7FC] rounded-xl">
                                <tr>
                                    <th className="px-6 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider rounded-l-xl">User Info</th>
                                    <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Access Role</th>
                                    <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Institute</th>
                                    <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Status</th>
                                    <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider text-right rounded-r-xl">God Controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F4F0FD]">
                                {users.length === 0 ? (
                                    <tr><td colSpan="5" className="p-12 text-center text-[#7D8DA6] font-medium">No users found.</td></tr>
                                ) : users.map((user) => (
                                    <tr key={user._id} className="hover:bg-[#F8F7FF] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0 border border-[#E9DFFC] overflow-hidden">
                                                    {user.profileImage ? (
                                                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-black text-[14px]">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-[#27225B] text-[14px]">{user.name}</div>
                                                    <div className="text-[12px] font-semibold text-[#7D8DA6]">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <select 
                                                value={user.role} 
                                                onChange={e => handleRoleChange(user._id, e.target.value)} 
                                                disabled={user.role === 'superadmin'}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border-none cursor-pointer outline-none shadow-sm ${
                                                    user.role === 'admin' ? 'bg-[#F4F0FD] text-[#6B4DF1]' :
                                                    user.role === 'tutor' ? 'bg-[#FFF7ED] text-[#EA580C]' :
                                                    user.role === 'superadmin' ? 'bg-[#27225B] text-white' :
                                                    'bg-[#ECFDF5] text-[#10B981]'
                                                }`}
                                            >
                                                <option value="student">Student</option>
                                                <option value="tutor">Tutor</option>
                                                <option value="admin">Admin</option>
                                                {user.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
                                            </select>
                                        </td>
                                        <td className="px-4 py-4">
                                            {user.instituteId ? (
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={14} className="text-[#A0ABC0]"/>
                                                    <span className="text-[13px] font-bold text-[#4A5568]">{user.instituteId.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[12px] font-bold text-[#A0ABC0] px-2.5 py-1 bg-gray-50 rounded-md border border-gray-200">Global / Independent</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            {user.isBlocked ? (
                                                <span className="px-3 py-1 rounded-md text-[11px] font-black bg-[#FEE2E2] text-[#E53E3E] uppercase tracking-wider flex items-center gap-1.5 w-max">
                                                    <Ban size={12} /> Blocked
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-md text-[11px] font-black bg-[#ECFDF5] text-[#10B981] uppercase tracking-wider flex items-center gap-1.5 w-max">
                                                    <CheckCircle2 size={12} /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                
                                                {/* 🌟 New View Profile Button */}
                                                <button 
                                                    onClick={() => router.push(`/superadmin/users/${user._id}`)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 text-[#7D8DA6] hover:bg-[#F4F0FD] hover:text-[#6B4DF1] transition-colors cursor-pointer border-none shadow-sm" 
                                                    title="View 360° Profile"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {/* Impersonate Button */}
                                                {user.role !== 'superadmin' && (
                                                    <button
                                                        onClick={() => handleImpersonate(user._id, user.name, user.role)}
                                                        disabled={impersonatingId !== null}
                                                        className="flex items-center gap-1.5 px-3 h-8 bg-[#F4F0FD] text-[#6B4DF1] font-bold text-[12px] rounded-lg hover:bg-[#6B4DF1] hover:text-white transition-all cursor-pointer border-none shadow-sm disabled:opacity-50"
                                                        title="Login As this user"
                                                    >
                                                        {impersonatingId === user._id ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} strokeWidth={2.5} />}
                                                        Login As
                                                    </button>
                                                )}

                                                {/* Block/Unblock Button */}
                                                {user.role !== 'superadmin' && (
                                                    <button 
                                                        onClick={() => handleBlock(user._id, user.isBlocked)} 
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer border-none shadow-sm ${user.isBlocked ? 'bg-[#ECFDF5] text-[#10B981] hover:bg-[#D1FAE5]' : 'bg-gray-50 text-[#A0ABC0] hover:bg-[#FEE2E2] hover:text-[#E53E3E]'}`} 
                                                        title={user.isBlocked ? 'Unblock User' : 'Block User'}
                                                    >
                                                        {user.isBlocked ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                                                    </button>
                                                )}

                                                {/* Delete Button */}
                                                {user.role !== 'superadmin' && (
                                                    <button 
                                                        onClick={() => handleDelete(user._id)} 
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 text-[#A0ABC0] hover:bg-[#FEE2E2] hover:text-[#E53E3E] transition-colors cursor-pointer border-none shadow-sm" 
                                                        title="Delete User Permanently"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}