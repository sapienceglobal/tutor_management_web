'use client';

import { Eye, Trash2 } from 'lucide-react';
import { C, T, S } from '@/constants/tutorTokens';

export default function DataTable({ title, columns, data, onView, onDelete, isTutor }) {
    // Default columns matching Invoice List
    const defaultColumns = [
        { header: 'INVOICE ID', accessor: 'id' },
        { header: 'CATEGORY', accessor: 'category' },
        { header: 'LISTING DATE', accessor: 'date' },
        { header: 'LISTING VIEWS', accessor: 'views' },
        { header: 'PRICE', accessor: 'price' },
        { header: 'DUE DATE', accessor: 'dueDate' },
        { header: 'ACTION', accessor: 'action' },
    ];

    const displayColumns = columns || defaultColumns;
    const wrapperClass = isTutor ? "rounded-2xl overflow-hidden" : "bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden";
    const wrapperStyle = isTutor ? { backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card, fontFamily: T.fontFamily } : {};

    return (
        <div className={wrapperClass} style={wrapperStyle}>
            {title && (
                <div className={isTutor ? "p-5 border-b" : "p-6 border-b border-slate-100"} style={isTutor ? { borderColor: C.cardBorder } : {}}>
                    <h3 className={isTutor ? "" : "text-lg font-semibold text-slate-800"} style={isTutor ? { color: C.heading, fontWeight: T.weight.bold } : {}}>{title}</h3>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={isTutor ? "border-b" : "bg-slate-50 border-b border-slate-100"} style={{ backgroundColor: isTutor ? C.innerBg : undefined, borderColor: isTutor ? C.cardBorder : undefined }}>
                            {displayColumns.map((col, index) => (
                                <th key={index} className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: isTutor ? C.cardBorder : undefined }}>
                        {data?.map((row, rowIndex) => (
                            <tr key={rowIndex} className="transition-colors group" style={{ cursor: 'default' }} onMouseEnter={e => { if (isTutor) e.currentTarget.style.backgroundColor = C.innerBg; else e.currentTarget.className="bg-slate-50/50 transition-colors" }} onMouseLeave={e => { if (isTutor) e.currentTarget.style.backgroundColor = 'transparent'; else e.currentTarget.className="transition-colors group" }}>
                                {displayColumns.map((col, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: isTutor ? C.text : undefined }}>
                                        {col.accessor === 'action' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => onView && onView(row)}
                                                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-md transition-colors group"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4 group-hover:text-slate-700" />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete && onDelete(row)}
                                                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors shadow-sm shadow-red-200"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : col.accessor === 'id' ? (
                                            <span className="font-medium text-slate-700">{row[col.accessor]}</span>
                                        ) : col.accessor === 'price' ? (
                                            <span className="font-bold text-slate-800">${row[col.accessor]}</span>
                                        ) : (
                                            row[col.accessor]
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Footer */}
            <div className="px-6 py-4 border-t flex items-center justify-between text-sm" style={{ borderColor: isTutor ? C.cardBorder : undefined, color: isTutor ? C.textMuted : undefined }}>
                <span>Showing 1 to {data?.length || 0} of {data?.length || 0} entries</span>
                <div className="flex gap-1">
                    <button className="px-3 py-1 border rounded hover:bg-slate-50 hover:bg-opacity-50" style={{ borderColor: isTutor ? C.cardBorder : undefined }}>Previous</button>
                    <button className="px-3 py-1 text-white rounded" style={{ backgroundColor: isTutor ? C.btnPrimary : '#f97316' }}>1</button>
                    <button className="px-3 py-1 border rounded hover:bg-slate-50 hover:bg-opacity-50" style={{ borderColor: isTutor ? C.cardBorder : undefined }}>Next</button>
                </div>
            </div>
        </div>
    );
}
