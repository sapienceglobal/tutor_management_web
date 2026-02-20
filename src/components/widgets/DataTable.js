'use client';

import { Eye, Trash2 } from 'lucide-react';

export default function DataTable({ title, columns, data, onView, onDelete }) {
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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">{title || 'Invoice List'}</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            {displayColumns.map((col, index) => (
                                <th key={index} className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data?.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
                                {displayColumns.map((col, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
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
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                <span>Showing 1 to {data?.length || 0} of {data?.length || 0} entries</span>
                <div className="flex gap-1">
                    <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Previous</button>
                    <button className="px-3 py-1 bg-orange-500 text-white rounded">1</button>
                    <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Next</button>
                </div>
            </div>
        </div>
    );
}
