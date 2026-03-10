'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search, Users, Trash2, Ban, CheckCircle, Shield, GraduationCap, UserCog } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

export default function SuperAdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => { fetchUsers(); }, [roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let query = `/superadmin/users?role=${roleFilter}`;
            if (searchTerm) query += `&search=${searchTerm}`;
            const res = await api.get(query);
            if (res.data.success) setUsers(res.data.users);
        } catch (error) { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    const handleBlock = async (id, currentStatus) => {
        try {
            await api.put(`/superadmin/users/${id}`, { isBlocked: !currentStatus });
            setUsers(users.map(u => u._id === id ? { ...u, isBlocked: !currentStatus } : u));
            toast.success(currentStatus ? 'User unblocked' : 'User blocked');
        } catch (error) { toast.error('Failed to update user'); }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            await api.put(`/superadmin/users/${id}`, { role: newRole });
            setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
            toast.success('Role updated');
        } catch (error) { toast.error('Failed to update role'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this user permanently?')) return;
        try {
            await api.delete(`/superadmin/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
            toast.success('User deleted');
        } catch (error) { toast.error('Failed to delete user'); }
    };

    const getRoleBadge = (role) => {
        const styles = {
            admin: 'bg-purple-100 text-purple-700',
            tutor: 'bg-blue-100 text-blue-700',
            student: 'bg-emerald-100 text-emerald-700',
        };
        return styles[role] || 'bg-slate-100 text-slate-600';
    };

    const getRoleIcon = (role) => {
        if (role === 'admin') return <Shield className="w-4 h-4" />;
        if (role === 'tutor') return <UserCog className="w-4 h-4" />;
        return <GraduationCap className="w-4 h-4" />;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">User Management</h1>
                <p className="text-slate-500 mt-1">Manage all platform users across roles and institutes</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Search by name or email..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </form>
                <div className="flex items-center gap-2">
                    {['all', 'student', 'tutor', 'admin'].map(role => (
                        <button key={role} onClick={() => setRoleFilter(role)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${roleFilter === role ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{users.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-emerald-500 uppercase tracking-wider">Students</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{users.filter(u => u.role === 'student').length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-blue-500 uppercase tracking-wider">Tutors</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{users.filter(u => u.role === 'tutor').length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-purple-500 uppercase tracking-wider">Admins</p>
                    <p className="text-2xl font-bold text-purple-700 mt-1">{users.filter(u => u.role === 'admin').length}</p>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">User</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Role</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Institute</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Joined</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.length > 0 ? users.map(user => (
                                <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                {user.profileImage ? <img src={user.profileImage} alt="" className="w-9 h-9 rounded-full object-cover" /> : getRoleIcon(user.role)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{user.name}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select value={user.role} onChange={e => handleRoleChange(user._id, e.target.value)} className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getRoleBadge(user.role)}`}>
                                            <option value="student">Student</option>
                                            <option value="tutor">Tutor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">{user.instituteId?.name || '-'}</td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        {user.isBlocked ? (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">Blocked</span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600">Active</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button onClick={() => handleBlock(user._id, user.isBlocked)} className={`p-1.5 rounded-lg transition-colors ${user.isBlocked ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'}`} title={user.isBlocked ? 'Unblock' : 'Block'}>
                                                {user.isBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => handleDelete(user._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
