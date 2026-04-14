'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Building2, Users, GraduationCap, Shield, Search, Key, Ban, CheckCircle, Mail, Phone, CalendarDays } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function InstituteDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [institute, setInstitute] = useState(null);
    const [users, setUsers] = useState({ admin: [], tutors: [], students: [] });
    const [counts, setCounts] = useState({ admin: 0, tutors: 0, students: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('admin');
    const [searchTerm, setSearchTerm] = useState('');
    const [impersonatingId, setImpersonatingId] = useState(null); // Changed to track specific user

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/superadmin/institutes/${id}/users`);
            if (res.data.success) {
                setInstitute(res.data.institute);
                setUsers(res.data.users);
                setCounts(res.data.counts);
            }
        } catch (error) {
            toast.error('Failed to load institute details');
        } finally { setLoading(false); }
    };

    const handleImpersonate = async (userId, userName) => {
        if (!confirm(`Are you sure you want to login as "${userName}"? You will be redirected to their dashboard.`)) return;
        setImpersonatingId(userId);
        try {
            const res = await api.post(`/superadmin/impersonate/${userId}`);
            if (res.data.success) {
                // Save superadmin's original credentials for restoration
                const currentToken = localStorage.getItem('token');
                const currentUser = localStorage.getItem('user');
                localStorage.setItem('sa_original_token', currentToken);
                localStorage.setItem('sa_original_user', currentUser);

                // Switch to impersonated user
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                Cookies.set('token', res.data.token, { expires: 1 });
                Cookies.set('user_role', res.data.user.role, { expires: 1 });
                localStorage.setItem('sa_impersonating', JSON.stringify({
                    name: res.data.user.name,
                    role: res.data.user.role,
                    email: res.data.user.email,
                }));

                toast.success(res.data.message);

                // Redirect to the user's dashboard
                const dashPaths = { admin: '/admin/dashboard', tutor: '/tutor/dashboard', student: '/student/dashboard' };
                window.location.href = dashPaths[res.data.user.role] || '/';
            }
        } catch (error) {
            toast.error('Failed to impersonate user');
            setImpersonatingId(null);
        }
    };

    const currentUsers = users[activeTab] || [];
    const filtered = currentUsers.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs = [
        { key: 'admin', label: 'Administrators', icon: Shield, count: counts.admin },
        { key: 'tutors', label: 'Instructors', icon: GraduationCap, count: counts.tutors },
        { key: 'students', label: 'Students', icon: Users, count: counts.students },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F1EAFB]">
                <Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" />
            </div>
        );
    }

    if (!institute) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F1EAFB]">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                    <Building2 className="w-12 h-12 text-[#A0ABC0] mx-auto mb-3" />
                    <h2 className="text-[18px] font-black text-[#27225B]">Institute Not Found</h2>
                    <p className="text-[13px] text-[#7D8DA6] mt-2 mb-4">The institute you are looking for does not exist or has been removed.</p>
                    <button onClick={() => router.push('/superadmin/institutes')} className="px-5 py-2 bg-[#6B4DF1] text-white font-bold rounded-xl border-none cursor-pointer">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F1EAFB', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Back Navigation ── */}
            <button 
                onClick={() => router.push('/superadmin/institutes')} 
                className="flex items-center gap-2 text-[13px] font-bold text-[#6B4DF1] hover:text-[#5839D6] transition-colors bg-transparent border-none cursor-pointer px-0"
            >
                <ArrowLeft size={16} strokeWidth={3} /> Back to Institutes
            </button>

            {/* ── Institute Details Header Card ── */}
            <div className="bg-white rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                <div className="flex items-center gap-5">
                    <div className="w-[72px] h-[72px] rounded-[16px] bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0 border border-[#D1C4F9]">
                        {institute.logo ? (
                            <img src={institute.logo} alt="Logo" className="w-full h-full object-cover rounded-[16px]" />
                        ) : (
                            <Building2 size={32} strokeWidth={2.5} />
                        )}
                    </div>
                    <div>
                        <h1 className="text-[26px] font-black text-[#27225B] m-0 leading-tight">{institute.name}</h1>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[13px] font-bold text-[#6B4DF1] bg-[#F4F0FD] px-2.5 py-0.5 rounded-md border border-[#E9DFFC]">
                                {institute.subdomain}.sapience.app
                            </span>
                            <span className="text-[12px] font-medium text-[#A0ABC0]">ID: {institute._id.slice(-8).toUpperCase()}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-4 py-2 rounded-xl text-[12px] font-black uppercase tracking-wider border ${institute.isActive !== false ? 'bg-[#ECFDF5] text-[#4ABCA8] border-[#A7F3D0]' : 'bg-[#FEE2E2] text-[#E53E3E] border-[#FECACA]'}`}>
                        {institute.isActive !== false ? 'Active' : 'Suspended'}
                    </span>
                    <span className="px-4 py-2 rounded-xl text-[12px] font-black uppercase tracking-wider bg-[#F9F7FC] text-[#6B4DF1] border border-[#E9DFFC]">
                        {institute.subscriptionPlan || 'Free'} Plan
                    </span>
                    <span className="px-4 py-2 rounded-xl text-[13px] font-bold bg-[#F8F7FF] text-[#4A5568] border border-[#E9DFFC] flex items-center gap-1.5">
                        <Users size={16} className="text-[#6B4DF1]" /> {counts.total} Total Users
                    </span>
                </div>
            </div>

            {/* ── Toolbar (Tabs & Search) ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                
                {/* Styled Filter Tabs */}
                <div className="flex bg-[#F4F0FD] p-1.5 rounded-xl w-full xl:w-auto overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button 
                                key={tab.key} 
                                onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
                                className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all whitespace-nowrap border-none cursor-pointer ${
                                    isActive 
                                    ? 'bg-white text-[#6B4DF1] shadow-sm' 
                                    : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'
                                }`}
                            >
                                <Icon size={16} strokeWidth={2.5} />
                                {tab.label}
                                <span className={`ml-1 px-2 py-0.5 rounded-md text-[10px] font-black ${isActive ? 'bg-[#F4F0FD] text-[#6B4DF1]' : 'bg-white text-[#A0ABC0]'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full xl:w-[350px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                    <input 
                        type="text" 
                        placeholder={`Search ${activeTab}...`}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0] transition-shadow"
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>

            {/* ── User Cards Grid ── */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#E9DFFC]/50 p-16 text-center" style={{ boxShadow: softShadow }}>
                    <Users className="w-14 h-14 text-[#D1C4F9] mx-auto mb-4" />
                    <h3 className="text-[18px] font-black text-[#27225B] m-0">No {activeTab} found</h3>
                    <p className="text-[13px] text-[#7D8DA6] mt-2 m-0">Try adjusting your search or switch to a different tab.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map(user => (
                        <div key={user._id} className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 hover:-translate-y-1 transition-transform relative flex flex-col group" style={{ boxShadow: softShadow }}>
                            
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0 border border-[#E9DFFC] overflow-hidden">
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-black text-[16px]">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-[#27225B] text-[15px] truncate max-w-[150px]">{user.name}</span>
                                            {user.isBlocked && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FEE2E2] text-[#E53E3E] uppercase tracking-wider border border-[#FECACA]">Blocked</span>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider">{user.role}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="flex flex-col gap-2 mb-5 flex-1">
                                <div className="flex items-center gap-2 text-[12px] font-semibold text-[#4A5568] bg-[#F9F7FC] px-3 py-1.5 rounded-lg border border-[#E9DFFC]">
                                    <Mail size={14} className="text-[#6B4DF1]" />
                                    <span className="truncate">{user.email}</span>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center gap-2 text-[12px] font-semibold text-[#4A5568] bg-[#F9F7FC] px-3 py-1.5 rounded-lg border border-[#E9DFFC]">
                                        <Phone size={14} className="text-[#6B4DF1]" />
                                        <span>{user.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="pt-4 border-t border-[#F4F0FD] flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#A0ABC0]">
                                    <CalendarDays size={14} />
                                    {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                
                                <button
                                    onClick={() => handleImpersonate(user._id, user.name)}
                                    disabled={impersonatingId !== null}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#F4F0FD] text-[#6B4DF1] font-bold text-[12px] rounded-xl hover:bg-[#6B4DF1] hover:text-white transition-all cursor-pointer border-none disabled:opacity-50"
                                    title={`Login to ${user.name}'s account`}
                                >
                                    {impersonatingId === user._id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Key size={14} strokeWidth={2.5} />
                                    )}
                                    Login As
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}