'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Search, Edit, Trash2, Globe, EyeOff, Loader2, Image as ImageIcon, Clock, CalendarDays, Tag } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        thumbnail: '',
        isPublished: true,
        tags: '',
        scheduledPublishAt: '',
        category: 'General',
        seoMeta: { title: '', description: '', keywords: '' }
    });

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/cms/blogs');
            if (res.data.success) {
                setBlogs(res.data.data);
                if (res.data.categories) {
                    setCategories(res.data.categories);
                }
            }
        } catch (error) {
            toast.error('Failed to load blogs');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (blog = null) => {
        if (blog) {
            setEditingBlog(blog);
            setFormData({
                title: blog.title,
                slug: blog.slug,
                excerpt: blog.excerpt,
                content: blog.content,
                thumbnail: blog.thumbnail,
                isPublished: blog.isPublished,
                tags: (blog.tags || []).join(', '),
                scheduledPublishAt: blog.scheduledPublishAt ? new Date(blog.scheduledPublishAt).toISOString().slice(0, 16) : '',
                category: blog.category || 'General',
                seoMeta: blog.seoMeta || { title: '', description: '', keywords: '' }
            });
        } else {
            setEditingBlog(null);
            setFormData({
                title: '',
                slug: '',
                excerpt: '',
                content: '',
                thumbnail: '',
                isPublished: true,
                tags: '',
                scheduledPublishAt: '',
                category: 'General',
                seoMeta: { title: '', description: '', keywords: '' }
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
                    toast.success('Blog updated');
                }
            } else {
                const res = await api.post('/cms/blogs', payload);
                if (res.data.success) {
                    setBlogs([res.data.data, ...blogs]);
                    toast.success('Blog created');
                }
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save blog');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this blog post?')) return;
        try {
            await api.delete(`/cms/blogs/${id}`);
            setBlogs(blogs.filter(b => b._id !== id));
            toast.success('Blog deleted');
        } catch (error) {
            toast.error('Failed to delete blog');
        }
    };

    const togglePublish = async (blog) => {
        try {
            const res = await api.put(`/cms/blogs/${blog._id}`, { isPublished: !blog.isPublished });
            if (res.data.success) {
                setBlogs(blogs.map(b => b._id === blog._id ? res.data.data : b));
                toast.success(`Blog ${!blog.isPublished ? 'published' : 'unpublished'}`);
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const filteredBlogs = blogs.filter(b => {
        const matchSearch = b.title.toLowerCase().includes(search.toLowerCase());
        const matchCategory = selectedCategory === 'All' || b.category === selectedCategory;
        return matchSearch && matchCategory;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Blog Manager</h1>
                    <p className="text-slate-500">Create articles and announcements.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search blogs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 w-64 bg-white"
                        />
                    </div>
                    {/* Category filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        <option value="All">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" /> New Blog
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBlogs.map(blog => (
                        <Card key={blog._id} className="group hover:shadow-lg transition-all border-slate-200 overflow-hidden flex flex-col">
                            {blog.thumbnail ? (
                                <div className="h-40 w-full bg-slate-100 overflow-hidden relative">
                                    <img src={blog.thumbnail} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <button
                                        onClick={() => togglePublish(blog)}
                                        className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md ${blog.isPublished ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'}`}
                                    >
                                        {blog.isPublished ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {blog.isPublished ? 'Published' : 'Draft'}
                                    </button>
                                </div>
                            ) : (
                                <div className="h-40 w-full bg-slate-100 flex items-center justify-center relative">
                                    <ImageIcon className="w-10 h-10 text-slate-300" />
                                    <button
                                        onClick={() => togglePublish(blog)}
                                        className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md ${blog.isPublished ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'}`}
                                    >
                                        {blog.isPublished ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {blog.isPublished ? 'Published' : 'Draft'}
                                    </button>
                                </div>
                            )}

                            <CardContent className="p-6 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-2">{blog.title}</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{blog.excerpt}</p>

                                <div className="flex items-center justify-between text-xs text-slate-400 mb-4 font-semibold uppercase tracking-wider">
                                    <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                                    {blog.status === 'scheduled' && (
                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Scheduled {new Date(blog.scheduledPublishAt).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span>{blog.author?.name}</span>
                                </div>

                                <div className="flex gap-2 border-t border-slate-100 pt-4 mt-auto">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openModal(blog)}>
                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(blog._id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredBlogs.length === 0 && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-700">No blogs found</h3>
                            <p className="text-slate-500">Create your first blog post to engage your students.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Editor Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{editingBlog ? 'Edit Blog' : 'Create New Blog'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-6 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Blog Title *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. 5 Tips to Learn Faster"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Slug (URL) *</Label>
                                <Input
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="e.g. 5-tips-to-learn-faster"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Thumbnail Image URL</Label>
                                <Input
                                    value={formData.thumbnail}
                                    onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tags (comma separated)</Label>
                                <Input
                                    value={formData.tags}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="study, tips, productivity"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-indigo-500" /> Category</Label>
                            <Input
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                placeholder="e.g. Study Tips, Announcements, Tech"
                                list="blog-categories"
                            />
                            <datalist id="blog-categories">
                                {categories.map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>

                        <div className="space-y-2">
                            <Label>Excerpt</Label>
                            <Textarea
                                value={formData.excerpt}
                                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                                placeholder="A brief summary of the post..."
                                className="h-20"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Content (HTML/Rich Text) *</Label>
                            <Textarea
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                placeholder="<h1>Title</h1><p>Main content...</p>"
                                className="font-mono h-64"
                                required
                            />
                        </div>

                        {/* Schedule Publishing */}
                        <div className="border border-amber-200 rounded-xl p-4 space-y-3 bg-amber-50/50">
                            <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                Schedule Publishing
                            </h4>
                            <p className="text-sm text-amber-600">Leave empty to publish immediately. Set a future date to schedule.</p>
                            <Input
                                type="datetime-local"
                                value={formData.scheduledPublishAt}
                                onChange={e => setFormData({ ...formData, scheduledPublishAt: e.target.value })}
                                className="bg-white"
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
                                    placeholder="learning, tips"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving} className="bg-indigo-600">
                                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Blog
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
