'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Tag, ArrowRight, Search, BookOpen } from 'lucide-react';
import api from '@/lib/axios';

export default function BlogListingPage() {
    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');


    useEffect(() => {
        fetchBlogs();
    }, [selectedCategory]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const categoryParam = selectedCategory !== 'All' ? `?category=${selectedCategory}` : '';
            const res = await api.get(`/cms/blogs${categoryParam}`);
            const data = res.data;
            if (data.success) {
                setBlogs(data.data);
                if (data.categories) setCategories(['All', ...data.categories]);
            }
        } catch (error) {
            console.error('Error fetching blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBlogs = blogs.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const readTime = (content) => {
        const words = content?.split(/\s+/).length || 0;
        return Math.max(1, Math.ceil(words / 200));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading blogs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            {/* Hero Section */}
            <div className="bg-[#0F172A] text-white">
                <div className="max-w-6xl mx-auto px-6 py-16 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-sm font-medium mb-6">
                        <BookOpen className="w-4 h-4" />
                        Our Blog
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                        Insights & Articles
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
                        Stay updated with the latest tips, tutorials, and educational insights from our experts.
                    </p>

                    {/* Search */}
                    <div className="max-w-md mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            {categories.length > 1 && (
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${selectedCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Blog Grid */}
            <div className="max-w-6xl mx-auto px-6 py-8 pb-20">
                {filteredBlogs.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredBlogs.map((blog) => (
                            <Link
                                key={blog._id}
                                href={`/blog/${blog.slug}`}
                                className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Thumbnail */}
                                <div className="aspect-[16/10] bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
                                    {blog.thumbnail ? (
                                        <img
                                            src={blog.thumbnail}
                                            alt={blog.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="w-12 h-12 text-indigo-300" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Tags */}
                                    <div className="flex items-center gap-2 mb-3">
                                        {blog.category && (
                                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                                                {blog.category}
                                            </span>
                                        )}
                                        {blog.tags?.slice(0, 1).map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <h2 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {blog.title}
                                    </h2>

                                    {blog.excerpt && (
                                        <p className="text-slate-600 text-sm line-clamp-3 mb-4">
                                            {blog.excerpt}
                                        </p>
                                    )}

                                    {/* Meta */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(blog.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {readTime(blog.content)} min read
                                            </span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">No blogs found</h3>
                        <p className="text-slate-500">
                            {searchTerm ? 'Try a different search term.' : 'Check back soon for new articles!'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
