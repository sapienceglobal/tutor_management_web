'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    MdArrowBack, MdBusiness, MdPeople, MdSchool, MdSecurity, 
    MdSearch, MdVpnKey, MdBlock, MdCheckCircle, MdEmail, 
    MdPhone, MdCalendarMonth 
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

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

export default function InstituteDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [institute, setInstitute] = useState(null);
    const [users, setUsers] = useState({ admin: [], tutors: [], students: [] });
    const [counts, setCounts] = useState({ admin: 0, tutors: 0, students: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('admin');
    const [searchTerm, setSearchTerm] = useState('');
    const [impersonatingId, setImpersonatingId] = useState(null);

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

                toast.success(res.data.message);

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
        { key: 'admin', label: 'Administrators', icon: MdSecurity, count: counts.admin },
        { key: 'tutors', label: 'Instructors', icon: MdSchool, count: counts.tutors },
        { key: 'students', label: 'Students', icon: MdPeople, count: counts.students },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    if (!institute) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdBusiness style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>Institute Not Found</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>The institute you are looking for does not exist or has been removed.</p>
                    <button onClick={() => router.push('/superadmin/institutes')}
                        style={{
                            marginTop: '16px', background: C.gradientBtn, color: '#ffffff', border: 'none',
                            padding: '10px 20px', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, 
                            fontWeight: T.weight.bold, cursor: 'pointer', boxShadow: S.btn
                        }}>Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Back Navigation ── */}
            <button 
                onClick={() => router.push('/superadmin/institutes')} 
                className="flex items-center gap-2 bg-transparent border-none cursor-pointer px-0 transition-opacity hover:opacity-80"
                style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary }}
            >
                <MdArrowBack style={{ width: 16, height: 16 }} /> Back to Institutes
            </button>

            {/* ── Institute Details Header Card ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6" 
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-5">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 72, height: 72, borderRadius: '10px', backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                        {institute.logo ? (
                            <img src={institute.logo} alt="Logo" className="w-full h-full object-cover" style={{ borderRadius: '10px' }} />
                        ) : (
                            <MdBusiness style={{ width: 32, height: 32, color: C.btnPrimary }} />
                        )}
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: T.leading.tight }}>
                            {institute.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary, backgroundColor: C.innerBg, padding: '4px 10px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                {institute.subdomain}.sapience.app
                            </span>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted }}>
                                ID: {institute._id.slice(-8).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                    <span style={{
                        padding: '8px 16px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                        ...(institute.isActive !== false ? { backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` } : { backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}` })
                    }}>
                        {institute.isActive !== false ? 'Active' : 'Suspended'}
                    </span>
                    <span style={{ padding: '8px 16px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider, backgroundColor: C.innerBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}` }}>
                        {institute.subscriptionPlan || 'Free'} Plan
                    </span>
                    <span className="flex items-center gap-1.5" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, backgroundColor: C.innerBg, color: C.heading, border: `1px solid ${C.cardBorder}` }}>
                        <MdPeople style={{ width: 16, height: 16, color: C.btnPrimary }} /> {counts.total} Total Users
                    </span>
                </div>
            </div>

            {/* ── Toolbar (Tabs & Search) ── */}
            <div className="p-4 flex flex-col xl:flex-row items-center justify-between gap-4" 
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                {/* Styled Filter Tabs */}
                <div className="flex p-1.5 w-full xl:w-auto overflow-x-auto" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button 
                                key={tab.key} 
                                onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
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
                                <Icon style={{ width: 16, height: 16 }} />
                                {tab.label}
                                <span style={{
                                    marginLeft: '4px', padding: '2px 8px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.black,
                                    backgroundColor: isActive ? C.innerBg : C.surfaceWhite,
                                    color: isActive ? C.btnPrimary : C.textFaint,
                                    border: `1px solid ${C.cardBorder}`
                                }}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full xl:w-[350px]">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                    <input 
                        type="text" 
                        placeholder={`Search ${activeTab}...`}
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>

            {/* ── User Cards Grid ── */}
            {filtered.length === 0 ? (
                <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdPeople style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No {activeTab} found</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>Try adjusting your search or switch to a different tab.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map(user => (
                        <div key={user._id} className="p-5 flex flex-col transition-transform hover:-translate-y-1" 
                            style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = S.cardHover; }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = S.card; }}
                        >
                            
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center shrink-0 overflow-hidden" 
                                        style={{ width: 48, height: 48, borderRadius: '10px', backgroundColor: C.innerBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}` }}>
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black }}>
                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate max-w-[150px]" style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                                {user.name}
                                            </span>
                                            {user.isBlocked && (
                                                <span style={{ padding: '2px 6px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: C.dangerBg, color: C.danger, textTransform: 'uppercase', letterSpacing: T.tracking.wider, border: `1px solid ${C.dangerBorder}` }}>
                                                    Blocked
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginTop: 2 }}>
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="flex flex-col gap-2 mb-5 flex-1">
                                <div className="flex items-center gap-2" style={{ backgroundColor: C.innerBg, padding: '8px 12px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <MdEmail style={{ width: 14, height: 14, color: C.btnPrimary }} />
                                    <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                        {user.email}
                                    </span>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center gap-2" style={{ backgroundColor: C.innerBg, padding: '8px 12px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                        <MdPhone style={{ width: 14, height: 14, color: C.btnPrimary }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                            {user.phone}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textFaint }}>
                                    <MdCalendarMonth style={{ width: 14, height: 14 }} />
                                    {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                
                                <button
                                    onClick={() => handleImpersonate(user._id, user.name)}
                                    disabled={impersonatingId !== null}
                                    className="flex items-center gap-1.5 transition-all border-none cursor-pointer"
                                    style={{
                                        backgroundColor: C.btnViewAllBg,
                                        color: C.btnViewAllText,
                                        border: `1px solid ${C.cardBorder}`,
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        opacity: impersonatingId !== null && impersonatingId !== user._id ? 0.5 : 1
                                    }}
                                    title={`Login to ${user.name}'s account`}
                                    onMouseEnter={(e) => {
                                        if (impersonatingId === null) {
                                            e.currentTarget.style.backgroundColor = C.btnPrimary;
                                            e.currentTarget.style.color = '#ffffff';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (impersonatingId === null) {
                                            e.currentTarget.style.backgroundColor = C.btnViewAllBg;
                                            e.currentTarget.style.color = C.btnViewAllText;
                                        }
                                    }}
                                >
                                    {impersonatingId === user._id ? (
                                        <div className="relative w-3.5 h-3.5">
                                            <div className="w-3.5 h-3.5 rounded-full border-[2px] animate-spin"
                                                style={{ borderColor: `${C.btnViewAllText}30`, borderTopColor: C.btnViewAllText }} />
                                        </div>
                                    ) : (
                                        <MdVpnKey style={{ width: 14, height: 14 }} />
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