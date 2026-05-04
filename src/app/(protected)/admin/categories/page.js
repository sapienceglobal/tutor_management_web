'use client';

import { useState, useEffect } from 'react';
import { 
    MdSearch, 
    MdAdd, 
    MdEdit, 
    MdDelete, 
    MdClose, 
    MdLabel, 
    MdBook,
    MdHourglassEmpty,
    MdLabelOutline
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
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

const modalInputStyle = {
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

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { confirmDialog } = useConfirm();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', icon: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            if (res.data.success) {
                setCategories(res.data.categories || []);
            } else {
                // Mock fallback for UI testing if API is empty
                setCategories([
                    { _id: '1', name: 'Web Development', description: 'Learn to build modern websites and web apps using React, Node, and more.', slug: 'web-development' },
                    { _id: '2', name: 'Data Science', description: 'Master Python, Machine Learning, and Data Analytics.', slug: 'data-science' },
                    { _id: '3', name: 'Business Management', description: 'Courses on leadership, finance, and marketing strategies.', slug: 'business-management' },
                    { _id: '4', name: 'Graphic Design', description: 'UI/UX design, Illustrator, Photoshop, and creative arts.', slug: 'graphic-design' },
                ]);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirmDialog("Delete Category", "Are you sure you want to delete this category? This action cannot be undone.", { variant: 'destructive' });
        if (!isConfirmed) return;

        try {
            await api.delete(`/categories/${id}`);
            setCategories(categories.filter(c => c._id !== id));
            toast.success('Category deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete category');
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, description: category.description || '', icon: category.icon || '' });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '', icon: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingCategory) {
                const res = await api.patch(`/categories/${editingCategory._id}`, formData);
                setCategories(categories.map(c => c._id === editingCategory._id ? res.data.category : c));
                toast.success('Category updated successfully');
            } else {
                const res = await api.post('/categories', formData);
                setCategories([...categories, res.data.category]);
                toast.success('Category created successfully');
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Submit error:', error);
            toast.error(error.response?.data?.message || 'Failed to save category');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCategories = categories.filter(category =>
        category.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
            
            {/* ── Header & Toolbar Card ── */}
            <div className="flex flex-col overflow-hidden mb-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Category Management</h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: '4px 0 0 0' }}>Organize and manage standard course categories</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 transition-opacity hover:opacity-90 cursor-pointer w-full sm:w-auto justify-center"
                        style={{ padding: '10px 24px', background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}
                    >
                        <MdAdd style={{ width: 18, height: 18 }} /> Add Category
                    </button>
                </div>
                
                <div className="px-6 py-4" style={{ backgroundColor: C.innerBg }}>
                    <div className="relative w-full md:w-[400px] group">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" style={{ width: 18, height: 18, color: C.textMuted }} />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            style={{ ...baseInputStyle, paddingLeft: '36px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                            onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Categories Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                        <div key={category._id} className="flex flex-col transition-all group relative" 
                             style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}`, padding: 24 }}
                             onMouseEnter={e => e.currentTarget.style.boxShadow = S.cardHover}
                             onMouseLeave={e => e.currentTarget.style.boxShadow = S.card}>
                            
                            {/* Card Header (Icon & Actions) */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center justify-center shrink-0" 
                                     style={{ width: 48, height: 48, borderRadius: '10px', backgroundColor: C.iconBg }}>
                                    <MdLabel style={{ width: 24, height: 24, color: C.iconColor }} />
                                </div>
                                
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(category)}
                                        className="transition-colors cursor-pointer border-none"
                                        title="Edit Category"
                                        style={{ backgroundColor: 'transparent', padding: '6px', color: C.textMuted, borderRadius: '8px' }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.btnPrimary; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}
                                    >
                                        <MdEdit style={{ width: 18, height: 18 }} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category._id)}
                                        className="transition-colors cursor-pointer border-none"
                                        title="Delete Category"
                                        style={{ backgroundColor: 'transparent', padding: '6px', color: C.textMuted, borderRadius: '8px' }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.dangerBg; e.currentTarget.style.color = C.danger; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}
                                    >
                                        <MdDelete style={{ width: 18, height: 18 }} />
                                    </button>
                                </div>
                            </div>

                            {/* Card Body */}
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 8px 0' }}>{category.name}</h3>
                            <p className="line-clamp-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, minHeight: '40px', lineHeight: 1.6, margin: 0 }}>
                                {category.description || 'No description provided for this category.'}
                            </p>

                            {/* Card Footer */}
                            <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                    <MdBook style={{ width: 14, height: 14 }} /> {category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-16 text-center" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                        <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                            <MdLabelOutline style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>No categories found matching your search.</p>
                    </div>
                )}
            </div>

            {/* ── Add/Edit Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="animate-in fade-in zoom-in duration-200 w-full max-w-md overflow-hidden" 
                         style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-transparent border-none cursor-pointer transition-opacity hover:opacity-70"
                            >
                                <MdClose style={{ width: 20, height: 20, color: C.textMuted }} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 8 }}>
                                    Category Name <span style={{ color: C.danger }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={modalInputStyle}
                                    placeholder="e.g. Web Development"
                                    onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 8 }}>
                                    Description
                                </label>
                                <textarea
                                    style={{ ...modalInputStyle, resize: 'none' }}
                                    placeholder="Brief description of this category..."
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                                ></textarea>
                            </div>

                            {/* Footer Buttons */}
                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isSaving}
                                    className="transition-colors cursor-pointer"
                                    style={{ padding: '10px 24px', backgroundColor: C.btnViewAllBg, color: C.text, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 transition-colors border-none cursor-pointer disabled:opacity-70 shadow-md"
                                    style={{ padding: '10px 24px', backgroundColor: C.btnPrimary, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                >
                                    {isSaving && <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" />}
                                    {editingCategory ? 'Save Changes' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}