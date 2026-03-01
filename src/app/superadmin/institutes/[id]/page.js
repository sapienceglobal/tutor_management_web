'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Building2, Users, GraduationCap, Shield, Search, Key, Ban, CheckCircle, Mail, Phone } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
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
    const [impersonating, setImpersonating] = useState(false);

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
            toast.error('Failed to load institute');
        } finally { setLoading(false); }
    };

    const handleImpersonate = async (userId, userName) => {
        if (!confirm(`Are you sure you want to login as "${userName}"? You will be redirected to their dashboard.`)) return;
        setImpersonating(true);
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
        } finally { setImpersonating(false); }
    };

    const currentUsers = users[activeTab === 'admin' ? 'admin' : activeTab === 'tutors' ? 'tutors' : 'students'] || [];
    const filtered = currentUsers.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs = [
        { key: 'admin', label: 'Admin', icon: Shield, count: counts.admin, color: 'purple' },
        { key: 'tutors', label: 'Tutors', icon: GraduationCap, count: counts.tutors, color: 'blue' },
        { key: 'students', label: 'Students', icon: Users, count: counts.students, color: 'emerald' },
    ];

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    if (!institute) return <div className="p-8 text-center text-slate-500">Institute not found</div>;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
            {/* Back + Header */}
            <button onClick={() => router.push('/superadmin/institutes')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Institutes
            </button>

            {/* Institute Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">{institute.name}</h1>
                            <p className="text-slate-500 text-sm mt-0.5">{institute.subdomain}.sapience.app</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${institute.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            {institute.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                            {institute.subscriptionPlan || 'Free'} Plan
                        </span>
                        <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {counts.total} users
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-0">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${isActive
                                ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50/50`
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}>
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? `bg-${tab.color}-100 text-${tab.color}-700` : 'bg-slate-100 text-slate-500'}`}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative mb-4 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder={`Search ${activeTab}...`}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* User List */}
            {filtered.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-medium text-slate-600">No {activeTab} found</h3>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(user => (
                        <div key={user._id} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-all hover:border-indigo-200 group">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {user.profileImage ? (
                                    <img src={user.profileImage} alt="" className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <Users className="w-5 h-5 text-slate-400" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-800">{user.name}</span>
                                    {user.isBlocked && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600">Blocked</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</span>
                                    {user.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {user.phone}</span>}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>

                            {/* Login As */}
                            <Button
                                onClick={() => handleImpersonate(user._id, user.name)}
                                disabled={impersonating}
                                variant="outline"
                                size="sm"
                                className="shrink-0 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 font-medium"
                            >
                                {impersonating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Key className="w-3.5 h-3.5 mr-1.5" />}
                                Login As
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
