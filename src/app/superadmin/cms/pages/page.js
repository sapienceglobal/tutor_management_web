'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Search, Edit, Trash2, Globe, EyeOff, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function CMSPages() {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPage, setEditingPage] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        isPublished: true,
        seoMeta: { title: '', description: '', keywords: '' }
    });

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        setLoading(true);
        try {
            const res = await api.get('/cms/pages');
            if (res.data.success) {
                setPages(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load pages');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (page = null) => {
        if (page) {
            setEditingPage(page);
            setFormData({
                title: page.title,
                slug: page.slug,
                content: page.content,
                isPublished: page.isPublished,
                seoMeta: page.seoMeta || { title: '', description: '', keywords: '' }
            });
        } else {
            setEditingPage(null);
            setFormData({
                title: '',
                slug: '',
                content: '',
                isPublished: true,
                seoMeta: { title: '', description: '', keywords: '' }
            });
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
                    toast.success('Page updated');
                }
            } else {
                const res = await api.post('/cms/pages', formData);
                if (res.data.success) {
                    setPages([res.data.data, ...pages]);
                    toast.success('Page created');
                }
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save page');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this page?')) return;
        try {
            await api.delete(`/cms/pages/${id}`);
            setPages(pages.filter(p => p._id !== id));
            toast.success('Page deleted');
        } catch (error) {
            toast.error('Failed to delete page');
        }
    };

    const togglePublish = async (page) => {
        try {
            const res = await api.put(`/cms/pages/${page._id}`, { isPublished: !page.isPublished });
            if (res.data.success) {
                setPages(pages.map(p => p._id === page._id ? res.data.data : p));
                toast.success(`Page ${!page.isPublished ? 'published' : 'unpublished'}`);
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const filteredPages = pages.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Dynamic Pages</h1>
                    <p className="text-slate-500">Create and manage content pages like About, Privacy, etc.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search pages..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 w-64 bg-white"
                        />
                    </div>
                    <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" /> New Page
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPages.map(page => (
                        <Card key={page._id} className="group hover:shadow-lg transition-all border-slate-200">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <button
                                        onClick={() => togglePublish(page)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${page.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                                    >
                                        {page.isPublished ? <><Globe className="w-3 h-3" /> Published</> : <><EyeOff className="w-3 h-3" /> Draft</>}
                                    </button>
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1">{page.title}</h3>
                                <p className="text-sm text-slate-500 mb-4 font-mono bg-slate-50 px-2 py-1 rounded inline-block">/{page.slug}</p>

                                <div className="flex gap-2 border-t border-slate-100 pt-4 mt-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openModal(page)}>
                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(page._id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredPages.length === 0 && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-700">No pages found</h3>
                            <p className="text-slate-500">Create your first dynamic page to get started.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Editor Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{editingPage ? 'Edit Page' : 'Create New Page'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-6 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Page Title *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. About Us"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Slug (URL) *</Label>
                                <Input
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="e.g. about-us"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Content (HTML/Rich Text) *</Label>
                            {/* In a real app, use a WYSIWYG editor like ReactQuill. Using Textarea for simplicity for now. */}
                            <Textarea
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                placeholder="<h1>Welcome</h1><p>Our story begins...</p>"
                                className="font-mono h-64"
                                required
                            />
                        </div>

                        <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50">
                            <h4 className="font-semibold text-slate-700">SEO Settings</h4>
                            <div className="space-y-2">
                                <Label>Meta Title</Label>
                                <Input
                                    value={formData.seoMeta.title}
                                    onChange={e => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, title: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Meta Description</Label>
                                <Textarea
                                    value={formData.seoMeta.description}
                                    onChange={e => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, description: e.target.value } })}
                                    className="h-20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Keywords</Label>
                                <Input
                                    value={formData.seoMeta.keywords}
                                    onChange={e => setFormData({ ...formData, seoMeta: { ...formData.seoMeta, keywords: e.target.value } })}
                                    placeholder="education, learning, courses"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving} className="bg-indigo-600">
                                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Page
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
