'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit2, Trash2, Globe, EyeOff, Loader2, LayoutTemplate, MoreHorizontal } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function CMSPages() {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPage, setEditingPage] = useState(null);
    const [formData, setFormData] = useState({
        title: '', slug: '', content: '', isPublished: true,
        seoMeta: { title: '', description: '', keywords: '' }
    });

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => { fetchPages(); }, []);

    const fetchPages = async () => {
        setLoading(true);
        try {
            const res = await api.get('/cms/pages');
            if (res.data.success) setPages(res.data.data);
        } catch (error) { toast.error('Failed to load pages'); } 
        finally { setLoading(false); }
    };

    const openModal = (page = null) => {
        if (page) {
            setEditingPage(page);
            setFormData({
                title: page.title, slug: page.slug, content: page.content,
                isPublished: page.isPublished, seoMeta: page.seoMeta || { title: '', description: '', keywords: '' }
            });
        } else {
            setEditingPage(null);
            setFormData({ title: '', slug: '', content: '', isPublished: true, seoMeta: { title: '', description: '', keywords: '' } });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingPage) {
                const res = await api.put(`/cms/pages/${editingPage._id}`, formData);
                if (res.data.success) {
                    setPages(pages.map(p => p._id === editingPage._id ? res.data.data : p));
                    toast.success('Page updated successfully');
                }
            } else {
                const res = await api.post('/cms/pages', formData);
                if (res.data.success) {
                    setPages([res.data.data, ...pages]);
                    toast.success('New page created');
                }
            }
            setIsModalOpen(false);
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to save page'); } 
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('🚨 Are you sure you want to permanently delete this page?')) return;
        try {
            await api.delete(`/cms/pages/${id}`);
            setPages(pages.filter(p => p._id !== id));
            toast.success('Page deleted');
        } catch (error) { toast.error('Failed to delete page'); }
    };

    const togglePublish = async (page) => {
        try {
            const res = await api.put(`/cms/pages/${page._id}`, { isPublished: !page.isPublished });
            if (res.data.success) {
                setPages(pages.map(p => p._id === page._id ? res.data.data : p));
                toast.success(`Page ${!page.isPublished ? 'Published' : 'Hidden'}`);
            }
        } catch (error) { toast.error('Failed to update status'); }
    };

    const filteredPages = pages.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#F4EEFD]"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>;

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[24px] font-black text-[#27225B] m-0">Dynamic Pages</h1>
                    <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Manage static content pages like About Us, Privacy Policy, Terms, etc.</p>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-3 bg-[#6B4DF1] text-white font-bold text-[14px] rounded-xl hover:bg-[#5839D6] transition-all shadow-[0_4px_14px_rgba(107,77,241,0.3)] border-none cursor-pointer">
                    <Plus size={18} strokeWidth={3} /> Create New Page
                </button>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                <div className="relative w-full md:w-[400px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                    <input
                        type="text" placeholder="Search pages by title or slug..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0]"
                    />
                </div>
            </div>

            {/* ── Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPages.map(page => (
                    <div key={page._id} className="bg-white rounded-[24px] border border-[#E9DFFC]/50 overflow-hidden hover:-translate-y-1 transition-transform flex flex-col group p-6" style={{ boxShadow: softShadow }}>
                        
                        <div className="flex items-start justify-between mb-5">
                            <div className="w-14 h-14 bg-[#F9F7FC] rounded-[16px] flex items-center justify-center text-[#6B4DF1] border border-[#E9DFFC]">
                                <LayoutTemplate size={24} strokeWidth={2} />
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${page.isPublished ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F1F5F9] text-[#718096]'}`}>
                                    {page.isPublished ? <Globe size={10} /> : <EyeOff size={10} />}
                                    {page.isPublished ? 'Live' : 'Draft'}
                                </span>
                                <button onClick={() => togglePublish(page)} className="text-[11px] font-bold text-[#A0ABC0] hover:text-[#6B4DF1] bg-transparent border-none cursor-pointer underline underline-offset-2">Toggle Visibility</button>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="font-black text-[18px] text-[#27225B] mb-1.5 leading-snug">{page.title}</h3>
                            <div className="inline-flex items-center text-[12px] font-bold text-[#6B4DF1] bg-[#F4F0FD] px-2 py-1 rounded-md border border-[#E9DFFC] font-mono mb-6">
                                /{page.slug}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-5 border-t border-[#F4F0FD]">
                            <button onClick={() => openModal(page)} className="flex-1 py-2.5 bg-[#F9F7FC] text-[#6B4DF1] rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#F4F0FD] transition-colors border-none cursor-pointer">
                                <Edit2 size={14} /> Edit Page
                            </button>
                            <button onClick={() => handleDelete(page._id)} className="w-12 bg-white border border-[#E9DFFC] text-[#A0ABC0] rounded-xl flex items-center justify-center hover:bg-[#FEE2E2] hover:text-[#E53E3E] transition-colors cursor-pointer shrink-0">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                
                {filteredPages.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-[#D5C2F6] rounded-[24px] bg-white/40">
                        <LayoutTemplate className="w-12 h-12 text-[#D1C4F9] mb-4" />
                        <h3 className="text-[18px] font-black text-[#27225B] m-0">No pages found</h3>
                        <p className="text-[13px] text-[#7D8DA6] mt-1">Create pages like "About Us" or "Privacy Policy" to display on the frontend.</p>
                    </div>
                )}
            </div>

            {/* ── Editor Modal ── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
                    <div className="bg-white rounded-[32px] overflow-hidden flex flex-col">
                        <div className="bg-[#27225B] p-8 text-white relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B4DF1] rounded-full mix-blend-screen filter blur-[60px] opacity-40"></div>
                            <DialogHeader className="relative z-10 text-left">
                                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 border border-white/20">
                                    <FileText className="text-[#E9DFFC] w-5 h-5" />
                                </div>
                                <DialogTitle className="text-[22px] font-black text-white m-0">{editingPage ? 'Edit Page Details' : 'Create Custom Page'}</DialogTitle>
                                <DialogDescription className="text-[#A0ABC0] text-[13px] font-medium m-0 mt-1">Design layout using HTML/Markdown structure.</DialogDescription>
                            </DialogHeader>
                        </div>
                        
                        <div className="p-8">
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide mb-1.5 block">Page Title <span className="text-red-500">*</span></label>
                                        <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-3.5 rounded-xl font-semibold text-[#27225B] text-[14px] outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all" placeholder="e.g. Terms of Service" />
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide mb-1.5 block">URL Slug <span className="text-red-500">*</span></label>
                                        <input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-3.5 rounded-xl font-semibold text-[#6B4DF1] text-[14px] outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all" placeholder="terms-of-service" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide mb-1.5 block">Raw Content (HTML) <span className="text-red-500">*</span></label>
                                    <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-4 rounded-xl font-mono text-[#27225B] text-[13px] outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all min-h-[300px] resize-y leading-relaxed" placeholder="<div><h2>Privacy Policy</h2><p>...</p></div>"></textarea>
                                </div>

                                <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                                    <h4 className="text-[13px] font-black text-gray-700 mb-2">SEO Configurations</h4>
                                    <div>
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Meta Title</label>
                                        <input value={formData.seoMeta.title} onChange={e => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, title: e.target.value } })} className="w-full bg-white border border-gray-200 p-2.5 rounded-lg font-semibold text-gray-700 text-[13px] outline-none focus:ring-2 focus:ring-[#6B4DF1]" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Meta Description</label>
                                        <textarea value={formData.seoMeta.description} onChange={e => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, description: e.target.value } })} className="w-full bg-white border border-gray-200 p-2.5 rounded-lg font-semibold text-gray-700 text-[13px] outline-none focus:ring-2 focus:ring-[#6B4DF1] min-h-[60px]"></textarea>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Keywords</label>
                                        <input value={formData.seoMeta.keywords} onChange={e => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, keywords: e.target.value } })} className="w-full bg-white border border-gray-200 p-2.5 rounded-lg font-semibold text-gray-700 text-[13px] outline-none focus:ring-2 focus:ring-[#6B4DF1]" placeholder="privacy, terms, about" />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white border border-[#E9DFFC] text-[#7D8DA6] font-bold text-[13px] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-8 py-3 bg-[#6B4DF1] text-white font-bold text-[13px] rounded-xl hover:bg-[#5839D6] transition-colors border-none shadow-md disabled:opacity-50 cursor-pointer">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutTemplate size={16} />}
                                        {editingPage ? 'Update Page' : 'Create Page'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}