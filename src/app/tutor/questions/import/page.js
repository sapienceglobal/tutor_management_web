'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Upload, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ImportQuestionsPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/tutor/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">Import Questions</h1>
                </div>

                <Card>
                    <CardContent className="p-12 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-slate-900">Upload CSV or JSON File</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                Bulk import questions from a spreadsheet. Supported formats: .csv, .json, .xlsx
                            </p>
                        </div>

                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 hover:bg-slate-50 transition-colors cursor-pointer">
                            <div className="flex flex-col items-center gap-2">
                                <FileText className="w-8 h-8 text-slate-400" />
                                <span className="text-sm font-medium text-slate-600">Click to browse files</span>
                                <span className="text-xs text-slate-400">or drag and drop here</span>
                            </div>
                        </div>

                        <Button disabled className="w-full">
                            Coming Soon
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
