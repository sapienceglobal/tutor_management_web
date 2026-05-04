'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    MdSearch, 
    MdSchool, 
    MdVisibility, 
    MdAdd, 
    MdEdit, 
    MdBlock, 
    MdCheckCircle, 
    MdCancel, 
    MdSecurity, 
    MdPersonRemove, 
    MdDownload, 
    MdNotifications, 
    MdFilterList, 
    MdChevronLeft, 
    MdChevronRight, 
    MdPeople, 
    MdWarning, 
    MdHourglassEmpty, 
    MdCloudUpload,
    MdDelete,
    MdPeopleOutline
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import AddInstructorWizardModal from '@/components/admin/AddInstructorWizardModal';
import Link from 'next/link';
import StatCard from '@/components/StatCard';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

export default function AdminTutorsPage() {
    const router = useRouter();
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { confirmDialog } = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [stats, setStats] = useState(null);

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

    return (
        <div className="space-y-6 min-h-screen" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Top Stats Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdPeople}
                    value={stats?.total || tutors.length || '0'}
                    label="Total Instructors"
                    iconBg={C.btnViewAllBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard 
                    icon={MdCheckCircle}
                    value={stats?.active || '0'}
                    label="Active Instructors"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
                <StatCard 
                    icon={MdWarning}
                    value={stats?.inactive || '0'}
                    label="Inactive/In Review"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
                <StatCard 
                    icon={MdHourglassEmpty}
                    value={stats?.pending || '0'}
                    label="Pending Requests"
                    iconBg={C.dangerBg}
                    iconColor={C.danger}
                />
            </div>

            {/* ── Toolbar / Filters ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="relative w-full sm:w-[300px] group">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" style={{ width: 18, height: 18, color: C.textMuted }} />
                    <input
                        type="text"
                        placeholder="Search instructors..."
                        style={{ ...baseInputStyle, paddingLeft: '36px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <select style={{ ...baseInputStyle, width: 'auto', minWidth: '120px' }}>
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                    <select style={{ ...baseInputStyle, width: 'auto', minWidth: '120px' }}>
                        <option>All Subjects</option>
                        <option>Mathematics</option>
                        <option>Physics</option>
                    </select>
                    <button className="flex items-center justify-center transition-colors cursor-pointer border-none"
                        style={{ width: 44, height: 44, backgroundColor: C.btnViewAllBg, color: C.btnPrimary, borderRadius: '10px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}>
                        <MdFilterList style={{ width: 20, height: 20 }} />
                    </button>
                    <button
                        onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 transition-opacity hover:opacity-90 cursor-pointer w-full sm:w-auto justify-center"
                        style={{ padding: '10px 20px', background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}
                    >
                        <MdAdd style={{ width: 18, height: 18 }} /> Add Instructor
                    </button>
                </div>
            </div>

            {/* ── Tutors Table ── */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 20px', width: '48px', borderBottom: `1px solid ${C.cardBorder}` }}>
                                    <input type="checkbox" style={{ width: 16, height: 16, accentColor: C.btnPrimary, cursor: 'pointer' }} />
                                </th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Instructor</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Email</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Phone</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Subject(s)</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Status</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTutors.length > 0 ? (
                                filteredTutors.map((tutor) => (
                                    <tr key={tutor._id} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <input type="checkbox" style={{ width: 16, height: 16, accentColor: C.btnPrimary, cursor: 'pointer' }} />
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <div className="flex items-center gap-3">
                                                {tutor.profileImage ? (
                                                    <img src={tutor.profileImage} alt="" className="object-cover shrink-0" style={{ width: 40, height: 40, borderRadius: '10px' }} />
                                                ) : (
                                                    <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: C.iconBg }}>
                                                        <MdSchool style={{ width: 18, height: 18, color: C.iconColor }} />
                                                    </div>
                                                )}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="flex items-center gap-2 truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {tutor.name}
                                                        {!tutor.isVerified && (
                                                            <span title="Pending Verification" style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: T.weight.bold, backgroundColor: C.warningBg, color: C.warning, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                                                                <MdSecurity style={{ width: 10, height: 10 }} /> Pending
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, marginTop: 2, maxWidth: '120px' }}>
                                                        {tutor._id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>{tutor.email}</span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>{tutor.phone || '+91 8876543210'}</span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, borderRadius: '10px', width: 'fit-content' }}>
                                                <MdChevronRight style={{ width: 14, height: 14 }} /> {tutor.subject || 'Mathematics'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            {tutor.isBlocked ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: C.warningBg, color: C.warning, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, borderRadius: '10px', border: `1px solid ${C.warningBorder}` }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: R.full, backgroundColor: C.warning }}></div> Inactive
                                                </span>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: C.successBg, color: C.success, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, borderRadius: '10px', border: `1px solid ${C.successBorder}` }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: R.full, backgroundColor: C.success }}></div> Active
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => router.push(`/admin/tutors/${tutor._id}`)} className="transition-colors border-none cursor-pointer" title="View Profile" style={{ backgroundColor: 'transparent', padding: '4px', color: C.btnPrimary }} onMouseEnter={e => e.currentTarget.style.color = '#5839D6'} onMouseLeave={e => e.currentTarget.style.color = C.btnPrimary}>
                                                    <MdVisibility style={{ width: 18, height: 18 }} />
                                                </button>
                                                
                                                <button onClick={() => { setEditingUser(tutor); setIsModalOpen(true); }} className="transition-colors border-none cursor-pointer" title="Edit Details" style={{ backgroundColor: 'transparent', padding: '4px', color: C.success }} onMouseEnter={e => e.currentTarget.style.color = '#389E8D'} onMouseLeave={e => e.currentTarget.style.color = C.success}>
                                                    <MdEdit style={{ width: 18, height: 18 }} />
                                                </button>

                                                <button 
                                                    onClick={() => handleVerify(tutor.tutorId, tutor.isVerified)}
                                                    className="transition-colors border-none cursor-pointer"
                                                    style={{ backgroundColor: 'transparent', padding: '4px', color: tutor.isVerified ? C.success : C.textMuted }}
                                                    title={tutor.isVerified ? "Revoke Verification" : "Verify Instructor"}
                                                    onMouseEnter={e => e.currentTarget.style.color = tutor.isVerified ? '#389E8D' : C.warning}
                                                    onMouseLeave={e => e.currentTarget.style.color = tutor.isVerified ? C.success : C.textMuted}
                                                >
                                                    {tutor.isVerified ? <MdCheckCircle style={{ width: 18, height: 18 }} /> : <MdSecurity style={{ width: 18, height: 18 }} />}
                                                </button>

                                                <button 
                                                    onClick={() => handleBlock(tutor._id, tutor.isBlocked)} 
                                                    className="transition-colors border-none cursor-pointer"
                                                    style={{ backgroundColor: 'transparent', padding: '4px', color: tutor.isBlocked ? C.warning : C.textMuted }}
                                                    title={tutor.isBlocked ? "Unblock Instructor" : "Block Instructor"}
                                                    onMouseEnter={e => e.currentTarget.style.color = tutor.isBlocked ? '#E07425' : C.warning}
                                                    onMouseLeave={e => e.currentTarget.style.color = tutor.isBlocked ? C.warning : C.textMuted}
                                                >
                                                    <MdBlock style={{ width: 18, height: 18 }} />
                                                </button>

                                                <button 
                                                    onClick={() => handleRemoveFromInstitute(tutor._id, tutor.name)} 
                                                    className="transition-colors border-none cursor-pointer"
                                                    style={{ backgroundColor: 'transparent', padding: '4px', color: C.textMuted }}
                                                    title="Remove from Institute"
                                                    onMouseEnter={e => e.currentTarget.style.color = C.danger}
                                                    onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                                                >
                                                    <MdPersonRemove style={{ width: 18, height: 18 }} />
                                                </button>

                                                <button onClick={() => handleDelete(tutor._id)} className="transition-colors border-none cursor-pointer" title="Delete User" style={{ backgroundColor: 'transparent', padding: '4px', color: C.textMuted }} onMouseEnter={e => e.currentTarget.style.color = C.danger} onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                                                    <MdDelete style={{ width: 18, height: 18 }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16">
                                        <div className="p-14 text-center border border-dashed"
                                             style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                            <div className="flex items-center justify-center mx-auto mb-4"
                                                 style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                <MdPeopleOutline style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                            </div>
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No Instructors</h3>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>
                                                No instructors found matching your search.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: C.surfaceWhite, borderTop: `1px solid ${C.cardBorder}` }}>
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>
                        Showing 1 to {filteredTutors.length} of {tutors.length} instructors
                    </span>
                    <div className="flex items-center gap-2">
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted, marginRight: 8 }}>Rows per page: 10</span>
                        <button className="flex items-center justify-center transition-colors cursor-pointer"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}
                            onMouseEnter={e => { e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.backgroundColor = C.surfaceWhite; }}>
                            <MdChevronLeft style={{ width: 20, height: 20 }} />
                        </button>
                        <button className="flex items-center justify-center border-none cursor-default"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.btnPrimary, color: '#ffffff', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}>
                            1
                        </button>
                        <button className="flex items-center justify-center transition-colors cursor-pointer"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}
                            onMouseEnter={e => { e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.backgroundColor = C.surfaceWhite; }}>
                            <MdChevronRight style={{ width: 20, height: 20 }} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Bottom Widgets Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Activities */}
                <div className="flex flex-col p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Recent Activities</h3>
                    <div className="flex flex-col gap-4">
                        {tutors.slice(0, 3).map((tutor, idx) => (
                            <div key={tutor._id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div style={{ width: 12, height: 12, borderRadius: R.full, backgroundColor: idx === 0 ? C.btnPrimary : idx === 1 ? C.warning : C.success }}></div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text, margin: 0 }}>
                                        <span style={{ fontWeight: T.weight.bold, color: C.heading, maxWidth: '100px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom' }}>
                                            {tutor.name}
                                        </span> added to system
                                    </p>
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted }}>Recently</span>
                            </div>
                        ))}
                        {tutors.length === 0 && (
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>No recent activities</p>
                        )}
                    </div>
                    <Link href="#" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary, textDecoration: 'none', marginTop: 20 }}>
                        View All Activities &gt;
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Quick Actions</h3>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 transition-colors border-none cursor-pointer group" style={{ backgroundColor: C.btnViewAllBg, borderRadius: '10px' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}>
                            <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: C.btnPrimary, color: '#ffffff' }}>
                                <MdAdd style={{ width: 18, height: 18 }} />
                            </div>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary }}>Add New Instructor</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 transition-colors border-none cursor-pointer group" style={{ backgroundColor: C.warningBg, borderRadius: '10px' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                            onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                            <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: C.warning, color: '#ffffff' }}>
                                <MdCloudUpload style={{ width: 18, height: 18 }} />
                            </div>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.warning }}>Bulk Import</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 transition-colors border-none cursor-pointer group" style={{ backgroundColor: C.successBg, borderRadius: '10px' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                            onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                            <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: C.success, color: '#ffffff' }}>
                                <MdDownload style={{ width: 18, height: 18 }} />
                            </div>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.success }}>Download Report</span>
                        </button>
                    </div>
                </div>

                {/* Instructor Statistics */}
                <div className="flex flex-col p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Instructor Statistics</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-3" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <div className="flex items-center gap-3">
                                <MdNotifications style={{ width: 18, height: 18, color: C.btnPrimary }} />
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{stats?.pending || 0} instructors pending verification</span>
                            </div>
                            <Link href="#" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, textDecoration: 'none' }}>View</Link>
                        </div>
                        <div className="flex items-center justify-between p-3" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <div className="flex items-center gap-3">
                                <MdNotifications style={{ width: 18, height: 18, color: C.btnPrimary }} />
                                <span className="truncate max-w-[160px]" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Here's your monthly instructor report</span>
                            </div>
                            <Link href="#" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, textDecoration: 'none' }}>Download</Link>
                        </div>
                        <div className="flex items-center justify-between p-3" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <div className="flex items-center gap-3">
                                <MdNotifications style={{ width: 18, height: 18, color: C.btnPrimary }} />
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{stats?.inactive || 0} inactive instructors</span>
                            </div>
                            <Link href="#" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, textDecoration: 'none' }}>View</Link>
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