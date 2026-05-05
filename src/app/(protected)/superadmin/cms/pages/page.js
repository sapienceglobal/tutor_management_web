'use client';

import { useState, useEffect } from 'react';
import { 
    MdArticle, MdAdd, MdSearch, MdEdit, MdDelete, MdPublic, 
    MdVisibilityOff, MdHourglassEmpty, MdDashboard, MdClose, MdLink
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>Loading pages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdDashboard style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Dynamic Pages
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Manage static content pages like About Us, Privacy Policy, Terms, etc.
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
                    <MdAdd style={{ width: 18, height: 18 }} /> Create New Page
                </button>
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4" 
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                <div className="relative w-full xl:w-[400px]">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                    <input
                        type="text" 
                        placeholder="Search pages by title or slug..." 
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPages.map(page => (
                    <div key={page._id} className="flex flex-col transition-transform hover:-translate-y-1 overflow-hidden group p-6" 
                        style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = S.cardHover}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = S.card}
                    >
                        
                        <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: '16px', backgroundColor: C.innerBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}` }}>
                                <MdDashboard style={{ width: 24, height: 24 }} />
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                                <span className="flex items-center gap-1 shadow-sm" 
                                    style={{ 
                                        padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.black, 
                                        textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                        backgroundColor: page.isPublished ? C.successBg : C.heading, 
                                        color: page.isPublished ? C.success : '#ffffff', 
                                        border: `1px solid ${page.isPublished ? C.successBorder : C.heading}` 
                                    }}>
                                    {page.isPublished ? <MdPublic style={{ width: 10, height: 10 }} /> : <MdVisibilityOff style={{ width: 10, height: 10 }} />}
                                    {page.isPublished ? 'Live' : 'Draft'}
                                </span>
                                <button 
                                    onClick={() => togglePublish(page)} 
                                    className="bg-transparent border-none cursor-pointer"
                                    style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, textDecoration: 'underline', textUnderlineOffset: '2px' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = C.btnPrimary}
                                    onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
                                >
                                    Toggle Visibility
                                </button>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="line-clamp-2 leading-snug" style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0, marginBottom: '6px' }}>{page.title}</h3>
                            <div className="inline-flex items-center mb-6" style={{ fontFamily: T.fontFamilyMono, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, backgroundColor: C.innerBg, padding: '4px 8px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                /{page.slug}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-5" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                            <button 
                                onClick={() => openModal(page)} 
                                className="flex-1 flex items-center justify-center gap-1.5 transition-colors border-none cursor-pointer"
                                style={{ padding: '10px 0', backgroundColor: C.innerBg, color: C.btnPrimary, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.innerBg}
                            >
                                <MdEdit style={{ width: 14, height: 14 }} /> Edit Page
                            </button>
                            <button 
                                onClick={() => handleDelete(page._id)} 
                                className="flex items-center justify-center transition-colors border-none cursor-pointer"
                                style={{ width: 40, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textFaint, borderRadius: '10px' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg; e.currentTarget.style.color = C.danger; e.currentTarget.style.borderColor = C.dangerBorder; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.surfaceWhite; e.currentTarget.style.color = C.textFaint; e.currentTarget.style.borderColor = C.cardBorder; }}
                            >
                                <MdDelete style={{ width: 16, height: 16 }} />
                            </button>
                        </div>
                    </div>
                ))}
                
                {filteredPages.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                        <MdDashboard style={{ width: 48, height: 48, color: C.textFaint, marginBottom: '16px' }} />
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No pages found</h3>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4, margin: 0 }}>Create pages like "About Us" or "Privacy Policy" to display on the frontend.</p>
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
                                    <MdArticle style={{ color: '#E9DFFC', width: 20, height: 20 }} />
                                </div>
                                <DialogTitle style={{ fontFamily: T.fontFamily, fontSize: '22px', fontWeight: T.weight.black, color: '#ffffff', margin: 0 }}>
                                    {editingPage ? 'Edit Page Details' : 'Create Custom Page'}
                                </DialogTitle>
                                <DialogDescription style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.darkCardMuted, margin: 0, marginTop: 4 }}>
                                    Design layout using HTML/Markdown structure.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        
                        <div className="p-8" style={{ backgroundColor: C.pageBg }}>
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>Page Title <span className="text-red-500">*</span></label>
                                        <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required style={baseInputStyle} placeholder="e.g. Terms of Service" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>URL Slug <span className="text-red-500">*</span></label>
                                        <input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required style={{ ...baseInputStyle, color: C.btnPrimary, fontFamily: T.fontFamilyMono }} placeholder="terms-of-service" />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>Raw Content (HTML) <span className="text-red-500">*</span></label>
                                    <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required style={{ ...baseInputStyle, fontFamily: T.fontFamilyMono, minHeight: '300px', resize: 'vertical', lineHeight: T.leading.relaxed, padding: '20px' }} placeholder="<div><h2>Privacy Policy</h2><p>...</p></div>"></textarea>
                                </div>

                                <div style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl, padding: '20px' }}>
                                    <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading, margin: 0, marginBottom: '16px' }}>SEO Configurations</h4>
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
                                            <input value={formData.seoMeta.keywords} onChange={e => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, keywords: e.target.value } })} style={baseInputStyle} placeholder="privacy, terms, about" />
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
                                        {isSaving ? <MdHourglassEmpty style={{ width: 18, height: 18 }} className="animate-spin" /> : <MdDashboard style={{ width: 18, height: 18 }} />}
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