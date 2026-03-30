'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

// CSV Parsing Logic (Retained exactly as is)
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
            const data = error?.response?.data;
            setResult(data || null);
            toast.error(data?.message || 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="w-full min-h-screen p-6 flex flex-col items-center" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            <div className="w-full max-w-3xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-4">
                        <Link href="/tutor/questions" className="text-decoration-none">
                            <button className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                                style={{ backgroundColor: '#E3DFF8', borderRadius: R.full }}>
                                <ArrowLeft size={18} color={C.heading} />
                            </button>
                        </Link>
                        <div>
                            <h1 className="flex items-center gap-2" style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                                <Upload size={20} color={C.btnPrimary} /> Import Questions
                            </h1>
                            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>
                                Upload CSV or JSON and import in bulk
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    
                    {/* Upload Box */}
                    <div style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `2px dashed ${C.btnPrimary}`, padding: '40px 20px', textAlign: 'center', transition: 'all 0.2s ease' }}>
                        <input id="question-import-file" type="file" accept=".csv,.json,application/json,text/csv" className="hidden" onChange={handleFileParse} />
                        <label htmlFor="question-import-file" className="flex flex-col items-center gap-3 cursor-pointer">
                            <div className="w-14 h-14 flex items-center justify-center" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                {parsing ? <Loader2 className="animate-spin" size={24} color={C.btnPrimary} /> : <FileText size={24} color={C.btnPrimary} />}
                            </div>
                            <div>
                                <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                                    {selectedFileName ? selectedFileName : 'Click to choose a CSV or JSON file'}
                                </p>
                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Supported formats: `.csv`, `.json`</p>
                            </div>
                        </label>
                    </div>

                    {parseError && (
                        <div className="flex items-start gap-3 p-4" style={{ backgroundColor: C.dangerBg, borderRadius: R.xl, border: `1px solid ${C.dangerBorder}` }}>
                            <AlertCircle size={18} color={C.danger} className="shrink-0 mt-0.5" />
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.danger, margin: 0 }}>{parseError}</p>
                        </div>
                    )}

                    {parsedRows.length > 0 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Rows Parsed</p>
                                    <p style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{stats.total}</p>
                                </div>
                                <div className="p-4" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.danger, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Missing Question Text</p>
                                    <p style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.danger, margin: 0 }}>{stats.missingQuestion}</p>
                                </div>
                            </div>

                            <div className="overflow-hidden" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                <div className="px-4 py-3" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Preview (first {previewRows.length} rows)</p>
                                </div>
                                <div className="flex flex-col">
                                    {previewRows.map((row, index) => (
                                        <div key={index} className="px-4 py-3" style={{ borderBottom: index !== previewRows.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                                            <p className="line-clamp-2" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0', lineHeight: 1.4 }}>
                                                {row.question || row.questionText || row.text || 'No question text'}
                                            </p>
                                            <p style={{ fontSize: '11px', fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                                                Type: {row.type || 'mcq'} · Difficulty: {row.difficulty || 'medium'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                        <button
                            onClick={handleImport}
                            disabled={!parsedRows.length || parsing || importing}
                            className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md w-full"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                        >
                            {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            Import Questions
                        </button>
                        <p style={{ fontSize: '11px', fontWeight: T.weight.medium, color: C.textMuted, margin: 0, textAlign: 'center' }}>
                            Supported columns: `question`, `type`, `options`, `correctAnswer`, `points`, `difficulty`, `topicId`, `skillId`
                        </p>
                    </div>

                    {result && (
                        <div className="p-4 space-y-3" style={{ backgroundColor: result.success ? C.successBg : C.warningBg, borderRadius: R.xl, border: `1px solid ${result.success ? C.successBorder : C.warningBorder}` }}>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} color={result.success ? C.success : C.warning} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: result.success ? C.success : C.warning, margin: 0 }}>
                                    {result.message || 'Import completed'}
                                </p>
                            </div>
                            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                Imported: {result.importedCount || 0} · Failed: {result.failedCount || 0} · Total: {result.totalCount || parsedRows.length}
                            </p>
                            {Array.isArray(result.errors) && result.errors.length > 0 && (
                                <div className="max-h-40 overflow-auto p-3 custom-scrollbar" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.md, border: `1px solid ${C.cardBorder}` }}>
                                    {result.errors.slice(0, 8).map((error, index) => (
                                        <p key={index} style={{ fontSize: '11px', fontWeight: T.weight.medium, color: C.danger, margin: '0 0 4px 0' }}>
                                            Row {error.row}: {error.message}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}