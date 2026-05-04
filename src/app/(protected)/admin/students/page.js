'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    MdSearch, 
    MdVisibility, 
    MdEdit, 
    MdPeople, 
    MdCheckCircle, 
    MdWarning, 
    MdHourglassEmpty, 
    MdCloudUpload, 
    MdAdd, 
    MdChevronLeft, 
    MdChevronRight, 
    MdFilterList,
    MdPersonRemove,
    MdDelete,
    MdDownload,
    MdNotifications,
    MdPeopleOutline
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import AddStudentWizardModal from '@/components/admin/AddStudentWizardModal';
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
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

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
                        password: 'Password@123',
                        role: 'student'
                    };

                    if (!payload.name || !payload.email) continue;

                    try {
                        await api.post('/admin/users', payload);
                        successCount++;
                    } catch (err) {
                        failCount++;
                    }
                }

                toast.success(`Bulk import completed: ${successCount} successful, ${failCount} failed.`);
                fetchStudents();
            } catch (err) {
                toast.error(err.message || "Failed to process CSV file.");
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleBlock = async (id, currentStatus) => {
        const action = currentStatus ? "Unblock" : "Block";
        const isConfirmed = await confirmDialog(`${action} Student`, `Are you sure you want to ${action.toLowerCase()} this student?`, { variant: currentStatus ? 'default' : 'destructive' });
        if (!isConfirmed) return;

        try {
            await api.put(`/admin/users/${id}/status`, { isBlocked: !currentStatus });
            setStudents(students.map(s => s._id === id ? { ...s, isBlocked: !currentStatus } : s));
            toast.success(`Student ${action.toLowerCase()}ed successfully`);
        } catch (error) {
            console.error('Block error:', error);
            toast.error(`Failed to ${action.toLowerCase()} student`);
        }
    };

    const handleRemoveFromInstitute = async (id, name) => {
        const isConfirmed = await confirmDialog(
            "Remove from Institute", 
            `Are you sure you want to remove ${name} from the institute?`, 
            { variant: 'destructive' }
        );
        if (!isConfirmed) return;

        try {
            await api.delete(`/admin/users/${id}/remove-from-institute`);
            setStudents(students.filter(s => s._id !== id));
            toast.success(`${name} removed from institute successfully`);
        } catch (error) {
            console.error('Remove from institute error:', error);
            toast.error(error.response?.data?.message || 'Failed to remove from institute');
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="space-y-6 min-h-screen w-full" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Top Stats Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdPeople}
                    value={stats?.total || 120}
                    label="Total Students"
                    iconBg={C.btnViewAllBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard 
                    icon={MdCheckCircle}
                    value={stats?.active || 94}
                    label="Active Students"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
                <StatCard 
                    icon={MdWarning}
                    value={stats?.inactive || 18}
                    label="Inactive/In Review"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
                <StatCard 
                    icon={MdHourglassEmpty}
                    value={stats?.pending || 7}
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
                        placeholder="Search students..."
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
                        <option>All Grades</option>
                        <option>Class 8</option>
                        <option>Class 9</option>
                        <option>Class 10</option>
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
                        <MdAdd style={{ width: 18, height: 18 }} /> Add Student
                    </button>
                </div>
            </div>

            {/* ── Students Table ── */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 20px', width: '48px', borderBottom: `1px solid ${C.cardBorder}` }}>
                                    <input type="checkbox" style={{ width: 16, height: 16, accentColor: C.btnPrimary, cursor: 'pointer' }} />
                                </th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Student Name</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Email</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Phone</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Grade</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Status</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student._id} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <input type="checkbox" style={{ width: 16, height: 16, accentColor: C.btnPrimary, cursor: 'pointer' }} />
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <div className="flex items-center gap-3">
                                                <img src={student.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`} alt="" className="object-cover shrink-0" style={{ width: 40, height: 40, borderRadius: '10px' }} />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="flex items-center gap-2 truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {student.name}
                                                        {student.isBlocked && (
                                                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: T.weight.bold, backgroundColor: C.dangerBg, color: C.danger, textTransform: 'uppercase' }}>
                                                                Blocked
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, marginTop: 2, maxWidth: '120px' }}>
                                                        {student._id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>{student.email}</span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>{student.phone || 'N/A'}</span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ padding: '4px 10px', backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, borderRadius: '10px', width: 'fit-content' }}>
                                                Class 9
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            {student.isBlocked ? (
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
                                                <button onClick={() => router.push(`/admin/students/${student._id}`)} className="transition-colors border-none cursor-pointer" title="View Profile" style={{ backgroundColor: 'transparent', padding: '4px', color: C.btnPrimary }} onMouseEnter={e => e.currentTarget.style.color = '#5839D6'} onMouseLeave={e => e.currentTarget.style.color = C.btnPrimary}>
                                                    <MdVisibility style={{ width: 18, height: 18 }} />
                                                </button>
                                                
                                                <button onClick={() => { setEditingUser(student); setIsModalOpen(true); }} className="transition-colors border-none cursor-pointer" title="Edit Details" style={{ backgroundColor: 'transparent', padding: '4px', color: C.success }} onMouseEnter={e => e.currentTarget.style.color = '#389E8D'} onMouseLeave={e => e.currentTarget.style.color = C.success}>
                                                    <MdEdit style={{ width: 18, height: 18 }} />
                                                </button>

                                                <button 
                                                    onClick={() => handleBlock(student._id, student.isBlocked)} 
                                                    className="transition-colors border-none cursor-pointer"
                                                    style={{ backgroundColor: 'transparent', padding: '4px', color: student.isBlocked ? C.warning : C.textMuted }}
                                                    title={student.isBlocked ? "Unblock Student" : "Block Student"}
                                                    onMouseEnter={e => e.currentTarget.style.color = student.isBlocked ? '#E07425' : C.warning}
                                                    onMouseLeave={e => e.currentTarget.style.color = student.isBlocked ? C.warning : C.textMuted}
                                                >
                                                    {student.isBlocked ? <MdCheckCircle style={{ width: 18, height: 18 }} /> : <MdWarning style={{ width: 18, height: 18 }} />}
                                                </button>

                                                <button 
                                                    onClick={() => handleRemoveFromInstitute(student._id, student.name)} 
                                                    className="transition-colors border-none cursor-pointer"
                                                    style={{ backgroundColor: 'transparent', padding: '4px', color: C.textMuted }}
                                                    title="Remove from Institute"
                                                    onMouseEnter={e => e.currentTarget.style.color = C.danger}
                                                    onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                                                >
                                                    <MdPersonRemove style={{ width: 18, height: 18 }} />
                                                </button>

                                                <button onClick={() => handleDelete(student._id)} className="transition-colors border-none cursor-pointer" title="Delete User" style={{ backgroundColor: 'transparent', padding: '4px', color: C.textMuted }} onMouseEnter={e => e.currentTarget.style.color = C.danger} onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
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
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No Students</h3>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>
                                                No students found matching your search.
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
                        Showing 1 to {filteredStudents.length} of {students.length} students
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
                
                {/* Quick Actions */}
                <div className="flex flex-col p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Quick Actions</h3>
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
                        <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="flex-1 flex items-center justify-center gap-2 transition-colors border-none cursor-pointer group" style={{ padding: '12px 16px', backgroundColor: C.btnViewAllBg, borderRadius: '10px' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}>
                            <MdAdd style={{ width: 18, height: 18, color: C.btnPrimary }} />
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.btnPrimary }}>Add Student</span>
                        </button>
                        <button disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 transition-opacity border-none cursor-pointer disabled:opacity-50" style={{ padding: '12px 16px', backgroundColor: C.warningBg, borderRadius: '10px' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                            onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                            {isImporting ? <MdHourglassEmpty style={{ width: 18, height: 18, color: C.warning }} className="animate-spin" /> : <MdCloudUpload style={{ width: 18, height: 18, color: C.warning }} />} 
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.warning }}>{isImporting ? 'Importing...' : 'Bulk Import'}</span>
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 transition-opacity border-none cursor-pointer" style={{ padding: '12px 16px', backgroundColor: C.successBg, borderRadius: '10px' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                            onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                            <MdDownload style={{ width: 18, height: 18, color: C.success }} />
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.success }}>Report</span>
                        </button>
                        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleBulkImport} className="hidden" />
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="flex flex-col p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Recent Activities</h3>
                    <div className="flex flex-col gap-4">
                        {recentActivities.length > 0 ? recentActivities.map((act, i) => (
                            <div key={i} className="flex items-center gap-3">
                                {act.image ? (
                                    <img src={act.image} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />
                                ) : (
                                    <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: [C.danger, C.btnPrimary, C.success][i % 3] }}></div>
                                )}
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, margin: 0, lineHeight: 1.3 }}>
                                    <span style={{ fontWeight: T.weight.bold, color: C.heading }}>{act.studentName}</span> enrolled in {act.courseTitle}
                                </p>
                            </div>
                        )) : (
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, fontStyle: 'italic', margin: 0 }}>No recent activities.</p>
                        )}
                    </div>
                </div>

                {/* Notifications */}
                <div className="flex flex-col p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Notifications</h3>
                    <div className="flex flex-col gap-3">
                        {notifications.length > 0 ? notifications.map((notif, i) => (
                            <div key={i} className="flex items-center justify-between p-3" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <MdWarning style={{ width: 16, height: 16, color: C.btnPrimary, shrink: 0 }} />
                                    <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{notif.text}</span>
                                </div>
                                <Link href="#" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, textDecoration: 'none', marginLeft: 8, shrink: 0 }}>View</Link>
                            </div>
                        )) : (
                            <div className="flex items-center justify-between p-3" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <MdNotifications style={{ width: 16, height: 16, color: C.btnPrimary, shrink: 0 }} />
                                    <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>No new notifications</span>
                                </div>
                            </div>
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