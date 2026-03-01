'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import api from '@/lib/axios';

export default function DynamicPage() {
    const { slug } = useParams();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        if (slug) fetchPage();
    }, [slug]);

    const fetchPage = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/cms/pages/${slug}`);
            const data = res.data;
            if (data.success) {
                setPage(data.data);
            } else {
                setPage(null);
            }
        } catch (error) {
            console.error('Error fetching page:', error);
            setPage(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading page...</p>
                </div>
            </div>
        );
    }

    if (!page) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
                    <p className="text-slate-600 mb-6">This page may have been removed or doesn&apos;t exist.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold">
                        <ArrowLeft className="w-4 h-4" /> Go Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            {/* Header */}
            <div className="bg-[#0F172A] text-white">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Home
                    </Link>
                    <h1 className="text-3xl lg:text-4xl font-bold">
                        {page.title}
                    </h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 lg:p-12">
                    <article
                        className="prose prose-lg prose-slate max-w-none
                            prose-headings:text-slate-900 prose-headings:font-bold
                            prose-p:text-slate-700 prose-p:leading-relaxed
                            prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                            prose-ul:text-slate-700 prose-ol:text-slate-700
                            prose-img:rounded-xl prose-img:shadow-lg
                            prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50 prose-blockquote:rounded-r-xl
                            prose-table:border-collapse prose-td:border prose-td:border-slate-200 prose-td:p-3
                            prose-th:border prose-th:border-slate-200 prose-th:bg-slate-50 prose-th:p-3"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                </div>

                {/* Last updated */}
                {page.updatedAt && (
                    <p className="text-center text-sm text-slate-400 mt-8">
                        Last updated: {new Date(page.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}
                    </p>
                )}
            </div>
        </div>
    );
}
