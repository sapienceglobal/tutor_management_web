'use client';

import { useState, useEffect, useRef } from 'react';
import {
    MdHourglassEmpty,
    MdAdd,
    MdEdit,
    MdDelete,
    MdSearch,
    MdVisibility,
    MdCheckCircle,
    MdChevronLeft,
    MdChevronRight,
    MdCloudUpload,
    MdDownload,
    MdNotifications,
    MdBusiness,
    MdErrorOutline,
    MdAccessTime,
    MdArticle,
    MdMoreHoriz,
    MdArrowForward
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import AddBranchWizardModal from '@/components/admin/AddBranchWizardModal';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

const ROWS_PER_PAGE = 10;

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

export default function AdminBranchesPage() {
    const { confirmDialog } = useConfirm();

    const [branches, setBranches] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, pending: 0 });
    const [recentActivities, setRecentActivities] = useState([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(paginated.map(b => b._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        const isConfirmed = await confirmDialog("Bulk Delete Branches", `Are you sure you want to delete the ${selectedIds.length} selected branches? This action is permanent.`, { variant: 'destructive' });
        if (!isConfirmed) return;
        
        try {
            await Promise.all(selectedIds.map(id => api.delete(`/facilities/${id}`)));
            toast.success('Selected branches deleted successfully');
            setBranches(prev => prev.filter(b => !selectedIds.includes(b._id)));
            setSelectedIds([]);
        } catch (error) {
            toast.error('Failed to delete some branches');
            fetchBranches();
        }
    };

    const handleBulkStatusChange = async (newStatus) => {
        const action = newStatus === 'active' ? "Activate" : "Deactivate";
        const isConfirmed = await confirmDialog(`Bulk ${action} Branches`, `Are you sure you want to ${action.toLowerCase()} the ${selectedIds.length} selected branches?`, { variant: newStatus === 'inactive' ? 'destructive' : 'default' });
        if (!isConfirmed) return;

        try {
            await Promise.all(selectedIds.map(id => api.put(`/facilities/${id}`, { status: newStatus })));
            toast.success(`Selected branches updated successfully`);
            setBranches(prev => prev.map(b => selectedIds.includes(b._id) ? { ...b, status: newStatus } : b));
            setSelectedIds([]);
        } catch (error) {
            toast.error(`Failed to update branches' status`);
            fetchBranches();
        }
    };

    const handleBulkImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isConfirmed = await confirmDialog("Bulk Import", `Are you sure you want to import branches from ${file.name}?`);
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
                if (rows.length < 2) throw new Error("CSV file must contain a header row and at least one branch data row.");

                const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, '').replace(/""/g, '"'));
                const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('campus'));
                const codeIdx = headers.findIndex(h => h.includes('code'));
                const streetIdx = headers.findIndex(h => h.includes('street'));
                const cityIdx = headers.findIndex(h => h.includes('city'));
                const stateIdx = headers.findIndex(h => h.includes('state'));
                const zipIdx = headers.findIndex(h => h.includes('zip') || h.includes('postal'));
                const countryIdx = headers.findIndex(h => h.includes('country'));
                const contactPersonIdx = headers.findIndex(h => h.includes('person') || h.includes('contactperson'));
                const emailIdx = headers.findIndex(h => h.includes('email'));
                const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
                const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('categories'));
                const statusIdx = headers.findIndex(h => h.includes('status'));

                if (nameIdx === -1) {
                    throw new Error("CSV must contain a 'Branch Name' or 'Campus Name' column.");
                }

                let successCount = 0;
                let failCount = 0;
                let skipCount = 0;

                for (let i = 1; i < rows.length; i++) {
                    const columns = rows[i].split(',').map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                    const campusName = columns[nameIdx];
                    if (!campusName) continue;

                    const branchCode = codeIdx !== -1 ? columns[codeIdx] : '';

                    // Duplicate check
                    const branchExists = branches.some(b => 
                        b.campusName?.toLowerCase() === campusName.toLowerCase() ||
                        (branchCode && b.branchCode?.toLowerCase() === branchCode.toLowerCase())
                    );
                    if (branchExists) {
                        skipCount++;
                        continue;
                    }

                    const payload = {
                        campusName,
                        branchCode,
                        address: {
                            street: streetIdx !== -1 ? columns[streetIdx] : '',
                            city: cityIdx !== -1 ? columns[cityIdx] : '',
                            state: stateIdx !== -1 ? columns[stateIdx] : '',
                            zipCode: zipIdx !== -1 ? columns[zipIdx] : '',
                            country: countryIdx !== -1 ? columns[countryIdx] : 'India'
                        },
                        contactPerson: contactPersonIdx !== -1 ? columns[contactPersonIdx] : '',
                        contactEmail: emailIdx !== -1 ? columns[emailIdx] : '',
                        contactPhone: phoneIdx !== -1 ? columns[phoneIdx] : '',
                        categories: categoryIdx !== -1 && columns[categoryIdx] ? columns[categoryIdx].split(';').map(c => c.trim()) : [],
                        status: statusIdx !== -1 && columns[statusIdx] ? columns[statusIdx].toLowerCase() : 'active'
                    };

                    try {
                        await api.post('/facilities', payload);
                        successCount++;
                    } catch (err) {
                        failCount++;
                    }
                }

                toast.success(`Bulk import completed: ${successCount} successful, ${skipCount} skipped (already exists), ${failCount} failed.`);
                fetchBranches();
            } catch (err) {
                toast.error(err.message || "Failed to process CSV file.");
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleDownloadReport = () => {
        if (filtered.length === 0) {
            toast.error("No branch data available to export");
            return;
        }

        const headers = [
            "ID", "Branch Name", "Branch Code", "Category", 
            "Street", "City", "State", "Zip Code", "Country", 
            "Contact Person", "Contact Email", "Contact Phone", "Status"
        ];
        const csvRows = [headers.join(",")];

        for (const branch of filtered) {
            const category = branch.features?.[0]?.name || (branch.categories && branch.categories[0]) || "Engineering";
            const rowData = [
                branch._id,
                branch.campusName,
                branch.branchCode || "N/A",
                category,
                branch.address?.street || "N/A",
                branch.address?.city || "N/A",
                branch.address?.state || "N/A",
                branch.address?.zipCode || "N/A",
                branch.address?.country || "India",
                branch.contactPerson || "N/A",
                branch.contactEmail || "N/A",
                branch.contactPhone || "N/A",
                branch.status || "active"
            ];
            
            const escapedRow = rowData.map(val => {
                const escapedStr = String(val).replace(/"/g, '""');
                return `"${escapedStr}"`;
            });
            csvRows.push(escapedRow.join(","));
        }

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `branches_report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Branch report downloaded successfully!");
    };

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

    const filtered = branches.filter(b => {
        const matchSearch = !searchTerm || b.campusName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.address?.city?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = !statusFilter || b.status === statusFilter;
        
        // Category Filter
        const branchCats = b.categories || [];
        const matchCategory = !categoryFilter || 
            branchCats.some(cat => cat.toLowerCase() === categoryFilter.toLowerCase()) || 
            (b.features?.[0]?.name && b.features[0].name.toLowerCase() === categoryFilter.toLowerCase());
            
        return matchSearch && matchStatus && matchCategory;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

    const statusBadge = (status) => {
        const map = {
            active: { bg: C.successBg, color: C.success, border: C.successBorder, label: 'Active', icon: MdCheckCircle },
            inactive: { bg: C.warningBg, color: C.warning, border: C.warningBorder, label: 'Inactive', icon: MdErrorOutline },
            pending: { bg: C.btnViewAllBg, color: C.btnPrimary, border: C.cardBorder, label: 'Pending', icon: MdAccessTime },
        };
        return map[status] || map['active'];
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const h = Math.floor(diff / 3600000);
        const d = Math.floor(diff / 86400000);
        if (h < 1) return 'Just now';
        if (h < 24) return `${h}h ago`;
        return `${d}d ago`;
    };

    const CATEGORY_COLORS = [C.btnPrimary, C.success, C.warning, C.danger, C.text, C.iconBg];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen w-full" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen w-full" style={{ ...pageStyle, backgroundColor: C.pageBg }}>

            {/* ── Main Management Card ── */}
            <div className="flex flex-col overflow-hidden w-full" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Branch Management</h1>
                    <button onClick={() => { setEditingBranch(null); setShowModal(true); }}
                        className="flex items-center justify-center gap-2 transition-opacity hover:opacity-90 cursor-pointer border-none w-full sm:w-auto"
                        style={{ padding: '10px 24px', background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                        <MdAdd style={{ width: 18, height: 18 }} /> Add Branch
                    </button>
                </div>
                
                {/* Table Toolbar */}
                <div className="px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                    <div className="relative w-full md:w-96 group">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" style={{ width: 18, height: 18, color: C.textMuted }} />
                        <input type="text" placeholder="Search branches..." style={{ ...baseInputStyle, paddingLeft: '36px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                            onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                            onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...baseInputStyle, width: 'auto', minWidth: '120px', padding: '10px 16px', cursor: 'pointer' }}>
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)} 
                            style={{ ...baseInputStyle, width: 'auto', minWidth: '140px', padding: '10px 16px', cursor: 'pointer' }}
                        >
                            <option value="">All Categories</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Management">Management</option>
                            <option value="Arts & Science">Arts & Science</option>
                            <option value="Medical">Medical</option>
                            <option value="Others">Others</option>
                        </select>
                        <button className="flex items-center justify-center transition-colors cursor-pointer border-none"
                            style={{ width: 44, height: 44, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', color: C.textMuted }}
                            onMouseEnter={e => e.currentTarget.style.color = C.btnPrimary}
                            onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                            <MdArrowForward style={{ width: 18, height: 18 }} />
                        </button>
                        <select style={{ ...baseInputStyle, width: 'auto', minWidth: '140px', padding: '10px 16px', cursor: 'pointer' }}>
                            <option>Bulk Actions</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 20px', width: '48px', borderBottom: `1px solid ${C.cardBorder}` }}>
                                    <input type="checkbox" 
                                           checked={paginated.length > 0 && selectedIds.length === paginated.length}
                                           onChange={handleSelectAll}
                                           style={{ width: 16, height: 16, accentColor: C.btnPrimary, cursor: 'pointer' }} />
                                </th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Branch Name ▾</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Address</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Category</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Status</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((branch, i) => {
                                const badge = statusBadge(branch.status);
                                return (
                                    <tr key={branch._id || i} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <input type="checkbox" 
                                                   checked={selectedIds.includes(branch._id)}
                                                   onChange={() => handleSelectRow(branch._id)}
                                                   style={{ width: 16, height: 16, accentColor: C.btnPrimary, cursor: 'pointer' }} />
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                                    <MdBusiness style={{ width: 20, height: 20, color: C.iconColor }} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{branch.campusName}</span>
                                                    <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, marginTop: 2, maxWidth: '200px' }}>
                                                        {branch.address?.street}, {branch.address?.city}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <div className="flex flex-col">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.text }}>{branch.address?.city}, {branch.address?.state}</span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.semibold, color: C.textMuted, marginTop: 2 }}>{branch.address?.zipCode}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ padding: '4px 10px', backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, borderRadius: '10px' }}>
                                                {branch.features?.[0]?.name || 'Engineering'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.xs,
                                                fontWeight: T.weight.bold,
                                                borderRadius: '10px',
                                                textTransform: 'uppercase',
                                                letterSpacing: T.tracking.wider,
                                                backgroundColor: badge.bg,
                                                color: badge.color,
                                                border: `1px solid ${badge.border}`
                                            }}>
                                                <badge.icon style={{ width: 14, height: 14 }} /> {badge.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                            <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingBranch(branch); setShowModal(true); }} className="transition-colors border-none cursor-pointer" title="Edit Branch" style={{ backgroundColor: 'transparent', color: C.success }}><MdEdit style={{ width: 18, height: 18 }} /></button>
                                                <button onClick={() => handleDelete(branch._id)} className="transition-colors border-none cursor-pointer" title="Delete Branch" style={{ backgroundColor: 'transparent', color: C.textMuted }} onMouseEnter={e => e.currentTarget.style.color = C.danger} onMouseLeave={e => e.currentTarget.style.color = C.textMuted}><MdDelete style={{ width: 18, height: 18 }} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ backgroundColor: C.surfaceWhite, borderTop: `1px solid ${C.cardBorder}` }}>
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>Showing {paginated.length} of {filtered.length} Branches</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}>
                            <MdChevronLeft style={{ width: 20, height: 20 }} />
                        </button>
                        <button className="flex items-center justify-center border-none cursor-default"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}>
                            {currentPage}
                        </button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}>
                            <MdChevronRight style={{ width: 20, height: 20 }} />
                        </button>
                        <button className="flex items-center justify-center transition-colors cursor-pointer ml-2"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}>
                            <MdArticle style={{ width: 16, height: 16 }} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Bottom Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Left: Branch Overview */}
                <div className="flex flex-col p-4 sm:p-5 w-full" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Branch Overview</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Total\nBranches', value: stats.total, bg: C.btnViewAllBg, iconColor: C.btnPrimary, icon: MdBusiness },
                            { label: 'Active\nBranches', value: stats.active, bg: C.successBg, iconColor: C.success, icon: MdCheckCircle },
                            { label: 'Inactive\nBranches', value: stats.inactive, bg: C.warningBg, iconColor: C.warning, icon: MdErrorOutline },
                            { label: 'Pending\nApproval', value: stats.pending, bg: '#EFF6FF', iconColor: '#2563EB', icon: MdAccessTime },
                        ].map((s, i) => (
                            <div key={i} className="rounded-xl p-3 flex flex-col items-center justify-center text-center h-28"
                                style={{ backgroundColor: s.bg, border: `1px solid ${C.cardBorder}` }}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: '#ffffff', boxShadow: S.active }}>
                                    <s.icon style={{ width: 16, height: 16, color: s.iconColor }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, lineHeight: 1, marginBottom: 4 }}>{s.value}</span>
                                <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, whiteSpace: 'pre' }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Middle: All Branches + Categories */}
                <div className="flex flex-col gap-6 w-full">
                    {/* All Branches Table */}
                    <div className="flex flex-col p-4 sm:p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>All Branches</h3>
                        {branches.length === 0 ? (
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, fontWeight: T.weight.medium, margin: 0 }}>No branches added yet.</p>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                            <th style={{ paddingBottom: 8, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel }}>Branch Name</th>
                                            <th style={{ paddingBottom: 8, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textAlign: 'right' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {branches.slice(0, 6).map(b => {
                                            const badge = statusBadge(b.status);
                                            return (
                                                <tr key={b._id} style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                                    <td className="truncate max-w-[120px]" style={{ padding: '10px 0', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{b.campusName}</td>
                                                    <td style={{ padding: '10px 0', textAlign: 'right' }}>
                                                        <span style={{ backgroundColor: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', border: `1px solid ${badge.border}` }}>
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Branch Categories */}
                    <div className="flex flex-col p-4 sm:p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Branch Categories</h3>
                        {categoryBreakdown.length === 0 ? (
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, fontWeight: T.weight.medium, margin: 0 }}>No categories assigned yet.</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {categoryBreakdown.map((cat, i) => (
                                    <div key={cat.name} className="flex items-center gap-3">
                                        <div style={{ width: 12, height: 12, borderRadius: '4px', backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length], flexShrink: 0 }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, flex: 1 }}>{cat.name}</span>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.textMuted }}>({cat.count})</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Quick Actions & Notifications */}
                <div className="flex flex-col gap-6 w-full">
                    {/* Quick Actions */}
                    <div className="flex flex-col p-4 sm:p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Quick Actions</h3>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => { setEditingBranch(null); setShowModal(true); }}
                                className="w-full flex items-center gap-3 px-4 py-3 transition-colors border-none cursor-pointer group" style={{ backgroundColor: C.btnViewAllBg, borderRadius: '12px' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}>
                                <div className="w-8 h-8 rounded-full bg-[#ffffff] flex items-center justify-center shadow-sm">
                                    <MdAdd style={{ width: 18, height: 18, color: C.btnPrimary }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary }}>Add New Branch</span>
                            </button>
                            <button disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 transition-colors border-none cursor-pointer disabled:opacity-50" style={{ backgroundColor: C.warningBg, borderRadius: '12px' }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                                onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                                <div className="w-8 h-8 rounded-full bg-[#ffffff] flex items-center justify-center shadow-sm">
                                    {isImporting ? <MdHourglassEmpty style={{ width: 16, height: 16, color: C.warning }} className="animate-spin" /> : <MdCloudUpload style={{ width: 16, height: 16, color: C.warning }} />}
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.warning }}>{isImporting ? 'Importing...' : 'Import Branches'}</span>
                            </button>
                            <button onClick={handleDownloadReport} className="w-full flex items-center gap-3 px-4 py-3 transition-colors border-none cursor-pointer" style={{ backgroundColor: C.successBg, borderRadius: '12px' }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                                onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                                <div className="w-8 h-8 rounded-full bg-[#ffffff] flex items-center justify-center shadow-sm">
                                    <MdDownload style={{ width: 16, height: 16, color: C.success }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.success }}>Download Branch Report</span>
                            </button>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="flex flex-col p-4 sm:p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Notifications</h3>
                        <div className="flex flex-col gap-4">
                            {stats.pending > 0 && (
                                <>
                                    <div className="flex items-start justify-between gap-3">
                                        <MdNotifications style={{ width: 16, height: 16, color: C.btnPrimary, marginTop: 2, flexShrink: 0 }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, flex: 1, lineHeight: 1.4 }}>
                                            {stats.pending} branch{stats.pending > 1 ? 'es are' : ' is'} pending verification
                                        </span>
                                    </div>
                                    <hr style={{ borderTop: `1px solid ${C.cardBorder}`, margin: 0 }} />
                                </>
                            )}
                            {stats.inactive > 0 && (
                                <>
                                    <div className="flex items-start justify-between gap-3">
                                        <MdNotifications style={{ width: 16, height: 16, color: C.btnPrimary, marginTop: 2, flexShrink: 0 }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, flex: 1, lineHeight: 1.4 }}>
                                            {stats.inactive} branch{stats.inactive > 1 ? 'es have' : ' has'} inactive status
                                        </span>
                                    </div>
                                    <hr style={{ borderTop: `1px solid ${C.cardBorder}`, margin: 0 }} />
                                </>
                            )}
                            {stats.total === 0 && (
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.medium, margin: 0 }}>No notifications at this time.</p>
                            )}
                            {stats.total > 0 && (
                                <div className="flex items-start justify-between gap-3">
                                    <MdNotifications style={{ width: 16, height: 16, color: C.btnPrimary, marginTop: 2, flexShrink: 0 }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, flex: 1, lineHeight: 1.4 }}>
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
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleBulkImport} className="hidden" />

            {/* Floating Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-6 px-6 py-4 rounded-2xl shadow-2xl border transition-all duration-300 animate-in slide-in-from-bottom-5"
                     style={{
                         backgroundColor: 'rgba(39, 34, 91, 0.95)',
                         backdropFilter: 'blur(10px)',
                         borderColor: 'rgba(255, 255, 255, 0.1)',
                         boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
                         minWidth: '320px',
                         maxWidth: '90%',
                         width: 'max-content'
                     }}>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: C.btnPrimary, color: '#ffffff', fontSize: T.size.sm }}>
                            {selectedIds.length}
                        </div>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#ffffff' }}>
                            Branches Selected
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button onClick={() => handleBulkStatusChange('active')}
                                className="flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer border-none font-bold"
                                style={{ padding: '8px 16px', backgroundColor: C.successBg, color: C.success, borderRadius: '8px', fontSize: T.size.sm }}>
                            <MdCheckCircle style={{ width: 16, height: 16 }} /> Activate
                        </button>
                        <button onClick={() => handleBulkStatusChange('inactive')}
                                className="flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer border-none font-bold"
                                style={{ padding: '8px 16px', backgroundColor: C.warningBg, color: C.warning, borderRadius: '8px', fontSize: T.size.sm }}>
                            <MdHourglassEmpty style={{ width: 16, height: 16 }} /> Deactivate
                        </button>
                        <button onClick={handleBulkDelete}
                                className="flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer border-none font-bold"
                                style={{ padding: '8px 16px', backgroundColor: C.dangerBg, color: C.danger, borderRadius: '8px', fontSize: T.size.sm }}>
                            <MdDelete style={{ width: 16, height: 16 }} /> Delete
                        </button>
                        <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                        <button onClick={() => setSelectedIds([])}
                                className="transition-colors hover:text-white cursor-pointer border-none bg-transparent font-bold"
                                style={{ color: 'rgba(255,255,255,0.5)', fontSize: T.size.sm }}>
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}