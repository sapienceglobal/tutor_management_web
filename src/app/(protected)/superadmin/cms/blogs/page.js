'use client';

import { useState, useEffect } from 'react';
import { 
    MdArticle, MdAdd, MdSearch, MdEdit, MdDelete, MdPublic, 
    MdVisibilityOff, MdHourglassEmpty, MdImage, MdAccessTime, 
    MdCalendarMonth, MdTag, MdMoreHoriz, MdDashboard, MdClose,
    MdSettings, MdNotes, MdLink, MdCategory, MdChevronRight
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

// ─── Base Input Style ─────────────────────────────────────────────────────────
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

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                        style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                </div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>Loading blogs...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdArticle style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Blog Manager
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Write, schedule, and manage articles and announcements.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => openModal()} 
                    className="flex items-center gap-2 transition-opacity border-none cursor-pointer"
                    style={{
                        background: C.gradientBtn,
                        color: '#ffffff',
                        padding: '12px 24px',
                        borderRadius: '10px',
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        boxShadow: S.btn
                    }}
                >
                    <MdAdd style={{ width: 18, height: 18 }} /> Write New Blog
                </button>
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4" 
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                <div className="flex p-1.5 w-full xl:w-auto overflow-x-auto" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                    <button 
                        onClick={() => setSelectedCategory('All')} 
                        className="transition-all whitespace-nowrap border-none cursor-pointer"
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                            backgroundColor: selectedCategory === 'All' ? C.surfaceWhite : 'transparent',
                            color: selectedCategory === 'All' ? C.btnPrimary : C.textFaint,
                            boxShadow: selectedCategory === 'All' ? S.active : 'none'
                        }}
                    >
                        All Categories
                    </button>
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)} 
                            className="transition-all whitespace-nowrap border-none cursor-pointer"
                            style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                backgroundColor: selectedCategory === cat ? C.surfaceWhite : 'transparent',
                                color: selectedCategory === cat ? C.btnPrimary : C.textFaint,
                                boxShadow: selectedCategory === cat ? S.active : 'none'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="relative w-full xl:w-[350px]">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                    <input
                        type="text" 
                        placeholder="Search articles..." 
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBlogs.map(blog => (
                    <div key={blog._id} className="flex flex-col transition-transform hover:-translate-y-1 overflow-hidden group" 
                        style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = S.cardHover}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = S.card}
                    >
                        
                        {/* Thumbnail Container */}
                        <div className="relative overflow-hidden" style={{ height: '176px', backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                            {blog.thumbnail ? (
                                <img src={blog.thumbnail} alt={blog.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full" style={{ color: C.textFaint }}>
                                    <MdImage style={{ width: 48, height: 48, opacity: 0.5 }} />
                                </div>
                            )}
                            
                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex gap-2">
                                <span className="flex items-center gap-1 shadow-sm" 
                                    style={{ 
                                        padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.black, 
                                        textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                        backgroundColor: blog.isPublished ? C.successBg : C.heading, 
                                        color: blog.isPublished ? C.success : '#ffffff', 
                                        border: `1px solid ${blog.isPublished ? C.successBorder : C.heading}` 
                                    }}>
                                    {blog.isPublished ? <MdPublic style={{ width: 12, height: 12 }} /> : <MdVisibilityOff style={{ width: 12, height: 12 }} />}
                                    {blog.isPublished ? 'Published' : 'Draft'}
                                </span>
                            </div>
                            <button 
                                onClick={() => togglePublish(blog)} 
                                className="absolute top-3 right-3 flex items-center justify-center transition-all border-none cursor-pointer shadow-sm group-hover:opacity-100" 
                                style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.9)', color: C.heading, opacity: 0 }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'; }}
                                title="Toggle Visibility"
                            >
                                <MdMoreHoriz style={{ width: 18, height: 18 }} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col">
                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '8px', display: 'block' }}>
                                {blog.category || 'General'}
                            </span>
                            <h3 className="line-clamp-2 leading-snug" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading, margin: 0, marginBottom: '8px' }}>
                                {blog.title}
                            </h3>
                            <p className="line-clamp-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginBottom: '16px', flex: 1 }}>
                                {blog.excerpt}
                            </p>

                            {/* Meta */}
                            <div className="pt-4 space-y-2" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center justify-between" style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.textFaint }}>
                                    <span className="flex items-center gap-1.5">
                                        <MdCalendarMonth style={{ width: 14, height: 14 }}/> 
                                        {new Date(blog.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span style={{ color: C.heading }}>{blog.author?.name || 'Admin'}</span>
                                </div>
                                {blog.status === 'scheduled' && (
                                    <span className="flex items-center gap-1.5" style={{ padding: '4px 8px', backgroundColor: C.warningBg, color: C.warning, borderRadius: '8px', fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', width: 'fit-content' }}>
                                        <MdAccessTime style={{ width: 12, height: 12 }} /> Scheduled: {new Date(blog.scheduledPublishAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <button 
                                    onClick={() => openModal(blog)} 
                                    className="flex-1 flex items-center justify-center gap-1.5 transition-colors border-none cursor-pointer"
                                    style={{ padding: '8px 0', backgroundColor: C.innerBg, color: C.btnPrimary, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.innerBg}
                                >
                                    <MdEdit style={{ width: 14, height: 14 }} /> Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(blog._id)} 
                                    className="flex items-center justify-center transition-colors border-none cursor-pointer"
                                    style={{ width: 40, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textFaint, borderRadius: '10px' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg; e.currentTarget.style.color = C.danger; e.currentTarget.style.borderColor = C.dangerBorder; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.surfaceWhite; e.currentTarget.style.color = C.textFaint; e.currentTarget.style.borderColor = C.cardBorder; }}
                                >
                                    <MdDelete style={{ width: 16, height: 16 }} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {filteredBlogs.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                        <MdArticle style={{ width: 48, height: 48, color: C.textFaint, marginBottom: '16px' }} />
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No articles found</h3>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4, margin: 0 }}>Start writing your first blog to engage your audience.</p>
                    </div>
                )}
            </div>

            {/* ── Editor Modal ── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none" style={{ borderRadius: R['3xl'] }}>
                    <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['3xl'] }}>
                        <div className="relative p-8" style={{ backgroundColor: C.darkCard, color: '#ffffff' }}>
                            <div className="absolute top-0 right-0 opacity-40 rounded-full filter blur-[60px]" style={{ width: 256, height: 256, backgroundColor: C.btnPrimary, mixBlendMode: 'screen' }}></div>
                            <DialogHeader className="relative z-10 text-left">
                                <div className="flex items-center justify-center mb-3 border border-white/20" style={{ width: 40, height: 40, borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                                    <MdDashboard style={{ color: '#E9DFFC', width: 20, height: 20 }} />
                                </div>
                                <DialogTitle style={{ fontFamily: T.fontFamily, fontSize: '22px', fontWeight: T.weight.black, color: '#ffffff', margin: 0 }}>
                                    {editingBlog ? 'Edit Blog Article' : 'Draft New Article'}
                                </DialogTitle>
                                <DialogDescription style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.darkCardMuted, margin: 0, marginTop: 4 }}>
                                    Publish content directly to the platform's frontend registry.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        
                        <div className="p-8" style={{ backgroundColor: C.pageBg }}>
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>Article Title <span className="text-red-500">*</span></label>
                                        <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required style={baseInputStyle} placeholder="e.g. 5 Tips to Learn Faster" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>URL Slug <span className="text-red-500">*</span></label>
                                        <input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required style={{ ...baseInputStyle, color: C.btnPrimary }} placeholder="5-tips-to-learn-faster" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>Thumbnail Image URL</label>
                                        <input value={formData.thumbnail} onChange={e => setFormData({ ...formData, thumbnail: e.target.value })} style={baseInputStyle} placeholder="https://..." />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>Tags (Comma Separated)</label>
                                        <input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} style={baseInputStyle} placeholder="study, tech, news" />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MdCategory style={{ width: 14, height: 14 }}/> Category
                                    </label>
                                    <input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} list="categories" style={baseInputStyle} placeholder="General" />
                                    <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>Short Excerpt</label>
                                    <textarea value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })} style={{ ...baseInputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Brief summary..."></textarea>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>Main Content (HTML/Markdown) <span className="text-red-500">*</span></label>
                                    <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required style={{ ...baseInputStyle, fontFamily: T.fontFamilyMono, minHeight: '250px', resize: 'vertical', lineHeight: T.leading.relaxed, padding: '20px' }} placeholder="<h1>Hello World</h1>"></textarea>
                                </div>

                                <div style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl, padding: '20px' }}>
                                    <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading, margin: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MdCalendarMonth style={{ width: 18, height: 18, color: C.warning }}/> Schedule Publishing
                                    </h4>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginBottom: '12px' }}>Leave empty to publish immediately.</p>
                                    <input type="datetime-local" value={formData.scheduledPublishAt} onChange={e => setFormData({ ...formData, scheduledPublishAt: e.target.value })} 
                                        style={{ ...baseInputStyle, width: 'auto', backgroundColor: '#ffffff', borderColor: C.warningBorder, color: C.warning }} />
                                </div>

                                <div style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl, padding: '20px' }}>
                                    <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading, margin: 0, marginBottom: '16px' }}>SEO Settings</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '4px' }}>Meta Title</label>
                                            <input value={formData.seoMeta.title} onChange={e => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, title: e.target.value } })} style={baseInputStyle} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '4px' }}>Meta Description</label>
                                            <textarea value={formData.seoMeta.description} onChange={e => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, description: e.target.value } })} style={{ ...baseInputStyle, minHeight: '60px' }}></textarea>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '4px' }}>Keywords</label>
                                            <input value={formData.seoMeta.keywords} onChange={e => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, keywords: e.target.value } })} style={baseInputStyle} placeholder="course, learning" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: C.cardBorder }}>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)} 
                                        className="transition-colors cursor-pointer"
                                        style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '12px 24px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                    >Cancel</button>
                                    <button 
                                        type="submit" 
                                        disabled={isSaving} 
                                        className="flex items-center gap-2 transition-opacity cursor-pointer border-none"
                                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', padding: '12px 32px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn, opacity: isSaving ? 0.6 : 1 }}
                                    >
                                        {isSaving ? <MdHourglassEmpty style={{ width: 18, height: 18 }} className="animate-spin" /> : <MdPublic style={{ width: 18, height: 18 }} />}
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