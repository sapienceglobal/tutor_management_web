'use client';

import { useState, useEffect } from 'react';
import { Loader2, Trash2, Search, Plus, Edit, Tags, X, BookOpen } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';

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

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

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
            <div className="flex bg-[#F1EAFB] min-h-screen items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F1EAFB', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header & Toolbar Card ── */}
            <div className="bg-white rounded-3xl flex flex-col overflow-hidden mb-6" style={{ boxShadow: softShadow }}>
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4F0FD]">
                    <div>
                        <h1 className="text-[22px] font-black text-[#27225B] m-0">Category Management</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Organize and manage standard course categories</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#6B4DF1] text-white font-bold text-[14px] rounded-xl hover:bg-[#5839D6] transition-colors shadow-md border-none cursor-pointer"
                    >
                        <Plus size={18} strokeWidth={3} /> Add Category
                    </button>
                </div>
                
                <div className="px-6 py-4 bg-[#FAFAFA]">
                    <div className="relative w-full md:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D8DA6]" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] w-full placeholder-[#A0ABC0]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* ── Categories Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                        <div key={category._id} className="bg-white rounded-2xl p-6 flex flex-col hover:-translate-y-1 transition-all group relative border border-[#F4F0FD]" style={{ boxShadow: softShadow }}>
                            
                            {/* Card Header (Icon & Actions) */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-[12px] bg-[#F4F0FD] flex items-center justify-center text-[#6B4DF1] border border-[#E9DFFC]">
                                    <Tags size={20} strokeWidth={2.5} />
                                </div>
                                
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(category)}
                                        className="p-1.5 text-[#A0ABC0] hover:text-[#6B4DF1] hover:bg-[#F4F0FD] rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                        title="Edit Category"
                                    >
                                        <Edit size={16} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category._id)}
                                        className="p-1.5 text-[#A0ABC0] hover:text-[#E53E3E] hover:bg-[#FFF5F5] rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                        title="Delete Category"
                                    >
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>

                            {/* Card Body */}
                            <h3 className="font-black text-[#27225B] text-[16px] m-0 mb-2">{category.name}</h3>
                            <p className="text-[13px] font-medium text-[#7D8DA6] line-clamp-2 min-h-[40px] m-0 leading-relaxed">
                                {category.description || 'No description provided for this category.'}
                            </p>

                            {/* Card Footer */}
                            <div className="mt-5 pt-4 border-t border-[#F4F0FD] flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider flex items-center gap-1">
                                    <BookOpen size={12} /> {category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-16 text-center bg-white rounded-3xl" style={{ boxShadow: softShadow }}>
                        <Tags className="w-12 h-12 text-[#D1C4F9] mx-auto mb-3" />
                        <p className="text-[15px] font-bold text-[#7D8DA6] m-0">No categories found matching your search.</p>
                    </div>
                )}
            </div>

            {/* ── Add/Edit Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e103c]/40 backdrop-blur-md">
                    <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#D5C2F6]">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F4F0FD] bg-[#FDFBFF]">
                            <h2 className="text-[18px] font-black text-[#27225B] m-0">
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-[#A0ABC0] hover:text-[#FF6B6B] bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-[#FFF5F5] transition-colors"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[#FAFAFA]">
                            <div>
                                <label className="block text-[13px] font-bold text-[#27225B] mb-2">
                                    Category Name <span className="text-[#E53E3E]">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] outline-none focus:border-[#6B4DF1] focus:ring-1 focus:ring-[#6B4DF1] transition-all placeholder-[#A0ABC0]"
                                    placeholder="e.g. Web Development"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-[#27225B] mb-2">
                                    Description
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 bg-white border border-[#E9DFFC] rounded-xl text-[13px] font-medium text-[#27225B] outline-none focus:border-[#6B4DF1] focus:ring-1 focus:ring-[#6B4DF1] transition-all placeholder-[#A0ABC0] resize-none"
                                    placeholder="Brief description of this category..."
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            {/* Footer Buttons */}
                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-white border border-[#E9DFFC] text-[#7A6C9B] font-bold text-[13px] rounded-xl cursor-pointer hover:bg-[#F9F7FC] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-[#6B4DF1] hover:bg-[#5839D6] text-white rounded-xl transition-colors font-bold text-[13px] shadow-md border-none flex items-center gap-2 cursor-pointer disabled:opacity-70"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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