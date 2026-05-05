'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    MdSearch, MdPeople, MdDelete, MdBlock, MdCheckCircle, MdSecurity, 
    MdSchool, MdPerson, MdVpnKey, MdBusiness, MdVisibility
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

// ─── Base Input Style ─────────────────────────────────────────────────────────
const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

export default function SuperAdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [impersonatingId, setImpersonatingId] = useState(null);

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
        { key: 'all', label: 'All Users', icon: MdPeople, count: counts.total },
        { key: 'student', label: 'Students', icon: MdSchool, count: counts.students },
        { key: 'tutor', label: 'Instructors', icon: MdPerson, count: counts.tutors },
        { key: 'admin', label: 'Admins', icon: MdSecurity, count: counts.admins },
    ];

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                        Global User Management
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, marginTop: 4, margin: 0 }}>
                        Control, monitor, and support all platform users.
                    </p>
                </div>
            </div>

            {/* ── Top KPI Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <StatCard
                    icon={MdPeople}
                    value={counts.total}
                    label="Total Users"
                    iconBg="#EEF2FF"
                    iconColor="#4F46E5"
                />
                <StatCard
                    icon={MdSchool}
                    value={counts.students}
                    label="Students"
                    iconBg="#ECFDF5"
                    iconColor="#10B981"
                />
                <StatCard
                    icon={MdPerson}
                    value={counts.tutors}
                    label="Instructors"
                    iconBg="#FFF7ED"
                    iconColor="#F59E0B"
                />
                <StatCard
                    icon={MdBlock}
                    value={counts.blocked}
                    label="Blocked"
                    iconBg={C.dangerBg}
                    iconColor={C.danger}
                />
            </div>

            {/* ── Main Table Area ── */}
            <div className="flex flex-col" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                {/* Table Toolbar */}
                <div className="px-6 py-5 flex flex-col xl:flex-row items-center justify-between gap-4 border-b" style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg, borderTopLeftRadius: R['2xl'], borderTopRightRadius: R['2xl'] }}>
                    
                    {/* Role Filter Tabs */}
                    <div className="flex p-1.5 w-full xl:w-auto overflow-x-auto" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = roleFilter === tab.key;
                            return (
                                <button 
                                    key={tab.key} 
                                    onClick={() => { setRoleFilter(tab.key); setSearchTerm(''); }}
                                    className="flex items-center gap-2 transition-all whitespace-nowrap border-none cursor-pointer"
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.base,
                                        fontWeight: T.weight.bold,
                                        backgroundColor: isActive ? C.surfaceWhite : 'transparent',
                                        color: isActive ? C.btnPrimary : C.textFaint,
                                        boxShadow: isActive ? S.active : 'none'
                                    }}
                                >
                                    <Icon style={{ width: 16, height: 16 }} /> {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSearch} className="relative w-full xl:w-80">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                        <input 
                            type="text" 
                            placeholder="Search name or email..." 
                            style={{ ...baseInputStyle, paddingLeft: '44px' }}
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </form>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto px-4 pb-4 min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <div className="relative w-12 h-12">
                                <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                                Loading users...
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[1000px] mt-4">
                            <thead style={{ backgroundColor: C.innerBg }}>
                                <tr>
                                    <th style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, padding: '16px', borderBottom: `1px solid ${C.cardBorder}`, borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' }}>User Info</th>
                                    <th style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, padding: '16px', borderBottom: `1px solid ${C.cardBorder}` }}>Access Role</th>
                                    <th style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, padding: '16px', borderBottom: `1px solid ${C.cardBorder}` }}>Institute</th>
                                    <th style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, padding: '16px', borderBottom: `1px solid ${C.cardBorder}` }}>Status</th>
                                    <th style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, padding: '16px', borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'right', borderTopRightRadius: '10px', borderBottomRightRadius: '10px' }}>God Controls</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8">
                                            <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                                <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                    <MdPeople style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                                </div>
                                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No users found</h3>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>Try adjusting your search criteria or role filter.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.map((user) => (
                                    <tr key={user._id} className="transition-colors"
                                        style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center shrink-0 overflow-hidden" 
                                                    style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, color: C.btnPrimary }}>
                                                    {user.profileImage ? (
                                                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black }}>
                                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, lineHeight: 1.2 }}>{user.name}</div>
                                                    <div style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, marginTop: 2 }}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <select 
                                                value={user.role} 
                                                onChange={e => handleRoleChange(user._id, e.target.value)} 
                                                disabled={user.role === 'superadmin'}
                                                style={{
                                                    ...baseInputStyle,
                                                    padding: '6px 12px',
                                                    fontSize: T.size.xs,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: T.tracking.wider,
                                                    width: 'auto',
                                                    cursor: user.role === 'superadmin' ? 'not-allowed' : 'pointer',
                                                    ...(user.role === 'admin' ? { backgroundColor: C.innerBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}` } :
                                                       user.role === 'tutor' ? { backgroundColor: C.warningBg, color: C.warning, border: `1px solid ${C.warningBorder}` } :
                                                       user.role === 'superadmin' ? { backgroundColor: C.heading, color: '#ffffff', border: `1px solid ${C.heading}` } :
                                                       { backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` })
                                                }}
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
                                                    <MdBusiness style={{ width: 14, height: 14, color: C.textFaint }}/>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}>{user.instituteId.name}</span>
                                                </div>
                                            ) : (
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textFaint, backgroundColor: C.cardBg, padding: '4px 10px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                                    Global / Independent
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            {user.isBlocked ? (
                                                <span className="flex items-center gap-1.5 w-max" style={{ padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: C.dangerBg, color: C.danger, textTransform: 'uppercase', letterSpacing: T.tracking.wider, border: `1px solid ${C.dangerBorder}` }}>
                                                    <MdBlock style={{ width: 12, height: 12 }} /> Blocked
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 w-max" style={{ padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: C.successBg, color: C.success, textTransform: 'uppercase', letterSpacing: T.tracking.wider, border: `1px solid ${C.successBorder}` }}>
                                                    <MdCheckCircle style={{ width: 12, height: 12 }} /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                
                                                {/* 🌟 New View Profile Button */}
                                                <button 
                                                    onClick={() => router.push(`/superadmin/users/${user._id}`)}
                                                    className="flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent" 
                                                    style={{ width: 32, height: 32, borderRadius: '10px', color: C.textFaint }}
                                                    title="View 360° Profile"
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.btnPrimary; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textFaint; }}
                                                >
                                                    <MdVisibility style={{ width: 16, height: 16 }} />
                                                </button>

                                                {/* Impersonate Button */}
                                                {user.role !== 'superadmin' && (
                                                    <button
                                                        onClick={() => handleImpersonate(user._id, user.name, user.role)}
                                                        disabled={impersonatingId !== null}
                                                        className="flex items-center gap-1.5 transition-all cursor-pointer border-none"
                                                        style={{
                                                            height: 32, padding: '0 12px', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold,
                                                            backgroundColor: C.innerBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}`,
                                                            opacity: impersonatingId !== null && impersonatingId !== user._id ? 0.5 : 1
                                                        }}
                                                        title="Login As this user"
                                                        onMouseEnter={(e) => {
                                                            if (impersonatingId === null) {
                                                                e.currentTarget.style.backgroundColor = C.btnPrimary;
                                                                e.currentTarget.style.color = '#ffffff';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (impersonatingId === null) {
                                                                e.currentTarget.style.backgroundColor = C.innerBg;
                                                                e.currentTarget.style.color = C.btnPrimary;
                                                            }
                                                        }}
                                                    >
                                                        {impersonatingId === user._id ? (
                                                            <div className="relative w-3 h-3">
                                                                <div className="w-3 h-3 rounded-full border-[2px] animate-spin"
                                                                    style={{ borderColor: `${C.btnViewAllText}30`, borderTopColor: C.btnViewAllText }} />
                                                            </div>
                                                        ) : (
                                                            <MdVpnKey style={{ width: 14, height: 14 }} />
                                                        )}
                                                        Login As
                                                    </button>
                                                )}

                                                {/* Block/Unblock Button */}
                                                {user.role !== 'superadmin' && (
                                                    <button 
                                                        onClick={() => handleBlock(user._id, user.isBlocked)} 
                                                        className="flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent" 
                                                        style={{ width: 32, height: 32, borderRadius: '10px', color: user.isBlocked ? C.success : C.textFaint }}
                                                        title={user.isBlocked ? 'Unblock User' : 'Block User'}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = user.isBlocked ? C.successBg : C.dangerBg; e.currentTarget.style.color = user.isBlocked ? C.success : C.danger; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = user.isBlocked ? C.success : C.textFaint; }}
                                                    >
                                                        {user.isBlocked ? <MdCheckCircle style={{ width: 16, height: 16 }} /> : <MdBlock style={{ width: 16, height: 16 }} />}
                                                    </button>
                                                )}

                                                {/* Delete Button */}
                                                {user.role !== 'superadmin' && (
                                                    <button 
                                                        onClick={() => handleDelete(user._id)} 
                                                        className="flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent" 
                                                        style={{ width: 32, height: 32, borderRadius: '10px', color: C.textFaint }}
                                                        title="Delete User Permanently"
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg; e.currentTarget.style.color = C.danger; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textFaint; }}
                                                    >
                                                        <MdDelete style={{ width: 16, height: 16 }} />
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