'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, FX } from '@/constants/tutorTokens';

const parseCsvText = (text) => {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                cell += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            row.push(cell.trim());
            cell = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i += 1;
            row.push(cell.trim());
            rows.push(row);
            row = [];
            cell = '';
            continue;
        }

        cell += char;
    }

    if (cell.length > 0 || row.length > 0) {
        row.push(cell.trim());
        rows.push(row);
    }

    return rows.filter((r) => r.some((value) => String(value || '').trim() !== ''));
};

const csvRowsToObjects = (rows) => {
    if (rows.length < 2) return [];
    const headers = rows[0].map((header) => String(header || '').trim());
    return rows.slice(1).map((row) => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] ?? '';
        });
        return obj;
    });
};

export default function ImportQuestionsPage() {
    const [parsing, setParsing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState('');
    const [parsedRows, setParsedRows] = useState([]);
    const [parseError, setParseError] = useState('');
    const [result, setResult] = useState(null);

    const previewRows = useMemo(() => parsedRows.slice(0, 5), [parsedRows]);

    const stats = useMemo(() => {
        const missingQuestion = parsedRows.filter((row) => !String(row.question || row.questionText || row.text || '').trim()).length;
        return {
            total: parsedRows.length,
            missingQuestion,
        };
    }, [parsedRows]);

    const handleFileParse = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setResult(null);
        setParseError('');
        setParsedRows([]);
        setSelectedFileName(file.name);
        setParsing(true);

        try {
            const fileText = await file.text();
            const extension = file.name.split('.').pop()?.toLowerCase();
            let rows = [];

            if (extension === 'json') {
                const parsed = JSON.parse(fileText);
                rows = Array.isArray(parsed) ? parsed : parsed?.questions || [];
                if (!Array.isArray(rows)) rows = [];
            } else if (extension === 'csv') {
                const csvRows = parseCsvText(fileText);
                rows = csvRowsToObjects(csvRows);
            } else {
                throw new Error('Unsupported format. Please upload CSV or JSON.');
            }

            if (!rows.length) {
                throw new Error('No rows found in file.');
            }

            const cleanedRows = rows.filter((row) =>
                Object.values(row || {}).some((value) => String(value ?? '').trim() !== '')
            );

            if (!cleanedRows.length) {
                throw new Error('File contains only empty rows.');
            }

            setParsedRows(cleanedRows);
            toast.success(`Parsed ${cleanedRows.length} rows`);
        } catch (error) {
            const message = error.message || 'Failed to parse file';
            setParseError(message);
            toast.error(message);
        } finally {
            setParsing(false);
            event.target.value = '';
        }
    };

    const handleImport = async () => {
        if (!parsedRows.length) return;

        setImporting(true);
        setResult(null);
        try {
            const res = await api.post('/question-bank/questions/import', { questions: parsedRows });
            const data = res.data || {};
            setResult(data);
            if (data.importedCount > 0) {
                toast.success(`Imported ${data.importedCount} question(s)`);
            } else {
                toast.error(data.message || 'No rows were imported');
            }
        } catch (error) {
            const data = error.response?.data;
            setResult(data || null);
            toast.error(data?.message || 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6" style={{ fontFamily: T.fontFamily }}>
            <div className="flex items-center gap-3">
                <Link href="/tutor/questions">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </button>
                </Link>
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}>
                            <Upload className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                        </div>
                        <h1 className="text-lg font-bold text-slate-800">Import Questions</h1>
                    </div>
                    <p className="text-xs text-slate-400 pl-0.5">Upload CSV or JSON and import in bulk</p>
                </div>
            </div>

            <div className="max-w-4xl bg-white rounded-xl border border-slate-100 p-6 space-y-5">
                <div className="rounded-xl border-2 border-dashed p-6" style={{ borderColor: FX.primary25 }}>
                    <input id="question-import-file" type="file" accept=".csv,.json,application/json,text/csv" className="hidden" onChange={handleFileParse} />
                    <label
                        htmlFor="question-import-file"
                        className="flex flex-col items-center gap-2 cursor-pointer text-center"
                    >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: FX.primary10, border: `1px solid ${FX.primary20}` }}>
                            {parsing ? <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.btnPrimary }} /> : <FileText className="w-6 h-6" style={{ color: C.btnPrimary }} />}
                        </div>
                        <p className="text-sm font-semibold text-slate-700">
                            {selectedFileName ? selectedFileName : 'Click to choose a CSV or JSON file'}
                        </p>
                        <p className="text-xs text-slate-400">Supported: `.csv`, `.json`</p>
                    </label>
                </div>

                {parseError && (
                    <div className="rounded-xl border px-4 py-3 flex items-start gap-2" style={{ borderColor: C.dangerBorder, backgroundColor: C.dangerBg }}>
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.danger }} />
                        <p className="text-xs" style={{ color: C.danger }}>{parseError}</p>
                    </div>
                )}

                {parsedRows.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border p-3" style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg }}>
                                <p className="text-[11px] text-slate-500 font-semibold">Rows Parsed</p>
                                <p className="text-base font-black text-slate-800">{stats.total}</p>
                            </div>
                            <div className="rounded-xl border p-3" style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg }}>
                                <p className="text-[11px] text-slate-500 font-semibold">Rows Missing Question Text</p>
                                <p className="text-base font-black text-slate-800">{stats.missingQuestion}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-100 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                                <p className="text-xs font-semibold text-slate-600">Preview (first {previewRows.length} rows)</p>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {previewRows.map((row, index) => (
                                    <div key={index} className="px-4 py-3">
                                        <p className="text-xs font-semibold text-slate-700 line-clamp-2">
                                            {row.question || row.questionText || row.text || 'No question text'}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            Type: {row.type || 'mcq'} · Difficulty: {row.difficulty || 'medium'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        onClick={handleImport}
                        disabled={!parsedRows.length || parsing || importing}
                        className="h-10 text-white font-semibold gap-2"
                        style={{ backgroundColor: C.btnPrimary }}
                    >
                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Import Questions
                    </Button>
                    <p className="text-xs text-slate-400">
                        Supported columns: `question`, `type`, `options`, `correctAnswer`, `points`, `difficulty`, `topicId`, `skillId`
                    </p>
                </div>

                {result && (
                    <div className="rounded-xl border px-4 py-3 space-y-2" style={{ borderColor: result.success ? C.successBorder : C.warningBorder, backgroundColor: result.success ? C.successBg : C.warningBg }}>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" style={{ color: result.success ? C.success : C.warning }} />
                            <p className="text-xs font-semibold" style={{ color: result.success ? C.success : C.warning }}>
                                {result.message || 'Import completed'}
                            </p>
                        </div>
                        <p className="text-xs text-slate-600">
                            Imported: {result.importedCount || 0} · Failed: {result.failedCount || 0} · Total: {result.totalCount || parsedRows.length}
                        </p>
                        {Array.isArray(result.errors) && result.errors.length > 0 && (
                            <div className="max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white p-2">
                                {result.errors.slice(0, 8).map((error, index) => (
                                    <p key={index} className="text-[11px] text-slate-500">
                                        Row {error.row}: {error.message}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

