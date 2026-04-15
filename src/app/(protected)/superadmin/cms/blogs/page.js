'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit2, Trash2, Globe, EyeOff, Loader2, Image as ImageIcon, Clock, CalendarDays, Tag, MoreHorizontal, LayoutTemplate } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function CMSBlogs() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [formData, setFormData] = useState({
        title: '', slug: '', excerpt: '', content: '', thumbnail: '',
        isPublished: true, tags: '', scheduledPublishAt: '', category: 'General',
        seoMeta: { title: '', description: '', keywords: '' }
    });

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => { fetchBlogs(); }, []);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/cms/blogs');
            if (res.data.success) {
                setBlogs(res.data.data);
                if (res.data.categories) setCategories(res.data.categories);
            }
        } catch (error) { toast.error('Failed to load blogs'); } 
        finally { setLoading(false); }
    };

    const openModal = (blog = null) => {
        if (blog) {
            setEditingBlog(blog);
            setFormData({
                title: blog.title, slug: blog.slug, excerpt: blog.excerpt, content: blog.content,
                thumbnail: blog.thumbnail, isPublished: blog.isPublished, tags: (blog.tags || []).join(', '),
                scheduledPublishAt: blog.scheduledPublishAt ? new Date(blog.scheduledPublishAt).toISOString().slice(0, 16) : '',
                category: blog.category || 'General', seoMeta: blog.seoMeta || { title: '', description: '', keywords: '' }
            });
        } else {
            setEditingBlog(null);
            setFormData({
                title: '', slug: '', excerpt: '', content: '', thumbnail: '', isPublished: true,
                tags: '', scheduledPublishAt: '', category: 'General', seoMeta: { title: '', description: '', keywords: '' }
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const payload = {
            ...formData,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            scheduledPublishAt: formData.scheduledPublishAt || null,
        };

        try {
            if (editingBlog) {
                const res = await api.put(`/cms/blogs/${editingBlog._id}`, payload);
                if (res.data.success) {
                    setBlogs(blogs.map(b => b._id === editingBlog._id ? res.data.data : b));
                    toast.success('Blog updated successfully');
                }
            } else {
                const res = await api.post('/cms/blogs', payload);
                if (res.data.success) {
                    setBlogs([res.data.data, ...blogs]);
                    toast.success('New blog published');
                }
            }
            setIsModalOpen(false);
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to save blog'); } 
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('🚨 Are you sure you want to delete this blog post?')) return;
        try {
            await api.delete(`/cms/blogs/${id}`);
            setBlogs(blogs.filter(b => b._id !== id));
            toast.success('Blog deleted permanently');
        } catch (error) { toast.error('Failed to delete blog'); }
    };

    const togglePublish = async (blog) => {
        try {
            const res = await api.put(`/cms/blogs/${blog._id}`, { isPublished: !blog.isPublished });
            if (res.data.success) {
                setBlogs(blogs.map(b => b._id === blog._id ? res.data.data : b));
                toast.success(`Blog ${!blog.isPublished ? 'Published' : 'Moved to Drafts'}`);
            }
        } catch (error) { toast.error('Failed to update status'); }
    };

    const filteredBlogs = blogs.filter(b => {
        const matchSearch = b.title.toLowerCase().includes(search.toLowerCase());
        const matchCategory = selectedCategory === 'All' || b.category === selectedCategory;
        return matchSearch && matchCategory;
    });

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#F4EEFD]"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>;

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[24px] font-black text-[#27225B] m-0">Blog Manager</h1>
                    <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Write, schedule, and manage articles and announcements.</p>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-3 bg-[#6B4DF1] text-white font-bold text-[14px] rounded-xl hover:bg-[#5839D6] transition-all shadow-[0_4px_14px_rgba(107,77,241,0.3)] border-none cursor-pointer">
                    <Plus size={18} strokeWidth={3} /> Write New Blog
                </button>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
                    <button onClick={() => setSelectedCategory('All')} className={`px-4 py-2 rounded-lg text-[13px] font-bold whitespace-nowrap border-none cursor-pointer transition-colors ${selectedCategory === 'All' ? 'bg-[#F4F0FD] text-[#6B4DF1]' : 'bg-transparent text-[#7D8DA6] hover:bg-gray-50'}`}>All Categories</button>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg text-[13px] font-bold whitespace-nowrap border-none cursor-pointer transition-colors ${selectedCategory === cat ? 'bg-[#F4F0FD] text-[#6B4DF1]' : 'bg-transparent text-[#7D8DA6] hover:bg-gray-50'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative w-full xl:w-[350px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                    <input
                        type="text" placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0]"
                    />
                </div>
            </div>

            {/* ── Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBlogs.map(blog => (
                    <div key={blog._id} className="bg-white rounded-[24px] border border-[#E9DFFC]/50 overflow-hidden hover:-translate-y-1 transition-transform flex flex-col group" style={{ boxShadow: softShadow }}>
                        
                        {/* Thumbnail Container */}
                        <div className="h-44 w-full bg-[#F4F0FD] relative overflow-hidden border-b border-[#E9DFFC]">
                            {blog.thumbnail ? (
                                <img src={blog.thumbnail} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full text-[#D1C4F9]">
                                    <ImageIcon size={48} strokeWidth={1.5} />
                                </div>
                            )}
                            
                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex gap-2">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${blog.isPublished ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-slate-800 text-white'}`}>
                                    {blog.isPublished ? <Globe size={10} /> : <EyeOff size={10} />}
                                    {blog.isPublished ? 'Published' : 'Draft'}
                                </span>
                            </div>
                            <button onClick={() => togglePublish(blog)} className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/80 backdrop-blur-sm text-[#27225B] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white border-none cursor-pointer shadow-sm" title="Toggle Visibility">
                                <MoreHorizontal size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col">
                            <span className="text-[10px] font-bold text-[#6B4DF1] uppercase tracking-wider mb-2">{blog.category || 'General'}</span>
                            <h3 className="font-black text-[16px] text-[#27225B] mb-2 line-clamp-2 leading-snug">{blog.title}</h3>
                            <p className="text-[13px] font-medium text-[#7D8DA6] mb-4 line-clamp-2 flex-1">{blog.excerpt}</p>

                            {/* Meta */}
                            <div className="flex flex-col gap-2 pt-4 border-t border-[#F4F0FD]">
                                <div className="flex items-center justify-between text-[11px] font-bold text-[#A0ABC0]">
                                    <span className="flex items-center gap-1"><CalendarDays size={12}/> {new Date(blog.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <span>{blog.author?.name || 'Admin'}</span>
                                </div>
                                {blog.status === 'scheduled' && (
                                    <span className="px-2 py-1 bg-[#FFF7ED] text-[#EA580C] rounded-md flex items-center gap-1 text-[10px] font-black uppercase w-max">
                                        <Clock size={10} /> Scheduled: {new Date(blog.scheduledPublishAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-[#F4F0FD]">
                                <button onClick={() => openModal(blog)} className="flex-1 py-2 bg-[#F9F7FC] text-[#6B4DF1] rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#F4F0FD] transition-colors border-none cursor-pointer">
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button onClick={() => handleDelete(blog._id)} className="w-10 bg-white border border-[#E9DFFC] text-[#A0ABC0] rounded-xl flex items-center justify-center hover:bg-[#FEE2E2] hover:text-[#E53E3E] transition-colors cursor-pointer shrink-0">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {filteredBlogs.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-[#D5C2F6] rounded-[24px] bg-white/40">
                        <FileText className="w-12 h-12 text-[#D1C4F9] mb-4" />
                        <h3 className="text-[18px] font-black text-[#27225B] m-0">No articles found</h3>
                        <p className="text-[13px] text-[#7D8DA6] mt-1">Start writing your first blog to engage your audience.</p>
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
                                    <LayoutTemplate className="text-[#E9DFFC] w-5 h-5" />
                                </div>
                                <DialogTitle className="text-[22px] font-black text-white m-0">{editingBlog ? 'Edit Blog Article' : 'Draft New Article'}</DialogTitle>
                                <DialogDescription className="text-[#A0ABC0] text-[13px] font-medium m-0 mt-1">Publish content directly to the institute's frontend website.</DialogDescription>
                            </DialogHeader>
                        </div>
                        
                        <div className="p-8">
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide mb-1.5 block">Article Title <span className="text-red-500">*</span></label>
                                        <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-3.5 rounded-xl font-semibold text-[#27225B] text-[14px] outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all" placeholder="e.g. 5 Tips to Learn Faster" />
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide mb-1.5 block">URL Slug <span className="text-red-500">*</span></label>
                                        <input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-3.5 rounded-xl font-semibold text-[#6B4DF1] text-[14px] outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all" placeholder="5-tips-to-learn-faster" />
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide mb-1.5 block">Thumbnail Image URL</label>
                                        <input value={formData.thumbnail} onChange={e => setFormData({ ...formData, thumbnail: e.target.value })} className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-3.5 rounded-xl font-semibold text-[#27225B] text-[14px] outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all" placeholder="https://..." />
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide mb-1.5 block">Tags (Comma Separated)</label>
                                        <input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-3.5 rounded-xl font-semibold text-[#27225B] text-[14px] outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all" placeholder="study, tech, news" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide mb-1.5 block flex items-center gap-1"><Tag size={12}/> Category</label>
                                    <input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} list="categories" className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-3.5 rounded-xl font-semibold text-[#27225B] text-[14px] outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all" placeholder="General" />
                                    <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
                                </div>

                                <div>
                                    <label className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide mb-1.5 block">Short Excerpt</label>
                                    <textarea value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })} className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-3.5 rounded-xl font-semibold text-[#27225B] text-[14px] outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all min-h-[80px] resize-y" placeholder="Brief summary..."></textarea>
                                </div>

                                <div>
                                    <label className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wide mb-1.5 block">Main Content (HTML/Markdown) <span className="text-red-500">*</span></label>
                                    <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required className="w-full bg-[#F8F6FC] border border-[#E9DFFC] p-4 rounded-xl font-mono text-[#27225B] text-[13px] outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all min-h-[250px] resize-y leading-relaxed" placeholder="<h1>Hello World</h1>"></textarea>
                                </div>

                                <div className="p-5 bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl">
                                    <h4 className="text-[13px] font-black text-[#EA580C] mb-2 flex items-center gap-1.5"><CalendarDays size={14}/> Schedule Publishing</h4>
                                    <p className="text-[12px] font-medium text-[#C2410C] mb-3">Leave empty to publish immediately.</p>
                                    <input type="datetime-local" value={formData.scheduledPublishAt} onChange={e => setFormData({ ...formData, scheduledPublishAt: e.target.value })} className="bg-white border border-[#FDBA74] p-2.5 rounded-lg text-[13px] font-bold text-[#9A3412] outline-none focus:ring-2 focus:ring-[#EA580C]" />
                                </div>

                                <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                                    <h4 className="text-[13px] font-black text-gray-700 mb-2">SEO Settings</h4>
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
                                        <input value={formData.seoMeta.keywords} onChange={e => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, keywords: e.target.value } })} className="w-full bg-white border border-gray-200 p-2.5 rounded-lg font-semibold text-gray-700 text-[13px] outline-none focus:ring-2 focus:ring-[#6B4DF1]" placeholder="course, learning" />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white border border-[#E9DFFC] text-[#7D8DA6] font-bold text-[13px] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-8 py-3 bg-[#6B4DF1] text-white font-bold text-[13px] rounded-xl hover:bg-[#5839D6] transition-colors border-none shadow-md disabled:opacity-50 cursor-pointer">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe size={16} />}
                                        {editingBlog ? 'Update Article' : 'Publish Article'}
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