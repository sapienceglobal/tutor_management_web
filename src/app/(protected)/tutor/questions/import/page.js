'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ImportQuestionsPage() {
    return (
        <div className="space-y-6" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* Page Header */}
            <div className="flex items-center gap-3">
                <Link href="/tutor/questions">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </button>
                </Link>
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                            <Upload className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <h1 className="text-lg font-bold text-slate-800">Import Questions</h1>
                    </div>
                    <p className="text-xs text-slate-400 pl-0.5">Bulk import questions from a file</p>
                </div>
            </div>

            {/* Content Card */}
            <div className="max-w-xl bg-white rounded-xl border border-slate-100 p-10 text-center space-y-6">
                <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                    <Upload className="w-7 h-7" style={{ color: 'var(--theme-primary)' }} />
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-slate-800">Upload CSV or JSON File</h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                        Bulk import questions from a spreadsheet. Supported formats: .csv, .json, .xlsx
                    </p>
                </div>

                {/* Drop zone */}
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 transition-all cursor-pointer group"
                    style={{ '--hover-bg': 'color-mix(in srgb, var(--theme-primary) 5%, white)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                    <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-slate-300 group-hover:text-[var(--theme-primary)] transition-colors" />
                        <span className="text-sm font-medium text-slate-500">Click to browse files</span>
                        <span className="text-xs text-slate-400">or drag and drop here</span>
                    </div>
                </div>

                {/* Format badges */}
                <div className="flex justify-center gap-2 flex-wrap">
                    {['.csv', '.json', '.xlsx'].map(fmt => (
                        <span key={fmt} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium border border-slate-200">
                            {fmt}
                        </span>
                    ))}
                </div>

                <Button disabled className="w-full h-10 bg-slate-100 text-slate-400 cursor-not-allowed text-sm font-semibold">
                    Coming Soon
                </Button>
            </div>
        </div>
    );
}