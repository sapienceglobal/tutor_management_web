'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    MdMenuBook, 
    MdCheckCircle, 
    MdWarning, 
    MdBlock, 
    MdSearch, 
    MdFilterList, 
    MdAdd, 
    MdVisibility, 
    MdCancel, 
    MdDelete, 
    MdViewModule, 
    MdAccessTime, 
    MdCloudUpload, 
    MdDownload, 
    MdChevronLeft, 
    MdChevronRight
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import Link from 'next/link';
import AddCourseWizardModal from '@/components/admin/AddCourseWizardModal';
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

export default function AdminCoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [tutorsList, setTutorsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const { confirmDialog } = useConfirm();

    const [categories, setCategories] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSelectAll = () => {
        if (selectedIds.length === filteredCourses.length && filteredCourses.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredCourses.map(c => c._id));
        }
    };

    const handleSelectCard = (id, e) => {
        e.stopPropagation();
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        const isConfirmed = await confirmDialog("Bulk Delete Courses", `Are you sure you want to delete the ${selectedIds.length} selected courses? This action is permanent.`, { variant: 'destructive' });
        if (!isConfirmed) return;
        
        try {
            await Promise.all(selectedIds.map(id => api.delete(`/admin/courses/${id}`)));
            toast.success('Selected courses deleted successfully');
            setCourses(prev => prev.filter(c => !selectedIds.includes(c._id)));
            setSelectedIds([]);
        } catch (error) {
            toast.error('Failed to delete some courses');
            fetchCourses();
        }
    };

    const handleBulkStatusChange = async (newStatus) => {
        const actionMap = { 'published': 'Publish', 'suspended': 'Suspend', 'rejected': 'Reject' };
        const action = actionMap[newStatus] || newStatus;
        const isConfirmed = await confirmDialog(`Bulk ${action} Courses`, `Are you sure you want to ${action.toLowerCase()} the ${selectedIds.length} selected courses?`, { variant: newStatus === 'published' ? 'default' : 'destructive' });
        if (!isConfirmed) return;

        try {
            await Promise.all(selectedIds.map(id => api.put(`/admin/courses/${id}/status`, { status: newStatus })));
            toast.success(`Selected courses updated successfully`);
            setCourses(prev => prev.map(c => selectedIds.includes(c._id) ? { ...c, status: newStatus } : c));
            setSelectedIds([]);
        } catch (error) {
            toast.error(`Failed to update status`);
            fetchCourses();
        }
    };

    const handleBulkImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isConfirmed = await confirmDialog("Bulk Import", `Are you sure you want to import courses from ${file.name}?`);
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
                if (rows.length < 2) throw new Error("CSV file must contain a header row and at least one course data row.");

                const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, '').replace(/""/g, '"'));
                const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('name'));
                const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('description'));
                const catIdx = headers.findIndex(h => h.includes('category'));
                const tutorIdx = headers.findIndex(h => h.includes('tutor') || h.includes('instructor'));
                const priceIdx = headers.findIndex(h => h.includes('price'));
                const levelIdx = headers.findIndex(h => h.includes('level'));
                const durationIdx = headers.findIndex(h => h.includes('duration'));
                const langIdx = headers.findIndex(h => h.includes('lang') || h.includes('language'));
                const statusIdx = headers.findIndex(h => h.includes('status'));

                if (titleIdx === -1 || descIdx === -1 || catIdx === -1) {
                    throw new Error("CSV must contain 'Title', 'Description', and 'Category' columns.");
                }

                let successCount = 0;
                let failCount = 0;
                let skipCount = 0;
                let currentCategories = [...categories];

                for (let i = 1; i < rows.length; i++) {
                    const columns = rows[i].split(',').map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                    const title = columns[titleIdx];
                    const description = columns[descIdx];
                    const categoryName = columns[catIdx];

                    if (!title || !description || !categoryName) continue;

                    // Duplicate check
                    const courseExists = courses.some(c => c.title?.toLowerCase() === title.toLowerCase());
                    if (courseExists) {
                        skipCount++;
                        continue;
                    }

                    let categoryId = '';
                    let foundCat = currentCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
                    if (foundCat) {
                        categoryId = foundCat._id;
                    } else {
                        try {
                            const newCatRes = await api.post('/categories', { name: categoryName });
                            if (newCatRes.data?.success) {
                                const newCat = newCatRes.data.category || newCatRes.data.data;
                                categoryId = newCat._id;
                                currentCategories.push(newCat);
                                setCategories([...currentCategories]);
                            }
                        } catch (catErr) {
                            console.error("Failed to create category during import", catErr);
                        }
                    }

                    if (!categoryId && currentCategories.length > 0) {
                        categoryId = currentCategories[0]._id;
                    }

                    const tutorVal = tutorIdx !== -1 ? columns[tutorIdx] : '';
                    let tutorId = '';
                    if (tutorVal) {
                        const foundTutor = tutorsList.find(t => 
                            t.email?.toLowerCase() === tutorVal.toLowerCase() ||
                            t.name?.toLowerCase() === tutorVal.toLowerCase() ||
                            t._id === tutorVal
                        );
                        if (foundTutor) {
                            tutorId = foundTutor._id;
                        }
                    }
                    if (!tutorId && tutorsList.length > 0) {
                        tutorId = tutorsList[0]._id;
                    }

                    const payload = {
                        title,
                        description,
                        categoryId,
                        tutorId,
                        price: priceIdx !== -1 && !isNaN(columns[priceIdx]) ? Number(columns[priceIdx]) : 0,
                        level: levelIdx !== -1 ? columns[levelIdx].toLowerCase() : 'beginner',
                        duration: durationIdx !== -1 && !isNaN(columns[durationIdx]) ? Number(columns[durationIdx]) : 0,
                        language: langIdx !== -1 ? columns[langIdx] : 'English',
                        status: statusIdx !== -1 ? columns[statusIdx].toLowerCase() : 'published'
                    };

                    try {
                        await api.post('/admin/courses', payload);
                        successCount++;
                    } catch (err) {
                        console.error('Course create failed in bulk import:', err);
                        failCount++;
                    }
                }

                toast.success(`Bulk import completed: ${successCount} successful, ${skipCount} skipped (already exists), ${failCount} failed.`);
                fetchCourses();
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
        if (filteredCourses.length === 0) {
            toast.error("No course data available to export");
            return;
        }

        const headers = ["ID", "Title", "Description", "Category", "Tutor Name", "Price", "Level", "Duration (Hrs)", "Language", "Status", "Modules Count", "Enrolled Count", "Rating"];
        const csvRows = [headers.join(",")];

        for (const course of filteredCourses) {
            const rowData = [
                course._id,
                course.title,
                course.description,
                course.categoryId?.name || course.category || "N/A",
                course.tutorId?.name || "N/A",
                course.price || 0,
                course.level || "beginner",
                course.duration || 0,
                course.language || "English",
                course.status || "draft",
                course.modules?.length || 0,
                course.enrolledCount || 0,
                course.rating || 0
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
        link.setAttribute("download", `courses_report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Course report downloaded successfully!");
    };

    useEffect(() => {
        fetchCourses();
        fetchTutors();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            if (res.data?.success) {
                setCategories(res.data.categories || res.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const fetchTutors = async () => {
        try {
            const res = await api.get('/admin/tutors');
            if (res.data?.success) setTutorsList(res.data.tutors || []);
        } catch (error) {
            console.error('Failed to fetch tutors', error);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get('/admin/courses');
            if (res.data.success) {
                setCourses(res.data.courses);
                setStats(res.data.stats || null);
                setRecentActivities(res.data.recentActivities || []);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSubmit = async (formData) => {
        if (editingCourse) {
            await api.put(`/admin/courses/${editingCourse._id}`, formData);
        } else {
            await api.post('/admin/courses', formData);
        }
        await fetchCourses(); 
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirmDialog("Delete Course", "Are you sure you want to delete this course? This action cannot be undone.", { variant: 'destructive' });
        if (!isConfirmed) return;

        try {
            await api.delete(`/admin/courses/${id}`);
            setCourses(courses.filter(c => c._id !== id));
            toast.success('Course deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete course');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        const actionMap = { 'published': 'Approve', 'rejected': 'Reject', 'suspended': 'Suspend' };
        const actionName = actionMap[newStatus] || newStatus;

        const isConfirmed = await confirmDialog(`${actionName} Course`, `Are you sure you want to ${actionName.toLowerCase()} this course?`, { variant: newStatus === 'rejected' || newStatus === 'suspended' ? 'destructive' : 'default' });
        if (!isConfirmed) return;

        try {
            const res = await api.put(`/admin/courses/${id}/status`, { status: newStatus });
            if (res.data.success) {
                setCourses(courses.map(c => c._id === id ? { ...c, status: newStatus } : c));
                toast.success(`Course ${actionName.toLowerCase()}ed successfully`);
            }
        } catch (error) {
            console.error('Status update error:', error);
            toast.error(`Failed to update course status`);
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (course.tutorId && course.tutorId.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!matchesSearch) return false;

        if (categoryFilter) {
            const courseCat = course.categoryId?.name || course.category || '';
            if (courseCat.toLowerCase() !== categoryFilter.toLowerCase()) return false;
        }

        if (statusFilter) {
            const courseStatus = course.status || 'draft';
            if (courseStatus.toLowerCase() !== statusFilter.toLowerCase()) return false;
        }

        return true;
    });

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
                    icon={MdMenuBook}
                    value={stats?.total || 0}
                    label="Total Courses"
                    iconBg={C.btnViewAllBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard 
                    icon={MdCheckCircle}
                    value={stats?.published || 0}
                    label="Published Courses"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
                <StatCard 
                    icon={MdWarning}
                    value={stats?.draft || 0}
                    label="Draft Courses"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
                <StatCard 
                    icon={MdBlock}
                    value={stats?.inactive || 0}
                    label="Inactive Courses"
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
                        placeholder="Search courses..."
                        style={{ ...baseInputStyle, paddingLeft: '36px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <select 
                        value={categoryFilter} 
                        onChange={(e) => setCategoryFilter(e.target.value)} 
                        style={{ ...baseInputStyle, width: 'auto', minWidth: '160px', cursor: 'pointer' }}
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c._id || c} value={c.name || c}>{c.name || c}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ ...baseInputStyle, width: 'auto', minWidth: '130px', cursor: 'pointer' }}
                    >
                        <option value="">All Statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button className="flex items-center justify-center transition-colors cursor-pointer border-none"
                        style={{ width: 44, height: 44, backgroundColor: C.btnViewAllBg, color: C.btnPrimary, borderRadius: '10px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}>
                        <MdFilterList style={{ width: 20, height: 20 }} />
                    </button>
                    <button 
                        onClick={handleSelectAll}
                        className="flex items-center justify-center transition-colors cursor-pointer border font-bold"
                        style={{ 
                            height: 44, 
                            padding: '0 16px',
                            backgroundColor: selectedIds.length === filteredCourses.length && filteredCourses.length > 0 ? C.btnPrimary : C.surfaceWhite, 
                            color: selectedIds.length === filteredCourses.length && filteredCourses.length > 0 ? '#ffffff' : C.text, 
                            borderColor: C.cardBorder,
                            borderRadius: '10px',
                            fontFamily: T.fontFamily,
                            fontSize: T.size.sm
                        }}
                    >
                        {selectedIds.length === filteredCourses.length && filteredCourses.length > 0 ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                        onClick={() => { setEditingCourse(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 transition-opacity hover:opacity-90 cursor-pointer w-full sm:w-auto justify-center"
                        style={{ padding: '10px 20px', background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}
                    >
                        <MdAdd style={{ width: 18, height: 18 }} /> Add Course
                    </button>
                </div>
            </div>

            {/* ── Course Grid (Cards) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                        <div key={course._id} className="flex flex-col group relative transition-all overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}
                             onMouseEnter={e => e.currentTarget.style.boxShadow = S.cardHover}
                             onMouseLeave={e => e.currentTarget.style.boxShadow = S.card}>
                            
                            {/* Checkbox Overlay */}
                            <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                                <input 
                                    type="checkbox"
                                    checked={selectedIds.includes(course._id)}
                                    onChange={(e) => handleSelectCard(course._id, e)}
                                    style={{ 
                                        width: 18, 
                                        height: 18, 
                                        accentColor: C.btnPrimary, 
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                />
                            </div>

                            {/* Thumbnail & Hover Overlay */}
                            <div className="h-[130px] relative overflow-hidden shrink-0" style={{ backgroundColor: C.innerBg }}>
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Course Thumbnail" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ color: C.btnPrimary }}>
                                        <MdMenuBook style={{ width: 40, height: 40, opacity: 0.5 }} />
                                    </div>
                                )}
                                
                                {/* Admin Action Overlay (Visible on Hover) */}
                                <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-4" style={{ backgroundColor: 'rgba(21, 22, 86, 0.8)' }}>
                                    <button onClick={() => { setEditingCourse(course); setIsModalOpen(true); }} className="rounded-full flex items-center justify-center transition-transform hover:scale-110 border-none cursor-pointer" title="Edit Details" style={{ width: 32, height: 32, backgroundColor: '#ffffff', color: C.btnPrimary }}>
                                        <MdVisibility style={{ width: 16, height: 16 }} />
                                    </button>

                                    {(course.status === 'pending' || course.status === 'suspended' || course.status === 'rejected') && (
                                        <button onClick={() => handleStatusChange(course._id, 'published')} className="rounded-full flex items-center justify-center transition-transform hover:scale-110 border-none cursor-pointer" title="Approve & Publish" style={{ width: 32, height: 32, backgroundColor: C.success, color: '#ffffff' }}>
                                            <MdCheckCircle style={{ width: 16, height: 16 }} />
                                        </button>
                                    )}

                                    {(course.status === 'pending' || course.status === 'published') && (
                                        <button onClick={() => handleStatusChange(course._id, 'rejected')} className="rounded-full flex items-center justify-center transition-transform hover:scale-110 border-none cursor-pointer" title="Reject Course" style={{ width: 32, height: 32, backgroundColor: C.warning, color: '#ffffff' }}>
                                            <MdCancel style={{ width: 16, height: 16 }} />
                                        </button>
                                    )}

                                    {course.status === 'published' && (
                                        <button onClick={() => handleStatusChange(course._id, 'suspended')} className="rounded-full flex items-center justify-center transition-transform hover:scale-110 border-none cursor-pointer" title="Suspend Course" style={{ width: 32, height: 32, backgroundColor: C.danger, color: '#ffffff' }}>
                                            <MdBlock style={{ width: 16, height: 16 }} />
                                        </button>
                                    )}

                                    <button onClick={() => handleDelete(course._id)} className="rounded-full flex items-center justify-center transition-transform hover:scale-110 border-none cursor-pointer" title="Delete Course" style={{ width: 32, height: 32, backgroundColor: '#ffffff', color: C.danger }}>
                                        <MdDelete style={{ width: 16, height: 16 }} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="line-clamp-1 truncate" title={course.title} style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 8px 0' }}>
                                    {course.title}
                                </h3>
                                
                                <div className="flex items-center justify-between mb-4">
                                    <span className="truncate max-w-[60%]" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted }}>
                                        {course.categoryId?.name || course.category || 'Computer Science'}
                                    </span>
                                    <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '6px', 
                                        fontFamily: T.fontFamily, 
                                        fontSize: '10px', 
                                        fontWeight: T.weight.bold, 
                                        textTransform: 'uppercase', 
                                        letterSpacing: T.tracking.wider,
                                        backgroundColor: course.status === 'published' ? C.successBg : course.status === 'draft' ? C.btnViewAllBg : C.warningBg,
                                        color: course.status === 'published' ? C.success : course.status === 'draft' ? C.btnPrimary : C.warning
                                    }}>
                                        {course.status || 'Draft'}
                                    </span>
                                </div>

                                {/* Footer Stats */}
                                <div className="mt-auto pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                    <div className="flex items-center gap-1.5" style={{ color: C.textMuted }}>
                                        <MdViewModule style={{ width: 14, height: 14 }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>{course.modules?.length || Math.floor(Math.random() * 20) + 5} Modules</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" style={{ color: C.textMuted }}>
                                        <MdAccessTime style={{ width: 14, height: 14 }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>{course.duration || Math.floor(Math.random() * 60) + 10} Mins</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center flex flex-col items-center justify-center" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                        <MdMenuBook style={{ width: 48, height: 48, color: C.btnPrimary, opacity: 0.3, marginBottom: 12 }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>No courses found matching your search.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {filteredCourses.length > 0 && (
                <div className="flex items-center justify-between">
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>
                        Showing 1 to {filteredCourses.length} of {courses.length} courses
                    </span>
                    <div className="flex items-center gap-2">
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted, marginRight: 8 }}>Rows per page: 10 ▾</span>
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
            )}

            {/* ── Bottom Widgets Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Quick Actions */}
                <div className="flex flex-col p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Quick Actions</h3>
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
                        <button disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 transition-opacity border-none cursor-pointer group disabled:opacity-50" style={{ padding: '12px 16px', backgroundColor: C.warningBg, borderRadius: '10px' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                            onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                            {isImporting ? <MdHourglassEmpty style={{ width: 18, height: 18, color: C.warning }} className="animate-spin" /> : <MdCloudUpload style={{ width: 18, height: 18, color: C.warning }} />}
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.warning }}>{isImporting ? 'Importing...' : 'Bulk Import'}</span>
                        </button>
                        <button onClick={handleDownloadReport} className="flex-1 flex items-center justify-center gap-2 transition-opacity border-none cursor-pointer group" style={{ padding: '12px 16px', backgroundColor: C.successBg, borderRadius: '10px' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                            onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                            <MdDownload style={{ width: 18, height: 18, color: C.success }} />
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.success }}>Download Report</span>
                        </button>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="flex flex-col p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Recent Activities</h3>
                    <div className="flex flex-col gap-3">
                        {recentActivities.map((activity, idx) => (
                            <div key={activity.id || idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: activity.action === 'published' ? C.successBg : C.btnViewAllBg, color: activity.action === 'published' ? C.success : C.btnPrimary }}>
                                        {activity.action === 'published' ? <MdCheckCircle style={{ width: 16, height: 16 }}/> : <MdAdd style={{ width: 16, height: 16 }}/>}
                                    </div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, margin: 0, lineHeight: 1.3 }}>
                                        <span style={{ fontWeight: T.weight.bold, color: C.heading, maxWidth: '120px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom' }}>
                                            {activity.title}
                                        </span> {activity.action}
                                    </p>
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted }}>Recently</span>
                            </div>
                        ))}
                        {recentActivities.length === 0 && (
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>No recent course activities.</p>
                        )}
                    </div>
                </div>

                {/* Notifications */}
                <div className="flex flex-col p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Notifications</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-3" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <div className="flex items-center gap-3 min-w-0">
                                <MdWarning style={{ width: 16, height: 16, color: C.btnPrimary, shrink: 0 }} />
                                <span className="truncate max-w-[200px]" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{stats?.pending || 0} courses pending approval</span>
                            </div>
                            <Link href="#" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, textDecoration: 'none', marginLeft: 8, shrink: 0 }}>Review</Link>
                        </div>
                        <div className="flex items-center justify-between p-3" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <div className="flex items-center gap-3 min-w-0">
                                <MdBlock style={{ width: 16, height: 16, color: C.btnPrimary, shrink: 0 }} />
                                <span className="truncate max-w-[200px]" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{stats?.inactive || 0} inactive courses</span>
                            </div>
                            <Link href="#" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, textDecoration: 'none', marginLeft: 8, shrink: 0 }}>View</Link>
                        </div>
                    </div>
                </div>

            </div>

            <AddCourseWizardModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingCourse(null); }}
                onSubmit={handleCourseSubmit}
                course={editingCourse}
                tutorsList={tutorsList}
            />
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
                            Courses Selected
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button onClick={() => handleBulkStatusChange('published')}
                                className="flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer border-none font-bold"
                                style={{ padding: '8px 16px', backgroundColor: C.successBg, color: C.success, borderRadius: '8px', fontSize: T.size.sm }}>
                            <MdCheckCircle style={{ width: 16, height: 16 }} /> Publish
                        </button>
                        <button onClick={() => handleBulkStatusChange('suspended')}
                                className="flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer border-none font-bold"
                                style={{ padding: '8px 16px', backgroundColor: C.warningBg, color: C.warning, borderRadius: '8px', fontSize: T.size.sm }}>
                            <MdBlock style={{ width: 16, height: 16 }} /> Suspend
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