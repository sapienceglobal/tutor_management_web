'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft, Tag, User, Share2 } from 'lucide-react';
import api from '@/lib/axios';
import { sanitizeHtml } from '@/lib/sanitize';

export default function BlogDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        if (slug) fetchBlog();
    }, [slug]);

    const fetchBlog = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/cms/blogs/${slug}`);
            const data = res.data;
            if (data.success) {
                setBlog(data.data);
            } else {
                setBlog(null);
            }
        } catch (error) {
            console.error('Error fetching blog:', error);
            setBlog(null);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const readTime = (content) => {
        const words = content?.split(/\s+/).length || 0;
        return Math.max(1, Math.ceil(words / 200));
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: blog.title, url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading article...</p>
                </div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Blog Not Found</h2>
                    <p className="text-slate-600 mb-6">This article may have been removed or doesn&apos;t exist.</p>
                    <Link href="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold">
                        <ArrowLeft className="w-4 h-4" /> Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            {/* Hero Banner */}
            <div className="bg-[#0F172A] text-white">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    {/* Back button */}
                    <Link href="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back to Blog
                    </Link>

                    {/* Category & Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        {blog.category && (
                            <span className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold rounded-full">
                                {blog.category}
                            </span>
                        )}
                        {blog.tags?.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-white/10 text-slate-300 text-xs font-medium rounded-full flex items-center gap-1">
                                <Tag className="w-3 h-3" /> {tag}
                            </span>
                        ))}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-6">
                        {blog.title}
                    </h1>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm">
                        {blog.author && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-500/30 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-indigo-300" />
                                </div>
                                <span className="text-white font-medium">{blog.author.name}</span>
                            </div>
                        )}
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDate(blog.createdAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {readTime(blog.content)} min read
                        </span>
                        <button onClick={handleShare} className="flex items-center gap-1.5 hover:text-white transition-colors ml-auto">
                            <Share2 className="w-4 h-4" /> Share
                        </button>
                    </div>
                </div>
            </div>

            {/* Thumbnail */}
            {blog.thumbnail && (
                <div className="max-w-4xl mx-auto px-6 -mt-2">
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                        <img
                            src={blog.thumbnail}
                            alt={blog.title}
                            className="w-full aspect-[21/9] object-cover"
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <article
                    className="prose prose-lg prose-slate max-w-none
                        prose-headings:text-slate-900 prose-headings:font-bold
                        prose-p:text-slate-700 prose-p:leading-relaxed
                        prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-xl prose-img:shadow-lg
                        prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-4
                        prose-code:bg-slate-100 prose-code:px-2 prose-code:py-0.5 prose-code:rounded
                        prose-pre:bg-[#0F172A] prose-pre:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.content) }}
                />

                {/* Tags footer */}
                {blog.tags?.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-slate-200">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Tags:</span>
                            {blog.tags.map(tag => (
                                <span key={tag} className="px-4 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Back to blog */}
                <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                    <Link href="/blog" className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg shadow-indigo-200">
                        <ArrowLeft className="w-4 h-4" /> View All Articles
                    </Link>
                </div>
            </div>
        </div>
    );
}
